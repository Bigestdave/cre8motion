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
        <div id="product">
          <NotAnotherGenerator />
        </div>
        <div id="how-it-works">
          <StickyPipeline />
        </div>
        <div id="examples">
          <OneShot />
        </div>
        <div id="technology">
          <Continuity />
        </div>
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
