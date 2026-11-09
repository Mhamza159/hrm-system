/**
 * @file m24.seed.js
 * @description Seed script for Module M24 Internal Chat demo data.
 */

import mongoose from 'mongoose';
import { Conversation } from '../models/conversation.model.js';
import { Message } from '../models/message.model.js';
import { User } from '../models/user.model.js';
import { Department } from '../models/department.model.js';
import { Employee } from '../models/employee.model.js';
import { env } from '../config/env.js';

export async function seedChatData() {
  console.log('🌱 [SEED M24] Bootstrapping Internal Chat demo data...');

  const [adminUser, hrUser, deptUser, empUser] = await Promise.all([
    User.findOne({ email: 'mhamzaofficial159@gmail.com' }),
    User.findOne({ email: 'hr@hrm.company.pk' }),
    User.findOne({ email: 'manager@hrm.company.pk' }),
    User.findOne({ email: 'employee@hrm.company.pk' })
  ]);

  if (!adminUser || !hrUser) {
    console.warn('⚠️ [SEED M24] Required users not found. Skipping chat seeding.');
    return;
  }

  let engDept = await Department.findOne({ code: 'ENG' }) || await Department.findOne();

  // Clean existing demo conversations and messages
  await Conversation.deleteMany({ name: { $in: ['Engineering Channel', 'Leadership Committee', 'Archived Sprint Review'] } });

  // 1. Seed 1-to-1 Direct Chat between Super Admin and HR Manager
  const directKey = [adminUser._id.toString(), hrUser._id.toString()].sort().join('_');
  await Conversation.deleteMany({ directKey });

  const directConv = await Conversation.create({
    type: 'direct',
    directKey,
    participants: [adminUser._id, hrUser._id],
    lastMessage: {
      content: 'Welcome to the internal team chat! All operational communications will happen here.',
      senderId: adminUser._id,
      sentAt: new Date(),
      messageType: 'text'
    },
    lastMessageAt: new Date()
  });

  await Message.create([
    {
      conversationId: directConv._id,
      senderId: hrUser._id,
      content: 'Hello Admin, thank you for setting up the new company collaboration channels.',
      messageType: 'text',
      readBy: [{ userId: hrUser._id, readAt: new Date() }],
      createdAt: new Date(Date.now() - 3600000)
    },
    {
      conversationId: directConv._id,
      senderId: adminUser._id,
      content: 'Welcome to the internal team chat! All operational communications will happen here.',
      messageType: 'text',
      readBy: [{ userId: adminUser._id, readAt: new Date() }],
      createdAt: new Date()
    }
  ]);

  // 2. Seed Group Chat: "Leadership Committee"
  const groupParticipants = [adminUser._id, hrUser._id];
  if (deptUser) groupParticipants.push(deptUser._id);
  if (empUser) groupParticipants.push(empUser._id);

  const groupConv = await Conversation.create({
    type: 'group',
    name: 'Leadership Committee',
    description: 'Executive committee and general leadership discussions.',
    admin: adminUser._id,
    participants: groupParticipants,
    lastMessage: {
      content: 'Quarterly OKR review meeting scheduled for tomorrow at 10:00 AM PKT.',
      senderId: hrUser._id,
      sentAt: new Date(),
      messageType: 'text'
    },
    lastMessageAt: new Date()
  });

  await Message.create({
    conversationId: groupConv._id,
    senderId: hrUser._id,
    content: 'Quarterly OKR review meeting scheduled for tomorrow at 10:00 AM PKT.',
    messageType: 'text',
    readBy: [{ userId: hrUser._id, readAt: new Date() }],
    createdAt: new Date()
  });

  // 3. Seed Department Channel if department exists
  if (engDept) {
    const deptParticipants = [adminUser._id, hrUser._id];
    if (deptUser) deptParticipants.push(deptUser._id);
    if (empUser) deptParticipants.push(empUser._id);

    const deptConv = await Conversation.create({
      type: 'department',
      name: `${engDept.name} Channel`,
      description: `Official collaboration channel for ${engDept.name}`,
      departmentId: engDept._id,
      participants: deptParticipants,
      lastMessage: {
        content: `Welcome team to the ${engDept.name} channel!`,
        senderId: adminUser._id,
        sentAt: new Date(),
        messageType: 'text'
      },
      lastMessageAt: new Date()
    });

    await Message.create({
      conversationId: deptConv._id,
      senderId: adminUser._id,
      content: `Welcome team to the ${engDept.name} channel!`,
      messageType: 'text',
      readBy: [{ userId: adminUser._id, readAt: new Date() }],
      createdAt: new Date()
    });
  }

  // 4. Seed Archived Channel for read-only testing
  await Conversation.create({
    type: 'group',
    name: 'Archived Sprint Review',
    description: 'Completed legacy project discussions.',
    admin: adminUser._id,
    participants: [adminUser._id, hrUser._id],
    isArchived: true,
    archivedAt: new Date(),
    archivedBy: adminUser._id,
    lastMessage: {
      content: 'This project is concluded. Channel is now locked.',
      senderId: adminUser._id,
      sentAt: new Date(),
      messageType: 'text'
    },
    lastMessageAt: new Date()
  });

  console.log('✅ [SEED M24] Internal Chat demo conversations & messages seeded.');
}

// Standalone execution support
if (process.argv[1]?.endsWith('m24.seed.js')) {
  mongoose
    .connect(env.MONGO_URI || 'mongodb://localhost:27017/hrm')
    .then(async () => {
      await seedChatData();
      await mongoose.disconnect();
      console.log('Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
