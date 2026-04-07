import { Card, CardContent } from '@/components/ui/card';
import { Hammer } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function ComingSoon() {
  const location = useLocation();
  const pageName = location.pathname.split('/').pop()?.replace('-', ' ') || 'Page';

  return (
    <div className="flex h-full items-center justify-center">
      <Card className="w-full max-w-md bg-[#111827]/60 border-[#1F2937]/80 backdrop-blur-xl">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center text-gray-400">
          <div className="w-16 h-16 rounded-full bg-[#1F2937] flex items-center justify-center mb-6">
            <Hammer className="h-8 w-8 text-blue-500" />
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2 capitalize">{pageName}</h2>
          <p className="text-sm">
            This module is currently in active development. We're building out the infrastructure to handle your data at scale.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
