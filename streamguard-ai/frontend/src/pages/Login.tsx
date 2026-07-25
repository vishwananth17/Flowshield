import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Heading2, Caption } from '@/components/ui/Typography';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      setError('Your session has expired. Please log in again.');
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response 
        ? (err.response.data?.detail || err.response.data?.error?.message || 'Invalid email or password')
        : 'Network Error: Backend is currently unreachable. Please check your connection or redeploy.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[var(--bg-base)] text-[var(--text-primary)] p-4 overflow-hidden font-body">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md z-10"
      >
        <Card variant="default" padding="none" className="w-full overflow-hidden text-left border border-[var(--border-default)]">
          <div className="space-y-3 text-center pt-8 pb-4">
            <div className="flex justify-center mb-2">
              <Link to="/">
                <Logo size={40} iconSize={24} showText={true} />
              </Link>
            </div>
            <div>
              <Heading2 className="text-center">Sign In</Heading2>
              <Caption className="text-center mt-1 block">Enter your credentials to access the console</Caption>
            </div>
          </div>
          
          <div className="px-8 py-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-[var(--radius-sm)] bg-[var(--color-danger-muted)] border border-[var(--color-danger-border)] p-3 text-xs text-[var(--color-danger)] text-center font-mono">
                  {error}
                </div>
              )}
              
              <Input
                required
                id="email"
                type="email"
                label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-secondary)]">Password</span>
                  <Link to="#" className="text-xs text-[var(--text-muted)] hover:text-white transition-colors">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Input
                    required
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword
                      ? <EyeOff className="w-4 h-4" />
                      : <Eye className="w-4 h-4" />
                    }
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                variant="gold"
                fullWidth
                size="lg"
              >
                {isLoading ? 'Authenticating...' : 'Sign in to Dashboard'}
              </Button>
            </form>
          </div>

          <div className="flex justify-center border-t border-[var(--border-subtle)] py-6 bg-[var(--bg-inset)]">
            <p className="text-xs text-[var(--text-muted)]">
              New to Flowshield?{' '}
              <Link to="/register" className="text-[var(--text-gold)] font-bold hover:underline">Request access</Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
