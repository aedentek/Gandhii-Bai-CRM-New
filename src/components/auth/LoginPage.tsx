import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Heart, Shield, UserPlus, Activity, Eye, EyeOff } from 'lucide-react';
import heroImage from '@/assets/healthcare-hero.jpg';
import logo from '@/assets/healthcare-logo.png';
import { loadWebsiteSettings, settingsAPI, rolesAPI, usersAPI } from '@/utils/api';

interface LoginPageProps {
  onLogin: (user: { email: string; role: string; name: string; permissions: string[] }) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [sampleUsers, setSampleUsers] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scrolling images for the left side
  const scrollingImages = [
    '/server/Photos/Login Scrolling/hand-with-medication-dark-style.jpg',
    '/server/Photos/Login Scrolling/hand-with-pills-dark-environment.jpg',
    '/server/Photos/Login Scrolling/people-meeting-support-group.jpg'
  ];

  // Auto-scroll effect for images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % scrollingImages.length
      );
    }, 5000); // Change image every 5 seconds for smoother experience

    return () => clearInterval(interval);
  }, [scrollingImages.length]);

  // Redirect if user is already logged in
  useEffect(() => {
    const savedUser = localStorage.getItem('healthcare_user');
    if (savedUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  // Load website settings on page load
  useEffect(() => {
    const loadSettings = async () => {
      try {
        console.log('🔗 Loading website settings via unified API...');
        await loadWebsiteSettings();
        console.log('✅ Website settings applied successfully');
      } catch (error) {
        console.error('❌ Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Quick fetch of users only
  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersData = await usersAPI.getAll();
        if (usersData) {
          setSampleUsers(usersData.filter((user: any) => {
            const status = user.user_status || user.status;
            return status === 'Active';
          }));
        }
      } catch (error) {
        // Silent fail for faster loading
      }
    };
    fetchData();
  }, []);

  // Handle photo upload and preview
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhoto(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Use the new login endpoint that connects to the database
      const loginResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email,
          password: password
        })
      });
      
      const loginData = await loginResponse.json();
      
      if (!loginResponse.ok) {
        toast({
          title: "Login Failed",
          description: loginData.error || "Invalid credentials",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      // Login successful - data includes user info and permissions from database
      console.log('✅ Database login successful:', loginData);
      
      onLogin({
        email: loginData.email,
        role: loginData.role,
        name: loginData.name,
        permissions: loginData.permissions || []
      });
      
      toast({
        title: "Welcome!",
        description: `Logged in as ${loginData.name} (${loginData.role})`,
      });
      
      navigate('/dashboard', { replace: true });
      
    } catch (error) {
      console.error('❌ Login error:', error);
      toast({
        title: "Connection Error",
        description: `Failed to connect to server. Make sure backend is running on port 4000.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-r from-blue-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-r from-indigo-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-cyan-200/20 to-blue-200/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto">
        {/* Mobile-first responsive container */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="flex flex-col lg:flex-row min-h-[600px]">
            
            {/* Left side - Enhanced Hero Section */}
            <div className="lg:flex-1 relative overflow-hidden">
              {/* Scrolling Images Section - Full Size Background */}
              <div className="absolute inset-0">
                {scrollingImages.map((imageSrc, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out ${
                      index === currentImageIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                    }`}
                    style={{ backgroundImage: `url('${imageSrc}')` }}
                  />
                ))}
                {/* Dark overlay for better text contrast */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60" />
              </div>

              {/* Content overlay on top of full-size image */}
              <div className="relative z-10 h-full min-h-[400px] lg:min-h-[600px] p-8 lg:p-12 flex flex-col justify-between">
                {/* Decorative patterns */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <div className="w-full h-full bg-white/5 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:60px_60px]"></div>
                </div>
                
                {/* Top content can be added here if needed */}
                <div></div>
                
                {/* Bottom content - Image indicators */}
                <div className="flex justify-center space-x-2">
                  {scrollingImages.map((_, index) => (
                    <button
                      key={index}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === currentImageIndex 
                          ? 'bg-yellow-300 w-8' 
                          : 'bg-white/50 w-2 hover:bg-white/70'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right side - Enhanced Login Form */}
            <div className="lg:flex-1 p-8 lg:p-12 flex items-center justify-center">
              <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                  <h3 className="text-3xl lg:text-4xl font-bold text-gray-900">Sign In</h3>
                  <p className="text-gray-600">Access your healthcare dashboard</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <UserPlus className="w-4 h-4 text-blue-600" />
                      <span>Email Address</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-4 pr-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-gray-50 hover:bg-white"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span>Password</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full pl-4 pr-12 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-gray-50 hover:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-md p-1 transition-colors duration-200"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember me and forgot password */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="remember"
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="remember" className="text-sm text-gray-600">
                        Remember me
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        window.history.pushState(null, '', '/forgot-password');
                        window.location.reload();
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Signing In...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <span>Sign In to Dashboard</span>
                        <Activity className="w-5 h-5" />
                      </div>
                    )}
                  </Button>

                  {/* Footer */}
                  <div className="text-center pt-4">
                    <p className="text-sm text-gray-600">
                      Secure access to your healthcare management platform
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-8 text-gray-600">
          <p className="text-sm">© 2024 Nova CRM. Secure. Reliable. Efficient.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;