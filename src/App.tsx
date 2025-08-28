// Import CSS globally
import './styles/modern-forms.css';
import './styles/modern-tables.css';
import './styles/global-crm-design.css';

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import LoginPage from '@/components/auth/LoginPage';
import ForgotPasswordPage from '@/components/auth/ForgotPasswordPage';
import ModernSidebar from '@/components/layout/ModernSidebar';
import { cn } from '@/lib/utils';
import './App.css';

import { loadWebsiteSettings } from '@/utils/api';
import AppRoutes from '@/components/AppRoutes';

const queryClient = new QueryClient();

function App() {
  const [user, setUser] = useState<{ name: string; role: string; email: string; permissions: string[] } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Load website settings (title, favicon) on app start using unified API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        console.log('🔗 Loading website settings via unified API...');
        await loadWebsiteSettings();
        console.log('✅ Website settings applied successfully');
      } catch (error) {
        console.error('❌ Failed to load website settings:', error);
      } finally {
        setSettingsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    console.log('🔐 Checking authentication...');
    const savedUser = localStorage.getItem('healthcare_user');
    console.log('💾 Saved user from localStorage:', savedUser);
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      console.log('✅ User authenticated:', parsedUser);
      setUser(parsedUser);
    } else {
      console.log('❌ No authenticated user found');
      // Check if the URL is for forgot password
      if (window.location.pathname === '/forgot-password') {
        console.log('🔄 Showing forgot password page');
        setShowForgotPassword(true);
        return;
      }
      console.log('🚫 No user found, creating auto-login for development');
      // Auto-login for development/testing
      const devUser = {
        name: 'Dr. Admin',
        role: 'Admin', 
        email: 'admin@healthcare.com',
        permissions: ['all'] // Admin has all permissions
      };
      setUser(devUser);
      localStorage.setItem('healthcare_user', JSON.stringify(devUser));
    }
  }, []);

  const handleLogin = (userData: { name: string; role: string; email: string; permissions: string[] }) => {
    setUser(userData);
    localStorage.setItem('healthcare_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('healthcare_user');
    // Force reload to ensure clean state
    window.location.href = '/';
  };

  console.log('🎭 App render state:', {
    settingsLoaded,
    showForgotPassword,
    userExists: !!user,
    user: user
  });

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          {!settingsLoaded ? (
            <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading...</p>
              </div>
            </div>
          ) : showForgotPassword ? (
            <ForgotPasswordPage onBack={() => {
              setShowForgotPassword(false);
              window.history.pushState(null, '', '/');
            }} />
          ) : !user ? (
            <LoginPage onLogin={handleLogin} />
          ) : (
            <div className="min-h-screen bg-background border-r-4 sm:border-r-6 md:border-r-8 border-gray-300 pr-4 sm:pr-6 md:pr-8">
              <ModernSidebar 
                user={user} 
                onLogout={handleLogout} 
                onCollapsedChange={setSidebarCollapsed}
              />
              <main className={cn(
                "min-h-screen overflow-x-hidden overflow-y-auto bg-background scrollbar-hide transition-all duration-300 max-w-full",
                "ml-0 lg:ml-64", // Mobile: no margin, Desktop: 64 when expanded
                sidebarCollapsed && "lg:ml-16" // Desktop: 16 when collapsed
              )}>
                <div className="min-h-screen w-full max-w-full pl-1 pr-4 sm:pl-2 sm:pr-6 lg:pl-3 lg:pr-6 pt-16 lg:pt-6 page-content">
                  <AppRoutes user={user} />
                </div>
              </main>
            </div>
          )}
          <Toaster />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
