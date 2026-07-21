import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/services/api';
import { toast } from 'sonner';

interface EnterpriseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EnterpriseModal({ isOpen, onClose }: EnterpriseModalProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    monthly_volume: 'Under 10,000',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/billing/contact-enterprise', formData);
      setIsSubmitted(true);
      toast.success("Message sent to Vishwanath!");
    } catch (err) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-xs"
          />

          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="relative bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {!isSubmitted ? (
               <div className="flex flex-col lg:flex-row h-full">
                  {/* Left Side */}
                  <div className="lg:w-1/3 bg-black p-10 lg:border-r border-zinc-800 hidden lg:block">
                      <div className="w-10 h-10 bg-white text-black rounded flex items-center justify-center mb-6 font-bold">
                          <Building2 className="w-5 h-5" />
                      </div>
                      <h2 className="text-2xl font-extrabold tracking-tight text-white mb-6 leading-tight">Enterprise <br />Intelligence</h2>
                      <ul className="space-y-4">
                        <li className="flex items-start text-xs text-zinc-400 font-medium">
                           <CheckCircle2 className="w-4 h-4 mr-2.5 text-white flex-shrink-0" />
                           Direct channel with our founder Vishwanath B.
                        </li>
                        <li className="flex items-start text-xs text-zinc-400 font-medium">
                           <CheckCircle2 className="w-4 h-4 mr-2.5 text-white flex-shrink-0" />
                           SLA-backed 99.9% uptime guarantees.
                        </li>
                        <li className="flex items-start text-xs text-zinc-400 font-medium">
                           <CheckCircle2 className="w-4 h-4 mr-2.5 text-white flex-shrink-0" />
                           Custom model training on historical telemetry.
                        </li>
                      </ul>
                  </div>

                  {/* Right Side: Form */}
                  <div className="flex-1 p-8 lg:p-10 overflow-y-auto">
                    <div className="max-w-md mx-auto">
                        <h3 className="text-xl font-bold text-white mb-1">Let's talk scale</h3>
                        <p className="text-zinc-500 text-xs mb-8">We'll reach out within 24 hours to schedule a deep-dive call.</p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Full Name</label>
                                <Input 
                                  required 
                                  value={formData.name}
                                  onChange={e => setFormData({...formData, name: e.target.value})}
                                  placeholder="John Doe" 
                                  className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 h-10 rounded text-xs focus-visible:ring-white" 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Work Email</label>
                                <Input 
                                  required 
                                  type="email"
                                  value={formData.email}
                                  onChange={e => setFormData({...formData, email: e.target.value})}
                                  placeholder="john@company.com" 
                                  className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 h-10 rounded text-xs focus-visible:ring-white" 
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Company</label>
                                    <Input 
                                      required 
                                      value={formData.company}
                                      onChange={e => setFormData({...formData, company: e.target.value})}
                                      placeholder="Fintech Inc" 
                                      className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 h-10 rounded text-xs focus-visible:ring-white" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Monthly Volume</label>
                                    <select 
                                      value={formData.monthly_volume}
                                      onChange={e => setFormData({...formData, monthly_volume: e.target.value})}
                                      className="w-full h-10 bg-black border border-zinc-800 text-white rounded px-3 text-xs focus:outline-none focus:border-white"
                                    >
                                        <option className="bg-black text-white">Under 10,000</option>
                                        <option className="bg-black text-white">10,000 - 1,00,000</option>
                                        <option className="bg-black text-white">1,00,000 - 10,00,000</option>
                                        <option className="bg-black text-white">Above 10,00,000</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">How can we help?</label>
                                <textarea 
                                  rows={3}
                                  value={formData.message}
                                  onChange={e => setFormData({...formData, message: e.target.value})}
                                  placeholder="Tell us about your fraud challenges..."
                                  className="w-full bg-black border border-zinc-800 text-white placeholder:text-zinc-600 rounded px-3 py-2 text-xs focus:outline-none focus:border-white"
                                />
                            </div>

                            <Button 
                              type="submit" 
                              disabled={loading}
                              className="w-full py-5 bg-white text-black hover:bg-zinc-200 font-bold text-xs uppercase tracking-wider rounded"
                            >
                                {loading ? "Sending..." : "Request Access"}
                            </Button>
                        </form>
                    </div>
                  </div>
               </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-16 text-center">
                    <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-white mb-3">Request Received</h2>
                    <p className="text-zinc-400 max-w-sm mx-auto mb-8 text-xs leading-relaxed">
                        Vishwanath or a senior engineer will reach out to you within 24 hours to schedule your onboarding.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button className="bg-white text-black hover:bg-zinc-200 font-bold px-6 h-10 rounded text-xs uppercase" onClick={onClose}>
                            Close Window
                        </Button>
                    </div>
                </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
