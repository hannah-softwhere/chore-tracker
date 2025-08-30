import { db } from './index';
import { choreTemplates, choreInstances, payouts } from './schema';
import { eq, and, gte, lte, desc, asc } from 'drizzle-orm';
import { addDays, addWeeks, addMonths } from 'date-fns';
import type { NewChoreTemplate, NewChoreInstance, NewPayout, Frequency } from './schema';

// Chore Template Services
export async function createChoreTemplate(template: NewChoreTemplate) {
  const [result] = await db.insert(choreTemplates).values(template).returning();
  return result;
}

export async function getChoreTemplates() {
  return await db.select().from(choreTemplates).where(eq(choreTemplates.isActive, true)).orderBy(desc(choreTemplates.createdAt));
}

export async function updateChoreTemplate(id: string, updates: Partial<NewChoreTemplate>) {
  const [result] = await db.update(choreTemplates).set(updates).where(eq(choreTemplates.id, id)).returning();
  return result;
}

export async function deleteChoreTemplate(id: string) {
  await db.delete(choreTemplates).where(eq(choreTemplates.id, id));
}

// Chore Instance Services
export async function createChoreInstance(instance: NewChoreInstance) {
  const [result] = await db.insert(choreInstances).values(instance).returning();
  return result;
}

export async function generateChoreInstances(templateId: string, startDate: Date, count: number = 30) {
  const template = await db.select().from(choreTemplates).where(eq(choreTemplates.id, templateId)).limit(1);
  
  if (!template[0]) throw new Error('Template not found');
  
  const instances: NewChoreInstance[] = [];
  let currentDate = startDate;

  for (let i = 0; i < count; i++) {
    const instance: NewChoreInstance = {
      templateId,
      title: template[0].title,
      amount: template[0].amount,
      frequency: template[0].frequency,
      dueDate: currentDate.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
      completed: false,
    };
    
    instances.push(instance);

    // Calculate next due date based on frequency
    switch (template[0].frequency) {
      case 'daily':
        currentDate = addDays(currentDate, 1);
        break;
      case 'weekly':
        currentDate = addWeeks(currentDate, 1);
        break;
      case 'monthly':
        currentDate = addMonths(currentDate, 1);
        break;
      case 'one-time':
        i = count; // Exit loop for one-time chores
        break;
    }

    // Stop creating instances for one-time chores after the first one
    if (template[0].frequency === 'one-time') break;
  }

  if (instances.length > 0) {
    await db.insert(choreInstances).values(instances);
  }
  
  return instances;
}

export async function getChoreInstances() {
  return await db.select().from(choreInstances).orderBy(desc(choreInstances.createdAt));
}

export async function getChoresForDate(date: Date) {
  const dateString = date.toISOString().split('T')[0]; // Convert Date to YYYY-MM-DD string
  return await db.select().from(choreInstances).where(eq(choreInstances.dueDate, dateString)).orderBy(asc(choreInstances.title));
}

export async function getDueChores() {
  const today = new Date().toISOString().split('T')[0]; // Convert to YYYY-MM-DD string
  return await db.select().from(choreInstances).where(
    and(
      eq(choreInstances.completed, false),
      lte(choreInstances.dueDate, today)
    )
  ).orderBy(asc(choreInstances.dueDate));
}

export async function completeChoreInstance(id: string) {
  const [result] = await db.update(choreInstances)
    .set({ completed: true, completedAt: new Date() })
    .where(eq(choreInstances.id, id))
    .returning();
  return result;
}

export async function uncompleteChoreInstance(id: string) {
  const [result] = await db.update(choreInstances)
    .set({ completed: false, completedAt: null })
    .where(eq(choreInstances.id, id))
    .returning();
  return result;
}

export async function deleteChoreInstance(id: string) {
  await db.delete(choreInstances).where(eq(choreInstances.id, id));
}

export async function getCompletedChores(filter: 'all' | 'week' | 'month' | '3months' = 'all') {
  const now = new Date();
  let startDate: Date;

  switch (filter) {
    case 'week':
      startDate = addDays(now, -7);
      break;
    case 'month':
      startDate = addMonths(now, -1);
      break;
    case '3months':
      startDate = addMonths(now, -3);
      break;
    default:
      return await db.select().from(choreInstances).where(eq(choreInstances.completed, true)).orderBy(desc(choreInstances.completedAt));
  }

  return await db.select().from(choreInstances).where(
    and(
      eq(choreInstances.completed, true),
      gte(choreInstances.completedAt!, startDate)
    )
  ).orderBy(desc(choreInstances.completedAt));
}

// Payout Services
export async function createPayout(payout: NewPayout) {
  const [result] = await db.insert(payouts).values(payout).returning();
  return result;
}

export async function getPayouts() {
  return await db.select().from(payouts).orderBy(desc(payouts.date));
}

// Statistics Services
export async function getTotalEarned() {
  const result = await db.select({ total: choreInstances.amount })
    .from(choreInstances)
    .where(eq(choreInstances.completed, true));
  
  return result.reduce((sum, row) => sum + Number(row.total), 0);
}

export async function getChoreStatistics() {
  // This would be a more complex query using the view we created
  // For now, we'll use a simple aggregation
  const stats = await db.select({
    templateId: choreTemplates.id,
    title: choreTemplates.title,
    amount: choreTemplates.amount,
    frequency: choreTemplates.frequency,
    isActive: choreTemplates.isActive,
  }).from(choreTemplates).where(eq(choreTemplates.isActive, true));
  
  return stats;
}
