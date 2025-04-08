
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.tsx'
import './index.css'

// Get the current hostname to handle multiple environments
const hostname = window.location.hostname;
const isDevelopment = hostname.includes('localhost') || 
                       hostname.includes('127.0.0.1') ||
                       hostname.includes('.lovableproject.com');

// Use the Google client ID with correct configuration
createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider 
    clientId="819293669934-k68lfl3bg7lon0rhuoqtqisukqgpc5i9.apps.googleusercontent.com"
    onScriptLoadError={() => console.error("Google OAuth script failed to load")}
    onScriptLoadSuccess={() => console.log("Google OAuth script loaded successfully")}
  >
    <Router>
      <App />
    </Router>
  </GoogleOAuthProvider>
);
