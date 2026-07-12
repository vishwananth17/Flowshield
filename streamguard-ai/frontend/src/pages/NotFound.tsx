import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0A0E1A] p-4 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-950/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />

      <Card className="w-full max-w-md bg-[#111827]/60 border-[#1F2937]/80 backdrop-blur-xl z-10 shadow-2xl relative">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />
        <CardContent className="flex flex-col items-center justify-center p-12 text-center text-gray-400">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 text-red-500 animate-pulse">
            <AlertTriangle className="h-10 w-10" />
          </div>
          <h1 className="text-5xl font-extrabold text-white tracking-tight">404</h1>
          <h2 className="text-xl font-bold text-white mt-2 mb-3">Page Not Found</h2>
          <p className="text-sm text-gray-400 mb-8 leading-relaxed">
            The page you are looking for does not exist, has been decommissioned, or has moved to another secure URI.
          </p>
          <Button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl transition-all font-bold"
          >
            <Home className="h-4 w-4 mr-2" />
            <span>Go to Dashboard</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
