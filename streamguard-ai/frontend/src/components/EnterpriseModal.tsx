import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Mail, User, MessageSquare, ChevronRight, CheckCircle2 } from 'lucide-react';
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
            className="absolute inset-0 bg-[#020617]/95 backdrop-blur-md"
          />

          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-[#0A0E1A] border border-[#1F2937] rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
          >
            <button 
              onClick={onClose}
              className="absolute top-8 right-8 text-gray-400 hover:text-white transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {!isSubmitted ? (
               <div className="flex flex-col lg:flex-row h-full">
                  {/* Left Side: Brand/Value */}
                  <div className="lg:w-1/3 bg-purple-600/5 p-12 lg:border-r border-[#1F2937] hidden lg:block">
                      <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-purple-600/20">
                          <Building2 className="text-white w-6 h-6" />
                      </div>
                      <h2 className="text-3xl font-black tracking-tight mb-6">Enterprise <br />Intelligence</h2>
                      <ul className="space-y-6">
                        <li className="flex items-start text-xs text-slate-400 leading-relaxed font-bold">
                           <CheckCircle2 className="w-4 h-4 mr-3 text-purple-500 flex-shrink-0" />
                           Direct channel with our founder Vishwanath B.
                        </li>
                        <li className="flex items-start text-xs text-slate-400 leading-relaxed font-bold">
                           <CheckCircle2 className="w-4 h-4 mr-3 text-purple-500 flex-shrink-0" />
                           SLA-backed 99.9% uptime guarantees.
                        </li>
                        <li className="flex items-start text-xs text-slate-400 leading-relaxed font-bold">
                           <CheckCircle2 className="w-4 h-4 mr-3 text-purple-500 flex-shrink-0" />
                           Custom model training on your historical data.
                        </li>
                      </ul>
                  </div>

                  {/* Right Side: Form */}
                  <div className="flex-1 p-8 lg:p-12 overflow-y-auto">
                    <div className="max-w-md mx-auto">
                        <h3 className="text-2xl font-black mb-2">Let's talk scale</h3>
                        <p className="text-slate-500 text-sm mb-10">We'll reach out within 24 hours to schedule a deep-dive call.</p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Full Name</label>
                                <Input 
                                  required 
                                  value={formData.name}
                                  onChange={e => setFormData({...formData, name: e.target.value})}
                                  placeholder="John Doe" 
                                  className="bg-white/5 border-white/10 h-12 rounded-xl" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Work Email</label>
                                <Input 
                                  required 
                                  type="email"
                                  value={formData.email}
                                  onChange={e => setFormData({...formData, email: e.target.value})}
                                  placeholder="john@company.com" 
                                  className="bg-white/5 border-white/10 h-12 rounded-xl" 
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Company</label>
                                    <Input 
                                      required 
                                      value={formData.company}
                                      onChange={e => setFormData({...formData, company: e.target.value})}
                                      placeholder="Fintech Inc" 
                                      className="bg-white/5 border-white/10 h-12 rounded-xl" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Monthly Volume</label>
                                    <select 
                                      value={formData.monthly_volume}
                                      onChange={e => setFormData({...formData, monthly_volume: e.target.value})}
                                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-purple-500"
                                    >
                                        <option className="bg-[#0A0E1A]">Under 10,000</option>
                                        <option className="bg-[#0A0E1A]">10,000 - 1,00,000</option>
                                        <option className="bg-[#0A0E1A]">1,00,000 - 10,00,000</option>
                                        <option className="bg-[#0A0E1A]">Above 10,00,000</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">How can we help?</label>
                                <textarea 
                                  rows={3}
                                  value={formData.message}
                                  onChange={e => setFormData({...formData, message: e.target.value})}
                                  placeholder="Tell us about your fraud challenges..."
                                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <Button 
                              type="submit" 
                              disabled={loading}
                              className="w-full py-7 bg-purple-600 hover:bg-purple-500 font-bold text-base rounded-2xl shadow-lg shadow-purple-600/20"
                            >
                                {loading ? "Sending..." : "Request Access"}
                            </Button>
                        </form>
                    </div>
                  </div>
               </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-20 text-center">
                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-emerald-500/20">
                        <CheckCircle2 className="text-white w-10 h-10" />
                    </div>
                    <h2 className="text-4xl font-black mb-4">Request Received</h2>
                    <p className="text-slate-400 max-w-sm mx-auto mb-10 leading-relaxed font-medium">
                        Vishwanath or a senior engineer will reach out to you within 24 hours to schedule your onboarding.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button className="bg-emerald-600 hover:bg-emerald-500 font-bold px-8 h-12 rounded-xl" onClick={() => window.open('https://wa.me/+91XXXXXXXXXX', '_blank')}>
                            Message on WhatsApp
                        </Button>
                        <Button variant="outline" className="border-white/10 h-12 rounded-xl px-8" onClick={onClose}>
                            Close
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
