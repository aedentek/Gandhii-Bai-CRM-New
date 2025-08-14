import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Mail, Shield, Key } from 'lucide-react';

interface ForgotPasswordPageProps {
  onBack: () => void;
}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onBack }) => {
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [userId, setUserId] = useState('');
  const [userRole, setUserRole] = useState('');

  // Timer for OTP expiry
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpSent && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setOtpSent(false);
      setGeneratedOtp('');
      toast({
        title: "OTP Expired",
        description: "The OTP has expired. Please request a new one.",
        variant: "destructive",
      });
      setStep('email');
    }
    return () => clearInterval(timer);
  }, [otpSent, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔍 Sending OTP request for:', email);
      
      // Send OTP request to backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send OTP');
      }

      console.log('✅ OTP sent successfully:', result);
      
      setOtpSent(true);
      setTimeLeft(300); // Reset timer to 5 minutes
      setStep('otp');
      
      toast({
        title: "OTP Sent Successfully",
        description: `A 6-digit OTP has been sent to ${result.sentTo} for user: ${email}`,
      });

    } catch (error) {
      console.error('❌ Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔍 Verifying OTP:', { email, otp });
      
      // Verify OTP with backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to verify OTP');
      }

      console.log('✅ OTP verified successfully:', result);
      
      // Store user details for password reset
      setUserId(result.userId);
      setUserRole(result.userRole);
      
      // OTP is valid, proceed to password reset
      setStep('reset');
      toast({
        title: "OTP Verified",
        description: "OTP verified successfully. Please set your new password.",
      });

    } catch (error) {
      console.error('❌ Error:', error);
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid or expired OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (password !== confirmPassword) {
        toast({
          title: "Password Mismatch",
          description: "Passwords do not match. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        toast({
          title: "Weak Password",
          description: "Password must be at least 6 characters long.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Update password in database
      const response = await fetch(`${import.meta.env.VITE_API_URL}/management-users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: email,
          role: userRole, // Use the stored user's role
          password: password,
          status: 'Active'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update password');
      }

      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated successfully. You can now login with your new password.",
      });

      // Redirect back to login after successful reset
      setTimeout(() => {
        onBack();
      }, 2000);

    } catch (error) {
      console.error('❌ Error:', error);
      toast({
        title: "Error",
        description: "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderEmailStep = () => (
    <Card className="w-full max-w-md shadow-medical">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Mail className="w-16 h-16 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold text-primary">Forgot Password</CardTitle>
        <CardDescription>
          Enter your email address to receive an OTP
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleEmailSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="transition-medical"
            />
          </div>

          <div className="text-sm text-muted-foreground bg-accent p-3 rounded-md">
            <strong>Note:</strong> OTP will be sent to aedentek@gmail.com for verification.
            Please check your email inbox for the 6-digit code.
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button 
            type="submit" 
            className="w-full bg-gradient-medical hover:shadow-hover transition-medical"
            disabled={loading || !email}
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </Button>
          
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        </CardFooter>
      </form>
    </Card>
  );

  const renderOtpStep = () => (
    <Card className="w-full max-w-md shadow-medical">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Shield className="w-16 h-16 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold text-primary">Verify OTP</CardTitle>
        <CardDescription>
          Enter the 6-digit OTP sent to aedentek@gmail.com
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleOtpSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">OTP Code</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              className="transition-medical text-center text-2xl tracking-widest"
              maxLength={6}
            />
          </div>

          <div className="text-sm text-center">
            <div className="text-muted-foreground">
              Time remaining: <span className="font-mono text-primary">{formatTime(timeLeft)}</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground bg-accent p-2 rounded">
              <strong>Check your email:</strong> OTP sent to aedentek@gmail.com<br/>
              If you don't see the email, please check your spam folder.
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button 
            type="submit" 
            className="w-full bg-gradient-medical hover:shadow-hover transition-medical"
            disabled={loading || otp.length !== 6}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </Button>
          
          <button
            type="button"
            onClick={() => setStep('email')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Email
          </button>
        </CardFooter>
      </form>
    </Card>
  );

  const renderResetStep = () => (
    <Card className="w-full max-w-md shadow-medical">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Key className="w-16 h-16 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold text-primary">Reset Password</CardTitle>
        <CardDescription>
          Create a new password for your account
        </CardDescription>
      </CardHeader>

      <form onSubmit={handlePasswordReset}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="transition-medical"
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="transition-medical"
              minLength={6}
            />
          </div>

          <div className="text-sm text-muted-foreground bg-accent p-3 rounded-md">
            <strong>Password Requirements:</strong><br />
            • At least 6 characters long<br />
            • Both passwords must match
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button 
            type="submit" 
            className="w-full bg-gradient-medical hover:shadow-hover transition-medical"
            disabled={loading || !password || !confirmPassword || password !== confirmPassword}
          >
            {loading ? 'Saving...' : 'Save New Password'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-subtle">
      {step === 'email' && renderEmailStep()}
      {step === 'otp' && renderOtpStep()}
      {step === 'reset' && renderResetStep()}
    </div>
  );
};

export default ForgotPasswordPage;
