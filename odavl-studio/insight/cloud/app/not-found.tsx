import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-4xl font-bold text-gray-800 mb-4">404</h2>
                <p className="text-gray-600 mb-4">Page not found</p>
                <Link
                    href="/"
                    className="text-primary-600 hover:text-primary-800 underline"
                >
                    Return Home
                </Link>
            </div>
        </div>
    );
}
