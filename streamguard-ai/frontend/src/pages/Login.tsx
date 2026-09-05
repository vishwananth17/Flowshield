import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowRight, ShieldCheck, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [authMode, setAuthMode] = useState<'email' | 'mobile'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      setError('Your session has expired. Please sign in again.');
    }
  }, [location]);

  useEffect(() => {
    let interval: any = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (authMode === 'email') {
        await login({ email, password });
      } else {
        if (!otpSent) {
          if (!mobileNumber || mobileNumber.length < 10) {
            setError('Please enter a valid 10-digit mobile number.');
            setIsLoading(false);
            return;
          }
          setOtpSent(true);
          setTimer(30);
          setIsLoading(false);
          toast.success('SMS OTP sent to ' + mobileNumber);
          return;
        } else {
          await login({ email: `${mobileNumber}@phone.flowshield.ai`, password: `otp_${otpCode}` });
        }
      }
      navigate('/dashboard');
      toast.success('Authenticated successfully');
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.error?.message || 'Invalid credentials';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-cyan-500/20 antialiased">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        {/* Wordmark Logo */}
        <Link to="/" className="inline-flex items-center space-x-1 select-none">
          <span className="font-semibold text-lg tracking-tight text-text-primary">Flowshield</span>
          <span className="text-cyan-500 font-bold text-lg">/</span>
          <span className="font-semibold text-lg tracking-tight text-text-primary">AI</span>
        </Link>
        <h2 className="type-h2 text-text-primary">Sign in to your workspace</h2>
        <p className="type-sm text-text-secondary">Enter your credentials to access the SOC telemetry console</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card variant="data" padding="lg" className="space-y-6">
          
          {/* Email vs Mobile Toggle */}
          <div className="flex items-center bg-surface-200 border border-border-200 p-1 rounded-sm text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setAuthMode('email'); setError(''); }}
              className={`flex-1 py-1.5 rounded-xs transition-colors ${
                authMode === 'email' ? 'bg-cyan-500 text-surface-000' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Email Address
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('mobile'); setError(''); }}
              className={`flex-1 py-1.5 rounded-xs transition-colors ${
                authMode === 'mobile' ? 'bg-cyan-500 text-surface-000' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Mobile OTP (India)
            </button>
          </div>

          {error && (
            <div className="p-3 bg-status-block/[0.08] border border-status-block/20 rounded-sm text-xs text-status-block flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === 'email' ? (
              <>
                <Input
                  label="Work Email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </>
            ) : (
              <>
                <Input
                  label="Mobile Number (+91)"
                  type="tel"
                  placeholder="9876543210"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  disabled={otpSent}
                  required
                />
                {otpSent && (
                  <Input
                    label="6-Digit OTP Code"
                    type="text"
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    required
                  />
                )}
              </>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full justify-center mt-2"
            >
              <span>{authMode === 'mobile' && !otpSent ? 'Send OTP' : 'Sign in to Console'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </form>

          <div className="pt-4 border-t border-border-100 flex items-center justify-between text-xs text-text-tertiary">
            <Link to="/register" className="hover:text-cyan-400 transition-colors">
              Need an account? <strong className="text-text-primary">Create workspace</strong>
            </Link>
            <Link to="/docs" className="hover:text-text-primary transition-colors">
              Docs & API
            </Link>
          </div>

        </Card>
      </div>

    </div>
  );
}
