
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { PortalSettings } from "@/types/auth";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("NotFound component mounted");
    console.log("Current path:", location.pathname);

    const checkAndRedirectPortal = async () => {
      // Check if this is a portal path
      const pathSegments = location.pathname.split('/');
      console.log("Path segments:", pathSegments);
      
      if (pathSegments.length >= 3 && pathSegments[1] === 'portal') {
        const username = pathSegments[2];
        const customPath = pathSegments.slice(3).join('/') || '';
        console.log(`Detected potential portal path: ${username}/${customPath}`);
        
        try {
          // First try to find in user_portal_config
          const { data: portalConfig, error } = await supabase
            .from('user_portal_config')
            .select('*')
            .eq('username', username)
            .eq('custom_path', customPath)
            .eq('enabled', true)
            .maybeSingle();
            
          if (portalConfig) {
            console.log("Found portal configuration, redirecting to portal page");
            navigate(`/portal/${username}/${customPath}`, { replace: true });
            return;
          } else {
            console.log("Portal config not found or not enabled in primary table");
            
            // Try web_login_regz as fallback
            const { data: userData } = await supabase
              .from('web_login_regz')
              .select('username, portal_settings')
              .eq('username', username)
              .maybeSingle();
              
            if (userData && 
                userData.portal_settings && 
                typeof userData.portal_settings === 'object' &&
                !Array.isArray(userData.portal_settings)) {
              
              // Safely type-cast portal_settings to the correct type
              // First cast to unknown, then to PortalSettings
              const portalSettings = userData.portal_settings as unknown as PortalSettings;
              
              if ('custom_path' in portalSettings &&
                  'enabled' in portalSettings &&
                  portalSettings.custom_path === customPath && 
                  portalSettings.enabled === true) {
                
                console.log("Found portal in web_login_regz, redirecting");
                navigate(`/portal/${username}/${customPath}`, { replace: true });
                return;
              }
            }
          }
        } catch (error) {
          console.error("Error checking portal:", error);
        }
      }
      
      // If we get here, it's not a valid portal path or couldn't be redirected
      setLoading(false);
    };
    
    checkAndRedirectPortal();
  }, [location.pathname, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="text-center p-6 max-w-md w-full bg-[#101010] border border-[#2a2a2a] rounded-lg">
        <h1 className="text-4xl font-bold mb-4 text-white">404</h1>
        <p className="text-xl text-gray-400 mb-4">Oops! Page not found</p>
        <p className="text-gray-400">The page you're looking for doesn't exist or has been moved.</p>
        
        <div className="mt-6">
          <Button 
            onClick={() => navigate("/")} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
