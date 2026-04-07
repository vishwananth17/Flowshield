import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Shield, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ email, password, full_name: fullName, organization_name: orgName });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to register account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0A0E1A] p-4 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md z-10"
      >
        <Card className="w-full backdrop-blur-xl bg-[#111827]/80 border-[#1F2937]/80 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
          <CardHeader className="space-y-4 text-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <div className="flex justify-center mb-8">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                    <Shield className="h-6 w-6 text-blue-400" />
                  </div>
                  <span className="text-3xl font-display font-bold text-white tracking-tight">Flowshield AI</span>
                </div>
              </div>
            </motion.div>
            <div>
              <CardTitle className="text-3xl font-display font-bold text-white tracking-tight">Join Flowshield AI</CardTitle>
              <CardDescription className="text-gray-400 mt-2">Start protecting your transactions instantly</CardDescription>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Organization Name</label>
                  <Input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Acme Corp"
                    required
                    className="bg-[#0f172a] border-[#1F2937] text-white focus-visible:ring-emerald-500/50 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Full Name</label>
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    className="bg-[#0f172a] border-[#1F2937] text-white focus-visible:ring-emerald-500/50 h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Work Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@company.com"
                  required
                  className="bg-[#0f172a] border-[#1F2937] text-white focus-visible:ring-emerald-500/50 h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-[#0f172a] border-[#1F2937] text-white focus-visible:ring-emerald-500/50 h-11"
                />
              </div>
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-medium tracking-wide transition-all duration-200"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-[#1F2937]/50 pt-6 pb-6 bg-[#0A0E1A]/30">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">Sign in</Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
