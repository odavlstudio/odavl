'use client';

import { useState } from 'react';
import { Users, Award, TrendingUp } from 'lucide-react';

export function ViralLoop() {
  const [invitesSent, setInvitesSent] = useState(0);
  const [tier, setTier] = useState('Bronze');

  const tiers = [
    { name: 'Bronze', invites: 0, reward: 'Access to beta' },
    { name: 'Silver', invites: 3, reward: '1 month free Pro' },
    { name: 'Gold', invites: 10, reward: '3 months free Pro' },
    { name: 'Platinum', invites: 25, reward: '1 year free Pro' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <Award className="mx-auto mb-4 text-brand-blue" size={48} />
        <h2 className="text-2xl font-bold mb-2">Your Referral Status</h2>
        <div className="text-4xl font-bold text-brand-purple">{tier}</div>
      </div>

      <div className="space-y-4 mb-8">
        {tiers.map((t) => (
          <div key={t.name} className={`p-4 rounded-lg ${invitesSent >= t.invites ? 'bg-brand-green/10' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{t.name}</div>
                <div className="text-sm text-gray-600">{t.reward}</div>
              </div>
              <div className="text-sm text-gray-500">{t.invites} invites</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-gray-600">
        <Users size={20} />
        <span>{invitesSent} invites sent</span>
      </div>
    </div>
  );
}
