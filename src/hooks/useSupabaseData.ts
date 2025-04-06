
import { useState, useEffect } from 'react';
import { getActiveClient, createCustomClient } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Custom hook for fetching data from Supabase tables
 * Automatically connects to the user's Supabase instance if needed
 */
export function useSupabaseData<T extends object>(
  tableName: string,
  options: {
    columns?: string;
    limit?: number;
    orderBy?: { column: string; ascending?: boolean };
    filter?: { column: string; operator: string; value: any }[];
  } = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user, isConnected } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Skip if not connected or missing credentials
    if (!user?.supabaseUrl || !user?.supabaseKey || !isConnected) {
      setIsLoading(false);
      setError(new Error('Supabase connection not available'));
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Ensure we have a custom client
        createCustomClient(user.supabaseUrl, user.supabaseKey);
        const supabase = getActiveClient();

        // Start building the query - using 'any' to bypass strict typing
        // since we're passing dynamic table names
        let query = (supabase.from as any)(tableName)
          .select(options.columns || '*');

        // Apply any filters
        if (options.filter && options.filter.length > 0) {
          for (const filter of options.filter) {
            switch (filter.operator) {
              case 'eq':
                query = query.eq(filter.column, filter.value);
                break;
              case 'gt':
                query = query.gt(filter.column, filter.value);
                break;
              case 'lt':
                query = query.lt(filter.column, filter.value);
                break;
              case 'gte':
                query = query.gte(filter.column, filter.value);
                break;
              case 'lte':
                query = query.lte(filter.column, filter.value);
                break;
              case 'neq':
                query = query.neq(filter.column, filter.value);
                break;
              case 'in':
                query = query.in(filter.column, filter.value);
                break;
              case 'like':
                query = query.like(filter.column, filter.value);
                break;
              case 'ilike':
                query = query.ilike(filter.column, filter.value);
                break;
              // Add more operators as needed
              default:
                // Default to eq if operator not recognized
                query = query.eq(filter.column, filter.value);
            }
          }
        }

        // Apply ordering
        if (options.orderBy) {
          query = query.order(
            options.orderBy.column, 
            { ascending: options.orderBy.ascending ?? false }
          );
        }

        // Apply limit
        if (options.limit) {
          query = query.limit(options.limit);
        }

        // Execute query
        const { data: queryData, error } = await query;

        if (error) {
          throw new Error(`Failed to fetch data from ${tableName}: ${error.message}`);
        }

        // Fix the type conversion issue by using type assertion
        setData(queryData as unknown as T[]);
      } catch (err) {
        console.error(`Error fetching data from ${tableName}:`, err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        toast({
          title: "Data Fetch Error",
          description: err instanceof Error ? err.message : 'Failed to fetch data',
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [tableName, user?.supabaseUrl, user?.supabaseKey, isConnected]);

  return { data, isLoading, error, isConnected };
}

/**
 * Save data to a Supabase table
 */
export async function saveSupabaseData<T extends object>(
  tableName: string,
  data: Partial<T>,
  options: {
    onConflict?: string;
    returning?: string;
  } = {}
) {
  try {
    const supabase = getActiveClient();
    // Using 'any' to bypass strict typing since we need to use dynamic table names
    let query = (supabase.from as any)(tableName).insert(data);
    let finalQuery = query;

    // Handle conflict option
    if (options.onConflict) {
      finalQuery = query.onConflict(options.onConflict);
    }

    // Handle returning option
    if (options.returning) {
      finalQuery = finalQuery.select(options.returning);
    }

    const { data: responseData, error } = await finalQuery;

    if (error) {
      throw new Error(`Failed to save data to ${tableName}: ${error.message}`);
    }

    return { data: responseData, error: null };
  } catch (err) {
    console.error(`Error saving data to ${tableName}:`, err);
    return { 
      data: null, 
      error: err instanceof Error ? err : new Error('Unknown error')
    };
  }
}

/**
 * Update data in a Supabase table
 */
export async function updateSupabaseData<T extends object>(
  tableName: string,
  updates: Partial<T>,
  matchColumn: string,
  matchValue: any,
  options: {
    returning?: string;
  } = {}
) {
  try {
    const supabase = getActiveClient();
    // Using 'any' to bypass strict typing for dynamic table names
    let query = (supabase.from as any)(tableName)
      .update(updates)
      .eq(matchColumn, matchValue);
    
    let finalQuery = query;

    // Handle returning option
    if (options.returning) {
      finalQuery = finalQuery.select(options.returning);
    }

    const { data: responseData, error } = await finalQuery;

    if (error) {
      throw new Error(`Failed to update data in ${tableName}: ${error.message}`);
    }

    return { data: responseData, error: null };
  } catch (err) {
    console.error(`Error updating data in ${tableName}:`, err);
    return { 
      data: null, 
      error: err instanceof Error ? err : new Error('Unknown error')
    };
  }
}

/**
 * Delete data from a Supabase table
 */
export async function deleteSupabaseData(
  tableName: string,
  matchColumn: string,
  matchValue: any
) {
  try {
    const supabase = getActiveClient();
    // Using 'any' to bypass strict typing for dynamic table names
    const { error } = await (supabase.from as any)(tableName)
      .delete()
      .eq(matchColumn, matchValue);

    if (error) {
      throw new Error(`Failed to delete data from ${tableName}: ${error.message}`);
    }

    return { error: null };
  } catch (err) {
    console.error(`Error deleting data from ${tableName}:`, err);
    return { 
      error: err instanceof Error ? err : new Error('Unknown error')
    };
  }
}
