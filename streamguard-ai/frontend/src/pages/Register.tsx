import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Heading2, Caption } from '@/components/ui/Typography';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import api from '@/services/api';
import { Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedToS, setAcceptedToS] = useState(false);
  const [acceptedDPA, setAcceptedDPA] = useState(false);
  
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedToS || !acceptedDPA) {
      setError('You must accept the terms and agreements to register.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register({ email, password, full_name: fullName, organization_name: orgName });
      
      try {
        await Promise.all([
          api.post('/legal/accept', { document: 'terms_of_service', version: '1.0' }),
          api.post('/legal/accept', { document: 'privacy_policy', version: '1.0' }),
          api.post('/legal/accept', { document: 'dpa', version: '1.0' })
        ]);
      } catch (acceptErr) {
        console.error("Failed to record legal acceptances:", acceptErr);
      }

      const plan = new URLSearchParams(window.location.search).get('plan');
      if (plan && plan !== 'free') {
        navigate(`/billing?upgrade=${plan}`);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.response?.data?.error?.message || 'Failed to register account');
    } finally {
      setLoading(false);
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
              <Heading2 className="text-center">Create Account</Heading2>
              <Caption className="text-center mt-1 block">Get started with autonomous fraud defense</Caption>
            </div>
          </div>
          
          <div className="px-8 py-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-[var(--radius-sm)] bg-[var(--color-danger-muted)] border border-[var(--color-danger-border)] p-3 text-xs text-[var(--color-danger)] text-center font-mono">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  required
                  type="text"
                  label="Organization"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Acme Corp"
                />
                <Input
                  required
                  type="text"
                  label="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              
              <Input
                required
                type="email"
                label="Work Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@company.com"
              />
              
              <div className="relative">
                <Input
                  required
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 bottom-3 text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />
                  }
                </button>
              </div>
              
              {/* Legal checkboxes */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center">
                  <input
                    id="tos"
                    type="checkbox"
                    checked={acceptedToS}
                    onChange={(e) => setAcceptedToS(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-[var(--border-default)] bg-black text-white focus:ring-[var(--color-primary)] cursor-pointer"
                  />
                  <label htmlFor="tos" className="ml-2 text-xs text-[var(--text-secondary)]">
                    I agree to the <Link to="/terms" className="text-white underline font-semibold">Terms of Service</Link> & <Link to="/privacy" className="text-white underline font-semibold">Privacy Policy</Link>.
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="dpa"
                    type="checkbox"
                    checked={acceptedDPA}
                    onChange={(e) => setAcceptedDPA(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-[var(--border-default)] bg-black text-white focus:ring-[var(--color-primary)] cursor-pointer"
                  />
                  <label htmlFor="dpa" className="ml-2 text-xs text-[var(--text-secondary)]">
                    I accept the <Link to="/dpa" className="text-white underline font-semibold">Data Processing Agreement</Link>.
                  </label>
                </div>
              </div>
              
              <Button 
                type="submit" 
                disabled={loading}
                variant="gold"
                fullWidth
                size="lg"
                className="mt-2"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          </div>
          
          <div className="flex justify-center border-t border-[var(--border-subtle)] py-6 bg-[var(--bg-inset)]">
            <p className="text-xs text-[var(--text-muted)]">
              Already have an account?{' '}
              <Link to="/login" className="text-[var(--text-gold)] font-bold hover:underline">Sign in</Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
