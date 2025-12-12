'use client';

import { Gift } from 'lucide-react';
import Link from 'next/link';

export function ReferralBanner() {
  return (
    <div className="bg-gradient-to-r from-brand-blue to-brand-purple text-white py-4 px-6 rounded-lg flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Gift size={24} />
        <div>
          <div className="font-semibold">Invite friends, get rewards!</div>
          <div className="text-sm opacity-90">Get 1 month free for every 3 referrals</div>
        </div>
      </div>
      <Link href="/referral">
        <button className="px-4 py-2 bg-white text-brand-blue rounded-lg font-semibold hover:bg-gray-100">
          Start Referring
        </button>
      </Link>
    </div>
  );
}
