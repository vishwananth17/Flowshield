import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Heading2, Heading3, Label, Caption } from '@/components/ui/Typography';
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12 font-body text-left">
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
            className="relative bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-xl)] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-[var(--shadow-xl)]"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-[var(--text-muted)] hover:text-white transition-colors z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {!isSubmitted ? (
               <div className="flex flex-col lg:flex-row h-full">
                  {/* Left Side */}
                  <div className="lg:w-1/3 bg-[var(--bg-inset)] p-10 lg:border-r border-[var(--border-default)] hidden lg:block">
                      <div className="w-10 h-10 bg-gradient-gold text-[var(--text-inverse)] rounded flex items-center justify-center mb-6 font-bold shadow-[var(--shadow-gold)] border border-[var(--border-gold)]">
                          <Building2 className="w-5 h-5" />
                      </div>
                      <Heading2 className="text-white mb-6 leading-tight">Enterprise <br />Intelligence</Heading2>
                      <ul className="space-y-4">
                        <li className="flex items-start text-xs text-[var(--text-secondary)] font-medium">
                           <CheckCircle2 className="w-4 h-4 mr-2.5 text-[var(--text-gold)] flex-shrink-0" />
                           Direct channel with our founder Vishwanath B.
                        </li>
                        <li className="flex items-start text-xs text-[var(--text-secondary)] font-medium">
                           <CheckCircle2 className="w-4 h-4 mr-2.5 text-[var(--text-gold)] flex-shrink-0" />
                           SLA-backed 99.9% uptime guarantees.
                        </li>
                        <li className="flex items-start text-xs text-[var(--text-secondary)] font-medium">
                           <CheckCircle2 className="w-4 h-4 mr-2.5 text-[var(--text-gold)] flex-shrink-0" />
                           Custom model training on historical telemetry.
                        </li>
                      </ul>
                  </div>

                  {/* Right Side: Form */}
                  <div className="flex-1 p-8 lg:p-10 overflow-y-auto">
                    <div className="max-w-md mx-auto">
                        <Heading3 className="text-white mb-1">Let's talk scale</Heading3>
                        <Caption className="mb-8 block">We'll reach out within 24 hours to schedule a deep-dive call.</Caption>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input 
                              required 
                              label="Full Name"
                              value={formData.name}
                              onChange={e => setFormData({...formData, name: e.target.value})}
                              placeholder="John Doe" 
                            />
                            
                            <Input 
                              required 
                              type="email"
                              label="Work Email"
                              value={formData.email}
                              onChange={e => setFormData({...formData, email: e.target.value})}
                              placeholder="john@company.com" 
                            />
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input 
                                  required 
                                  label="Company"
                                  value={formData.company}
                                  onChange={e => setFormData({...formData, company: e.target.value})}
                                  placeholder="Fintech Inc" 
                                />
                                
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-sm font-medium text-[var(--text-secondary)]">Monthly Volume</label>
                                    <select 
                                      value={formData.monthly_volume}
                                      onChange={e => setFormData({...formData, monthly_volume: e.target.value})}
                                      className="w-full h-11 bg-[var(--bg-inset)] border border-[var(--border-default)] text-white rounded-[var(--radius-md)] px-3 text-xs focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                                    >
                                        <option className="bg-black text-white">Under 10,000</option>
                                        <option className="bg-black text-white">10,000 - 1,00,000</option>
                                        <option className="bg-black text-white">1,00,000 - 10,00,000</option>
                                        <option className="bg-black text-white">Above 10,00,000</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-[var(--text-secondary)]">How can we help?</label>
                                <textarea 
                                  rows={3}
                                  value={formData.message}
                                  onChange={e => setFormData({...formData, message: e.target.value})}
                                  placeholder="Tell us about your fraud challenges..."
                                  className="w-full bg-[var(--bg-inset)] border border-[var(--border-default)] text-white placeholder:text-zinc-600 rounded-[var(--radius-md)] px-3 py-2 text-xs focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                                />
                            </div>

                            <Button 
                              type="submit" 
                              disabled={loading}
                              variant="gold"
                              fullWidth
                              size="lg"
                            >
                                {loading ? "Sending..." : "Request Access"}
                            </Button>
                        </form>
                    </div>
                  </div>
               </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-16 text-center">
                    <div className="w-16 h-16 bg-gradient-gold text-[var(--text-inverse)] border border-[var(--border-gold)] shadow-[var(--shadow-gold)] rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <Heading2 className="text-white mb-3">Request Received</Heading2>
                    <Caption className="max-w-sm mx-auto mb-8 block leading-relaxed">
                        Vishwanath or a senior engineer will reach out to you within 24 hours to schedule your onboarding.
                    </Caption>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button variant="gold" onClick={onClose}>
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
