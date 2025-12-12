// Referral tracking and attribution
export function trackReferral(code: string) {
  document.cookie = `ref=${code};max-age=${30 * 24 * 60 * 60};path=/`;
  localStorage.setItem('referralCode', code);
  localStorage.setItem('referralTimestamp', Date.now().toString());
}

export function getReferralCode(): string | null {
  return localStorage.getItem('referralCode');
}
