import Link from 'next/link';
import { FooterLinkSection } from '../landing/FooterLinkSection';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const productLinks = [
    { name: 'ODAVL Insight', href: '/features#insight' },
    { name: 'ODAVL Autopilot', href: '/features#autopilot' },
    { name: 'ODAVL Guardian', href: '/features#guardian' },
    { name: 'Pricing', href: '/pricing' },
  ];

  const resourceLinks = [
    { name: 'Documentation', href: '/docs' },
    { name: 'API Reference', href: '/docs/api/rest' },
    { name: 'Tutorials', href: '/docs/tutorials/monorepo' },
    { name: 'Blog', href: '/blog' },
  ];

  const companyLinks = [
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
  ];

  const socialLinks = [
    { name: 'GitHub', href: 'https://github.com/odavl-studio', icon: '🐙' },
    { name: 'Twitter', href: 'https://twitter.com/odavl_studio', icon: '🐦' },
    { name: 'LinkedIn', href: 'https://linkedin.com/company/odavl-studio', icon: '💼' },
    { name: 'Discord', href: 'https://discord.gg/odavl', icon: '💬' },
  ];

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ODAVL Studio
              </div>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-sm">
              Autonomous code quality platform powered by ML. Detect errors, fix automatically, and test before deployment.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-2xl hover:scale-110 transition-transform"
                  aria-label={social.name}
                >
                  {social.icon}
                </Link>
              ))}
            </div>
          </div>

          {/* Products, Resources, Company Columns */}
          <FooterLinkSection
            title="Products"
            links={productLinks}
            titleClassName="font-bold text-gray-900 dark:text-white mb-4"
            linkClassName="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            listClassName="space-y-3"
          />
          <FooterLinkSection
            title="Resources"
            links={resourceLinks}
            titleClassName="font-bold text-gray-900 dark:text-white mb-4"
            linkClassName="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            listClassName="space-y-3"
          />
          <FooterLinkSection
            title="Company"
            links={companyLinks}
            titleClassName="font-bold text-gray-900 dark:text-white mb-4"
            linkClassName="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            listClassName="space-y-3"
          />
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {currentYear} ODAVL Studio. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link
                href="/privacy"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/sitemap.xml"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
