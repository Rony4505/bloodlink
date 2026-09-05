import type { Metadata } from "next";
import { JarvisHub } from "@/components/jarvis/JarvisHub";
import "./jarvis.css";

export const metadata: Metadata = {
  title: "Jarvis Hub | Personal AI Agents",
  description: "Voice-controlled agent hub with cartoon animations for laptop and phone control.",
};

export default function JarvisPage() {
  return <JarvisHub />;
}
