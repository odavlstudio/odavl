export function generateUtmParams(source: string, medium: string, campaign: string): string {
  const params = new URLSearchParams({
    utm_source: source,
    utm_medium: medium,
    utm_campaign: campaign
  });
  return params.toString();
}

export function generateShareUrl(baseUrl: string, referralCode: string, platform: string): string {
  const utmParams = generateUtmParams(platform, 'referral', 'user-share');
  return `${baseUrl}?ref=${referralCode}&${utmParams}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function getShareText(platform: string): string {
  const texts = {
    twitter: 'Just found ODAVL Studio - autonomous code quality that fixes itself! 🚀',
    linkedin: 'ODAVL Studio is transforming how teams maintain code quality with AI-powered automation.',
    facebook: 'Check out ODAVL Studio - it automatically detects and fixes code issues!'
  };
  return texts[platform as keyof typeof texts] || texts.twitter;
}
