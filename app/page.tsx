"use client";

import { LayoutGroup } from "framer-motion";
import { LandingScreen } from "@/components/landing/LandingScreen";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-hero-gradient">
      <LayoutGroup>
        <LandingScreen />
      </LayoutGroup>
    </main>
  );
}
