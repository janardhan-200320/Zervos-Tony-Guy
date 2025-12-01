import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; message?: string };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: (error as any)?.message || 'Unexpected error' };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Log for diagnostics without crashing dev overlay
    // eslint-disable-next-line no-console
    console.error('App ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Something went wrong</h1>
          <p className="text-gray-600 mt-2 max-w-lg">
            {this.state.message || 'A runtime error occurred. Please try reloading the page.'}
          </p>
          <button
            className="mt-4 px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={() => this.setState({ hasError: false })}
          >
            Dismiss
          </button>
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}
