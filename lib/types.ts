export type UserRole = "user" | "host" | "admin";
export type HostStatus = "available" | "busy" | "offline";
export type SessionStatus = "waiting" | "active" | "ended" | "expired";
export type ServiceType = "text" | "voice" | "audio_call";

export type TransactionType =
  | "ad_reward"
  | "text"
  | "voice"
  | "audio_call"
  | "withdrawal"
  | "admin_adjustment"
  | "gift";

export type WithdrawalStatus = "pending" | "approved" | "paid" | "rejected";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  coin_balance: number;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

export interface Host {
  id: string;
  display_name: string;
  photo_url: string | null;
  bio: string | null;
  status: HostStatus;
  active_session_id: string | null;
  text_enabled: boolean;
  voice_enabled: boolean;
  call_enabled: boolean;
  total_earned: number;
  total_withdrawn: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  host_id: string;
  status: SessionStatus;
  service_type: ServiceType | null;
  started_at: string | null;
  ended_at: string | null;
  expired_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QueueItem {
  id: string;
  host_id: string;
  user_id: string;
  position: number;
  created_at: string;
}

export interface Message {
  id: string;
  session_id: string;
  sender_id: string;
  content: string;
  coin_charged: number;
  created_at: string;
}

export interface AppSettings {
  id: number;
  text_coin_cost: number;
  voice_coin_per_second: number;
  call_coin_per_second: number;
  ad_reward_coins: number;
  ad_limit_per_minute: number;
  ad_limit_per_hour: number;
  expired_cleanup_hours: number;
  short_video_coins?: number;
  short_video_cooldown_seconds?: number;
  short_video_limit_per_hour?: number;
  offerwall_coins_per_cent?: number;
  monetization_enabled: boolean;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      hosts: {
        Row: Host;
        Insert: Partial<Host> & { id: string; display_name: string };
        Update: Partial<Host>;
      };
      sessions: {
        Row: Session;
        Insert: Partial<Session>;
        Update: Partial<Session>;
      };
      queue: {
        Row: QueueItem;
        Insert: Partial<QueueItem>;
        Update: Partial<QueueItem>;
      };
      messages: {
        Row: Message;
        Insert: Partial<Message>;
        Update: Partial<Message>;
      };
      app_settings: {
        Row: AppSettings;
        Insert: Partial<AppSettings>;
        Update: Partial<AppSettings>;
      };
    };
  };
};
