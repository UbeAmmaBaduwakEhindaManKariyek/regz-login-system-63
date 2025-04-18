
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowDown, KeyRound, Download, AlertCircle, LogIn, UserPlus } from 'lucide-react';
import { PortalSettings } from '@/types/auth';

interface PortalConfig {
  id?: number;
  username: string;
  enabled: boolean;
  custom_path: string;
  download_url?: string;
  application_name?: string;
  created_at?: string;
}

const UserPortalPage = () => {
  const { username: ownerUsername, custom_path } = useParams();
  const location = useLocation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalConfig, setPortalConfig] = useState<PortalConfig | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [authForm, setAuthForm] = useState({
    username: '',
    password: '',
    license_key: '',
  });
  
  const [resetForm, setResetForm] = useState({
    username: '',
    license_key: '',
  });
  
  const isMounted = React.useRef(true);
  
  // Log important information for debugging
  useEffect(() => {
    console.log("UserPortalPage mounted");
    console.log("Params:", { ownerUsername, custom_path });
    console.log("Current path:", location.pathname);
    
    return () => {
      isMounted.current = false;
    };
  }, [ownerUsername, custom_path, location]);
  
  const fetchPortalConfig = useCallback(async () => {
    console.log("Fetching portal config...");
    if (!ownerUsername || !custom_path) {
      console.error("Missing username or custom_path parameters");
      if (isMounted.current) {
        setError('Invalid portal URL');
        setLoading(false);
      }
      return;
    }

    try {
      console.log(`Fetching portal config for ${ownerUsername}/${custom_path}`);
      
      // First check in user_portal_config table
      const { data: portalData, error: portalError } = await supabase
        .from('user_portal_config')
        .select('*')
        .eq('username', ownerUsername)
        .eq('custom_path', custom_path)
        .eq('enabled', true)
        .maybeSingle();

      if (portalData) {
        console.log('Found portal config in user_portal_config', portalData);
        if (isMounted.current) {
          setPortalConfig(portalData);
          setLoading(false);
        }
        return;
      } else {
        console.log('Portal config not found in user_portal_config, checking web_login_regz');
      }
      
      // If not found in user_portal_config, check web_login_regz table
      const { data: userData, error: userError } = await supabase
        .from('web_login_regz')
        .select('username, portal_settings')
        .eq('username', ownerUsername)
        .maybeSingle();
        
      if (userError) {
        console.error('Error fetching user data:', userError);
        if (isMounted.current) {
          setError('Portal not found or is disabled');
          setLoading(false);
        }
        return;
      }

      // Safely handle portal_settings from userData
      if (userData && userData.portal_settings) {
        console.log('Found user data with portal settings', userData);
        
        // Type check and convert portal_settings
        try {
          // First cast to unknown, then to PortalSettings to handle the type conversion safely
          const portalSettings = userData.portal_settings as unknown as PortalSettings;
          
          if (typeof portalSettings === 'object' && 
              portalSettings.custom_path === custom_path && 
              portalSettings.enabled === true) {
            
            if (isMounted.current) {  
              setPortalConfig({
                username: userData.username,
                enabled: portalSettings.enabled,
                custom_path: portalSettings.custom_path,
                download_url: portalSettings.download_url,
                application_name: portalSettings.application_name
              });
              setLoading(false);
            }
          } else {
            console.error('Portal settings do not match or are disabled');
            if (isMounted.current) {
              setError('Portal not found or is disabled');
              setLoading(false);
            }
          }
        } catch (error) {
          console.error('Error parsing portal settings:', error);
          if (isMounted.current) {
            setError('Invalid portal configuration');
            setLoading(false);
          }
        }
      } else {
        console.error('No portal settings found in user data');
        if (isMounted.current) {
          setError('Portal not found or is disabled');
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error fetching portal:', error);
      if (isMounted.current) {
        setError('Portal not found or is disabled');
        setLoading(false);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [ownerUsername, custom_path]);

  useEffect(() => {
    // This effect runs when the component mounts or params change
    if (ownerUsername && custom_path) {
      console.log(`Loading portal for ${ownerUsername}/${custom_path}`);
      fetchPortalConfig();
    } else {
      console.error("Missing username or custom_path parameters");
      setError('Invalid portal URL');
      setLoading(false);
    }
  }, [ownerUsername, custom_path, fetchPortalConfig]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, formType: 'auth' | 'reset') => {
    const { name, value } = e.target;
    if (formType === 'auth') {
      setAuthForm(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setResetForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);
    
    try {
      const { data: userData, error: userError } = await (supabase as any)
        .from('users')
        .select('*')
        .eq('username', authForm.username)
        .eq('password', authForm.password)
        .single();
      
      if (userError || !userData) {
        setAuthError('Invalid username or password');
        setLoading(false);
        return;
      }
        
      const { data: existingAuth } = await (supabase as any)
        .from('user_portal_auth')
        .select('id')
        .eq('username', authForm.username)
        .maybeSingle();
        
      if (existingAuth?.id) {
        await (supabase as any)
          .from('user_portal_auth')
          .update({ last_login: new Date().toISOString() })
          .eq('id', existingAuth.id);
      } else {
        await (supabase as any)
          .from('user_portal_auth')
          .insert({
            username: authForm.username,
            password: authForm.password,
            license_key: userData.key || ''
          });
      }
      
      setIsAuthenticated(true);
      
      setResetForm(prev => ({
        ...prev,
        username: authForm.username,
        license_key: userData.key || ''
      }));
      
      toast({
        title: 'Login successful',
        description: 'You can now access portal features',
      });
    } catch (error) {
      console.error('Login error:', error);
      setAuthError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    if (!authForm.username || !authForm.password || !authForm.license_key) {
      setAuthError('All fields are required');
      return;
    }
    
    setLoading(true);
    
    try {
      const { data: existingUser, error: checkUserError } = await (supabase as any)
        .from('users')
        .select('username')
        .eq('username', authForm.username)
        .single();
        
      if (existingUser) {
        setAuthError('Username already exists');
        setLoading(false);
        return;
      }
      
      const { data: licenseData, error: licenseError } = await (supabase as any)
        .from('license_keys')
        .select('*')
        .eq('license_key', authForm.license_key)
        .single();
        
      if (licenseError || !licenseData) {
        setAuthError('Invalid license key');
        setLoading(false);
        return;
      }
      
      const { error: registerError } = await (supabase as any)
        .from('users')
        .insert({
          username: authForm.username,
          password: authForm.password,
          key: authForm.license_key,
          subscription: licenseData.subscription,
          expiredate: licenseData.expiredate,
          save_hwid: licenseData.save_hwid,
          banned: licenseData.banned,
          hwid_reset_count: licenseData.hwid_reset_count,
          max_devices: licenseData.max_devices,
          hwid: licenseData.hwid,
          mobile_number: licenseData.mobile_number,
          admin_approval: licenseData.admin_approval
        });
        
      if (registerError) {
        throw registerError;
      }
      
      await (supabase as any)
        .from('user_portal_auth')
        .insert({
          username: authForm.username,
          password: authForm.password,
          license_key: authForm.license_key,
        });
      
      setIsAuthenticated(true);
      
      setResetForm(prev => ({
        ...prev,
        username: authForm.username,
        license_key: authForm.license_key
      }));
      
      toast({
        title: 'Registration successful',
        description: 'Your account has been created',
      });
    } catch (error) {
      console.error('Registration error:', error);
      setAuthError('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleResetHWID = async () => {
    if (!resetForm.username || !resetForm.license_key) {
      toast({
        title: 'Missing information',
        description: 'Please enter your username and license key',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      const { error: userUpdateError } = await (supabase as any)
        .from('users')
        .update({ hwid: [] })
        .eq('username', resetForm.username)
        .eq('key', resetForm.license_key);

      const { error: licenseUpdateError } = await (supabase as any)
        .from('license_keys')
        .update({ hwid: [] })
        .eq('license_key', resetForm.license_key);

      if (userUpdateError && licenseUpdateError) {
        throw userUpdateError || licenseUpdateError;
      }

      toast({
        title: 'Success',
        description: 'Your HWID has been reset successfully',
      });
    } catch (error) {
      console.error('Error resetting HWID:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset HWID. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (portalConfig?.download_url) {
      window.open(portalConfig.download_url, '_blank');
    } else {
      toast({
        title: 'Download unavailable',
        description: 'The download link has not been configured by the administrator',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthForm({
      username: '',
      password: '',
      license_key: '',
    });
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        <p className="text-white ml-2">Loading portal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] p-4">
        <Card className="w-full max-w-md bg-[#101010] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Portal Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white">{error}</p>
            <div className="mt-4">
              <Button 
                onClick={() => navigate("/")} 
                className="bg-blue-600 hover:bg-blue-700"
              >
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const portalTitle = portalConfig?.application_name || "Application Portal";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] p-4">
      <Card className="w-full max-w-md bg-[#101010] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">{portalTitle}</CardTitle>
          <CardDescription className="text-gray-400">
            {isAuthenticated 
              ? "Reset your HWID or download the application" 
              : "Login or register to access portal features"}
          </CardDescription>
        </CardHeader>
        
        {isAuthenticated ? (
          <CardContent>
            <Tabs defaultValue="reset" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="reset">Reset HWID</TabsTrigger>
                <TabsTrigger value="download">Download</TabsTrigger>
              </TabsList>
              
              <TabsContent value="reset" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-username">Username</Label>
                  <Input
                    id="reset-username"
                    name="username"
                    value={resetForm.username}
                    onChange={(e) => handleInputChange(e, 'reset')}
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                    readOnly
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reset-license-key">License Key</Label>
                  <Input
                    id="reset-license-key"
                    name="license_key"
                    value={resetForm.license_key}
                    onChange={(e) => handleInputChange(e, 'reset')}
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                    readOnly
                  />
                </div>
                
                <Button 
                  onClick={handleResetHWID} 
                  className="w-full"
                  disabled={loading}
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  Reset HWID
                </Button>
              </TabsContent>
              
              <TabsContent value="download" className="pt-4">
                <div className="text-center space-y-4">
                  <ArrowDown className="h-12 w-12 mx-auto text-blue-500" />
                  <h3 className="text-lg font-medium text-white">Download Application</h3>
                  <p className="text-sm text-gray-400">
                    Click the button below to download the latest version of the application
                  </p>
                  <Button onClick={handleDownload} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download Now
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 text-center">
              <Button onClick={handleLogout} variant="outline" className="bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#2a2a2a]">
                Logout
              </Button>
            </div>
          </CardContent>
        ) : (
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              {authError && (
                <Alert className="mt-4 bg-red-900 border-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}
              
              <TabsContent value="login" className="space-y-4 pt-4">
                <form onSubmit={handleLogin}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-username">Username</Label>
                      <Input
                        id="login-username"
                        name="username"
                        placeholder="Enter your username"
                        value={authForm.username}
                        onChange={(e) => handleInputChange(e, 'auth')}
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        value={authForm.password}
                        onChange={(e) => handleInputChange(e, 'auth')}
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full mt-4"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Logging in...
                        </span>
                      ) : (
                        <>
                          <LogIn className="mr-2 h-4 w-4" />
                          Login
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4 pt-4">
                <form onSubmit={handleRegister}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-username">Username</Label>
                      <Input
                        id="register-username"
                        name="username"
                        placeholder="Choose a username"
                        value={authForm.username}
                        onChange={(e) => handleInputChange(e, 'auth')}
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        name="password"
                        type="password"
                        placeholder="Choose a password"
                        value={authForm.password}
                        onChange={(e) => handleInputChange(e, 'auth')}
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-license">License Key</Label>
                      <Input
                        id="register-license"
                        name="license_key"
                        placeholder="Enter your license key"
                        value={authForm.license_key}
                        onChange={(e) => handleInputChange(e, 'auth')}
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full mt-4"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Registering...
                        </span>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Register
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default UserPortalPage;
