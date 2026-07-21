import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
              <CardTitle className="text-2xl font-extrabold text-white tracking-tight">Sign In</CardTitle>
              <CardDescription className="text-zinc-400 text-xs mt-1">Enter your credentials to access the console</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-8 py-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded bg-zinc-900 border border-zinc-700 p-3 text-xs text-red-400 text-center font-mono">
                  {error}
                </div>
              )}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Email address</label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-white h-10 rounded text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Password</label>
                  <Link to="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Forgot password?</Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-white h-10 rounded text-xs"
                />
              </div>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-11 bg-white text-black hover:bg-zinc-200 font-bold text-xs uppercase tracking-wider rounded transition-colors"
              >
                {isLoading ? 'Authenticating...' : 'Sign in to Dashboard'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-zinc-900 py-6 bg-black">
            <p className="text-xs text-zinc-400">
              New to Flowshield?{' '}
              <Link to="/register" className="text-white font-bold hover:underline">Request access</Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
