
export interface UserCredentials {
  email: string;
  username: string;
  password: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  picture?: string; // Add optional picture property
}
