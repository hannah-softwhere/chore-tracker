import { NextRequest, NextResponse } from 'next/server';
import { getChoreInstances, getChoresForDate, getDueChores, completeChoreInstance, uncompleteChoreInstance, deleteChoreInstance } from '@/lib/db/services';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const due = searchParams.get('due');

    if (date) {
      const chores = await getChoresForDate(new Date(date));
      return NextResponse.json(chores);
    }

    if (due === 'true') {
      const chores = await getDueChores();
      return NextResponse.json(chores);
    }

    const instances = await getChoreInstances();
    return NextResponse.json(instances);
  } catch (error) {
    console.error('Error fetching chore instances:', error);
    return NextResponse.json({ error: 'Failed to fetch chore instances' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let result;
    switch (action) {
      case 'complete':
        result = await completeChoreInstance(id);
        break;
      case 'uncomplete':
        result = await uncompleteChoreInstance(id);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating chore instance:', error);
    return NextResponse.json({ error: 'Failed to update chore instance' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing chore instance ID' }, { status: 400 });
    }

    await deleteChoreInstance(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chore instance:', error);
    return NextResponse.json({ error: 'Failed to delete chore instance' }, { status: 500 });
  }
}
