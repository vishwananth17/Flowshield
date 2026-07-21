import { Card, CardContent } from '@/components/ui/card';
import { Mail, Globe, MessageCircle, Users } from 'lucide-react';

export default function Team() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto p-6 text-white text-left font-body">
      <div className="border-b border-zinc-800 pb-4">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Team & Founder</h1>
        <p className="text-zinc-400 text-xs mt-1">The engineers defending your transaction pipelines.</p>
      </div>

      <div className="mt-6">
        <Card className="bg-zinc-950 border-zinc-800 overflow-hidden rounded-lg">
          <div className="h-24 bg-zinc-900 w-full relative border-b border-zinc-800">
             <div className="absolute inset-0 bg-black/40" />
          </div>
          <CardContent className="pt-0 relative p-6">
             <div className="absolute -top-10 left-6">
                <div className="h-20 w-20 rounded bg-white text-black font-extrabold flex items-center justify-center text-3xl shadow-sm border border-zinc-300">
                    V
                </div>
             </div>
             <div className="pt-12 pb-2">
                <div className="flex justify-between items-start">
                   <div>
                       <h2 className="text-xl font-extrabold text-white tracking-tight">Vishwananth B</h2>
                       <p className="text-zinc-400 font-mono text-xs mt-0.5">Founder & Lead Engineer, Flowshield AI</p>
                   </div>
                   <div className="flex space-x-2">
                       <button className="h-8 w-8 rounded bg-black border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-colors text-white"><Mail className="h-4 w-4" /></button>
                       <button className="h-8 w-8 rounded bg-black border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-colors text-white"><Globe className="h-4 w-4" /></button>
                       <button className="h-8 w-8 rounded bg-black border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-colors text-white"><MessageCircle className="h-4 w-4" /></button>
                   </div>
                </div>
                <div className="mt-4 text-zinc-400 text-xs max-w-3xl leading-relaxed space-y-3 font-normal">
                    <p>
                        Vishwananth is the founder and chief architect behind Flowshield AI. Focused on solving high-volume payment fraud challenges using advanced machine learning, he engineered Flowshield to replace legacy rule-based dispute tools.
                    </p>
                    <p>
                        With a background in real-time stream processing, Vishwananth designed the 3-layer Ensemble Model (MVIForest + XGBoost + Hard Rules) that achieves 100% target recall across 6 fraud types with a 0.030% false block rate in under 100 milliseconds.
                    </p>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
         <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center text-zinc-300">
           <Users className="mr-2 h-4 w-4 text-zinc-400" /> Organization Roster
         </h3>
         <Card className="bg-zinc-950 border-zinc-800 rounded-lg">
            <CardContent className="p-0">
               <div className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 rounded bg-white text-black font-extrabold flex items-center justify-center text-sm">V</div>
                      <div>
                          <p className="font-bold text-xs text-white">Vishwananth B</p>
                          <p className="text-[10px] text-zinc-500 font-mono">bsvishwananth@gmail.com</p>
                      </div>
                  </div>
                  <span className="bg-black border border-zinc-800 text-white text-[10px] px-2.5 py-0.5 rounded font-mono uppercase font-bold">Owner</span>
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
