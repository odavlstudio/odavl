'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex items-center justify-center min-h-screen p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-6 w-6 text-red-500" />
                                <CardTitle>Something went wrong</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-gray-600">
                                We encountered an unexpected error. Please try refreshing the page.
                            </p>
                            {this.state.error && (
                                <details className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                                    <summary className="cursor-pointer font-medium mb-2">
                                        Error Details
                                    </summary>
                                    <pre className="whitespace-pre-wrap break-words">
                                        {this.state.error.message}
                                    </pre>
                                </details>
                            )}
                            <Button onClick={this.handleReset} className="w-full">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Refresh Page
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
