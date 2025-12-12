'use client';

import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { ShareButtons } from './share-buttons';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralCode?: string;
}

export function ShareModal({ isOpen, onClose, referralCode = 'USER123' }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const referralUrl = `https://odavl.com?ref=${referralCode}`;

  const copyReferralLink = async () => {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Share ODAVL</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">Your Referral Link</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralUrl}
              readOnly
              className="flex-1 px-4 py-2 border rounded-lg bg-gray-50"
            />
            <button onClick={copyReferralLink} className="px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90">
              {copied ? <Check size={20} /> : <Copy size={20} />}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">Share on Social Media</label>
          <ShareButtons url={referralUrl} />
        </div>

        <div className="text-sm text-gray-600">
          Get 1 month free for every 3 successful referrals!
        </div>
      </div>
    </div>
  );
}
