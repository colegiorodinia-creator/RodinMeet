import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#222', color: 'white', height: '100dvh', overflow: 'auto', fontFamily: 'monospace', zIndex: 999999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <h1 style={{ color: '#ff453a' }}>Opa! O aplicativo travou (Crash).</h1>
          <p>Tire um print desta tela e envie para o desenvolvedor:</p>
          <div style={{ background: 'black', padding: '15px', borderRadius: '8px', border: '1px solid #ff453a', marginTop: '10px' }}>
            <h3 style={{ color: '#f97316' }}>{this.state.error?.toString()}</h3>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', color: '#ebebf5', marginTop: '10px' }}>
              {this.state.errorInfo?.componentStack}
            </pre>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '20px', padding: '10px 20px', background: '#f97316', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Recarregar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
