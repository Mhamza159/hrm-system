/**
 * @file notify.service.js
 * @description Centralized Multi-Channel Alert & Notification Dispatcher (Module M8 / Slice 8.1).
 * 
 * CORE ARCHITECTURAL INVARIANT (THE SINGLE NOTIFY PIPELINE):
 * No other module, controller, or background job in this application creates notification documents
 * or dispatches raw alert emails directly. All system events (leave approved, shift adjusted,
 * payroll generated, profile edited, announcement published) MUST call `notify(userIds, payload)`.
 * 
 * PIPELINE WORKFLOW:
 * 1. Normalize and deduplicate recipient User ObjectIds.
 * 2. Persist notification records in bulk via `Notification.insertMany()`.
 * 3. Emit real-time WebSocket packet (`notification:new`) to recipient's isolated Socket room `user:${id}`.
 * 4. Query user `notificationPrefs` and conditionally queue asynchronous Email or WhatsApp jobs.
 * 5. Return execution summary `{ success, count, notificationIds }` without blocking caller flow.
 */

import mongoose from 'mongoose';
import { Notification } from '../models/notification.model.js';
import { User } from '../models/user.model.js';
import { emitToUser } from './socket.service.js';
import { queueService } from './queue.service.js';
import { whatsappService } from './whatsapp.service.js';
import { SettingService } from '../modules/settings/setting.service.js';

/**
 * Dispatch multi-channel notification to one or more users
 * 
 * @param {string|import('mongoose').Types.ObjectId|Array<string|import('mongoose').Types.ObjectId>} userIds - Single user ID or array of user IDs
 * @param {Object} payload - Notification data
 * @param {string} [payload.type='system'] - Category ('system', 'attendance', 'leave', 'payroll', 'announcement', 'security', 'profile')
 * @param {string} payload.title - Concise notification headline
 * @param {string} payload.body - Detailed message body
 * @param {string} [payload.link=null] - Internal route link to navigate on click
 * @param {Object} [payload.metadata={}] - Arbitrary contextual metadata
 * @param {Array<string>} [payload.channels=['inApp']] - Target channels to evaluate (e.g. ['inApp', 'email', 'whatsapp'])
 * @returns {Promise<{ success: boolean, count: number, notifications: Array<Object> }>}
 */
export const notify = async (userIds, payload) => {
  try {
    if (!userIds || (Array.isArray(userIds) && userIds.length === 0)) {
      return { success: false, count: 0, notifications: [] };
    }

    // 1. Normalize and deduplicate recipient IDs
    const rawList = Array.isArray(userIds) ? userIds : [userIds];
    const uniqueIds = Array.from(
      new Set(
        rawList
          .filter(Boolean)
          .map((id) => (typeof id === 'string' ? id : id.toString()))
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
      )
    );

    if (uniqueIds.length === 0) {
      return { success: false, count: 0, notifications: [] };
    }

    const {
      type = 'system',
      title,
      body,
      link = null,
      metadata = {},
      channels = ['inApp', 'email', 'whatsapp']
    } = payload;

    if (!title || !body) {
      throw new Error('Notification requires both title and body content');
    }

    // 2. Resolve Admin Channel Configuration (System-wide method selection)
    let adminChannels = { inApp: true, email: true, whatsapp: false };
    try {
      if (typeof SettingService?.getSetting === 'function') {
        const adminNotifSetting = await SettingService.getSetting('notifications');
        if (adminNotifSetting) {
          const globalChannels = adminNotifSetting.channels || { inApp: true, email: true, whatsapp: false };

          let targetConfig = null;
          if (type === 'announcement' && adminNotifSetting.announcements) {
            targetConfig = adminNotifSetting.announcements;
          } else if (type && adminNotifSetting.categories?.[type]) {
            targetConfig = adminNotifSetting.categories[type];
          }

          adminChannels = {
            inApp: globalChannels.inApp !== false && (targetConfig ? targetConfig.inApp !== false : true),
            email: globalChannels.email !== false && (targetConfig ? targetConfig.email !== false : true),
            whatsapp: globalChannels.whatsapp === true && (targetConfig ? targetConfig.whatsapp === true : true)
          };
        }
      }
    } catch {
      // Graceful fallback to default channels if settings lookup is unavailable
    }

    const effectiveInApp = channels.includes('inApp') && adminChannels.inApp === true;
    const effectiveEmail = channels.includes('email') && adminChannels.email === true;
    const effectiveWhatsapp = channels.includes('whatsapp') && adminChannels.whatsapp === true;

    // 3. In-App Notification Storage & Real-Time WebSocket Emission
    let savedNotifications = [];
    if (effectiveInApp) {
      const documentsToInsert = uniqueIds.map((uid) => ({
        userId: new mongoose.Types.ObjectId(uid),
        type,
        title: title.trim(),
        body: body.trim(),
        link: link ? link.trim() : null,
        isRead: false,
        metadata: metadata || {}
      }));

      savedNotifications = await Notification.insertMany(documentsToInsert);

      for (const notif of savedNotifications) {
        try {
          emitToUser(notif.userId, 'notification:new', {
            _id: notif._id,
            userId: notif.userId,
            type: notif.type,
            title: notif.title,
            body: notif.body,
            link: notif.link,
            isRead: notif.isRead,
            createdAt: notif.createdAt,
            metadata: notif.metadata
          });
        } catch (socketErr) {
          console.warn(`[notify.service] Socket emission failed for user ${notif.userId}: ${socketErr.message}`);
        }
      }
    }

    // 4. Asynchronous Email & WhatsApp Delivery
    if (effectiveEmail || effectiveWhatsapp) {
      const userQuery = User.find(
        { _id: { $in: uniqueIds } },
        'name email phone notificationPrefs employeeId'
      );
      if (typeof userQuery.populate === 'function') {
        userQuery.populate('employeeId', 'name phone');
      }

      userQuery
        .lean()
        .then((users) => {
          for (const u of users) {
            const prefs = u.notificationPrefs?.[type] || {
              email: true,
              whatsapp: true
            };

            const employeeName = u.employeeId?.name || u.name || 'Team Member';
            const employeePhone = u.employeeId?.phone || u.phone;

            // Email Channel Dispatch
            if (effectiveEmail && prefs.email !== false && u.email) {
              queueService.addNotificationEmailJob({
                to: u.email,
                employeeName,
                actionTitle: title,
                details: body,
                link
              }).catch((qErr) => {
                console.warn(`[notify.service] Email job queueing error for ${u.email}: ${qErr.message}`);
              });
            }

            // WhatsApp Channel Dispatch
            if (effectiveWhatsapp && prefs.whatsapp !== false && employeePhone) {
              whatsappService.sendWhatsAppMessage({
                to: employeePhone,
                message: `${title}: ${body}`
              }).catch((wErr) => {
                console.warn(`[notify.service] WhatsApp dispatch error for ${employeePhone}: ${wErr.message}`);
              });
            }
          }
        })
        .catch((prefErr) => {
          console.warn(`[notify.service] User preferences lookup warning: ${prefErr.message}`);
        });
    }

    return {
      success: true,
      count: savedNotifications.length,
      notifications: savedNotifications
    };
  } catch (error) {
    console.error(`[notify.service] Notification dispatch failed: ${error.message}`);
    throw error;
  }
};
