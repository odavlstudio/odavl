'use client';

import { useEffect } from 'react';

export const dynamic = 'force-dynamic';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong!</h2>
                <p className="text-gray-600 mb-4">{error.message}</p>
                <button
                    onClick={reset}
                    className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
