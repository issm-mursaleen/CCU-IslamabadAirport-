"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, BarChart3, Users, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-size-[40px_40px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
          <div className="container relative mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-emerald-400">
              Transform Your Business <br /> with SecureDash
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
              The all-in-one CRM platform designed for modern teams. Secure, fast, and incredibly easy to use.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="px-8 h-12 text-md font-semibold bg-blue-600 hover:bg-blue-700">
                  Get Started Free
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="px-8 h-12 text-md font-semibold border-slate-700 text-white hover:bg-slate-800">
                View Demo
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-slate-50 border-y">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
              <p className="text-slate-600 max-w-xl mx-auto">Everything you need to manage your business effectively in one place.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard 
                icon={<BarChart3 className="h-10 w-10 text-blue-600" />}
                title="Advanced Analytics"
                description="Get deep insights into your business performance with real-time data."
              />
              <FeatureCard 
                icon={<Users className="h-10 w-10 text-emerald-600" />}
                title="Team Collaboration"
                description="Work together seamlessly with shared boards and task management."
              />
              <FeatureCard 
                icon={<Shield className="h-10 w-10 text-purple-600" />}
                title="Secure by Design"
                description="Your data is protected with enterprise-grade security and encryption."
              />
              <FeatureCard 
                icon={<Zap className="h-10 w-10 text-amber-600" />}
                title="Blazing Fast"
                description="Built on Next.js 15 for the best performance and user experience."
              />
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-lg font-semibold uppercase tracking-wider text-slate-500 mb-8">Trusted by industry leaders</h3>
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale">
               <div className="text-2xl font-bold text-slate-900 italic">Vercel</div>
               <div className="text-2xl font-bold text-slate-900 italic">Supabase</div>
               <div className="text-2xl font-bold text-slate-900 italic">Stripe</div>
               <div className="text-2xl font-bold text-slate-900 italic">Prisma</div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-blue-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to scale your business?</h2>
            <p className="text-blue-100 text-xl mb-10 max-w-xl mx-auto">
              Join 10,000+ businesses already using SecureDash to manage their growth.
            </p>
            <Link href="/login">
              <Button size="lg" variant="secondary" className="px-10 h-14 text-lg font-bold text-blue-700 bg-white hover:bg-slate-100">
                Start Your Free Trial
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 font-bold text-white text-xl mb-6">
                <Shield className="h-6 w-6 text-blue-500" />
                <span>SecureDash</span>
              </div>
              <p className="text-sm">Making CRM simple and secure for everyone.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-6">Product</h4>
              <ul className="space-y-4 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-6">Company</h4>
              <ul className="space-y-4 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-6">Legal</h4>
              <ul className="space-y-4 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-900 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} SecureDash Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="border-none shadow-md hover:shadow-xl transition-all hover:-translate-y-1 duration-300">
      <CardHeader className="pb-2">
        <div className="mb-4">{icon}</div>
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-500 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}
