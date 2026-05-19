import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  Timestamp,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Expense, Note, Task, ChatSession, ChatMessage, UserSettings } from '@/types';

// ─── Expenses ────────────────────────────────────────────────────
export async function addExpense(userId: string, data: Omit<Expense, 'id' | 'userId' | 'createdAt'>) {
  const ref = collection(db, 'users', userId, 'expenses');
  return addDoc(ref, { ...data, userId, createdAt: Date.now() });
}

export async function getExpenses(userId: string): Promise<Expense[]> {
  const ref = collection(db, 'users', userId, 'expenses');
  const q = query(ref, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Expense));
}

export async function deleteExpense(userId: string, expenseId: string) {
  return deleteDoc(doc(db, 'users', userId, 'expenses', expenseId));
}

// ─── Notes ───────────────────────────────────────────────────────
export async function addNote(userId: string, data: { title: string; content: string }) {
  const ref = collection(db, 'users', userId, 'notes');
  return addDoc(ref, { ...data, userId, createdAt: Date.now(), updatedAt: Date.now() });
}

export async function getNotes(userId: string): Promise<Note[]> {
  const ref = collection(db, 'users', userId, 'notes');
  const q = query(ref, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Note));
}

export async function updateNote(userId: string, noteId: string, data: { title?: string; content?: string }) {
  return updateDoc(doc(db, 'users', userId, 'notes', noteId), { ...data, updatedAt: Date.now() });
}

export async function deleteNote(userId: string, noteId: string) {
  return deleteDoc(doc(db, 'users', userId, 'notes', noteId));
}

// ─── Tasks ───────────────────────────────────────────────────────
export async function addTask(userId: string, data: { taskName: string; dueDate: string; dueTime?: string }) {
  const ref = collection(db, 'users', userId, 'tasks');
  return addDoc(ref, { ...data, userId, isCompleted: false, createdAt: Date.now() });
}

export async function getTasks(userId: string): Promise<Task[]> {
  const ref = collection(db, 'users', userId, 'tasks');
  const q = query(ref, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task));
}

export async function toggleTask(userId: string, taskId: string, isCompleted: boolean) {
  return updateDoc(doc(db, 'users', userId, 'tasks', taskId), { isCompleted });
}

export async function deleteTask(userId: string, taskId: string) {
  return deleteDoc(doc(db, 'users', userId, 'tasks', taskId));
}

// ─── Chat Sessions ──────────────────────────────────────────────
export async function createChatSession(userId: string, title: string): Promise<string> {
  const ref = collection(db, 'users', userId, 'chats');
  const docRef = await addDoc(ref, { title, userId, createdAt: Date.now(), updatedAt: Date.now() });
  return docRef.id;
}

export async function getChatSessions(userId: string): Promise<ChatSession[]> {
  const ref = collection(db, 'users', userId, 'chats');
  const q = query(ref, orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatSession));
}

export async function updateChatSession(userId: string, chatId: string, data: Partial<ChatSession>) {
  return updateDoc(doc(db, 'users', userId, 'chats', chatId), { ...data, updatedAt: Date.now() });
}

export async function deleteChatSession(userId: string, chatId: string) {
  // Delete all messages first
  const msgRef = collection(db, 'users', userId, 'chats', chatId, 'messages');
  const snap = await getDocs(msgRef);
  const deletes = snap.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletes);
  return deleteDoc(doc(db, 'users', userId, 'chats', chatId));
}

// ─── Chat Messages ──────────────────────────────────────────────
export async function addChatMessage(userId: string, chatId: string, msg: Omit<ChatMessage, 'id'>) {
  const ref = collection(db, 'users', userId, 'chats', chatId, 'messages');
  await addDoc(ref, msg);
  await updateDoc(doc(db, 'users', userId, 'chats', chatId), { updatedAt: Date.now() });
}

export async function getChatMessages(userId: string, chatId: string): Promise<ChatMessage[]> {
  const ref = collection(db, 'users', userId, 'chats', chatId, 'messages');
  const q = query(ref, orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage));
}

// ─── User Settings ──────────────────────────────────────────────
export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const ref = doc(db, 'users', userId, 'settings', 'profile');
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserSettings) : null;
}

export async function saveUserSettings(userId: string, settings: Partial<UserSettings>) {
  const ref = doc(db, 'users', userId, 'settings', 'profile');
  return setDoc(ref, settings, { merge: true });
}
