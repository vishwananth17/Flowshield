import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

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
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0E1A] p-4 text-white">
          <div className="flex max-w-md flex-col items-center text-center space-y-6">
            <div className="rounded-full bg-red-500/10 p-6 flex items-center justify-center">
              <AlertTriangle className="h-16 w-16 text-red-500 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
              <p className="text-gray-400 text-sm leading-relaxed">
                A critical rendering error occurred in the StreamGuard interface. If this persists, please contact support.
              </p>
            </div>
            
            <div className="bg-[#111827] border border-[#1F2937] text-left p-4 rounded-lg w-full overflow-hidden">
              <p className="font-mono text-xs text-red-400 break-words opacity-80">
                {this.state.error?.toString()}
              </p>
            </div>

            <div className="flex gap-4 w-full pt-4">
              <Button 
                onClick={this.handleReload} 
                className="flex-1 bg-blue-600 hover:bg-blue-500"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Application
              </Button>
              <Link to="/dashboard" className="flex-1">
                <Button variant="outline" className="w-full border-[#1F2937] text-gray-300 hover:text-white">
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
