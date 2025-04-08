
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const GoogleSuccessPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user || !user.isGoogleUser) {
      navigate('/');
    }
  }, [user, navigate]);
  
  if (!user) {
    return null;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212]">
      <Card className="w-[450px] max-w-[90%] bg-[#101010] border-[#2a2a2a]">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-white">Google Login Successful!</CardTitle>
          <CardDescription className="text-gray-400">
            Welcome to RegzAuth, {user.username}!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="flex justify-center mb-4">
            {user.picture ? (
              <img 
                src={user.picture} 
                alt={user.username} 
                className="w-20 h-20 rounded-full border-2 border-blue-500" 
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <p className="text-white">
            You've successfully signed in with Google.
          </p>
          {user.email && (
            <p className="text-gray-400">
              Email: {user.email}
            </p>
          )}
          <div className="bg-yellow-900/30 border border-yellow-700/50 p-4 rounded-md text-left mt-4">
            <p className="text-yellow-200 font-medium">Important:</p>
            <p className="text-yellow-100 text-sm mt-1">
              For your convenience, we've generated a temporary username based on your Google account.
              You should update your username and set a password in the settings page for direct login access.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button asChild variant="outline" className="w-full bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#2a2a2a]">
            <Link to="/settings">Update Account Settings</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default GoogleSuccessPage;
