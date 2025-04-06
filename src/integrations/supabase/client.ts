
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://tevmesjpsrsiuwswgzfb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRldm1lc2pwc3JzaXV3c3dnemZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1NTMwNjksImV4cCI6MjA1MzEyOTA2OX0.ItHcLDWAjDMDre1twpp9yWfEc-VLcTu1Zy09UhgvO1I";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Custom client for user-provided Supabase instances
let customClient: ReturnType<typeof createClient> | null = null;

/**
 * Create a custom Supabase client using user-provided URL and key
 */
export function createCustomClient(url: string, key: string) {
  try {
    if (!url || !key) {
      console.error('Invalid Supabase URL or API Key');
      return null;
    }
    
    customClient = createClient(url, key);
    return customClient;
  } catch (error) {
    console.error('Error creating custom Supabase client:', error);
    return null;
  }
}

/**
 * Get the active Supabase client
 * Returns the custom client if available, otherwise returns the default project client
 */
export function getActiveClient() {
  return customClient || supabase;
}

/**
 * Execute raw SQL using the active Supabase client
 * Attempts to use the execute_sql RPC function
 */
export async function executeRawSql(sqlQuery: string) {
  try {
    const client = getActiveClient();
    // Use type assertion to resolve the TypeScript error
    return await client.rpc('execute_sql', { sql_query: sqlQuery });
  } catch (error) {
    console.error('Error executing raw SQL:', error);
    return { error };
  }
}

// Helper function to safely access tables with proper type handling
export function fromTable(tableName: string) {
  const client = getActiveClient();
  // Use type assertion to any to bypass the TypeScript error
  return (client as any).from(tableName);
}
