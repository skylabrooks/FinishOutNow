import React, { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center p-8 bg-red-950/20 border border-red-900/50 rounded-xl">
            <div className="text-center">
              <AlertTriangle className="mx-auto mb-3 text-red-400" size={32} />
              <h3 className="text-lg font-semibold text-red-300 mb-1">Component Error</h3>
              <p className="text-red-200 text-sm">{this.state.error?.message || 'An error occurred'}</p>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
