import { Inbox, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface EmptyStateProps {
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    icon?: React.ReactNode;
}

export function EmptyState({
    title,
    description,
    actionLabel,
    onAction,
    icon
}: EmptyStateProps) {
    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-gray-100 p-6 mb-4">
                    {icon || <Inbox className="h-12 w-12 text-gray-400" />}
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-sm text-gray-500 text-center max-w-sm mb-6">
                    {description}
                </p>
                {actionLabel && onAction && (
                    <Button onClick={onAction}>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        {actionLabel}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
