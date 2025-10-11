import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DemoPage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-8">
            ODAVL Demo
          </h1>
          <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
            Experience autonomous code quality improvement in action. See how ODAVL observes, decides, acts, and learns to improve your codebase.
          </p>
          
          {/* Professional Demo Request */}
          <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-12">
            <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-cyan-400/20 rounded-xl flex items-center justify-center">
              <div className="text-center max-w-lg">
                <div className="text-6xl mb-6">🤖</div>
                <h3 className="text-2xl font-bold text-white mb-4">Live Demo Available</h3>
                <p className="text-white/80 mb-6">
                  See ODAVL&apos;s autonomous code quality system in action. Watch real-time code analysis, 
                  decision-making, and automated improvements on actual codebases.
                </p>
                <p className="text-sm text-white/60">
                  Schedule a personalized demonstration with our engineering team
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/pilot">
                Start Your Pilot
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10" asChild>
              <Link href="/contact">
                Schedule Demo Call
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}