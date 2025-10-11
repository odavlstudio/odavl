export const accessibilityConfig = {
  skipLinks: [
    { href: '#main-content', text: 'Skip to main content' },
    { href: '#navigation', text: 'Skip to navigation' },
  ],
  ariaLabels: {
    navigation: 'Main navigation',
    logo: 'ODAVL Studio homepage',
    menu: 'Toggle navigation menu',
    search: 'Search documentation',
    languageSwitch: 'Switch language',
    themeToggle: 'Toggle dark mode',
  },
  focusVisible: 'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
  reducedMotion: 'motion-reduce:transform-none motion-reduce:transition-none',
};

export function generateSkipLinks() {
  return accessibilityConfig.skipLinks.map(link => (
    `<a href="${link.href}" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-primary text-primary-foreground px-4 py-2 rounded z-50">${link.text}</a>`
  )).join('');
}