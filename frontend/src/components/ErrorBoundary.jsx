import { Component } from "react";
import { Link } from "react-router-dom";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
          <div className="max-w-md w-full bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl text-center space-y-8">
            <div className="w-20 h-20 mx-auto bg-red-50 text-red-500 rounded-3xl flex items-center justify-center text-3xl">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-slate-900 mb-3">Something went wrong</h1>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                An unexpected error occurred. Please try refreshing the page.
              </p>
            </div>
            {this.state.error && (
              <details className="text-left bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <summary className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                  Error Details
                </summary>
                <pre className="mt-3 text-xs text-red-600 whitespace-pre-wrap break-words font-mono">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors"
              >
                Refresh Page
              </button>
              <Link
                to="/"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="w-full py-4 bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
