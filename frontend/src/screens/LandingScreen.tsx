import { Nav } from "../app/components/Nav";
import { Hero } from "../app/components/Hero";
import { NotAnotherGenerator } from "../app/components/NotAnotherGenerator";
import { StickyPipeline } from "../app/components/StickyPipeline";
import { OneShot } from "../app/components/OneShot";
import { Continuity } from "../app/components/Continuity";
import { CTA, Footer } from "../app/components/CTA";

export function LandingScreen() {
  return (
    <div className="min-h-screen w-full bg-app text-ink font-sans">
      <Nav />
      <main>
        <Hero />
        <NotAnotherGenerator />
        <StickyPipeline />
        <OneShot />
        <Continuity />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
