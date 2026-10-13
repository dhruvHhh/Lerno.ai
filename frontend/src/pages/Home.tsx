import ClosingCta from "@/components/home/ClosingCta";
import Demo from "@/components/home/Demo";
import Features from "@/components/home/Features";
import Hero from "@/components/home/Hero";
import HowItWorks from "@/components/home/HowItWorks";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Demo />
        <Features />
        <HowItWorks />
        <ClosingCta />
      </main>
      <Footer />
    </>
  );
}
