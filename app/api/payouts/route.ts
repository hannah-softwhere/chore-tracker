import { NextRequest, NextResponse } from 'next/server';
import { createPayout, getPayouts, getTotalEarned } from '@/lib/db/services';
import type { NewPayout } from '@/lib/db/schema';

export async function GET() {
  try {
    const payouts = await getPayouts();
    return NextResponse.json(payouts);
  } catch (error) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, notes } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid payout amount' }, { status: 400 });
    }

    // Check if there's enough earned money
    const totalEarned = await getTotalEarned();
    if (amount > totalEarned) {
      return NextResponse.json({ error: 'Payout amount exceeds total earned' }, { status: 400 });
    }

    // Create the payout
    const payout: NewPayout = {
      amount: parseFloat(amount),
      notes,
    };

    const newPayout = await createPayout(payout);
    return NextResponse.json(newPayout, { status: 201 });
  } catch (error) {
    console.error('Error creating payout:', error);
    return NextResponse.json({ error: 'Failed to create payout' }, { status: 500 });
  }
}
