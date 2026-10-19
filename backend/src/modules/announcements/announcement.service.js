/**
 * @file announcement.service.js
 * @description Business Logic for Announcements, Pinning & Read Receipts (Module M8 / Slices 8.6, 8.7, 8.8).
 */

import { Announcement } from '../../models/announcement.model.js';
import { User } from '../../models/user.model.js';
import { Employee } from '../../models/employee.model.js';
import { notify } from '../../services/notify.service.js';
import { emitToCompany, emitToDepartment } from '../../services/socket.service.js';
import { ApiError } from '../../utils/ApiError.js';

class AnnouncementService {
  /**
   * Helper to retrieve actor's assigned department ID
   */
  async getActorDepartmentId(user) {
    if (user.employeeId?.departmentId) {
      return user.employeeId.departmentId.toString();
    }
    const emp = await Employee.findOne({ userId: user._id }).select('departmentId').lean();
    return emp?.departmentId ? emp.departmentId.toString() : null;
  }

  /**
   * Fetch announcements scoped to actor's permissions and department
   */
  async getAnnouncements(query = {}, user, scope = 'own') {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false };

    // 1. Data Scoping
    if (scope !== 'all') {
      const userDeptId = await this.getActorDepartmentId(user);
      const audienceConditions = [{ targetAudience: 'company' }];
      if (userDeptId) {
        audienceConditions.push({ departmentId: userDeptId });
      }
      filter.$or = audienceConditions;
    }

    // 2. Query filters
    if (query.search) {
      const searchRegex = { $regex: query.search, $options: 'i' };
      const searchConditions = [{ title: searchRegex }, { content: searchRegex }];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    if (query.priority) {
      filter.priority = query.priority;
    }

    if (query.targetAudience) {
      filter.targetAudience = query.targetAudience;
    }

    if (query.departmentId) {
      filter.departmentId = query.departmentId;
    }

    if (query.pinnedOnly === true || query.pinnedOnly === 'true') {
      filter.pinned = true;
    }

    const [announcements, total] = await Promise.all([
      Announcement.find(filter)
        .sort({ pinned: -1, pinnedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('authorId', 'name email avatar')
        .populate('departmentId', 'name code')
        .lean(),
      Announcement.countDocuments(filter)
    ]);

    // Attach reader summary flag for requesting user
    const formatted = announcements.map((a) => {
      const hasRead = Array.isArray(a.readBy) && a.readBy.some((r) => r.userId?.toString() === user._id.toString());
      return {
        ...a,
        hasRead,
        readCount: a.readBy ? a.readBy.length : 0
      };
    });

    return {
      announcements: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Create and publish announcement targeted to company or department
   */
  async createAnnouncement(payload, actor, scope = 'own') {
    const { title, content, targetAudience = 'company', departmentId, priority = 'normal', pinned = false } = payload;

    // 1. RBAC & Data Scope Validation
    if (targetAudience === 'company') {
      if (scope !== 'all') {
        throw new ApiError(403, 'Only administrators and HR managers can broadcast company-wide announcements');
      }
    } else if (targetAudience === 'department') {
      if (!departmentId) {
        throw new ApiError(400, 'Department ID is required for department-scoped announcements');
      }

      if (scope !== 'all') {
        const actorDeptId = await this.getActorDepartmentId(actor);
        if (!actorDeptId || actorDeptId !== departmentId.toString()) {
          throw new ApiError(403, 'You can only publish announcements for your own department');
        }
      }
    }

    // 2. Handle Pinned Announcement constraint (Max 3 pinned)
    let pinnedAt = null;
    if (pinned) {
      const pinnedCount = await Announcement.countDocuments({ pinned: true, isDeleted: false });
      if (pinnedCount >= 3) {
        // Automatically unpin the oldest pinned announcement
        await Announcement.findOneAndUpdate(
          { pinned: true, isDeleted: false },
          { pinned: false, pinnedAt: null },
          { sort: { pinnedAt: 1, createdAt: 1 } }
        );
      }
      pinnedAt = new Date();
    }

    // 3. Persist Announcement
    const announcement = await Announcement.create({
      title: title.trim(),
      content: content.trim(),
      targetAudience,
      departmentId: targetAudience === 'department' ? departmentId : null,
      priority,
      pinned,
      pinnedAt,
      authorId: actor._id,
      readBy: [{ userId: actor._id, readAt: new Date() }] // Author automatically marks read
    });

    await announcement.populate('authorId', 'name email avatar');
    if (announcement.departmentId) {
      await announcement.populate('departmentId', 'name code');
    }

    // 4. Multi-Channel Alert & Real-Time Broadcast via Centralized notify()
    try {
      if (targetAudience === 'company') {
        const activeUsers = await User.find({ isActive: true, isDeleted: false }).select('_id').lean();
        const targetIds = activeUsers.map((u) => u._id);
        
        await notify(targetIds, {
          type: 'announcement',
          title: `Announcement: ${announcement.title}`,
          body: announcement.content.length > 120 ? `${announcement.content.substring(0, 117)}...` : announcement.content,
          link: '/announcements',
          metadata: { announcementId: announcement._id, priority: announcement.priority }
        });

        emitToCompany('announcement:new', announcement);
      } else {
        const deptEmployees = await Employee.find({ departmentId: announcement.departmentId }).select('userId').lean();
        const targetIds = deptEmployees.map((e) => e.userId).filter(Boolean);

        await notify(targetIds, {
          type: 'announcement',
          title: `Department Announcement: ${announcement.title}`,
          body: announcement.content.length > 120 ? `${announcement.content.substring(0, 117)}...` : announcement.content,
          link: '/announcements',
          metadata: { announcementId: announcement._id, priority: announcement.priority }
        });

        emitToDepartment(announcement.departmentId, 'announcement:new', announcement);
      }
    } catch (notifErr) {
      console.warn(`[AnnouncementService] Broadcast alert warning: ${notifErr.message}`);
    }

    return announcement;
  }

  /**
   * Update an existing announcement
   */
  async updateAnnouncement(id, payload, actor, scope = 'own') {
    const announcement = await Announcement.findOne({ _id: id, isDeleted: false });
    if (!announcement) {
      throw new ApiError(404, 'Announcement not found');
    }

    // Authorization: Author or user with 'all' scope
    if (scope !== 'all' && announcement.authorId.toString() !== actor._id.toString()) {
      throw new ApiError(403, 'You do not have permission to edit this announcement');
    }

    if (payload.pinned !== undefined && payload.pinned !== announcement.pinned) {
      if (payload.pinned) {
        const pinnedCount = await Announcement.countDocuments({ pinned: true, isDeleted: false });
        if (pinnedCount >= 3) {
          await Announcement.findOneAndUpdate(
            { pinned: true, isDeleted: false },
            { pinned: false, pinnedAt: null },
            { sort: { pinnedAt: 1, createdAt: 1 } }
          );
        }
        announcement.pinned = true;
        announcement.pinnedAt = new Date();
      } else {
        announcement.pinned = false;
        announcement.pinnedAt = null;
      }
    }

    if (payload.title) announcement.title = payload.title.trim();
    if (payload.content) announcement.content = payload.content.trim();
    if (payload.priority) announcement.priority = payload.priority;

    await announcement.save();
    await announcement.populate('authorId', 'name email avatar');
    if (announcement.departmentId) {
      await announcement.populate('departmentId', 'name code');
    }

    return announcement;
  }

  /**
   * Soft delete announcement
   */
  async deleteAnnouncement(id, actor, scope = 'own') {
    const announcement = await Announcement.findOne({ _id: id, isDeleted: false });
    if (!announcement) {
      throw new ApiError(404, 'Announcement not found');
    }

    if (scope !== 'all' && announcement.authorId.toString() !== actor._id.toString()) {
      throw new ApiError(403, 'You do not have permission to delete this announcement');
    }

    announcement.isDeleted = true;
    await announcement.save();

    return { success: true, message: 'Announcement deleted successfully' };
  }

  /**
   * Toggle announcement pin status (Slice 8.7)
   */
  async togglePinAnnouncement(id, pinned, actor, scope = 'own') {
    const announcement = await Announcement.findOne({ _id: id, isDeleted: false });
    if (!announcement) {
      throw new ApiError(404, 'Announcement not found');
    }

    if (pinned) {
      const pinnedCount = await Announcement.countDocuments({ pinned: true, isDeleted: false });
      if (pinnedCount >= 3) {
        await Announcement.findOneAndUpdate(
          { pinned: true, isDeleted: false },
          { pinned: false, pinnedAt: null },
          { sort: { pinnedAt: 1, createdAt: 1 } }
        );
      }
      announcement.pinned = true;
      announcement.pinnedAt = new Date();
    } else {
      announcement.pinned = false;
      announcement.pinnedAt = null;
    }

    await announcement.save();
    await announcement.populate('authorId', 'name email avatar');
    if (announcement.departmentId) {
      await announcement.populate('departmentId', 'name code');
    }

    return announcement;
  }

  /**
   * Record read receipt for reader (Slice 8.8)
   */
  async recordReadReceipt(id, userId) {
    const announcement = await Announcement.findOne({ _id: id, isDeleted: false }).select('_id readBy');
    if (!announcement) {
      throw new ApiError(404, 'Announcement not found');
    }

    const alreadyRead = Array.isArray(announcement.readBy) && announcement.readBy.some((r) => r.userId?.toString() === userId.toString());
    if (!alreadyRead) {
      await Announcement.updateOne(
        { _id: id, isDeleted: false, 'readBy.userId': { $ne: userId } },
        { $addToSet: { readBy: { userId, readAt: new Date() } } }
      );
    }

    const updated = await Announcement.findById(id).select('readBy').lean();

    return {
      success: true,
      alreadyRead,
      readCount: updated?.readBy ? updated.readBy.length : (announcement.readBy?.length || 0)
    };
  }

  /**
   * Get detailed read receipts breakdown (Slice 8.8)
   */
  async getReadReceipts(id, actor, scope = 'own') {
    const announcement = await Announcement.findOne({ _id: id, isDeleted: false })
      .populate('readBy.userId', 'name email avatar')
      .lean();

    if (!announcement) {
      throw new ApiError(404, 'Announcement not found');
    }

    // Only author, HR manager, or Super Admin can inspect read receipts
    if (scope !== 'all' && announcement.authorId.toString() !== actor._id.toString()) {
      throw new ApiError(403, 'You do not have permission to view read receipts for this announcement');
    }

    return {
      announcementId: announcement._id,
      title: announcement.title,
      totalReads: announcement.readBy.length,
      readers: announcement.readBy
    };
  }
}

export const announcementService = new AnnouncementService();
