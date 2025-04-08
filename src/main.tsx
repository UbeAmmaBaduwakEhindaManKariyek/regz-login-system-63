
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId="819293669934-k68lfl3bg7lon0rhuoqtqisukqgpc5i9.apps.googleusercontent.com">
    <Router>
      <App />
    </Router>
  </GoogleOAuthProvider>
);
