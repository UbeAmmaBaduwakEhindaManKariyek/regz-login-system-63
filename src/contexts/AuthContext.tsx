
import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthUser, LoginCredentials, UserCredentials, GoogleUserInfo, WebLoginRegz } from "@/types/auth";
import { useToast } from "@/components/ui/use-toast";
import { supabase, createCustomClient, getActiveClient, executeRawSql } from '@/integrations/supabase/client';
import { jwtDecode } from "jwt-decode";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isConnected: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  loginWithGoogle: (googleCredential: string) => Promise<boolean>;
  register: (credentials: UserCredentials) => Promise<boolean>;
  logout: () => void;
  saveSupabaseConfig: (url: string, key: string) => Promise<boolean>;
  checkConnection: () => Promise<boolean>;
  updateUserCredentials: (username: string, password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem("keyauth_user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        if (userData.supabaseUrl && userData.supabaseKey) {
          checkSupabaseConnection(userData.supabaseUrl, userData.supabaseKey)
            .then(connected => {
              if (!connected) {
                console.error("Failed to connect with stored Supabase credentials");
                toast({
                  title: "Connection Error",
                  description: "Could not connect to Supabase with stored credentials. Please try again.",
                  variant: "destructive",
                });
              }
            });
        }
      } catch (error) {
        console.error("Failed to parse stored user", error);
        localStorage.removeItem("keyauth_user");
      }
    }
    setIsLoading(false);
  }, []);

  const checkSupabaseConnection = async (url: string, key: string): Promise<boolean> => {
    try {
      if (!url || !key) {
        console.error("Invalid Supabase URL or key");
        setIsConnected(false);
        return false;
      }
      
      console.log("Attempting to connect to Supabase with URL:", url);
      
      const customClient = createCustomClient(url, key);
      
      if (!customClient) {
        console.error("Failed to create custom Supabase client");
        setIsConnected(false);
        return false;
      }
      
      try {
        const { error: tablesError } = await customClient
          .from('users')
          .select('count', { count: 'exact', head: true });
        
        if (tablesError) {
          const { error: authError } = await customClient
            .from('web_login_regz')
            .select('count', { count: 'exact', head: true });
          
          if (authError) {
            console.error("All connection tests failed:", authError);
            setIsConnected(false);
            return false;
          }
        }
        
        console.log("Successfully connected to Supabase");
        setIsConnected(true);
        return true;
      } catch (queryError) {
        console.error("Supabase query error:", queryError);
        setIsConnected(false);
        return false;
      }
    } catch (error) {
      console.error("Supabase connection error:", error);
      setIsConnected(false);
      return false;
    }
  };

  const saveUserToStorage = (userData: AuthUser) => {
    localStorage.setItem("keyauth_user", JSON.stringify(userData));
    setUser(userData);
  };

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const projectSupabase = supabase;
      
      const { data, error } = await projectSupabase
        .from('web_login_regz')
        .select('*')
        .eq('username', credentials.username)
        .maybeSingle();
      
      if (error) {
        console.error("Error querying web_login_regz:", error);
        toast({
          title: "Login failed",
          description: "Failed to authenticate. Please check your credentials.",
          variant: "destructive",
        });
        return false;
      }
      
      if (data && data.username === credentials.username) {
        if (data.password === credentials.password) {
          const userWithSupabaseConfig: AuthUser = {
            id: data.id,
            username: data.username,
            email: data.email,
            isAdmin: data.subscription_type === 'admin',
            supabaseUrl: data.supabase_url,
            supabaseKey: data.supabase_api_key
          };
          
          if (data.supabase_url && data.supabase_api_key) {
            const connected = await checkSupabaseConnection(data.supabase_url, data.supabase_api_key);
            if (connected) {
              saveUserToStorage(userWithSupabaseConfig);
              toast({
                title: "Login successful",
                description: `Welcome back, ${userWithSupabaseConfig.username}!`,
              });
              return true;
            } else {
              saveUserToStorage(userWithSupabaseConfig);
              toast({
                title: "Login successful",
                description: "But could not connect to your Supabase project. Please check your Supabase configuration.",
                variant: "destructive"
              });
              return true;
            }
          } else {
            saveUserToStorage(userWithSupabaseConfig);
            toast({
              title: "Login successful",
              description: `Welcome back, ${userWithSupabaseConfig.username}!`,
            });
            return true;
          }
        }
      }
      
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
      return false;
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (googleCredential: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Decode the Google token
      const decodedToken = jwtDecode<GoogleUserInfo>(googleCredential);
      
      if (!decodedToken.email) {
        toast({
          title: "Login failed",
          description: "Could not get email from Google account",
          variant: "destructive",
        });
        return false;
      }
      
      console.log("Google login attempt for email:", decodedToken.email);
      console.log("Google user info:", decodedToken);
      
      const projectSupabase = supabase;
      
      // Check if user with this email already exists in web_login_regz
      const { data: existingUser, error: checkUserError } = await projectSupabase
        .from('web_login_regz')
        .select('*')
        .eq('email', decodedToken.email)
        .maybeSingle();
        
      if (checkUserError) {
        console.error("Error checking for existing user:", checkUserError);
        toast({
          title: "Login failed",
          description: "Error checking user information",
          variant: "destructive",
        });
        return false;
      }
      
      let userData: WebLoginRegz | null = null;
      
      // If user doesn't exist, create a new one
      if (!existingUser) {
        // Generate a username based on email
        const username = decodedToken.email.split('@')[0] + "_" + Math.floor(Math.random() * 10000);
        // Generate a random password (user can change it later)
        const password = Math.random().toString(36).slice(-8);
        
        // Create new user
        const { data: newUser, error: insertError } = await projectSupabase
          .from('web_login_regz')
          .insert({
            username: username,
            email: decodedToken.email,
            password: password,
            subscription_type: 'user',
            google_id: decodedToken.sub,
            is_google_user: true,
            picture: decodedToken.picture
          })
          .select()
          .single();
        
        if (insertError) {
          console.error("Error creating user:", insertError);
          toast({
            title: "Login failed",
            description: "Failed to create user account",
            variant: "destructive",
          });
          return false;
        }
        
        userData = newUser as WebLoginRegz;
        
        toast({
          title: "Account created",
          description: "Your account has been created using Google. You can update your username and password in settings.",
        });
      } else {
        // Cast the existing user to our WebLoginRegz type
        const existingWebLoginUser = existingUser as unknown as WebLoginRegz;
        
        // Update the user's picture if they already exist
        if (decodedToken.picture && (!existingWebLoginUser.picture || existingWebLoginUser.picture !== decodedToken.picture)) {
          const { error: updateError } = await projectSupabase
            .from('web_login_regz')
            .update({ 
              picture: decodedToken.picture 
            })
            .eq('id', existingWebLoginUser.id);
            
          if (updateError) {
            console.error("Error updating user picture:", updateError);
            userData = existingWebLoginUser;
          } else {
            // Create a new object with the updated picture
            userData = {
              ...existingWebLoginUser,
              picture: decodedToken.picture
            };
          }
        } else {
          userData = existingWebLoginUser;
        }
      }
      
      // Login user
      if (!userData) {
        toast({
          title: "Login failed",
          description: "User data could not be retrieved",
          variant: "destructive",
        });
        return false;
      }
      
      const userWithSupabaseConfig: AuthUser = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        isAdmin: userData.subscription_type === 'admin',
        supabaseUrl: userData.supabase_url,
        supabaseKey: userData.supabase_api_key,
        isGoogleUser: true,
        googleId: userData.google_id,
        picture: userData.picture
      };
      
      if (userData.supabase_url && userData.supabase_api_key) {
        await checkSupabaseConnection(userData.supabase_url, userData.supabase_api_key);
      }
      
      saveUserToStorage(userWithSupabaseConfig);
      
      toast({
        title: "Login successful",
        description: `Welcome, ${userWithSupabaseConfig.username}!`,
      });
      
      return true;
    } catch (error) {
      console.error("Google login error:", error);
      toast({
        title: "Login failed",
        description: "An unexpected error occurred during Google login",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserCredentials = async (username: string, password: string): Promise<boolean> => {
    try {
      if (!user) {
        toast({
          title: "Update failed",
          description: "You must be logged in to update your credentials",
          variant: "destructive",
        });
        return false;
      }
      
      setIsLoading(true);
      const projectSupabase = supabase;
      
      // Check if the username is already taken by another user
      const { data: existingUser, error: checkUserError } = await projectSupabase
        .from('web_login_regz')
        .select('id')
        .eq('username', username)
        .neq('id', user.id)  // Exclude current user
        .maybeSingle();
        
      if (checkUserError) {
        console.error("Error checking for existing username:", checkUserError);
        toast({
          title: "Update failed",
          description: "Error checking username availability",
          variant: "destructive",
        });
        return false;
      }
      
      if (existingUser) {
        toast({
          title: "Update failed",
          description: "Username already exists",
          variant: "destructive",
        });
        return false;
      }
      
      // Update user credentials
      const { error: updateError } = await projectSupabase
        .from('web_login_regz')
        .update({
          username: username,
          password: password
        })
        .eq('id', user.id);
        
      if (updateError) {
        console.error("Error updating user credentials:", updateError);
        toast({
          title: "Update failed",
          description: "Failed to update your credentials",
          variant: "destructive",
        });
        return false;
      }
      
      // Update local storage
      const updatedUser = { ...user, username: username };
      saveUserToStorage(updatedUser);
      
      toast({
        title: "Update successful",
        description: "Your credentials have been updated",
      });
      
      return true;
    } catch (error) {
      console.error("Update credentials error:", error);
      toast({
        title: "Update failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: UserCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log("Register function called with:", credentials);
      
      // Using the default supabase client for registration
      const projectSupabase = supabase;
      
      // Check if username already exists
      const { data: existingUser, error: checkUserError } = await projectSupabase
        .from('web_login_regz')
        .select('username')
        .eq('username', credentials.username)
        .maybeSingle();
        
      if (checkUserError) {
        console.error("Error checking for existing user:", checkUserError);
        toast({
          title: "Registration failed",
          description: "Error checking username availability",
          variant: "destructive",
        });
        return false;
      }
      
      if (existingUser) {
        toast({
          title: "Registration failed",
          description: "Username already exists",
          variant: "destructive",
        });
        return false;
      }
      
      // Create new user - Using a valid subscription_type from the allowed list
      const { error: insertError } = await projectSupabase
        .from('web_login_regz')
        .insert({
          username: credentials.username,
          email: credentials.email,
          password: credentials.password,
          subscription_type: 'user', // Using 'user' as a valid subscription type
          supabase_url: credentials.supabaseUrl,
          supabase_api_key: credentials.supabaseKey
        });
      
      if (insertError) {
        console.error("Error inserting new user:", insertError);
        toast({
          title: "Registration failed",
          description: `Failed to create user account: ${insertError.message}`,
          variant: "destructive",
        });
        return false;
      }
      
      // Get the newly created user
      const { data: newUser, error: fetchNewUserError } = await projectSupabase
        .from('web_login_regz')
        .select('*')
        .eq('username', credentials.username)
        .maybeSingle();
      
      if (fetchNewUserError || !newUser) {
        console.error("Error fetching new user:", fetchNewUserError);
        toast({
          title: "Registration partial success",
          description: "Account created but unable to log in automatically",
          variant: "destructive",
        });
        return false;
      }
      
      // Create user object and save to storage
      const userWithSupabaseConfig: AuthUser = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        isAdmin: newUser.subscription_type === 'admin',
        supabaseUrl: newUser.supabase_url,
        supabaseKey: newUser.supabase_api_key
      };
      
      saveUserToStorage(userWithSupabaseConfig);
      
      // Connect to custom supabase if provided
      if (newUser.supabase_url && newUser.supabase_api_key) {
        await checkSupabaseConnection(newUser.supabase_url, newUser.supabase_api_key);
      }
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${userWithSupabaseConfig.username}!`,
      });
      
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("keyauth_user");
    setUser(null);
    setIsConnected(false);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  const checkConnection = async (): Promise<boolean> => {
    if (!user?.supabaseUrl || !user?.supabaseKey) {
      return false;
    }
    return await checkSupabaseConnection(user.supabaseUrl, user.supabaseKey);
  };

  const saveSupabaseConfig = async (url: string, key: string): Promise<boolean> => {
    if (!url.trim() || !key.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both Supabase URL and API key",
        variant: "destructive",
      });
      return false;
    }

    try {
      setIsLoading(true);
      console.log("Testing connection to:", url);
      
      const connected = await checkSupabaseConnection(url, key);
      
      if (connected) {
        const updatedUser = user ? { ...user, supabaseUrl: url, supabaseKey: key } : {
          id: 1,
          username: "admin",
          email: "admin@example.com",
          supabaseUrl: url,
          supabaseKey: key,
          isAdmin: true
        };
        
        // First, save to the main project's Supabase database
        if (user && user.username) {
          const projectSupabase = supabase; // Use the default project Supabase client
          
          const { error: updateError } = await projectSupabase
            .from('web_login_regz')
            .update({
              supabase_url: url,
              supabase_api_key: key
            })
            .eq('username', user.username);
            
          if (updateError) {
            console.error("Failed to update credentials in project Supabase:", updateError);
            
            // Try to insert instead if update failed (might not exist yet)
            if (updateError.code === '23505') { // Duplicate key error
              console.log("User credentials already exist, update failed with constraint error");
            } else {
              const { error: insertError } = await projectSupabase
                .from('web_login_regz')
                .insert({
                  username: user.username,
                  email: user.email || 'admin@example.com',
                  password: 'encrypted_password', // Note: safely store password
                  subscription_type: 'user',
                  supabase_url: url,
                  supabase_api_key: key
                });
                
              if (insertError) {
                console.error("Failed to insert credentials in project Supabase:", insertError);
                toast({
                  title: "Update Failed",
                  description: "Failed to save your Supabase credentials to the project database",
                  variant: "destructive",
                });
              } else {
                console.log("Successfully inserted credentials in project Supabase");
              }
            }
          } else {
            console.log("Successfully updated credentials in project Supabase");
          }
        }
        
        // Then try to save to the user's Supabase as well if connected
        if (user && user.username) {
          try {
            const customClient = createCustomClient(url, key);
            if (!customClient) {
              console.error("Failed to create custom Supabase client");
            } else {
              // Check if web_login_regz table exists in user's Supabase
              const { error: checkTableError } = await customClient
                .from('web_login_regz')
                .select('count', { count: 'exact', head: true })
                .limit(1);
                
              if (checkTableError) {
                console.log("web_login_regz table might not exist in user's Supabase, attempting to create it");
                
                try {
                  const { error: createTableError } = await executeRawSql(`
                    CREATE TABLE IF NOT EXISTS web_login_regz (
                      id SERIAL PRIMARY KEY,
                      username TEXT NOT NULL,
                      email TEXT NOT NULL,
                      password TEXT NOT NULL,
                      subscription_type TEXT NOT NULL,
                      supabase_url TEXT,
                      supabase_api_key TEXT,
                      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
                    )
                  `);
                  
                  if (createTableError) {
                    console.error("Failed to create web_login_regz table in user's Supabase:", createTableError);
                  } else {
                    console.log("Successfully created web_login_regz table in user's Supabase");
                  }
                } catch (error) {
                  console.error("Error creating web_login_regz table in user's Supabase:", error);
                }
              }
              
              // Insert or update user's credentials in their own Supabase
              const { error: upsertError } = await customClient
                .from('web_login_regz')
                .upsert({
                  username: user.username,
                  email: user.email || 'admin@example.com',
                  password: 'encrypted_password', // Note: safely store password
                  subscription_type: 'user',
                  supabase_url: url,
                  supabase_api_key: key
                }, { 
                  onConflict: 'username' 
                });
              
              if (upsertError) {
                console.error("Failed to save credentials to user's web_login_regz:", upsertError);
              } else {
                console.log("Successfully saved credentials to user's web_login_regz table");
              }
            }
          } catch (error) {
            console.error("Error saving to user's web_login_regz:", error);
          }
        }
        
        // Save updated user to local storage
        saveUserToStorage(updatedUser);
        
        toast({
          title: "Supabase configuration saved",
          description: "Your Supabase URL and API key have been saved and connected successfully",
        });
        return true;
      } else {
        toast({
          title: "Connection failed",
          description: "Could not connect to Supabase with the provided URL and API key",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Failed to save Supabase config:", error);
      toast({
        title: "Connection Error",
        description: "An error occurred while trying to connect to Supabase",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    isConnected,
    login,
    loginWithGoogle,
    register,
    logout,
    saveSupabaseConfig,
    checkConnection,
    updateUserCredentials,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
