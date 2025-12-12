'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LaunchPage() {
  const [email, setEmail] = useState('');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const launchDate = new Date('2025-03-15T09:00:00-07:00'); // March 15, 2025, 9am PT
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = launchDate.getTime() - now;
      
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Waitlist signup:', email);
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-brand-blue to-brand-purple bg-clip-text text-transparent">
            ODAVL Studio is Launching Soon
          </h1>
          <p className="text-xl text-gray-300">Autonomous code quality that fixes itself</p>
        </div>

        <div className="flex justify-center gap-8 mb-16">
          <div className="text-center">
            <div className="text-6xl font-bold text-brand-blue">{timeLeft.days}</div>
            <div className="text-sm text-gray-400">DAYS</div>
          </div>
          <div className="text-center">
            <div className="text-6xl font-bold text-brand-purple">{timeLeft.hours}</div>
            <div className="text-sm text-gray-400">HOURS</div>
          </div>
          <div className="text-center">
            <div className="text-6xl font-bold text-brand-green">{timeLeft.minutes}</div>
            <div className="text-sm text-gray-400">MINUTES</div>
          </div>
          <div className="text-center">
            <div className="text-6xl font-bold text-gray-400">{timeLeft.seconds}</div>
            <div className="text-sm text-gray-400">SECONDS</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-16">
          <h2 className="text-2xl font-bold mb-4">Join the Waitlist</h2>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400"
              required
            />
            <button type="submit" className="px-6 py-3 bg-brand-blue rounded-lg hover:bg-brand-blue/90">
              Notify Me
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
