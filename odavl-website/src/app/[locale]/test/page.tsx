import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import LocaleSwitcher from '@/components/LocaleSwitcher';

export default function TestPage() {
  const t = useTranslations('common');

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-primary">ODAVL Framework Test</h1>
        <p className="text-lg text-muted-foreground">
          Testing Wave B framework integration: Next.js 15 + shadcn/ui + next-intl
        </p>
        <LocaleSwitcher />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Button Components</CardTitle>
            <CardDescription>Testing shadcn/ui button variants</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="default">Default Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="ghost">Ghost Button</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Form Elements</CardTitle>
            <CardDescription>Testing input components</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Enter text here..." />
            <Input type="email" placeholder="email@example.com" />
            <Input type="password" placeholder="Password" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('welcome')}</CardTitle>
            <CardDescription>Testing internationalization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">Language switching test</p>
            <p className="text-sm text-muted-foreground">
              Current translation: {t('welcome')}
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-xs">RTL Support:</span>
              <span className="text-xs font-mono">
                {document?.dir === 'rtl' ? 'RTL Active' : 'LTR Active'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold">Brand Colors Test</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="w-full h-16 bg-primary rounded-lg"></div>
            <p className="text-sm font-medium">Primary</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-16 bg-secondary rounded-lg"></div>
            <p className="text-sm font-medium">Secondary</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-16 bg-accent rounded-lg"></div>
            <p className="text-sm font-medium">Accent</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-16 bg-muted rounded-lg border"></div>
            <p className="text-sm font-medium">Muted</p>
          </div>
        </div>
      </div>
    </div>
  );
}