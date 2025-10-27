import { NextRequest, NextResponse } from 'next/server';
import { getMessages, createMessage, getChat } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const chatId = params.chatId;

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
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

    // Get messages
    const messages = await getMessages(chatId);

    return NextResponse.json({
      success: true,
      messages,
      chat,
    });

  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const chatId = params.chatId;
    const body = await req.json();
    const { userId, text, attachmentPath } = body;

    if (!chatId || !userId) {
      return NextResponse.json(
        { error: 'Chat ID and user ID are required' },
        { status: 400 }
      );
    }

    if (!text && !attachmentPath) {
      return NextResponse.json(
        { error: 'Message text or attachment is required' },
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

    // Create message
    const message = await createMessage({
      chat_id: chatId,
      user_id: userId,
      text: text?.trim() || null,
      attachment_path: attachmentPath || null,
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Failed to create message' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message,
    });

  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
