import { NextRequest, NextResponse } from 'next/server';
import { getChat, supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, chatId } = body;

    if (!userId || !chatId) {
      return NextResponse.json(
        { error: 'User ID and chat ID are required' },
        { status: 400 }
      );
    }

    // Verify chat exists
    const chat = await getChat(chatId);
    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Verify user is part of the chat
    if (!chat.user_ids.includes(userId)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Mark chat as ended by adding an ended_at timestamp
    const { error } = await supabase
      .from('chats')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', chatId);

    if (error) {
      console.error('Error ending chat:', error);
      return NextResponse.json(
        { error: 'Failed to end chat' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Chat ended successfully',
    });

  } catch (error) {
    console.error('End chat error:', error);
    return NextResponse.json(
      { error: 'Failed to end chat' },
      { status: 500 }
    );
  }
}
