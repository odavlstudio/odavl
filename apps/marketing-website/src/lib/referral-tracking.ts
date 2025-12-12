export function getReferralCode(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('ref');
}

export function saveReferralCode(code: string): void {
  if (typeof window === 'undefined') return;
  document.cookie = `odavl_ref=${code}; max-age=${30 * 24 * 60 * 60}; path=/`;
}

export function getSavedReferralCode(): string | null {
  if (typeof window === 'undefined') return null;
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'odavl_ref') return value;
  }
  return null;
}
