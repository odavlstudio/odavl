/**
 * Feedback Widget Component
 * 
 * Week 13: Beta Testing - Feedback Collection
 * 
 * In-app feedback widget for collecting user feedback, bug reports, and feature requests.
 */

'use client';

import { useState } from 'react';
import { MessageSquare, X, Send, Bug, Lightbulb, ThumbsUp, ThumbsDown } from 'lucide-react';

type FeedbackType = 'bug' | 'feature' | 'feedback' | 'praise';

interface FeedbackData {
    type: FeedbackType;
    message: string;
    rating?: number;
    screenshot?: string;
    url: string;
    userAgent: string;
}

export default function FeedbackWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [feedbackType, setFeedbackType] = useState<FeedbackType>('feedback');
    const [message, setMessage] = useState('');
    const [rating, setRating] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const feedbackData: FeedbackData = {
                type: feedbackType,
                message,
                rating: feedbackType === 'feedback' ? rating : undefined,
                url: window.location.href,
                userAgent: navigator.userAgent,
            };

            // Submit feedback (placeholder - replace with API call)
            await submitFeedback(feedbackData);

            setIsSubmitted(true);
            setTimeout(() => {
                setIsOpen(false);
                setIsSubmitted(false);
                setMessage('');
                setRating(0);
            }, 2000);
        } catch (error) {
            console.error('Failed to submit feedback:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50"
                aria-label="Open feedback widget"
            >
                <MessageSquare className="w-6 h-6" />
            </button>
        );
    }

    if (isSubmitted) {
        return (
            <div className="fixed bottom-6 right-6 w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 z-50 border border-gray-200 dark:border-gray-800">
                <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ThumbsUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Thank you!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        Your feedback helps us improve Guardian
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 border border-gray-200 dark:border-gray-800 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-white" />
                    <h3 className="text-lg font-semibold text-white">Send Feedback</h3>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-white/80 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Feedback Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        What would you like to share?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setFeedbackType('bug')}
                            className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${feedbackType === 'bug'
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <Bug className="w-5 h-5" />
                            <span className="text-xs font-medium">Bug Report</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setFeedbackType('feature')}
                            className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${feedbackType === 'feature'
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <Lightbulb className="w-5 h-5" />
                            <span className="text-xs font-medium">Feature Idea</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setFeedbackType('feedback')}
                            className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${feedbackType === 'feedback'
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <MessageSquare className="w-5 h-5" />
                            <span className="text-xs font-medium">Feedback</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setFeedbackType('praise')}
                            className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${feedbackType === 'praise'
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <ThumbsUp className="w-5 h-5" />
                            <span className="text-xs font-medium">Praise</span>
                        </button>
                    </div>
                </div>

                {/* Rating (only for feedback type) */}
                {feedbackType === 'feedback' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            How satisfied are you?
                        </label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`w-10 h-10 rounded-lg border-2 transition-all flex items-center justify-center ${rating >= star
                                            ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-500'
                                            : 'border-gray-200 dark:border-gray-700 text-gray-400'
                                        }`}
                                >
                                    <span className="text-lg">⭐</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Message */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tell us more
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={
                            feedbackType === 'bug'
                                ? 'Describe the bug and steps to reproduce...'
                                : feedbackType === 'feature'
                                    ? 'Describe the feature you would like...'
                                    : feedbackType === 'praise'
                                        ? 'What did you love?'
                                        : 'Share your thoughts...'
                        }
                        rows={4}
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {message.length}/500 characters
                    </p>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isSubmitting || !message.trim()}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending...
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            Send Feedback
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}

/**
 * Submit feedback to API
 */
async function submitFeedback(data: FeedbackData): Promise<void> {
    // Placeholder - replace with actual API call
    console.log('Feedback submitted:', data);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In production:
    // await fetch('/api/feedback', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data),
    // });
}
