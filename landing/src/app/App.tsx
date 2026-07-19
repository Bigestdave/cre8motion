import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { NotAnotherGenerator } from "./components/NotAnotherGenerator";
import { StickyPipeline } from "./components/StickyPipeline";
import { OneShot } from "./components/OneShot";
import { Continuity } from "./components/Continuity";
import { CTA, Footer } from "./components/CTA";

export default function App() {
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
