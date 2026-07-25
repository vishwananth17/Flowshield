import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { Heading1, Caption } from '@/components/ui/Typography';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-base)] p-4 text-white font-body">
          <div className="flex max-w-md flex-col items-center text-center space-y-6">
            <div className="rounded-full bg-[var(--color-danger-muted)] border border-[var(--color-danger-border)] p-6 flex items-center justify-center">
              <AlertTriangle className="h-16 w-16 text-[var(--color-danger)] animate-pulse" />
            </div>
            <div>
              <Heading1 className="mb-2">Something went wrong</Heading1>
              <Caption className="block leading-relaxed">
                A critical rendering error occurred in the Flowshield interface. If this persists, please contact support.
              </Caption>
            </div>
            
            <div className="bg-[var(--bg-inset)] border border-[var(--border-default)] text-left p-4 rounded-[var(--radius-md)] w-full overflow-hidden">
              <p className="font-mono text-xs text-[var(--color-danger)] break-words opacity-80">
                {this.state.error?.toString()}
              </p>
            </div>

            <div className="flex gap-4 w-full pt-4">
              <Button 
                onClick={this.handleReload} 
                variant="gold"
                className="flex-grow"
              >
                <RefreshCw className="mr-2 h-4 w-4 animate-spin-slow" />
                Reload Application
              </Button>
              <Link to="/dashboard" className="flex-grow">
                <Button variant="ghost" className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
