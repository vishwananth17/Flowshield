import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Mail, Globe, MessageCircle, Users } from 'lucide-react';

export default function Team() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto p-6 md:p-12 text-white">
      <div>
        <h1 className="text-3xl font-display font-bold">Team & Founders</h1>
        <p className="text-gray-400 mt-1">The engineers defending your transaction pipelines.</p>
      </div>

      <div className="mt-8">
        <Card className="bg-[#111827] border-[#1F2937] overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-blue-600/40 to-purple-600/40 w-full relative">
             <div className="absolute inset-0 bg-[#0A0E1A]/20" />
          </div>
          <CardContent className="pt-0 relative">
             <div className="absolute -top-12 left-6">
                <div className="h-24 w-24 rounded-full border-4 border-[#111827] bg-[#1F2937] flex items-center justify-center overflow-hidden">
                    <span className="text-4xl font-bold text-white">V</span>
                </div>
             </div>
             <div className="pt-16 pb-2">
                <div className="flex justify-between items-start">
                   <div>
                       <h2 className="text-2xl font-bold text-white tracking-tight">Vishwananth B</h2>
                       <p className="text-blue-400 font-medium">Founder & CEO, Flowshield AI</p>
                   </div>
                   <div className="flex space-x-3">
                       <button className="h-8 w-8 rounded-full bg-[#1F2937] flex items-center justify-center hover:bg-[#374151] transition-colors"><Mail className="h-4 w-4 text-gray-300" /></button>
                       <button className="h-8 w-8 rounded-full bg-[#1F2937] flex items-center justify-center hover:bg-[#374151] transition-colors"><Globe className="h-4 w-4 text-gray-300" /></button>
                       <button className="h-8 w-8 rounded-full bg-[#1F2937] flex items-center justify-center hover:bg-[#374151] transition-colors"><MessageCircle className="h-4 w-4 text-gray-300" /></button>
                   </div>
                </div>
                <div className="mt-6 text-gray-300 max-w-3xl leading-relaxed space-y-4">
                    <p>
                        Vishwananth is the visionary architect behind Flowshield AI. Focused on solving enterprise-grade fraud challenges using advanced machine learning, he built Flowshield to replace legacy, rule-based processors. 
                    </p>
                    <p>
                        With a deep background in distributed systems and real-time Kafka streaming, Vishwananth engineered the core Ensemble Model that blocks millions of dollars in stolen chargebacks across global e-commerce pipelines in under 42 milliseconds.
                    </p>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
         <h3 className="text-xl font-bold mb-4 flex items-center"><Users className="mr-2 h-5 w-5 text-gray-400" /> Organization Members</h3>
         <Card className="bg-[#111827] border-[#1F2937]">
            <CardContent className="p-0">
               <div className="flex items-center justify-between p-4 border-b border-[#1F2937]/50">
                  <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center font-bold">V</div>
                      <div>
                          <p className="font-medium text-white">Vishwananth B</p>
                          <p className="text-xs text-gray-500">bsvishwananth@gmail.com</p>
                      </div>
                  </div>
                  <span className="bg-[#1F2937] text-gray-300 text-xs px-3 py-1 rounded-full uppercase tracking-wider font-semibold">Owner</span>
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
