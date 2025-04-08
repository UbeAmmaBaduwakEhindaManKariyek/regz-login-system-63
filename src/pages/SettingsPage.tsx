
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SupabaseSetup from '@/components/supabase/SupabaseSetup';
import { useAuth } from '@/contexts/AuthContext';
import ApiKeyManagement from '@/components/api/ApiKeyManagement';
import AppVersionManager from '@/components/settings/AppVersionManager';
import UserPortalSettings from '@/components/settings/UserPortalSettings';
import InstallTables from '@/components/supabase/InstallTables';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserCredentialsManager from '@/components/settings/UserCredentialsManager';

const SettingsPage = () => {
  const { isConnected } = useAuth();

  return (
    <div className="container max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Tabs defaultValue="connection" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="connection">Supabase Connection</TabsTrigger>
          <TabsTrigger value="database" disabled={!isConnected}>Database Setup</TabsTrigger>
          <TabsTrigger value="api" disabled={!isConnected}>API & Version</TabsTrigger>
          <TabsTrigger value="portal" disabled={!isConnected}>User Portal</TabsTrigger>
          <TabsTrigger value="credentials">User Credentials</TabsTrigger>
        </TabsList>
        
        <TabsContent value="connection" className="space-y-6">
          <SupabaseSetup />
        </TabsContent>
        
        <TabsContent value="database" className="space-y-6">
          {isConnected && (
            <Card className="bg-[#101010] border-[#2a2a2a]">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white">Supabase Database Setup</CardTitle>
                <CardDescription className="text-gray-400">
                  Install and manage all required tables in your Supabase database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InstallTables />
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="api" className="space-y-6">
          {isConnected && (
            <>
              <AppVersionManager />
              <ApiKeyManagement />
            </>
          )}
        </TabsContent>

        <TabsContent value="portal" className="space-y-6">
          {isConnected && (
            <UserPortalSettings />
          )}
        </TabsContent>
        
        <TabsContent value="credentials" className="space-y-6">
          <UserCredentialsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
