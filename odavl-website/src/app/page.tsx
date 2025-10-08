import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import LocaleSwitcher from '@/components/LocaleSwitcher';

export default function Home() {
  const t = useTranslations('common');

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-primary">
            ODAVL Studio
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('welcome')} - Autonomous Code Quality Platform
          </p>
          <LocaleSwitcher />
        </div>

        <div className="space-y-6">
          <p className="text-lg max-w-3xl mx-auto">
            Experience the future of automated code quality improvement with ODAVL&apos;s 
            Observe-Decide-Act-Verify-Learn cycle. Our autonomous system continuously 
            monitors and enhances your codebase within defined safety constraints.
          </p>

          <div className="flex gap-4 justify-center flex-col sm:flex-row">
            <Button size="lg" className="text-lg px-8 py-3">
              Get Started
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              View Documentation
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-lg mx-auto flex items-center justify-center">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="text-xl font-semibold">Observe</h3>
            <p className="text-muted-foreground">
              Continuously monitor code quality metrics and identify improvement opportunities
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="w-16 h-16 bg-secondary/10 rounded-lg mx-auto flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-xl font-semibold">Autonomous Action</h3>
            <p className="text-muted-foreground">
              Make intelligent decisions and implement fixes within safety boundaries
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="w-16 h-16 bg-accent/10 rounded-lg mx-auto flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
            <h3 className="text-xl font-semibold">Verification</h3>
            <p className="text-muted-foreground">
              Validate changes and learn from outcomes to improve future decisions
            </p>
          </div>
        </div>

        <div className="mt-16 p-8 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Framework Test: Next.js 15 + shadcn/ui + next-intl integration complete
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Visit <Link href="/test" className="underline hover:text-primary">/test</Link> to verify all components
          </p>
        </div>
      </div>
    </div>
  );
}
