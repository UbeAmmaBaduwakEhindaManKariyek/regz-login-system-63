
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

const UserCredentialsManager = () => {
  const { user, updateUserCredentials } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const validatePassword = () => {
    if (password !== confirmPassword) {
      setPasswordError("Passwords don't match");
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError('');
    setUpdateSuccess(false);
    
    if (!validatePassword()) return;
    if (!username.trim() || !password.trim()) {
      setUpdateError('Username and password are required');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const success = await updateUserCredentials(username, password);
      if (success) {
        setUpdateSuccess(true);
      }
    } catch (error) {
      console.error("Update credentials error:", error);
      setUpdateError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-[#101010] border-[#2a2a2a]">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">User Credentials</CardTitle>
        <CardDescription className="text-gray-400">
          Update your username and password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {updateError && (
            <Alert className="bg-red-900 border-red-700">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {updateError}
              </AlertDescription>
            </Alert>
          )}
          
          {updateSuccess && (
            <Alert className="bg-green-900 border-green-700">
              <AlertDescription>
                Your credentials have been updated successfully
              </AlertDescription>
            </Alert>
          )}
          
          {user?.isGoogleUser && (
            <Alert className="bg-blue-900 border-blue-700">
              <AlertDescription>
                You created your account with Google. You can update your username and password here to be able to login using either method.
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
              New Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
            />
            {passwordError && (
              <p className="text-sm text-red-500">{passwordError}</p>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : 'Update Credentials'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserCredentialsManager;
