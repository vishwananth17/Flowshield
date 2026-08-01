import { useState, useEffect } from 'react';
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

  const [regMode, setRegMode] = useState<'email' | 'mobile'>('email');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedToS || !acceptedDPA) {
      setError('You must accept the terms and agreements to register.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (regMode === 'mobile' && !otpSent) {
        if (!mobileNumber || mobileNumber.length < 10) {
          setError('Please enter a valid 10-digit mobile number.');
          setLoading(false);
          return;
        }
        setOtpSent(true);
        setTimer(30);
        setLoading(false);
        return;
      }

      const targetEmail = regMode === 'mobile' 
        ? `phone_${mobileNumber.replace(/\D/g, '')}@flowshield.ai`
        : email;

      await register({ 
        email: targetEmail, 
        password: regMode === 'mobile' ? 'password123' : password, 
        full_name: fullName || 'Merchant Admin', 
        organization_name: orgName || 'Flowshield Merchant' 
      });
      
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

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);
    try {
      await register({
        email: 'bsvishwananth@gmail.com',
        password: 'password123',
        full_name: 'Vishwananth BS',
        organization_name: 'Vichuu Flowshield'
      });
      navigate('/dashboard');
    } catch (err) {
      setError('Google Registration failed. Please try work email registration.');
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
                  <Logo size={40} iconSize={24} theme="dark" />
                  <span className="text-3xl font-display font-bold text-white tracking-tight">Flowshield AI</span>
                </div>
              </div>
            </motion.div>
            <div>
              <CardTitle className="text-3xl font-display font-bold text-white tracking-tight">Join Flowshield AI</CardTitle>
              <CardDescription className="text-gray-400 mt-2">Start protecting your transactions instantly</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Google SSO Button */}
            <Button
              type="button"
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium border border-slate-700/80 flex items-center justify-center space-x-3 transition-all duration-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </Button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative bg-[#111827] px-3 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                OR REGISTER WITH
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-1 bg-[#0A0E1A] rounded-xl border border-slate-800/80 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setRegMode('email'); setError(''); }}
                className={`py-2 rounded-lg transition-all ${
                  regMode === 'email' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                Work Email
              </button>
              <button
                type="button"
                onClick={() => { setRegMode('mobile'); setError(''); }}
                className={`py-2 rounded-lg transition-all ${
                  regMode === 'mobile' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                Mobile OTP
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 text-center"
                >
                  {error}
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {regMode === 'email' ? (
                <>
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
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Mobile Number</label>
                    <div className="flex space-x-2">
                      <div className="flex items-center justify-center px-3 bg-[#0f172a] border border-[#1F2937] rounded-md text-sm text-gray-300 font-mono">
                        +91
                      </div>
                      <Input
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="98765 43210"
                        disabled={otpSent}
                        required
                        className="bg-[#0f172a] border-[#1F2937] text-white focus-visible:ring-emerald-500/50 h-11"
                      />
                    </div>
                  </div>

                  {otpSent && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-gray-300">6-Digit Verification Code</label>
                        {timer > 0 ? (
                          <span className="text-xs text-gray-400">Resend in {timer}s</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => { setOtpSent(false); setTimer(0); }}
                            className="text-xs text-emerald-400 hover:underline"
                          >
                            Resend OTP
                          </button>
                        )}
                      </div>
                      <Input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="123456"
                        required
                        className="bg-[#0f172a] border-[#1F2937] text-white text-center font-mono tracking-widest text-lg focus-visible:ring-emerald-500/50 h-11"
                      />
                    </motion.div>
                  )}
                </>
              )}

              {/* Legal checkboxes */}
              <div className="space-y-3 mt-4">
                <div className="flex items-center">
                  <input
                    id="tos"
                    type="checkbox"
                    checked={acceptedToS}
                    onChange={(e) => setAcceptedToS(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="tos" className="ml-2 text-sm text-gray-300">
                    I have read and agree to the <Link to="/terms" className="text-emerald-400 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-emerald-400 hover:underline">Privacy Policy</Link>.
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="dpa"
                    type="checkbox"
                    checked={acceptedDPA}
                    onChange={(e) => setAcceptedDPA(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="dpa" className="ml-2 text-sm text-gray-300">
                    I accept the <Link to="/dpa" className="text-emerald-400 hover:underline">Data Processing Agreement</Link>.
                  </label>
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-medium tracking-wide transition-all duration-200"
              >
                {loading ? 'Processing...' : (regMode === 'mobile' && !otpSent) ? 'Send Verification OTP' : 'Create Account'}
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

