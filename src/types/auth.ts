
export interface UserCredentials {
  email: string;
  username: string;
  password: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  isAdmin?: boolean;
  isGoogleUser?: boolean;
  googleId?: string;
  picture?: string;
}

export interface SupabaseConfig {
  url: string;
  key: string;
}

export interface PortalSettings {
  enabled: boolean;
  custom_path: string;
  download_url?: string;
  application_name?: string;
}

export interface WebLoginRegz {
  id: number;
  username: string;
  password: string;
  email: string;
  subscription_type: string;
  created_at: string;
  supabase_url: string | null;
  supabase_api_key: string | null;
  license_key: string | null;
  portal_settings: PortalSettings | null | any; // Allow any to handle JSON type from Supabase
  google_id?: string;
  is_google_user?: boolean;
  picture?: string;
}

export interface License {
  id: number;
  key?: string;
  license_key: string;
  user_id?: number | null;
  created_at?: string;
  expiredate?: string | null;
  is_active?: boolean;
  admin_approval?: boolean;
  banned?: boolean;
  hwid?: string[];
  hwid_reset_count?: number;
  max_devices?: number;
  mobile_number?: string;
  save_hwid?: boolean;
  subscription?: string;
  username?: string; // Used for joined data from users table
}

export interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
  sub: string;
}
