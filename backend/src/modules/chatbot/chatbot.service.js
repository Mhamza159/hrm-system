/**
 * @file chatbot.service.js
 * @description Core Domain Service for M16 HR Chatbot & AI Virtual Assistant.
 * 
 * SPECIFICATION & ARCHITECTURE:
 * - Module: M16 HR Chatbot (BUILD-GUIDE Section 25 · Rows 16.1 to 16.9)
 * - Layer: Service (Domain Logic, RAG Document Parsing, Bilingual Heuristics, Dual-Layer LLM + Fallback)
 * - Compliance: Standard library first (native fetch), no external bloat, deterministic test stability.
 */

import path from 'path';
import fs from 'fs';
import { PolicyDoc } from '../../models/policyDoc.model.js';
import { ChatMessage } from '../../models/chatMessage.model.js';
import { UnansweredQuestion } from '../../models/unanswered.model.js';
import { Setting } from '../../models/setting.model.js';
import { Notification } from '../../models/notification.model.js';
import { User } from '../../models/user.model.js';
import { Role } from '../../models/role.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { env } from '../../config/env.js';
import {
  CHATBOT_TOOL_DEFINITIONS,
  executeToolCall,
  searchPolicy,
  getMyLeaveBalance,
  getMyLastPayslip,
  getNextPayDate
} from './tools/chatbot.tools.js';

export const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Helper: Detect whether the input query is primarily Roman Urdu or English
 */
export function detectLanguage(text) {
  if (!text || typeof text !== 'string') return 'en';
  const romanUrduKeywords = [
    'meri', 'mera', 'mere', 'mujhe', 'hum', 'kitni', 'kitna', 'kitne',
    'chutti', 'chhutti', 'chuttiyan', 'chhutiyan', 'kab', 'kahan', 'kyun', 'kese', 'kaise',
    'aayegi', 'aaye gi', 'milegi', 'batao', 'bataiye', 'hai', 'hain', 'hoga', 'hogi',
    'tankhwah', 'salary', 'payslip', 'chahiye', 'karo', 'karna', 'kardo', 'shukriya',
    'agli', 'agla', 'bache', 'bachi'
  ];

  const lower = text.toLowerCase();
  const words = lower.split(/[\s,?.!]+/);
  let matches = 0;
  for (const word of words) {
    if (romanUrduKeywords.includes(word)) {
      matches++;
    }
  }

  // If 2 or more Roman Urdu keywords match, or prominent keyword matches in short sentence
  if (matches >= 2 || (words.length <= 6 && matches >= 1)) {
    return 'ur-roman';
  }
  return 'en';
}

/**
 * 16.1: Upload and Ingest Company Policy Document
 */
export async function uploadPolicyDoc(file, body, user) {
  if (!file) {
    throw new ApiError(400, 'Policy document file is required.');
  }

  const { title, category = 'General', description = '' } = body;
  const originalName = file.originalname || 'document.pdf';
  const rawExt = path.extname(originalName).toLowerCase().replace('.', '') || 'pdf';
  const ext = ['pdf', 'docx', 'doc', 'txt'].includes(rawExt) ? rawExt : 'pdf';

  // Ensure uploads directory exists
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'policies');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const safeFilename = `policy-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
  const filePath = path.join(uploadDir, safeFilename);

  fs.writeFileSync(filePath, file.buffer);
  const fileUrl = `/uploads/policies/${safeFilename}`;

  // Extract plain text from buffer
  let extractedText = '';
  try {
    extractedText = file.buffer.toString('utf8', 0, Math.min(file.buffer.length, 50000));
  } catch {
    extractedText = '';
  }

  // Clean extracted text: remove non-printable characters
  extractedText = extractedText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').trim();

  // If file was binary PDF/DOC without plaintext header, ensure fallback searchable text
  if (!extractedText || extractedText.length < 20) {
    extractedText = `${title}\nCategory: ${category}\nDescription: ${description}\nOfficial policy document file uploaded by HR management.`;
  }

  const policyDoc = await PolicyDoc.create({
    title,
    category,
    description,
    fileUrl,
    fileType: ext,
    fileSize: file.size,
    extractedText,
    isActive: true,
    uploadedBy: user._id
  });

  return policyDoc;
}

/**
 * 16.1: Retrieve Paginated Policy Documents
 */
export async function getPolicyDocs({ page = 1, limit = 20, category, search, isActive } = {}) {
  const filter = { isDeleted: false };

  if (category && category !== 'All') {
    filter.category = category;
  }

  if (isActive !== undefined && isActive !== '') {
    filter.isActive = isActive === 'true' || isActive === true;
  }

  if (search && typeof search === 'string' && search.trim()) {
    const escaped = escapeRegex(search.trim());
    filter.$or = [
      { title: { $regex: escaped, $options: 'i' } },
      { description: { $regex: escaped, $options: 'i' } }
    ];
  }

  const parsedPage = Math.max(1, parseInt(page, 10));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (parsedPage - 1) * parsedLimit;

  const [items, total] = await Promise.all([
    PolicyDoc.find(filter)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .lean(),
    PolicyDoc.countDocuments(filter)
  ]);

  return {
    items,
    total,
    page: parsedPage,
    limit: parsedLimit,
    totalPages: Math.ceil(total / parsedLimit) || 1
  };
}

/**
 * 16.1: Soft-Delete Policy Document
 */
export async function deletePolicyDoc(id) {
  const doc = await PolicyDoc.findById(id);
  if (!doc || doc.isDeleted) {
    throw new ApiError(404, 'Policy document not found.');
  }

  doc.isDeleted = true;
  doc.isActive = false;
  await doc.save();

  return { message: 'Policy document successfully deleted.' };
}

/**
 * 16.2 & 16.7: Ask Chatbot Assistant (Dual-Layer: OpenAI Tools + Deterministic Fallback)
 */
export async function askChatbot({ message }, user) {
  if (!message || !message.trim()) {
    throw new ApiError(400, 'Message cannot be empty.');
  }

  const userQuery = message.trim();
  const language = detectLanguage(userQuery);

  // Check feature toggle and rate limit in company settings
  const chatbotSettings = await getChatbotSettings();
  if (chatbotSettings.enabled === false) {
    throw new ApiError(503, 'HR Chatbot is currently disabled by administrator.');
  }

  // Check daily limit per user
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const dailyCount = await ChatMessage.countDocuments({
    userId: user._id,
    role: 'user',
    createdAt: { $gte: todayStart }
  });

  const limitPerDay = chatbotSettings.dailyLimitPerUser || 30;
  if (dailyCount >= limitPerDay) {
    throw new ApiError(
      429,
      `Daily query limit of ${limitPerDay} questions reached for today. Your limit will reset at midnight.`
    );
  }

  // Save the incoming user message
  await ChatMessage.create({
    userId: user._id,
    employeeId: user.employeeId,
    role: 'user',
    content: userQuery,
    language
  });

  let replyText = '';
  let actions = [];
  let sources = [];
  let toolCallsRecord = [];

  // 1. Try Live LLM (Google Gemini or OpenAI) if configured
  let aiSuccess = false;
  const isGemini = !!(env.GEMINI_API_KEY && env.GEMINI_API_KEY !== 'mock_key' && !env.GEMINI_API_KEY.startsWith('test_'));
  const isOpenAi = !!(env.OPENAI_API_KEY && env.OPENAI_API_KEY !== 'mock_key' && !env.OPENAI_API_KEY.startsWith('test_'));

  if (isGemini || isOpenAi) {
    try {
      const apiUrl = isGemini
        ? 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';
      const apiKey = isGemini ? env.GEMINI_API_KEY : env.OPENAI_API_KEY;
      const modelName = isGemini ? 'gemini-2.5-flash' : 'gpt-4o-mini';

      // Fetch recent 6 messages for context
      const history = await ChatMessage.find({ userId: user._id, isCleared: false })
        .sort({ createdAt: -1 })
        .limit(6)
        .lean();
      history.reverse();

      const messagesPayload = [
        {
          role: 'system',
          content: `You are the HRM Virtual Assistant for an enterprise software company in Pakistan.
You assist employees with HR policies, leave balances, payslips, and payroll dates.
Language: The user speaks ${language === 'ur-roman' ? 'Roman Urdu' : 'English'}. Respond in natural, polite ${language === 'ur-roman' ? 'Roman Urdu' : 'English'}.
Strict Security Rules:
- Personal data (leaves, salary, payslips, next pay date) must ONLY be fetched using the provided functions.
- Never invent numbers or dates. Always invoke the respective tool.
- If user attempts to query another employee's records (e.g., "Ali ki salary kya hai?"), refuse access politely and state that peer records are strictly confidential under company security policy.
- If a question cannot be answered from policy or tools, admit politely and suggest clicking 'Ask HR'.`
        },
        ...history.map((m) => ({ role: m.role === 'tool' ? 'assistant' : m.role, content: m.content || '' })),
        { role: 'user', content: userQuery }
      ];

      const aiRes = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: messagesPayload,
          tools: CHATBOT_TOOL_DEFINITIONS,
          tool_choice: 'auto',
          temperature: 0.3
        }),
        signal: AbortSignal.timeout(12000)
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const choice = aiData.choices?.[0]?.message;

        if (choice?.tool_calls && choice.tool_calls.length > 0) {
          // Execute tool calls
          const toolCall = choice.tool_calls[0];
          const toolName = toolCall.function?.name;
          let toolArgs = {};
          try {
            toolArgs = JSON.parse(toolCall.function?.arguments || '{}');
          } catch {
            toolArgs = {};
          }

          const toolResult = await executeToolCall(toolName, toolArgs, user);
          toolCallsRecord.push({
            id: toolCall.id,
            name: toolName,
            arguments: toolArgs,
            result: toolResult
          });

          // Process tool results for special actions and sources
          if (toolName === 'searchPolicy' && toolResult.results) {
            sources = toolResult.results;
          } else if (toolName === 'getMyLastPayslip' && toolResult.downloadUrl) {
            actions.push({
              type: 'download_payslip',
              label: 'Download Payslip PDF',
              payload: { url: toolResult.downloadUrl, period: toolResult.period }
            });
          }

          // Second round to format the tool result
          const secondRes = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: modelName,
              messages: [
                ...messagesPayload,
                choice,
                {
                  role: 'tool',
                  tool_call_id: toolCall.id,
                  content: JSON.stringify(toolResult)
                }
              ]
            }),
            signal: AbortSignal.timeout(12000)
          });

          if (secondRes.ok) {
            const secondData = await secondRes.json();
            replyText = secondData.choices?.[0]?.message?.content || '';
            aiSuccess = true;
          }
        } else if (choice?.content) {
          replyText = choice.content;
          aiSuccess = true;
        }

        // If AI replied but admits missing info, or couldn't find matching policy, provide Ask HR button
        if (
          aiSuccess &&
          !actions.some((a) => a.type === 'escalate_hr') &&
          (/cannot find|don't have|not found|no policy|undocumented|ask hr|hr se rabta|apologize|not mention|cannot be answered|specific details/i.test(replyText) ||
            (sources.length === 0 && !toolCallsRecord.some((t) => ['getMyLeaveBalance', 'getMyLastPayslip', 'getNextPayDate'].includes(t.name))))
        ) {
          actions.push({
            type: 'escalate_hr',
            label: language === 'ur-roman' ? 'HR se Poochain' : 'Ask HR',
            payload: { question: userQuery }
          });
        }
      }
    } catch {
      aiSuccess = false;
    }
  }

  // 2. Deterministic Fallback Heuristic Router (Executes if AI is offline or test environment)
  if (!aiSuccess) {
    const lower = userQuery.toLowerCase().trim();

    // Check for standard conversational greetings
    const isGreeting =
      /^(hi|hello|hey|salam|assalam|aoa|greetings|good morning|good afternoon|good evening|kaise ho|kese ho)\b/i.test(lower) ||
      ['hi', 'hello', 'hey', 'salam', 'aoa', 'assalam u alaikum', 'assalamu alaikum', 'kese ho', 'kaise ho'].includes(lower);

    // Intent 1: Leave Balance
    if (
      lower.includes('leave') ||
      lower.includes('chutti') ||
      lower.includes('chhutiyan') ||
      lower.includes('chuttiyan') ||
      lower.includes('balance') ||
      lower.includes('casual') ||
      lower.includes('sick') ||
      lower.includes('annual')
    ) {
      const balanceData = await getMyLeaveBalance({}, user);
      toolCallsRecord.push({ name: 'getMyLeaveBalance', result: balanceData });

      if (balanceData.error) {
        replyText =
          language === 'ur-roman'
            ? 'Aap ke account ke sath koi employee record link nahi hai. Meherbani farma kar HR se rabta karein.'
            : 'No employee profile linked to your user account. Please contact HR.';
      } else {
        const balList = balanceData.balances
          .map((b) => `• **${b.leaveType}**: ${b.remainingDays} din baqi (Total: ${b.allocatedDays}, Used: ${b.usedDays})`)
          .join('\n');

        if (language === 'ur-roman') {
          replyText = `Aap ki baqi chuttiyan (Leave Balances) darj zail hain:\n\n${balList}\n\nAgar aap leave apply karna chahte hain to mujhe batayein.`;
        } else {
          replyText = `Here is your current leave balance summary for ${balanceData.year}:\n\n${balList}\n\nWould you like me to assist you with applying for leave?`;
        }

        actions.push({
          type: 'apply_leave_prompt',
          label: language === 'ur-roman' ? 'Chutti Apply Karein' : 'Apply for Leave',
          payload: { action: 'open_leave_modal' }
        });
      }
    }
    // Intent 3: Next Pay Date
    else if (
      lower.includes('next pay') ||
      lower.includes('next salary') ||
      lower.includes('agli salary') ||
      lower.includes('kab aayegi') ||
      lower.includes('pay date') ||
      lower.includes('salary date')
    ) {
      const payDateData = await getNextPayDate({}, user);
      toolCallsRecord.push({ name: 'getNextPayDate', result: payDateData });

      if (language === 'ur-roman') {
        replyText = `Aap ki agli salary **${payDateData.formattedDate}** ko transfer ki jaye gi (${payDateData.daysRemaining} din baqi hain).\n\n*Note: Company ki policy ke tehat har maah ki 1st tareekh ko salaries disburse hoti hain.*`;
      } else {
        replyText = `Your next salary disbursement is scheduled for **${payDateData.formattedDate}** (${payDateData.daysRemaining} days remaining).\n\n*Company Standard: Salaries are credited on the 1st day of every month.*`;
      }
    }
    // Intent 2: Salary / Payslip
    else if (
      lower.includes('payslip') ||
      lower.includes('salary') ||
      lower.includes('tankhwah') ||
      lower.includes('pay slip') ||
      lower.includes('slip')
    ) {
      // Check for prompt injection / peer query
      if (
        (lower.includes('ali') || lower.includes('danyal') || lower.includes('emp-') || lower.includes('other')) &&
        !lower.includes('my') &&
        !lower.includes('meri')
      ) {
        replyText =
          language === 'ur-roman'
            ? 'Security policy ke tehat aap sirf apni zati tankhwah aur payslip dekh sakte hain. Doosre mulazmeen ka record confidential hota hai.'
            : 'Security Policy: You are strictly restricted to inspecting your own personal salary records. Peer information is confidential.';
      } else {
        const payslipData = await getMyLastPayslip({}, user);
        toolCallsRecord.push({ name: 'getMyLastPayslip', result: payslipData });

        if (!payslipData.found) {
          replyText =
            language === 'ur-roman'
              ? 'Aap ka koi processed payslip record daryaft nahi hua. Jab agla payroll generate hoga to yahan show hoga.'
              : 'No processed payslip records were found for your account.';
        } else {
          if (language === 'ur-roman') {
            replyText = `Aap ki aakhri tankhwah (${payslipData.period}) ki tafseelat:\n\n• **Net Pay**: PKR ${payslipData.netPayPKR?.toLocaleString()}\n• **Gross Pay**: PKR ${payslipData.grossPayPKR?.toLocaleString()}\n• **Deductions**: PKR ${payslipData.totalDeductionsPKR?.toLocaleString()}\n\nAap neechay diye gaye button se PDF download kar sakte hain.`;
          } else {
            replyText = `Here are the details for your latest payslip (${payslipData.period}):\n\n• **Net Salary**: PKR ${payslipData.netPayPKR?.toLocaleString()}\n• **Gross Earnings**: PKR ${payslipData.grossPayPKR?.toLocaleString()}\n• **Total Deductions**: PKR ${payslipData.totalDeductionsPKR?.toLocaleString()}\n\nYou can download the complete itemized PDF below.`;
          }

          actions.push({
            type: 'download_payslip',
            label: language === 'ur-roman' ? 'Payslip PDF Download Karein' : 'Download Payslip PDF',
            payload: { url: payslipData.downloadUrl, period: payslipData.period }
          });
        }
      }
    }
    // Greeting branch
    else if (isGreeting) {
      if (language === 'ur-roman') {
        replyText = `Khushamdeed! Main aap ka HR Assistant hoon. Aap mujh se:\n\n1. Apni baqi leaves (chuttiyan)\n2. Aakhri payslip aur tankhwah ki tafseelat\n3. Agli salary kab aayegi\n4. Company ki policies aur rules (jaise probation period, office timing)\n\nke baray me pooch sakte hain. Main aap ki kya madad kar sakta hoon?`;
      } else {
        replyText = `Hello! I am your HRM Assistant. You can ask me about:\n\n• Your leave balances and quota\n• Your latest payslip and salary disbursement\n• Upcoming pay dates\n• Official company policies (probation, timings, benefits)\n\nHow can I help you today?`;
      }
    }
    // General Policy & Operational Inquiries (Dynamic full-text / semantic lookup)
    else {
      const policyData = await searchPolicy({ query: userQuery });
      toolCallsRecord.push({ name: 'searchPolicy', result: policyData });

      if (policyData.found && policyData.results?.length > 0) {
        sources = policyData.results;
        const topResult = policyData.results[0];

        if (language === 'ur-roman') {
          replyText = `Company ki policy (**${topResult.title}**) ke mutabiq:\n\n> "${topResult.snippet}"\n\nAgar mazeed wazahat darkar ho to aap 'Ask HR' ke zariye HR team se rabta kar sakte hain.`;
        } else {
          replyText = `According to company policy (**${topResult.title}**):\n\n> "${topResult.snippet}"\n\nPlease let me know if you need more details, or use 'Ask HR' for custom inquiries.`;
        }
      } else {
        if (language === 'ur-roman') {
          replyText = `Maazrat, is mozuh par company policy ya handbook me koi wazeh maloomat nahi mili. Kya aap chahte hain ke main yeh sawal HR team ko forward kar doon?`;
        } else {
          replyText = `I could not find an official policy covering this topic in the handbook. Would you like me to escalate this to the HR team?`;
        }
        actions.push({
          type: 'escalate_hr',
          label: language === 'ur-roman' ? 'HR se Poochain (Ask HR)' : 'Ask HR',
          payload: { question: userQuery }
        });
      }
    }
  }

  // Save the assistant response in database
  const assistantMessage = await ChatMessage.create({
    userId: user._id,
    employeeId: user.employeeId,
    role: 'assistant',
    content: replyText,
    language,
    actions,
    sources,
    toolCalls: toolCallsRecord
  });

  return {
    reply: replyText,
    messageId: assistantMessage._id,
    actions,
    sources,
    language
  };
}

/**
 * 16.6: Escalate Unanswered Question to HR Team
 */
export async function escalateQuestion({ question, userLanguage = 'en' }, user) {
  if (!question || question.trim().length < 3) {
    throw new ApiError(400, 'Question must be at least 3 characters long.');
  }

  const cleanQuestion = question.trim();

  // Create escalation record
  const unansweredDoc = await UnansweredQuestion.create({
    userId: user._id,
    employeeId: user.employeeId,
    question: cleanQuestion,
    userLanguage,
    status: 'Pending'
  });

  // Notify all users with HR Manager role
  try {
    const hrRole = await Role.findOne({ name: 'HR Manager' }).lean();
    if (hrRole) {
      const hrUsers = await User.find({ roles: hrRole._id, isActive: true }).select('_id').lean();
      for (const hrUser of hrUsers) {
        await Notification.create({
          userId: hrUser._id,
          title: 'New Chatbot Query Escalated',
          message: `Employee submitted an unanswered query: "${cleanQuestion.substring(0, 80)}${cleanQuestion.length > 80 ? '...' : ''}"`,
          type: 'announcement',
          link: '/chatbot/unanswered',
          isRead: false
        });
      }
    }
  } catch {
    // Non-blocking notification
  }

  return unansweredDoc;
}

/**
 * 16.6: Get Unanswered Questions Queue for HR Managers
 */
export async function getUnansweredQuestions({ page = 1, limit = 20, status } = {}) {
  const filter = {};
  if (status && status !== 'All') {
    filter.status = status;
  }

  const parsedPage = Math.max(1, parseInt(page, 10));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (parsedPage - 1) * parsedLimit;

  const [items, total] = await Promise.all([
    UnansweredQuestion.find(filter)
      .populate('userId', 'name email employeeId')
      .populate('answeredBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .lean(),
    UnansweredQuestion.countDocuments(filter)
  ]);

  return {
    items,
    total,
    page: parsedPage,
    limit: parsedLimit,
    totalPages: Math.ceil(total / parsedLimit) || 1
  };
}

/**
 * 16.6: Answer an Escalated Question (HR Manager)
 */
export async function answerUnansweredQuestion(id, { answer }, user) {
  if (!answer || !answer.trim()) {
    throw new ApiError(400, 'Answer cannot be empty.');
  }

  const questionDoc = await UnansweredQuestion.findById(id);
  if (!questionDoc) {
    throw new ApiError(404, 'Unanswered question record not found.');
  }

  questionDoc.status = 'Answered';
  questionDoc.answer = answer.trim();
  questionDoc.answeredBy = user._id;
  questionDoc.answeredAt = new Date();
  await questionDoc.save();

  // Send in-app notification back to inquiring employee
  try {
    await Notification.create({
      userId: questionDoc.userId,
      title: 'HR Answered Your Chatbot Question',
      message: `HR response: "${answer.trim().substring(0, 90)}${answer.length > 90 ? '...' : ''}"`,
      type: 'announcement',
      link: '/',
      isRead: false
    });
  } catch {
    // Non-blocking
  }

  return questionDoc;
}

/**
 * 16.8: Get User's Chat Conversation History
 */
export async function getChatHistory(user) {
  const messages = await ChatMessage.find({
    userId: user._id,
    isCleared: false
  })
    .sort({ createdAt: 1 })
    .limit(50)
    .lean();

  return messages;
}

/**
 * 16.8: Clear User's Conversation History
 */
export async function clearChatHistory(user) {
  await ChatMessage.updateMany(
    { userId: user._id, isCleared: false },
    { $set: { isCleared: true } }
  );

  return { message: 'Chat history cleared successfully.' };
}

/**
 * 16.9: Get Chatbot Settings from Company Settings
 */
export async function getChatbotSettings() {
  const setting = await Setting.findOne({ key: 'chatbot' }).lean();
  if (!setting || !setting.value) {
    return {
      enabled: true,
      dailyLimitPerUser: 30,
      allowedRoles: ['Super Admin', 'HR Manager', 'Department Manager', 'Employee']
    };
  }

  return {
    enabled: setting.value.enabled !== false,
    dailyLimitPerUser: setting.value.dailyLimitPerUser || 30,
    allowedRoles: setting.value.allowedRoles || ['Super Admin', 'HR Manager', 'Department Manager', 'Employee']
  };
}

/**
 * 16.9: Update Chatbot Settings (Super Admin)
 */
export async function updateChatbotSettings(data, user) {
  const current = await getChatbotSettings();
  const merged = {
    ...current,
    ...data
  };

  const setting = await Setting.findOneAndUpdate(
    { key: 'chatbot' },
    {
      key: 'chatbot',
      value: merged,
      updatedBy: user._id
    },
    { upsert: true, new: true }
  );

  return setting.value;
}
