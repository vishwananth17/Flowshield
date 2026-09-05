import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowRight, AlertCircle, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [acceptedToS, setAcceptedToS] = useState(true);
  const [acceptedDPA, setAcceptedDPA] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedToS || !acceptedDPA) {
      setError('You must accept the terms and DPDP compliance agreement.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await register({
        email,
        password,
        full_name: fullName,
        organization_name: orgName,
      });
      toast.success('Workspace created successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.error?.message || 'Registration failed';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
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
        <h2 className="type-h2 text-text-primary">Create your merchant workspace</h2>
        <p className="type-sm text-text-secondary">Initialize automated fraud defense and dispute representation</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card variant="data" padding="lg" className="space-y-6">
          
          {error && (
            <div className="p-3 bg-status-block/[0.08] border border-status-block/20 rounded-sm text-xs text-status-block flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="Vishwananth Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Input
              label="Work Email"
              type="email"
              placeholder="name@store.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Company / Store Name"
              placeholder="e.g. Acme Retail Technologies"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
            />
            <Input
              label="Master Password (8+ characters)"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {/* Checkbox Agreements */}
            <div className="space-y-2.5 pt-2 text-xs text-text-secondary">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedToS}
                  onChange={(e) => setAcceptedToS(e.target.checked)}
                  className="rounded border-border-300 bg-surface-200 text-cyan-500 mt-0.5"
                />
                <span>I accept the <Link to="/terms" className="text-cyan-400 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-cyan-400 hover:underline">Privacy Policy</Link></span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedDPA}
                  onChange={(e) => setAcceptedDPA(e.target.checked)}
                  className="rounded border-border-300 bg-surface-200 text-cyan-500 mt-0.5"
                />
                <span>I agree to the <Link to="/security" className="text-cyan-400 hover:underline">DPDP Act 2023 Data Processing Agreement</Link></span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={loading}
              className="w-full justify-center mt-2"
            >
              <span>Create Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </form>

          <div className="pt-4 border-t border-border-100 text-center text-xs text-text-tertiary">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-400 font-semibold hover:underline">
              Sign in
            </Link>
          </div>

        </Card>
      </div>

    </div>
  );
}
