import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  SlidersHorizontal,
  Shield,
  HelpCircle,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

export default function RadarRiskControls() {
  const [elevatedThreshold, setElevatedThreshold] = useState(65);
  const [highestThreshold, setHighestThreshold] = useState(85);

  const [elevatedAction, setElevatedAction] = useState<'review' | '3ds'>('review');
  const [highestAction, setHighestAction] = useState<'block' | '3ds'>('block');

  const handleSave = () => {
    toast.success('Machine learning risk thresholds saved to production');
  };

  const handleReset = () => {
    setElevatedThreshold(65);
    setHighestThreshold(85);
    setElevatedAction('review');
    setHighestAction('block');
    toast.info('Thresholds reset to Stripe recommended defaults');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E3E8EE] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#1A1F36]">Risk Controls</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#CBF4C9] text-[#0E6245] border border-[#A3E7A0]">
              OPTIMIZED
            </span>
          </div>
          <p className="text-sm text-[#4F566B] mt-1">
            Tune Radar's machine learning thresholds to balance fraud defense against checkout friction.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" onClick={handleReset} className="text-xs">
            <RotateCcw className="w-3.5 h-3.5 text-[#697386]" />
            <span>Reset to Defaults</span>
          </Button>

          <Button size="sm" onClick={handleSave} className="bg-[#635BFF] hover:bg-[#4F46E5] text-white text-xs gap-1.5">
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </Button>
        </div>
      </div>

      {/* Interactive Risk Tolerance Spectrum Card */}
      <Card variant="data" padding="lg" className="space-y-8">
        
        <div>
          <h3 className="text-base font-bold text-[#1A1F36]">Machine Learning Risk Thresholds</h3>
          <p className="text-xs text-[#697386] mt-0.5">
            Radar assigns every transaction a numerical risk score from 0 (safest) to 99 (highest risk) using hundreds of signals.
          </p>
        </div>

        {/* Visual 0-99 Meter */}
        <div className="space-y-3">
          <div className="flex justify-between text-xs font-semibold text-[#4F566B]">
            <span>Score 0 (Safe)</span>
            <span className="text-[#8A6100]">Elevated Threshold ({elevatedThreshold})</span>
            <span className="text-[#A8071A]">Highest Threshold ({highestThreshold})</span>
            <span>Score 99 (Fraud)</span>
          </div>

          <div className="h-4 rounded-full overflow-hidden flex bg-[#F1F5F9] border border-[#E3E8EE] shadow-inner">
            <div
              className="bg-[#0E6245] transition-all flex items-center justify-center text-[10px] text-white font-bold"
              style={{ width: `${elevatedThreshold}%` }}
            >
              Normal (Allow)
            </div>
            <div
              className="bg-[#D97706] transition-all flex items-center justify-center text-[10px] text-white font-bold"
              style={{ width: `${highestThreshold - elevatedThreshold}%` }}
            >
              Elevated
            </div>
            <div
              className="bg-[#A8071A] transition-all flex items-center justify-center text-[10px] text-white font-bold"
              style={{ width: `${100 - highestThreshold}%` }}
            >
              Highest
            </div>
          </div>
        </div>

        {/* 2 Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-[#E3E8EE]">
          
          {/* Elevated Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-bold text-[#1A1F36] block">Elevated Risk Tier</label>
                <span className="text-xs text-[#697386]">Payments scored between {elevatedThreshold} and {highestThreshold - 1}</span>
              </div>
              <span className="font-mono text-sm font-bold text-[#8A6100] px-2 py-0.5 bg-[#FFECD1] rounded">
                Score &ge; {elevatedThreshold}
              </span>
            </div>

            <input
              type="range"
              min={40}
              max={80}
              value={elevatedThreshold}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val < highestThreshold) setElevatedThreshold(val);
              }}
              className="w-full accent-[#635BFF] cursor-pointer"
            />

            <div className="space-y-1.5 pt-2">
              <span className="text-xs font-semibold text-[#4F566B]">Action when threshold reached:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setElevatedAction('review')}
                  className={`flex-1 py-1.5 px-3 rounded text-xs font-semibold border transition-all ${
                    elevatedAction === 'review'
                      ? 'border-[#635BFF] bg-[#EEF2FF] text-[#635BFF]'
                      : 'border-[#E3E8EE] bg-white text-[#4F566B]'
                  }`}
                >
                  Send to Manual Review Queue
                </button>
                <button
                  type="button"
                  onClick={() => setElevatedAction('3ds')}
                  className={`flex-1 py-1.5 px-3 rounded text-xs font-semibold border transition-all ${
                    elevatedAction === '3ds'
                      ? 'border-[#635BFF] bg-[#EEF2FF] text-[#635BFF]'
                      : 'border-[#E3E8EE] bg-white text-[#4F566B]'
                  }`}
                >
                  Request 3D Secure
                </button>
              </div>
            </div>
          </div>

          {/* Highest Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-bold text-[#1A1F36] block">Highest Risk Tier</label>
                <span className="text-xs text-[#697386]">Payments scored &ge; {highestThreshold}</span>
              </div>
              <span className="font-mono text-sm font-bold text-[#A8071A] px-2 py-0.5 bg-[#FFD8D8] rounded">
                Score &ge; {highestThreshold}
              </span>
            </div>

            <input
              type="range"
              min={70}
              max={95}
              value={highestThreshold}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val > elevatedThreshold) setHighestThreshold(val);
              }}
              className="w-full accent-[#635BFF] cursor-pointer"
            />

            <div className="space-y-1.5 pt-2">
              <span className="text-xs font-semibold text-[#4F566B]">Action when threshold reached:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setHighestAction('block')}
                  className={`flex-1 py-1.5 px-3 rounded text-xs font-semibold border transition-all ${
                    highestAction === 'block'
                      ? 'border-[#A8071A] bg-[#FFD8D8]/50 text-[#A8071A]'
                      : 'border-[#E3E8EE] bg-white text-[#4F566B]'
                  }`}
                >
                  Block Payment Immediately
                </button>
                <button
                  type="button"
                  onClick={() => setHighestAction('3ds')}
                  className={`flex-1 py-1.5 px-3 rounded text-xs font-semibold border transition-all ${
                    highestAction === '3ds'
                      ? 'border-[#635BFF] bg-[#EEF2FF] text-[#635BFF]'
                      : 'border-[#E3E8EE] bg-white text-[#4F566B]'
                  }`}
                >
                  Request 3DS Challenge
                </button>
              </div>
            </div>
          </div>

        </div>

      </Card>

      {/* Stripe Radar Machine Learning Architecture Info Card */}
      <div className="rounded-lg bg-white border border-[#E3E8EE] p-5 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded bg-[#EEF2FF] flex items-center justify-center text-[#635BFF] flex-shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#1A1F36]">Adaptive Machine Learning Network</h4>
            <p className="text-xs text-[#4F566B] leading-relaxed">
              Radar trains continuously on millions of global transactions across the payment network. When an attacker is blocked on one merchant, Radar immediately updates risk weights across all Flowshield connected businesses in real time.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-[#E3E8EE] text-xs">
          <div>
            <span className="font-semibold text-[#1A1F36]">Device Fingerprinting</span>
            <p className="text-[#697386] mt-0.5">Detects browser emulation, spoofed user-agents, and automated bots.</p>
          </div>
          <div>
            <span className="font-semibold text-[#1A1F36]">Network Intelligence</span>
            <p className="text-[#697386] mt-0.5">Flags Tor nodes, commercial VPN proxies, and datacenter IP clusters.</p>
          </div>
          <div>
            <span className="font-semibold text-[#1A1F36]">Velocity Tracking</span>
            <p className="text-[#697386] mt-0.5">Monitors card testing bursts across multiple cards and subnets.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
