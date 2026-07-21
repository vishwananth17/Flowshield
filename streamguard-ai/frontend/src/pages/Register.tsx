import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import api from '@/services/api';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      
      // Record legal acceptances in backend database
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
    <div className="relative flex min-h-screen items-center justify-center bg-black text-white p-4 overflow-hidden font-body">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md z-10"
      >
        <Card className="w-full bg-zinc-950 border border-zinc-800 rounded-xl shadow-sm overflow-hidden text-left">
          <CardHeader className="space-y-3 text-center pt-8 pb-4">
            <div className="flex justify-center mb-2">
              <Link to="/">
                <Logo size={40} iconSize={24} theme="dark" showText={true} />
              </Link>
            </div>
            <div>
              <CardTitle className="text-2xl font-extrabold text-white tracking-tight">Create Account</CardTitle>
              <CardDescription className="text-zinc-400 text-xs mt-1">Get started with autonomous fraud defense</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-8 py-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded bg-zinc-900 border border-zinc-700 p-3 text-xs text-red-400 text-center font-mono">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Organization</label>
                  <Input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Acme Corp"
                    required
                    className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-white h-10 rounded text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Full Name</label>
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-white h-10 rounded text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Work Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@company.com"
                  required
                  className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-white h-10 rounded text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-white h-10 rounded text-xs"
                />
              </div>
              
              {/* Legal checkboxes */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center">
                  <input
                    id="tos"
                    type="checkbox"
                    checked={acceptedToS}
                    onChange={(e) => setAcceptedToS(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-zinc-700 bg-black text-white focus:ring-white"
                  />
                  <label htmlFor="tos" className="ml-2 text-xs text-zinc-400">
                    I agree to the <Link to="/terms" className="text-white underline font-semibold">Terms of Service</Link> & <Link to="/privacy" className="text-white underline font-semibold">Privacy Policy</Link>.
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="dpa"
                    type="checkbox"
                    checked={acceptedDPA}
                    onChange={(e) => setAcceptedDPA(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-zinc-700 bg-black text-white focus:ring-white"
                  />
                  <label htmlFor="dpa" className="ml-2 text-xs text-zinc-400">
                    I accept the <Link to="/dpa" className="text-white underline font-semibold">Data Processing Agreement</Link>.
                  </label>
                </div>
              </div>
              
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-11 bg-white text-black hover:bg-zinc-200 font-bold text-xs uppercase tracking-wider rounded transition-colors mt-2"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-zinc-900 py-6 bg-black">
            <p className="text-xs text-zinc-400">
              Already have an account?{' '}
              <Link to="/login" className="text-white font-bold hover:underline">Sign in</Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
