import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Shield, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0A0E1A] p-4 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md z-10"
      >
        <Card className="w-full backdrop-blur-xl bg-[#111827]/80 border-[#1F2937]/80 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
          <CardHeader className="space-y-4 text-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="flex justify-center"
            >
              <div className="relative rounded-full bg-blue-500/10 p-4 ring-1 ring-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                <Shield className="h-8 w-8 text-blue-400" />
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-purple-400 animate-pulse" />
              </div>
            </motion.div>
            <div>
              <CardTitle className="text-3xl font-display font-bold text-white tracking-tight">StreamGuard AI</CardTitle>
              <CardDescription className="text-gray-400 mt-2">Sign in to your protective shield</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 text-center"
                >
                  {error}
                </motion.div>
              )}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-300">Email address</label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="bg-[#0f172a] border-[#1F2937] text-white focus-visible:ring-blue-500/50 h-11"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-gray-300">Password</label>
                  <Link to="#" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Forgot password?</Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-[#0f172a] border-[#1F2937] text-white focus-visible:ring-blue-500/50 h-11"
                />
              </div>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-medium tracking-wide transition-all duration-200"
              >
                {isLoading ? 'Authenticating...' : 'Sign in to Dashboard'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-[#1F2937]/50 pt-6 pb-6 bg-[#0A0E1A]/30">
            <p className="text-sm text-gray-400">
              New to StreamGuard?{' '}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Request access</Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
