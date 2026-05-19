import { GoogleGenerativeAI, type Part } from '@google/generative-ai';
import {
  getExpenses,
  addExpense,
  getNotes,
  addNote,
  getTasks,
  addTask,
  toggleTask,
} from './firestore';
import type { Expense, Note, Task } from '@/types';

// ─── Tool Definitions for Function Calling ──────────────────────
const tools = [
  {
    functionDeclarations: [
      {
        name: 'get_expenses',
        description: 'Retrieve all expenses of the current user from the database. Returns a list of expenses with title, amount, category, and date.',
        parameters: { type: 'OBJECT' as const, properties: {}, required: [] },
      },
      {
        name: 'add_expense',
        description: 'Add a new expense entry to the database for the current user.',
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            title: { type: 'STRING' as const, description: 'Title or description of the expense' },
            amount: { type: 'NUMBER' as const, description: 'Amount in local currency' },
            category: { type: 'STRING' as const, description: 'Category: Food, Transport, Shopping, Entertainment, Health, Education, Bills, Rent, Groceries, Travel, Gift, Other' },
            date: { type: 'STRING' as const, description: 'Date in YYYY-MM-DD format' },
          },
          required: ['title', 'amount', 'category', 'date'],
        },
      },
      {
        name: 'get_notes',
        description: 'Retrieve all notes of the current user.',
        parameters: { type: 'OBJECT' as const, properties: {}, required: [] },
      },
      {
        name: 'add_note',
        description: 'Create a new note for the current user.',
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            title: { type: 'STRING' as const, description: 'Title of the note' },
            content: { type: 'STRING' as const, description: 'Content of the note' },
          },
          required: ['title', 'content'],
        },
      },
      {
        name: 'get_tasks',
        description: 'Retrieve all tasks/to-dos of the current user.',
        parameters: { type: 'OBJECT' as const, properties: {}, required: [] },
      },
      {
        name: 'add_task',
        description: 'Add a new task/to-do item for the current user.',
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            taskName: { type: 'STRING' as const, description: 'Name/description of the task' },
            dueDate: { type: 'STRING' as const, description: 'Due date in YYYY-MM-DD format' },
            dueTime: { type: 'STRING' as const, description: 'Due time in HH:mm format (optional)' },
          },
          required: ['taskName', 'dueDate'],
        },
      },
      {
        name: 'complete_task',
        description: 'Mark a task as completed by its name (finds closest match).',
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            taskName: { type: 'STRING' as const, description: 'Name of the task to mark as completed' },
          },
          required: ['taskName'],
        },
      },
    ],
  },
];

// ─── Execute Function Call ──────────────────────────────────────
async function executeFunctionCall(
  name: string,
  args: Record<string, unknown>,
  userId: string
): Promise<string> {
  try {
    switch (name) {
      case 'get_expenses': {
        const expenses = await getExpenses(userId);
        if (expenses.length === 0) return JSON.stringify({ result: 'No expenses found.' });
        return JSON.stringify({ result: expenses.map(e => ({ title: e.title, amount: e.amount, category: e.category, date: e.date })) });
      }
      case 'add_expense': {
        await addExpense(userId, {
          title: args.title as string,
          amount: args.amount as number,
          category: args.category as string,
          date: args.date as string,
        });
        return JSON.stringify({ result: `Expense "${args.title}" of ${args.amount} added successfully.` });
      }
      case 'get_notes': {
        const notes = await getNotes(userId);
        if (notes.length === 0) return JSON.stringify({ result: 'No notes found.' });
        return JSON.stringify({ result: notes.map(n => ({ title: n.title, content: n.content.substring(0, 200) })) });
      }
      case 'add_note': {
        await addNote(userId, { title: args.title as string, content: args.content as string });
        return JSON.stringify({ result: `Note "${args.title}" created successfully.` });
      }
      case 'get_tasks': {
        const tasks = await getTasks(userId);
        if (tasks.length === 0) return JSON.stringify({ result: 'No tasks found.' });
        return JSON.stringify({ result: tasks.map(t => ({ taskName: t.taskName, dueDate: t.dueDate, dueTime: t.dueTime || '', isCompleted: t.isCompleted })) });
      }
      case 'add_task': {
        await addTask(userId, {
          taskName: args.taskName as string,
          dueDate: args.dueDate as string,
          dueTime: args.dueTime as string | undefined,
        });
        return JSON.stringify({ result: `Task "${args.taskName}" added for ${args.dueDate}.` });
      }
      case 'complete_task': {
        const tasks = await getTasks(userId);
        const target = (args.taskName as string).toLowerCase();
        const match = tasks.find(t => t.taskName.toLowerCase().includes(target));
        if (match) {
          await toggleTask(userId, match.id, true);
          return JSON.stringify({ result: `Task "${match.taskName}" marked as completed.` });
        }
        return JSON.stringify({ result: `Could not find a task matching "${args.taskName}".` });
      }
      default:
        return JSON.stringify({ error: `Unknown function: ${name}` });
    }
  } catch (err: any) {
    return JSON.stringify({ error: err.message });
  }
}

// ─── Auto Categorize ────────────────────────────────────────────
export async function autoCategorizeSingle(apiKey: string, title: string): Promise<string> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(
      `You are an expense categorizer. Given this expense title: "${title}", respond with ONLY one of these categories: Food, Transport, Shopping, Entertainment, Health, Education, Bills, Rent, Groceries, Travel, Gift, Other. No explanation needed, just the single category word.`
    );
    const text = result.response.text().trim();
    const validCategories = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Education', 'Bills', 'Rent', 'Groceries', 'Travel', 'Gift', 'Other'];
    return validCategories.find(c => c.toLowerCase() === text.toLowerCase()) || 'Other';
  } catch {
    return 'Other';
  }
}

// ─── Main Chat Function ─────────────────────────────────────────
export async function sendChatMessage(
  apiKey: string,
  systemPrompt: string,
  history: { role: string; content: string }[],
  userMessage: string,
  userId: string,
  imageBase64?: string,
  imageMimeType?: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: systemPrompt || `You are HC Agent, a highly intelligent personal AI assistant. You help the user manage their expenses, notes, and tasks. You can read data from and write data to the user's database using the available tools. Always be helpful, friendly, and proactive. When the user asks about their data, use the appropriate tool to fetch it. When they ask to add something, use the tool to add it. Today's date is ${new Date().toISOString().split('T')[0]}.`,
    tools: tools as any,
  });

  // Build conversation history for context
  const chatHistory = history.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({ history: chatHistory as any });

  // Build user message parts
  const parts: Part[] = [];
  if (imageBase64 && imageMimeType) {
    parts.push({ inlineData: { data: imageBase64, mimeType: imageMimeType } });
  }
  parts.push({ text: userMessage });

  let response = await chat.sendMessage(parts);
  let result = response.response;

  // Handle function calls in a loop
  let maxIterations = 5;
  while (maxIterations > 0) {
    const candidate = result.candidates?.[0];
    const functionCall = candidate?.content?.parts?.find((p: any) => p.functionCall)?.functionCall;

    if (!functionCall) break;

    const fnResult = await executeFunctionCall(functionCall.name, functionCall.args as Record<string, unknown>, userId);

    response = await chat.sendMessage([
      { functionResponse: { name: functionCall.name, response: JSON.parse(fnResult) } },
    ]);
    result = response.response;
    maxIterations--;
  }

  return result.text() || 'I could not generate a response.';
}
