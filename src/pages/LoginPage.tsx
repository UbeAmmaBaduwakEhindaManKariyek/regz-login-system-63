
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { Separator } from '@/components/ui/separator';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);
    
    try {
      const success = await login({ username, password });
      if (success) {
        navigate('/');
      } else {
        setLoginError('Invalid username or password');
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError('An unexpected error occurred during login');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      setIsSubmitting(true);
      try {
        const success = await loginWithGoogle(credentialResponse.credential);
        if (success) {
          // Redirect to the Google success page instead of home
          navigate('/google-success');
        }
      } catch (error) {
        console.error("Google login error:", error);
        setLoginError('An unexpected error occurred during Google login');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleGoogleLoginError = () => {
    setLoginError('Google login failed. Please try again or use email/password login.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212]">
      <Card className="w-[350px] bg-[#101010] border-[#2a2a2a]">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-white">RegzAuth</CardTitle>
          <CardDescription className="text-gray-400">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {loginError && (
              <Alert className="bg-red-900 border-red-700">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {loginError}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-gray-300">
                Username
              </label>
              <Input
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-300">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : 'Login'}
            </Button>
            
            <div className="relative w-full">
              <Separator className="my-4" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-[#101010] px-2 text-xs text-gray-400">OR</span>
              </div>
            </div>
            
            <div className="w-full flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={handleGoogleLoginError}
                theme="filled_black"
                shape="pill"
                useOneTap
              />
            </div>
            
            <p className="text-sm text-gray-400">
              Don't have an account?{" "}
              <Link to="/register" className="text-blue-500 hover:underline">
                Register
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;
