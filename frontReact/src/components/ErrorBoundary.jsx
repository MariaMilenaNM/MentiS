import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // Log do erro para monitoramento (em produção enviaria para serviço como Sentry)
        console.error('ErrorBoundary capturou erro:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            // Se houver um fallback customizado, usa ele
            if (this.props.fallback) {
                return this.props.fallback(this.state.error, this.handleRetry);
            }

            // Fallback padrão
            return (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '60vh',
                        padding: '20px',
                        textAlign: 'center',
                        backgroundColor: '#f8f9fa',
                        color: '#1a1a3e'
                    }}
                    role="alert"
                    aria-live="assertive"
                >
                    <h2 style={{ color: '#c6322d', marginBottom: '16px' }}>
                        Oops! Algo deu errado
                    </h2>
                    <p style={{ marginBottom: '24px', maxWidth: '500px' }}>
                        Encontramos um problema inesperado. Nossa equipe foi notificada.
                    </p>
                    <details style={{
                        textAlign: 'left',
                        maxWidth: '600px',
                        marginBottom: '24px',
                        background: '#fff',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        padding: '16px'
                    }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#6c757d' }}>
                            Detalhes técnicos (para suporte)
                        </summary>
                        <pre style={{
                            marginTop: '12px',
                            fontSize: '12px',
                            overflow: 'auto',
                            color: '#495057'
                        }}>
                            {this.state.error && this.state.error.toString()}
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </details>
                    <button
                        onClick={this.handleRetry}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#0A0B26',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#1a1c4d'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#0A0B26'}
                    >
                        Tentar Novamente
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;