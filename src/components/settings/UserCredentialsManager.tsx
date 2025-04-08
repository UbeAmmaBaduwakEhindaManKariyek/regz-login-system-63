
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

const UserCredentialsManager = () => {
  const { user, updateUserCredentials, isLoading } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username) {
      setError('Username is required');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password && password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    setSaving(true);
    setError('');
    
    try {
      const success = await updateUserCredentials(username, password);
      if (!success) {
        setError('Failed to update credentials');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error updating credentials:', err);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <Card className="bg-[#101010] border-[#2a2a2a]">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">Account Credentials</CardTitle>
        <CardDescription className="text-gray-400">
          Update your username and password
          {user?.isGoogleUser && (
            <span className="mt-2 block text-amber-500">
              You signed up with Google. Please set a username and password for direct login access.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4 bg-red-900 border-red-700">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-gray-300">
              Username
            </label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
              disabled={isLoading || saving}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-300">
              New Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
              disabled={isLoading || saving}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
              Confirm New Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
              disabled={isLoading || saving}
            />
          </div>
          
          <Button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading || saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserCredentialsManager;
