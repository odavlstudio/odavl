'use client';

import { Twitter, Linkedin, Facebook, Link2, Mail } from 'lucide-react';

interface ShareButtonsProps {
  url?: string;
  title?: string;
  text?: string;
}

export function ShareButtons({ 
  url = 'https://odavl.com',
  title = 'ODAVL Studio',
  text = 'Check out ODAVL Studio - autonomous code quality that fixes itself!'
}: ShareButtonsProps) {
  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  const shareToLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedinUrl, '_blank', 'width=550,height=420');
  };

  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=550,height=420');
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    alert('Link copied!');
  };

  return (
    <div className="flex gap-3">
      <button onClick={shareToTwitter} className="p-2 bg-[#1DA1F2] text-white rounded-lg hover:opacity-90">
        <Twitter size={20} />
      </button>
      <button onClick={shareToLinkedIn} className="p-2 bg-[#0A66C2] text-white rounded-lg hover:opacity-90">
        <Linkedin size={20} />
      </button>
      <button onClick={shareToFacebook} className="p-2 bg-[#1877F2] text-white rounded-lg hover:opacity-90">
        <Facebook size={20} />
      </button>
      <button onClick={copyLink} className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
        <Link2 size={20} />
      </button>
    </div>
  );
}
