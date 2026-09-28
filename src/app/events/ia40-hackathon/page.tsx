import type { Metadata } from "next";
import Guide from "./Guide";

export const metadata: Metadata = {
  title: "IA40 Hackathon Guide · AISEA",
  description:
    "Know before you go: schedule, WiFi, challenge, Vercel and OpenAI credits, setup and prizes for the IA40 Hackathon on September 29, 2026 at the Four Seasons Seattle.",
  openGraph: {
    title: "IA40 Hackathon Guide",
    description:
      "Everything you need for the IA40 Hackathon on September 29, 2026. Theme: technology that gives time back.",
    images: ["/events/ia40-hackathon.jpg"],
  },
};

export default function Page() {
  return <Guide />;
}
