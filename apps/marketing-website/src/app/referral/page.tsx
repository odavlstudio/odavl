'use client';

import { ViralLoop } from '@/components/growth/viral-loop';
import { ShareButtons } from '@/components/growth/share-buttons';

export default function ReferralPage() {
  const referralCode = 'USER123'; // This would come from user session
  const referralUrl = `https://odavl.com?ref=${referralCode}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Referral Dashboard</h1>
          <p className="text-xl text-gray-600">Invite friends and earn rewards</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <ViralLoop />
          
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Share Your Link</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">Your Referral Link</label>
              <input
                type="text"
                value={referralUrl}
                readOnly
                className="w-full px-4 py-2 border rounded-lg bg-gray-50"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">Share on Social</label>
              <ShareButtons url={referralUrl} text="Check out ODAVL Studio! Use my referral link:" />
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-3">How it works</h3>
              <ol className="space-y-2 text-sm text-gray-600">
                <li>1. Share your referral link</li>
                <li>2. Friends sign up and activate</li>
                <li>3. You both get rewards!</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
