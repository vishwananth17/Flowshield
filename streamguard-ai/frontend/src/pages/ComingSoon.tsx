import { Card } from '@/components/ui/Card';
import { Hammer } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Heading2, Caption } from '@/components/ui/Typography';

export default function ComingSoon() {
  const location = useLocation();
  const pageName = location.pathname.split('/').pop()?.replace('-', ' ') || 'Page';

  return (
    <div className="flex h-full items-center justify-center font-body text-left">
      <Card variant="glass" className="w-full max-w-md p-12 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--bg-inset)] border border-[var(--border-default)] flex items-center justify-center mb-6 text-[var(--text-gold)]">
          <Hammer className="h-8 w-8" />
        </div>
        <Heading2 className="capitalize mb-2">{pageName}</Heading2>
        <Caption className="block leading-relaxed">
          This module is currently in active development. We're building out the infrastructure to handle your data at scale.
        </Caption>
      </Card>
    </div>
  );
}
