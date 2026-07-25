import { Card } from '@/components/ui/Card';
import { AlertTriangle, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Heading1, Heading2, Caption } from '@/components/ui/Typography';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[var(--bg-base)] p-4 overflow-hidden text-left font-body">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-950/20 rounded-full blur-[120px] pointer-events-none" />

      <Card variant="glass" className="w-full max-w-md p-12 text-center flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-[var(--color-danger-muted)] border border-[var(--color-danger-border)] flex items-center justify-center mb-6 text-[var(--color-danger)] animate-pulse">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <Heading1>404</Heading1>
        <Heading2 className="mt-2 mb-3">Page Not Found</Heading2>
        <Caption className="mb-8 block max-w-xs mx-auto leading-relaxed">
          The page you are looking for does not exist, has been decommissioned, or has moved to another secure URI.
        </Caption>
        <Button
          onClick={() => navigate('/dashboard')}
          variant="gold"
          size="lg"
        >
          <Home className="h-4 w-4 mr-2" />
          <span>Go to Dashboard</span>
        </Button>
      </Card>
    </div>
  );
}
