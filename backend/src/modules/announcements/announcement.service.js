/**
 * @file announcement.service.js
 * @description Business Logic for Announcements, Pinning, Archiving, Multi-Department Targeting & Read Analytics (Module M8 / Slices 8.6, 8.7, 8.8).
 */

import mongoose from 'mongoose';
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
      const d = user.employeeId.departmentId;
      return (d._id || d).toString();
    }
    const emp = await Employee.findOne({
      $or: [{ userId: user._id }, { email: user.email }]
    })
      .select('departmentId')
      .lean();
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

    // 1. Archival filter: Default to active (non-archived)
    if (query.isArchived === true || query.isArchived === 'true') {
      filter.isArchived = true;
    } else {
      filter.isArchived = false;
    }

    // 2. Data Scoping by Role / Permission
    if (scope !== 'all') {
      const userDeptId = await this.getActorDepartmentId(user);
      const audienceConditions = [{ targetAudience: 'company' }];
      if (userDeptId) {
        audienceConditions.push({
          targetAudience: 'department',
          $or: [
            { departmentId: userDeptId },
            { departmentIds: userDeptId }
          ]
        });
      }
      filter.$or = audienceConditions;
    }

    // 3. Search filter
    if (query.search && query.search.trim()) {
      const searchRegex = { $regex: query.search.trim(), $options: 'i' };
      const searchConditions = [{ title: searchRegex }, { content: searchRegex }];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    // 4. Priority filter
    if (query.priority) {
      filter.priority = query.priority;
    }

    // 5. Target Audience filter
    if (query.targetAudience) {
      filter.targetAudience = query.targetAudience;
    }

    // 6. Explicit Department filter
    if (query.departmentId && query.departmentId !== 'all') {
      const deptIds = query.departmentId.includes(',')
        ? query.departmentId.split(',').map((id) => id.trim()).filter((id) => mongoose.Types.ObjectId.isValid(id))
        : [query.departmentId.trim()];

      const deptCondition = {
        $or: [
          { departmentId: { $in: deptIds } },
          { departmentIds: { $in: deptIds } }
        ]
      };

      if (filter.$and) {
        filter.$and.push(deptCondition);
      } else if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, deptCondition];
        delete filter.$or;
      } else {
        filter.$or = deptCondition.$or;
      }
    }

    // 7. Pinned filter
    if (query.pinnedOnly === true || query.pinnedOnly === 'true') {
      filter.pinned = true;
    }

    // 8. Sorting strategy
    let sortOptions = { pinned: -1, pinnedAt: -1, createdAt: -1 };
    if (query.sort === 'newest') {
      sortOptions = { pinned: -1, createdAt: -1 };
    } else if (query.sort === 'oldest') {
      sortOptions = { pinned: -1, createdAt: 1 };
    } else if (query.sort === 'priority') {
      sortOptions = { priority: 1, pinned: -1, createdAt: -1 };
    }

    const [announcements, total] = await Promise.all([
      Announcement.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('authorId', 'name email avatar')
        .populate('departmentId', 'name code')
        .populate('departmentIds', 'name code')
        .populate('archivedBy', 'name email')
        .lean(),
      Announcement.countDocuments(filter)
    ]);

    // Attach reader summary flag for requesting user
    let formatted = announcements.map((a) => {
      const hasRead = Array.isArray(a.readBy) && a.readBy.some((r) => r.userId?.toString() === user._id.toString());
      return {
        ...a,
        hasRead,
        readCount: a.readBy ? a.readBy.length : 0
      };
    });

    // 9. Read Status filter in memory if specified
    if (query.hasRead !== undefined) {
      const targetRead = query.hasRead === true || query.hasRead === 'true';
      formatted = formatted.filter((a) => a.hasRead === targetRead);
    }

    return {
      announcements: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  /**
   * Fetch single announcement by ID and trigger automatic read receipt
   */
  async getAnnouncementById(id, user, scope = 'own') {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, 'Invalid announcement identifier');
    }

    const announcement = await Announcement.findOne({ _id: id, isDeleted: false })
      .populate('authorId', 'name email avatar')
      .populate('departmentId', 'name code')
      .populate('departmentIds', 'name code')
      .populate('archivedBy', 'name email');

    if (!announcement) {
      throw new ApiError(404, 'Announcement not found');
    }

    // Scoping check
    if (scope !== 'all' && announcement.targetAudience === 'department') {
      const userDeptId = await this.getActorDepartmentId(user);
      const isTargetDept =
        (announcement.departmentId && announcement.departmentId._id?.toString() === userDeptId) ||
        (announcement.departmentIds && announcement.departmentIds.some((d) => d._id?.toString() === userDeptId));

      if (!isTargetDept && announcement.authorId._id?.toString() !== user._id.toString()) {
        throw new ApiError(403, 'You do not have access to view this department announcement');
      }
    }

    // Automatic read receipt trigger for the reader
    await this.recordReadReceipt(id, user._id);

    return {
      ...announcement.toObject(),
      hasRead: true,
      readCount: announcement.readBy ? announcement.readBy.length : 0
    };
  }

  /**
   * Create and publish announcement targeted to company or department
   */
  async createAnnouncement(payload, actor, scope = 'own') {
    const {
      title,
      content,
      targetAudience = 'company',
      departmentId,
      departmentIds = [],
      priority = 'normal',
      pinned = false,
      expiryDate = null,
      attachments = []
    } = payload;

    // Normalize department references
    const finalDeptIds = departmentIds.length > 0 ? departmentIds : departmentId ? [departmentId] : [];
    const primaryDeptId = finalDeptIds.length > 0 ? finalDeptIds[0] : null;

    // 1. RBAC & Data Scope Validation
    if (targetAudience === 'company') {
      if (scope !== 'all') {
        throw new ApiError(403, 'Only administrators and HR managers can broadcast company-wide announcements');
      }
    } else if (targetAudience === 'department') {
      if (finalDeptIds.length === 0) {
        throw new ApiError(400, 'At least one Department ID is required for department-scoped announcements');
      }

      if (scope !== 'all') {
        const actorDeptId = await this.getActorDepartmentId(actor);
        const hasAccess = finalDeptIds.every((dId) => dId.toString() === actorDeptId);
        if (!hasAccess) {
          throw new ApiError(403, 'You can only publish announcements for your own department');
        }
      }
    }

    // 2. Handle Pinned Announcement constraint (Max 3 pinned active notices)
    let pinnedAt = null;
    if (pinned) {
      const pinnedCount = await Announcement.countDocuments({ pinned: true, isDeleted: false, isArchived: false });
      if (pinnedCount >= 3) {
        // Automatically unpin the oldest pinned announcement
        await Announcement.findOneAndUpdate(
          { pinned: true, isDeleted: false, isArchived: false },
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
      departmentId: targetAudience === 'department' ? primaryDeptId : null,
      departmentIds: targetAudience === 'department' ? finalDeptIds : [],
      priority,
      pinned,
      pinnedAt,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      attachments,
      authorId: actor._id,
      readBy: [{ userId: actor._id, readAt: new Date() }] // Author automatically marks read
    });

    await announcement.populate('authorId', 'name email avatar');
    if (announcement.departmentId) {
      await announcement.populate('departmentId', 'name code');
    }
    if (announcement.departmentIds?.length > 0) {
      await announcement.populate('departmentIds', 'name code');
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
        const deptEmployees = await Employee.find({
          departmentId: { $in: finalDeptIds },
          isDeleted: false,
          status: 'Active'
        })
          .select('userId')
          .lean();
        const targetIds = deptEmployees.map((e) => e.userId).filter(Boolean);

        await notify(targetIds, {
          type: 'announcement',
          title: `Department Announcement: ${announcement.title}`,
          body: announcement.content.length > 120 ? `${announcement.content.substring(0, 117)}...` : announcement.content,
          link: '/announcements',
          metadata: { announcementId: announcement._id, priority: announcement.priority }
        });

        finalDeptIds.forEach((dId) => {
          emitToDepartment(dId, 'announcement:new', announcement);
        });
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
        const pinnedCount = await Announcement.countDocuments({ pinned: true, isDeleted: false, isArchived: false });
        if (pinnedCount >= 3) {
          await Announcement.findOneAndUpdate(
            { pinned: true, isDeleted: false, isArchived: false },
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
    if (payload.targetAudience) announcement.targetAudience = payload.targetAudience;

    if (payload.departmentIds !== undefined) {
      announcement.departmentIds = payload.departmentIds;
      announcement.departmentId = payload.departmentIds.length > 0 ? payload.departmentIds[0] : null;
    } else if (payload.departmentId !== undefined) {
      announcement.departmentId = payload.departmentId;
      announcement.departmentIds = payload.departmentId ? [payload.departmentId] : [];
    }

    if (payload.expiryDate !== undefined) {
      announcement.expiryDate = payload.expiryDate ? new Date(payload.expiryDate) : null;
    }

    if (payload.attachments !== undefined) {
      announcement.attachments = payload.attachments;
    }

    await announcement.save();
    await announcement.populate('authorId', 'name email avatar');
    if (announcement.departmentId) {
      await announcement.populate('departmentId', 'name code');
    }
    if (announcement.departmentIds?.length > 0) {
      await announcement.populate('departmentIds', 'name code');
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
    announcement.pinned = false;
    announcement.pinnedAt = null;
    await announcement.save();

    return { success: true, message: 'Announcement deleted successfully' };
  }

  /**
   * Archive active announcement (Dedicated Archive Tab)
   */
  async archiveAnnouncement(id, actor, scope = 'own') {
    const announcement = await Announcement.findOne({ _id: id, isDeleted: false });
    if (!announcement) {
      throw new ApiError(404, 'Announcement not found');
    }

    if (announcement.isArchived) {
      throw new ApiError(400, 'Announcement is already archived');
    }

    if (scope !== 'all' && announcement.authorId.toString() !== actor._id.toString()) {
      throw new ApiError(403, 'You do not have permission to archive this announcement');
    }

    announcement.isArchived = true;
    announcement.archivedAt = new Date();
    announcement.archivedBy = actor._id;
    announcement.pinned = false;
    announcement.pinnedAt = null;
    await announcement.save();

    await announcement.populate('authorId', 'name email avatar');
    await announcement.populate('archivedBy', 'name email');

    return announcement;
  }

  /**
   * Restore archived announcement back to active feed
   */
  async restoreAnnouncement(id, actor, scope = 'own') {
    const announcement = await Announcement.findOne({ _id: id, isDeleted: false });
    if (!announcement) {
      throw new ApiError(404, 'Announcement not found');
    }

    if (!announcement.isArchived) {
      throw new ApiError(400, 'Announcement is not archived');
    }

    if (scope !== 'all' && announcement.authorId.toString() !== actor._id.toString()) {
      throw new ApiError(403, 'You do not have permission to restore this announcement');
    }

    announcement.isArchived = false;
    announcement.archivedAt = null;
    announcement.archivedBy = null;
    await announcement.save();

    await announcement.populate('authorId', 'name email avatar');

    return announcement;
  }

  /**
   * Toggle announcement pin status (Slice 8.7)
   */
  async togglePinAnnouncement(id, pinned, _actor, _scope = 'own') {
    const announcement = await Announcement.findOne({ _id: id, isDeleted: false, isArchived: false });
    if (!announcement) {
      throw new ApiError(404, 'Active announcement not found');
    }

    if (pinned) {
      const pinnedCount = await Announcement.countDocuments({ pinned: true, isDeleted: false, isArchived: false });
      if (pinnedCount >= 3) {
        await Announcement.findOneAndUpdate(
          { pinned: true, isDeleted: false, isArchived: false },
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
   * Get detailed read receipts breakdown and audience engagement metrics (Slice 8.8)
   */
  async getReadReceipts(id, actor, scope = 'own') {
    const announcement = await Announcement.findOne({ _id: id, isDeleted: false })
      .populate('readBy.userId', 'name email avatar')
      .populate('departmentId', 'name code')
      .populate('departmentIds', 'name code')
      .lean();

    if (!announcement) {
      throw new ApiError(404, 'Announcement not found');
    }

    // Only author, HR manager, or Super Admin can inspect read receipts
    if (scope !== 'all' && announcement.authorId.toString() !== actor._id.toString()) {
      throw new ApiError(403, 'You do not have permission to view read receipts for this announcement');
    }

    // 1. Calculate Target Audience Denominator
    let totalTargeted = 0;
    const targetDeptIds = announcement.departmentIds?.length > 0
      ? announcement.departmentIds.map((d) => d._id || d)
      : announcement.departmentId
      ? [announcement.departmentId._id || announcement.departmentId]
      : [];

    if (announcement.targetAudience === 'company') {
      totalTargeted = await User.countDocuments({ isActive: true, isDeleted: false });
    } else {
      totalTargeted = await Employee.countDocuments({
        departmentId: { $in: targetDeptIds },
        isDeleted: false,
        status: 'Active'
      });
    }

    const seenCount = announcement.readBy ? announcement.readBy.length : 0;
    const unseenCount = Math.max(0, totalTargeted - seenCount);
    const compliancePercentage = totalTargeted > 0 ? Math.round((seenCount / totalTargeted) * 100) : 100;

    // 2. Fetch employee details for each reader
    const readerUserIds = announcement.readBy?.map((r) => r.userId?._id || r.userId).filter(Boolean) || [];
    const employees = await Employee.find({
      userId: { $in: readerUserIds },
      isDeleted: false
    })
      .populate('departmentId', 'name code')
      .populate('designationId', 'title')
      .select('name employeeCode email departmentId designationId avatar userId')
      .lean();

    const empByUserId = {};
    employees.forEach((emp) => {
      if (emp.userId) empByUserId[emp.userId.toString()] = emp;
    });

    const readers = (announcement.readBy || []).map((receipt) => {
      const uId = receipt.userId?._id ? receipt.userId._id.toString() : receipt.userId?.toString();
      const emp = empByUserId[uId];
      return {
        userId: uId,
        readAt: receipt.readAt,
        name: emp?.name || receipt.userId?.name || 'Staff Member',
        email: emp?.email || receipt.userId?.email || '',
        avatar: emp?.avatar || receipt.userId?.avatar || null,
        employeeCode: emp?.employeeCode || 'N/A',
        department: emp?.departmentId?.name || 'General',
        designation: emp?.designationId?.title || 'Staff'
      };
    });

    // 3. Department Breakdown
    const deptStats = {};
    readers.forEach((r) => {
      const dName = r.department || 'General';
      if (!deptStats[dName]) {
        deptStats[dName] = { departmentName: dName, signedCount: 0 };
      }
      deptStats[dName].signedCount += 1;
    });

    const departmentBreakdown = Object.values(deptStats);

    return {
      announcementId: announcement._id,
      title: announcement.title,
      targetAudience: announcement.targetAudience,
      totalTargeted,
      seenCount,
      unseenCount,
      compliancePercentage,
      departmentBreakdown,
      readers
    };
  }
}

export const announcementService = new AnnouncementService();
