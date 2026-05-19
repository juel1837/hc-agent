export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  createdAt: number;
  userId: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  userId: string;
}

export interface Task {
  id: string;
  taskName: string;
  dueDate: string;
  dueTime?: string;
  isCompleted: boolean;
  createdAt: number;
  userId: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  userId: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  imageUrl?: string;
  createdAt: number;
}

export interface UserSettings {
  apiKey: string;
  systemPrompt: string;
  displayName: string;
}

export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Entertainment',
  'Health',
  'Education',
  'Bills',
  'Rent',
  'Groceries',
  'Travel',
  'Gift',
  'Other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f97316',
  Transport: '#3b82f6',
  Shopping: '#ec4899',
  Entertainment: '#a855f7',
  Health: '#ef4444',
  Education: '#14b8a6',
  Bills: '#eab308',
  Rent: '#6366f1',
  Groceries: '#22c55e',
  Travel: '#06b6d4',
  Gift: '#f43f5e',
  Other: '#64748b',
};

export const PROMPT_TEMPLATES = [
  { label: '📊 Analyze My Budget', prompt: 'Analyze my current month expenses and give me a detailed budget breakdown with insights and savings tips.' },
  { label: '📝 Summarize My Notes', prompt: 'Summarize all my recent notes and highlight the key points from each one.' },
  { label: '✅ Review My Tasks', prompt: 'Review my pending tasks, prioritize them, and suggest the best order to complete them today.' },
  { label: '🎬 Draft Video Script', prompt: 'Help me draft a creative video script idea based on my recent notes and interests.' },
  { label: '💡 Daily Plan', prompt: 'Create a detailed daily plan for me based on my pending tasks and any upcoming deadlines.' },
  { label: '📈 Spending Trends', prompt: 'Show me my spending trends this month compared to categories and suggest where I can cut costs.' },
];
