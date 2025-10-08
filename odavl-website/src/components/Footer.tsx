import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export default function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="border-t border-white/10 bg-slate-900/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-xl font-bold text-white">ODAVL Studio</div>
              <span className="text-xs bg-cyan-400/20 text-cyan-200 px-2 py-1 rounded-full font-medium">Enterprise</span>
            </div>
            <p className="text-sm text-white/70 max-w-md leading-relaxed">
              Autonomous code quality platform with enterprise-grade safety controls
              for intelligent development workflows. Trusted by development teams worldwide.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <div className="flex items-center gap-2 text-xs text-white/60">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                All systems operational
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-4">Product</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/features" className="text-white/70 hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="text-white/70 hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/docs" className="text-white/70 hover:text-white transition-colors">Documentation</Link></li>
              <li><Link href="/security" className="text-white/70 hover:text-white transition-colors">Security</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/about" className="text-white/70 hover:text-white transition-colors">About</Link></li>
              <li><Link href="/contact" className="text-white/70 hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/support" className="text-white/70 hover:text-white transition-colors">{t('support')}</Link></li>
              <li><Link href="/careers" className="text-white/70 hover:text-white transition-colors">Careers</Link></li>
            </ul>
          </div>
        </div>
        <Separator className="my-8 bg-white/10" />
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/60">
          <div className="flex items-center gap-6">
            <p>{t('copyright')}</p>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <span>🔒</span> SOC 2 Compliant
              </span>
              <span className="flex items-center gap-1">
                <span>🇪🇺</span> GDPR Ready
              </span>
            </div>
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">{t('privacy')}</Link>
            <Link href="/terms" className="hover:text-white transition-colors">{t('terms')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}