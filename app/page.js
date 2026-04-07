import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="relative min-h-[80vh] flex flex-col items-center justify-center overflow-hidden">
      {/* Hero Section Background */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)]"></div>

      <section className="container mx-auto px-4 text-center">
        <h1 className="text-6xl sm:text-7xl lg:text-9xl font-black mb-8 tracking-tighter">
          <span className="text-gray-900">Manage with</span> <br />
          <span className="gradient-title">ATMCT Workspace</span>
        </h1>
        
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto font-medium">
          The all-in-one project management solution designed to elevate your team&apos;s productivity and streamline every workflow.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Link href="/onboarding">
            <Button size="lg" className="px-8 h-14 text-lg font-bold">
              Get Started <ChevronRight size={20} className="ml-2" />
            </Button>
          </Link>
          <Link href="/projects">
            <Button size="lg" variant="outline" className="px-8 h-14 text-lg font-bold">
              View Dashboard
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
