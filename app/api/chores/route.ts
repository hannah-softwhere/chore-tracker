import { NextRequest, NextResponse } from 'next/server';
import { createChoreTemplate, getChoreTemplates, generateChoreInstances } from '@/lib/db/services';
import type { NewChoreTemplate } from '@/lib/db/schema';

export async function GET() {
  try {
    const templates = await getChoreTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching chore templates:', error);
    return NextResponse.json({ error: 'Failed to fetch chore templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, amount, frequency, startDate } = body;

    // Validate required fields
    if (!title || !amount || !frequency || !startDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate amount is a valid number
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Create the chore template
    const template: NewChoreTemplate = {
      title,
      amount: amountNum.toString(), // Drizzle decimal expects string
      frequency,
    };

    const newTemplate = await createChoreTemplate(template);

    // Generate initial chore instances
    await generateChoreInstances(newTemplate.id, new Date(startDate), 30);

    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error) {
    console.error('Error creating chore template:', error);
    return NextResponse.json({ error: 'Failed to create chore template' }, { status: 500 });
  }
}
