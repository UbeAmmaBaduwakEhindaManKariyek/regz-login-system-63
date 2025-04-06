import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlusCircle, Download, Search, Loader2, Trash2, Copy, Calendar } from 'lucide-react';
import { getActiveClient, fromTable } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { License } from '@/types/auth';

const LicensesPage: React.FC = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newLicenseKey, setNewLicenseKey] = useState('');
  const [newLicenseExpiry, setNewLicenseExpiry] = useState('');
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [selectedSubscription, setSelectedSubscription] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { toast } = useToast();
  const { isConnected } = useAuth();
  
  useEffect(() => {
    const fetchLicenses = async () => {
      if (!isConnected) {
        setLicenses([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const { data, error } = await fromTable('license_keys')
          .select('*');
        
        if (error) {
          console.error("Error fetching licenses:", error);
          toast({
            title: "Failed to load licenses",
            description: error.message,
            variant: "destructive"
          });
          return;
        }
        
        if (data && data.length > 0) {
          const formattedData: License[] = data.map(item => ({
            id: item.id,
            key: item.key,
            license_key: item.license_key,
            expiredate: item.expiredate,
            user_id: null,
            created_at: new Date().toISOString(),
            is_active: !item.banned,
            admin_approval: item.admin_approval,
            banned: item.banned,
            hwid: item.hwid,
            hwid_reset_count: item.hwid_reset_count,
            max_devices: item.max_devices,
            mobile_number: item.mobile_number,
            save_hwid: item.save_hwid,
            subscription: item.subscription,
            username: undefined
          }));
          setLicenses(formattedData);
        } else {
          setLicenses([
            {
              id: 1,
              key: 'mock-key-1',
              license_key: 'LICENSE-XXXX-YYYY-ZZZZ',
              user_id: 1,
              created_at: new Date().toISOString(),
              expiredate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              is_active: true,
              username: 'johndoe'
            },
            {
              id: 2,
              key: 'mock-key-2',
              license_key: 'LICENSE-AAAA-BBBB-CCCC',
              user_id: 2,
              created_at: new Date().toISOString(),
              expiredate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
              is_active: true,
              username: 'janesmith'
            },
            {
              id: 3,
              key: 'mock-key-3',
              license_key: 'LICENSE-DDDD-EEEE-FFFF',
              user_id: null,
              created_at: new Date().toISOString(),
              expiredate: null,
              is_active: false,
              username: undefined
            }
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch licenses:", error);
        toast({
          title: "Error",
          description: "Failed to load license data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLicenses();
    
    const fetchSubscriptionTypes = async () => {
      if (!isConnected) return;
      
      try {
        const { data, error } = await fromTable('subscription_types')
          .select('name')
          .eq('is_active', true);
        
        if (error) {
          console.error("Error fetching subscription types:", error);
          return;
        }
        
        if (data && data.length > 0) {
          const types = data.map(item => item.name);
          setSubscriptions(types);
          if (types.length > 0) setSelectedSubscription(types[0]);
        } else {
          setSubscriptions(['Standard', 'Premium', 'Enterprise']);
          setSelectedSubscription('Standard');
        }
      } catch (error) {
        console.error("Failed to fetch subscription types:", error);
      }
    };
    
    fetchSubscriptionTypes();
    
  }, [isConnected, toast]);
  
  const filteredLicenses = licenses.filter(license => 
    license.license_key?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (license.username && license.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const totalPages = Math.ceil(filteredLicenses.length / entriesPerPage);
  const displayedLicenses = filteredLicenses.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );
  
  const handleExport = () => {
    if (filteredLicenses.length === 0) {
      toast({
        title: "No Records",
        description: "There are no licenses to export",
        variant: "destructive"
      });
      return;
    }
    
    const csvContent = [
      ['ID', 'License Key', 'User ID', 'Username', 'Created At', 'Expires At', 'Status', 'Subscription'].join(','),
      ...filteredLicenses.map(license => [
        license.id,
        license.license_key,
        license.user_id || '',
        license.username || '',
        license.created_at,
        license.expiredate || '',
        license.is_active ? 'Active' : 'Inactive',
        license.subscription || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `license-keys-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Complete",
      description: `${filteredLicenses.length} license(s) exported to CSV`
    });
  };
  
  const generateRandomKey = () => {
    setIsGenerating(true);
    
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const parts = [];
    for (let i = 0; i < 3; i++) {
      let part = '';
      for (let j = 0; j < 4; j++) {
        part += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      parts.push(part);
    }
    
    const licenseKey = `LICENSE-${parts[0]}-${parts[1]}-${parts[2]}`;
    setNewLicenseKey(licenseKey);
    
    setTimeout(() => {
      setIsGenerating(false);
    }, 500);
  };
  
  const handleCreateLicense = async () => {
    if (!newLicenseKey) {
      toast({
        title: "Missing Information",
        description: "Please generate or enter a license key",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    try {
      if (isConnected) {
        const expiredate = newLicenseExpiry ? new Date(newLicenseExpiry).toISOString().split('T')[0] : null;
        
        const { data, error } = await fromTable('license_keys')
          .insert({
            license_key: newLicenseKey,
            expiredate: expiredate,
            banned: false,
            admin_approval: true,
            save_hwid: true,
            subscription: selectedSubscription || null
          })
          .select();
        
        if (error) {
          console.error("Error creating license:", error);
          toast({
            title: "Failed to create license",
            description: error.message,
            variant: "destructive"
          });
          return;
        }
        
        if (data && data.length > 0) {
          const newLicense: License = {
            id: data[0].id,
            key: data[0].key,
            license_key: data[0].license_key,
            expiredate: data[0].expiredate,
            is_active: !data[0].banned,
            admin_approval: data[0].admin_approval,
            banned: data[0].banned,
            hwid: data[0].hwid,
            hwid_reset_count: data[0].hwid_reset_count,
            max_devices: data[0].max_devices,
            mobile_number: data[0].mobile_number,
            save_hwid: data[0].save_hwid,
            subscription: data[0].subscription,
            created_at: new Date().toISOString()
          };
          
          setLicenses(prev => [newLicense, ...prev]);
        }
      } else {
        const newLicense: License = {
          id: Math.floor(Math.random() * 1000) + 100,
          license_key: newLicenseKey,
          user_id: null,
          created_at: new Date().toISOString(),
          expiredate: newLicenseExpiry ? new Date(newLicenseExpiry).toISOString() : null,
          subscription: selectedSubscription,
          is_active: true
        };
        
        setLicenses(prev => [newLicense, ...prev]);
      }
      
      setIsCreateDialogOpen(false);
      toast({
        title: "License Created",
        description: "The license key has been created successfully"
      });
      
      setNewLicenseKey('');
      setNewLicenseExpiry('');
      setSelectedSubscription(subscriptions[0] || '');
    } catch (error) {
      console.error("Failed to create license:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key).then(() => {
      toast({
        title: "Copied",
        description: "License key copied to clipboard"
      });
    }).catch(err => {
      console.error("Failed to copy:", err);
    });
  };
  
  const handleDeleteLicense = async (id: number) => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect to Supabase first",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { error } = await fromTable('license_keys')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error("Error deleting license:", error);
        toast({
          title: "Failed to delete license",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      setLicenses(prev => prev.filter(license => license.id !== id));
      
      toast({
        title: "License Deleted",
        description: "The license key has been deleted successfully"
      });
    } catch (error) {
      console.error("Failed to delete license:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">License Keys</h1>
        <p className="text-gray-400">Manage and generate license keys</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex flex-col md:flex-row gap-4">
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Create License
          </Button>
          
          <Button
            variant="outline"
            className="bg-[#1a1a1a] border-gray-700 text-white"
            onClick={handleExport}
            disabled={licenses.length === 0}
          >
            <Download className="mr-2 h-4 w-4" /> Export Licenses
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm">Show:</span>
            <Select
              value={entriesPerPage.toString()}
              onValueChange={(value) => {
                setEntriesPerPage(parseInt(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-20 bg-[#1a1a1a] border-gray-700 text-white">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-gray-700 text-white">
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="relative flex-1 md:min-w-[250px]">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              placeholder="Search licenses..."
              className="pl-8 bg-[#1a1a1a] border-gray-700 text-white"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>
      
      <div className="rounded-md border border-gray-800 overflow-hidden">
        <Table>
          <TableHeader className="bg-[#0a0a0a]">
            <TableRow className="hover:bg-[#0a0a0a] border-gray-800">
              <TableHead className="text-gray-300">License Key</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300">User</TableHead>
              <TableHead className="text-gray-300">Subscription</TableHead>
              <TableHead className="text-gray-300">Created At</TableHead>
              <TableHead className="text-gray-300">Expires</TableHead>
              <TableHead className="text-gray-300 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="hover:bg-[#151515] border-gray-800">
                <TableCell colSpan={7} className="text-center py-10 text-gray-400">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading licenses...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : displayedLicenses.length === 0 ? (
              <TableRow className="hover:bg-[#151515] border-gray-800">
                <TableCell colSpan={7} className="text-center py-10 text-gray-400">
                  {searchTerm ? "No matching licenses found" : "No licenses found. Create a license to get started."}
                </TableCell>
              </TableRow>
            ) : (
              displayedLicenses.map((license) => (
                <TableRow key={license.id} className="hover:bg-[#151515] border-gray-800">
                  <TableCell className="font-medium text-white">
                    <div className="flex items-center gap-2">
                      <span>{license.license_key}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-gray-400 hover:text-white"
                        onClick={() => handleCopyKey(license.license_key)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      license.is_active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                    }`}>
                      {license.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-white">{license.username || 'Unassigned'}</TableCell>
                  <TableCell className="text-white">{license.subscription || 'None'}</TableCell>
                  <TableCell className="text-white">
                    {license.created_at ? format(new Date(license.created_at), 'yyyy-MM-dd') : 'N/A'}
                  </TableCell>
                  <TableCell className="text-white">
                    {license.expiredate 
                      ? format(new Date(license.expiredate), 'yyyy-MM-dd')
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      onClick={() => handleDeleteLicense(license.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            className="bg-[#1a1a1a] border-gray-700 text-white"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          >
            Previous
          </Button>
          <span className="text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            className="bg-[#1a1a1a] border-gray-700 text-white"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          >
            Next
          </Button>
        </div>
      )}
      
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-[#101010] text-white border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create License Key</DialogTitle>
            <DialogDescription className="text-gray-400">
              Generate a new license key that can be assigned to a user.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="licenseKey" className="text-sm font-medium text-gray-300">License Key</label>
              <div className="flex gap-2">
                <Input 
                  id="licenseKey" 
                  placeholder="Generate or enter manually" 
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                  value={newLicenseKey}
                  onChange={(e) => setNewLicenseKey(e.target.value)}
                />
                <Button 
                  type="button" 
                  variant="secondary" 
                  className="bg-[#1a1a1a] border-gray-700 text-white hover:bg-gray-700"
                  onClick={generateRandomKey}
                  disabled={isGenerating}
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate'}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="subscription" className="text-sm font-medium text-gray-300">Subscription Type</label>
              <Select 
                value={selectedSubscription} 
                onValueChange={setSelectedSubscription}
              >
                <SelectTrigger className="bg-[#1a1a1a] border-gray-700 text-white">
                  <SelectValue placeholder="Select subscription type" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-gray-700 text-white">
                  {subscriptions.map(sub => (
                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="expiryDate" className="text-sm font-medium text-gray-300">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Expiration Date (optional)</span>
                </div>
              </label>
              <Input 
                id="expiryDate" 
                type="date" 
                className="bg-[#1a1a1a] border-gray-700 text-white"
                value={newLicenseExpiry}
                onChange={(e) => setNewLicenseExpiry(e.target.value)}
              />
              <p className="text-xs text-gray-400">Leave blank for a license that never expires</p>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)}
              className="bg-[#1a1a1a] border-gray-700 text-white hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateLicense}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!newLicenseKey || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : 'Create License'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LicensesPage;
