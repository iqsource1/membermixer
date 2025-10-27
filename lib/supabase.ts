import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Client-side Supabase client (uses anon key with RLS)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Lazy initialization for server-side admin client
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        `Missing Supabase credentials: URL=${!!supabaseUrl}, ServiceKey=${!!serviceRoleKey}`
      );
    }

    _supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return _supabaseAdmin;
}

// Database types
export interface Profile {
  user_id: string;
  name: string;
  interests: string[];
  avatar_path?: string;
  bio?: string;
  matches_used: number;
  has_unlimited_matches: boolean;
  active_subscription: boolean;
  last_match_at?: string;
  created_at: string;
}

export interface Chat {
  id: string;
  user_ids: string[];
  created_at: string;
  last_message_at?: string;
}

export interface Message {
  id: string;
  chat_id: string;
  user_id: string;
  text?: string;
  attachment_path?: string;
  timestamp: string;
}

// Helper functions for Supabase operations

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

export async function createOrUpdateProfile(profile: Partial<Profile>): Promise<Profile | null> {
  console.log('[Supabase] Attempting to upsert profile:', profile.user_id);

  const { data, error } = await getSupabaseAdmin()
    .from('profiles')
    .upsert(profile, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Error upserting profile:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return null;
  }

  console.log('[Supabase] Profile upserted successfully:', data.user_id);
  return data;
}

export async function getAllProfiles(excludeUserId?: string): Promise<Profile[]> {
  let query = getSupabaseAdmin()
    .from('profiles')
    .select('*')
    .not('interests', 'is', null);

  if (excludeUserId) {
    query = query.neq('user_id', excludeUserId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }

  return data || [];
}

export async function getActiveChat(userId: string): Promise<Chat | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('chats')
    .select('*')
    .contains('user_ids', [userId])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching active chat:', error);
  }

  return data || null;
}

export async function createChat(userId1: string, userId2: string): Promise<Chat | null> {
  const chatId = crypto.randomUUID();

  const { data, error } = await getSupabaseAdmin()
    .from('chats')
    .insert({
      id: chatId,
      user_ids: [userId1, userId2],
      last_message_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating chat:', error);
    return null;
  }

  return data;
}

export async function getChat(chatId: string): Promise<Chat | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('chats')
    .select('*')
    .eq('id', chatId)
    .single();

  if (error) {
    console.error('Error fetching chat:', error);
    return null;
  }

  return data;
}

export async function getMessages(chatId: string, limit = 50): Promise<Message[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('timestamp', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return data || [];
}

export async function createMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<Message | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('messages')
    .insert(message)
    .select()
    .single();

  if (error) {
    console.error('Error creating message:', error);
    return null;
  }

  // Update chat last_message_at
  await getSupabaseAdmin()
    .from('chats')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', message.chat_id);

  return data;
}

export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<string | undefined> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true });

  if (error) {
    console.error('Error uploading file:', error);
    return undefined;
  }

  return data.path;
}

export async function getSignedUrl(bucket: string, path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 3600); // 1 hour expiry

  if (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }

  return data.signedUrl;
}

