import { Card } from '@/components/ui/Card';
import { Mail, Globe, MessageCircle, Users } from 'lucide-react';
import { Heading1, Heading2, Heading3, Label, Caption } from '@/components/ui/Typography';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function Team() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto text-left font-body">
      <div className="border-b border-[var(--border-subtle)] pb-4">
        <Heading1>Team & Founder</Heading1>
        <Caption className="mt-1 block">The engineers defending your transaction pipelines.</Caption>
      </div>

      <div className="mt-6">
        <Card variant="default" padding="none" className="overflow-hidden">
          <div className="h-24 bg-[var(--bg-inset)] w-full relative border-b border-[var(--border-default)]">
            <div className="absolute inset-0 bg-black/40" />
          </div>
          <div className="pt-0 relative p-6">
            <div className="absolute -top-10 left-6">
              <div className="h-20 w-20 rounded bg-gradient-gold text-[var(--text-inverse)] font-extrabold flex items-center justify-center text-3xl shadow-[var(--shadow-gold)] border border-[var(--border-gold)]">
                V
              </div>
            </div>
            
            <div className="pt-12 pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <Heading2 className="text-white">Vishwananth B</Heading2>
                  <p className="text-[var(--text-gold)] font-mono text-xs mt-0.5 font-bold">Founder & Lead Engineer, Flowshield AI</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" className="p-2"><Mail className="h-4 w-4 text-[var(--text-gold)]" /></Button>
                  <Button variant="ghost" size="sm" className="p-2"><Globe className="h-4 w-4 text-[var(--text-gold)]" /></Button>
                  <Button variant="ghost" size="sm" className="p-2"><MessageCircle className="h-4 w-4 text-[var(--text-gold)]" /></Button>
                </div>
              </div>
              
              <div className="mt-4 text-[var(--text-secondary)] text-xs max-w-3xl leading-relaxed space-y-3 font-normal">
                <p>
                  Vishwananth is the founder and chief architect behind Flowshield AI. Focused on solving high-volume payment fraud challenges using advanced machine learning, he engineered Flowshield to replace legacy rule-based dispute tools.
                </p>
                <p>
                  With a background in real-time stream processing, Vishwananth designed the 3-layer Ensemble Model (MVIForest + XGBoost + Hard Rules) that achieves 100% target recall across 6 fraud types with a 0.030% false block rate in under 100 milliseconds.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-8 space-y-3">
        <Heading3 className="flex items-center text-zinc-300">
          <Users className="mr-2 h-4 w-4 text-[var(--text-gold)]" /> Organization Roster
        </Heading3>
        <Card variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded bg-gradient-gold text-[var(--text-inverse)] font-extrabold flex items-center justify-center text-sm shadow-[var(--shadow-gold)] border border-[var(--border-gold)]">V</div>
              <div>
                <p className="font-bold text-xs text-white">Vishwananth B</p>
                <p className="text-[10px] text-[var(--text-muted)] font-mono">bsvishwananth@gmail.com</p>
              </div>
            </div>
            <Badge variant="gold">Owner</Badge>
          </div>
        </Card>
      </div>
    </div>
  );
}
