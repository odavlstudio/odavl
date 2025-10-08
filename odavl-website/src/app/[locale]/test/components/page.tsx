import { ODButton } from '@/components/ui/ODButton'
import { ODCard } from '@/components/ui/ODCard'
import { ODBadge } from '@/components/ui/ODBadge'
import { ODTabs } from '@/components/ui/ODTabs'
import { PricingTable } from '@/components/ui/PricingTable'
import { FeatureGrid } from '@/components/ui/FeatureGrid'
import { SectionTitle } from '@/components/ui/SectionTitle'

export default function ComponentsPage() {
  const pricingTiers = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for individual developers",
      features: ["Basic code quality monitoring", "10 fixes per month", "Community support"],
      cta: "Get Started"
    },
    {
      name: "Pro",
      price: "$29",
      description: "For professional teams",
      features: ["Advanced quality metrics", "Unlimited fixes", "Priority support", "Custom rules"],
      cta: "Start Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations",
      features: ["Enterprise security", "SSO integration", "Dedicated support", "Custom deployment"],
      cta: "Contact Sales"
    }
  ]

  const features = [
    { icon: "🔍", title: "Observe", description: "Monitor code quality metrics continuously" },
    { icon: "🧠", title: "Decide", description: "AI-powered decision making for code improvements" },
    { icon: "⚡", title: "Act", description: "Automated fixes within safety boundaries" },
    { icon: "✅", title: "Verify", description: "Validate changes before deployment" },
    { icon: "📚", title: "Learn", description: "Improve from outcomes and patterns" }
  ]

  const tabsData = [
    { id: "overview", label: "Overview", content: <div className="p-4">Overview content</div> },
    { id: "features", label: "Features", content: <div className="p-4">Features content</div> },
    { id: "pricing", label: "Pricing", content: <div className="p-4">Pricing content</div> }
  ]

  return (
    <div className="container mx-auto py-16 space-y-16">
      <SectionTitle title="ODAVL Design System" subtitle="Components" description="Enterprise-grade UI components built with shadcn/ui and Tailwind CSS" />
      
      <section className="space-y-8">
        <h3 className="text-2xl font-bold">Buttons</h3>
        <div className="flex flex-wrap gap-4">
          <ODButton variant="primary">Primary</ODButton>
          <ODButton variant="secondary">Secondary</ODButton>
          <ODButton variant="ghost">Ghost</ODButton>
          <ODButton variant="outline">Outline</ODButton>
          <ODButton variant="destructive">Destructive</ODButton>
        </div>
      </section>

      <section className="space-y-8">
        <h3 className="text-2xl font-bold">Badges</h3>
        <div className="flex flex-wrap gap-4">
          <ODBadge variant="default">Default</ODBadge>
          <ODBadge variant="secondary">Secondary</ODBadge>
          <ODBadge variant="success">Success</ODBadge>
          <ODBadge variant="warning">Warning</ODBadge>
          <ODBadge variant="danger">Danger</ODBadge>
        </div>
      </section>

      <section className="space-y-8">
        <h3 className="text-2xl font-bold">Tabs</h3>
        <ODTabs tabs={tabsData} />
      </section>

      <section className="space-y-8">
        <h3 className="text-2xl font-bold">Cards</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <ODCard title="Basic Card" description="A simple card component">
            <p>This is the card content area.</p>
          </ODCard>
          <ODCard title="Advanced Card" description="Card with custom header">
            <p>Cards support hover animations and custom content.</p>
          </ODCard>
        </div>
      </section>

      <section className="space-y-8">
        <h3 className="text-2xl font-bold">Feature Grid</h3>
        <FeatureGrid features={features} />
      </section>

      <section className="space-y-8">
        <h3 className="text-2xl font-bold">Pricing Table</h3>
        <PricingTable tiers={pricingTiers} />
      </section>
    </div>
  )
}