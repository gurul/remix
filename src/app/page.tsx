"use client";

import { useEffect, useRef, useState } from "react";
import createGlobe from "cobe";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Cpu,
  Database,
  Layers,
  ChevronRight,
  ChevronLeft,
  Zap,
  Shield,
  Search,
  Menu,
  X,
  Calendar,
  Users,
  MapPin,
  Clock,
  Linkedin
} from "lucide-react";
import Image from "next/image";

const Mono = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`font-mono text-[10px] uppercase tracking-[0.2em] text-accent ${className}`}>
    {children}
  </span>
);

// Accent orange for globe (matches #ff7a1a)
const GLOBE_AMBER = [255 / 255, 122 / 255, 26 / 255] as [number, number, number];

// Shared animation speed: event cards px/s and globe rotation use this (globe rad/frame = SPEED * 0.00004)
const ANIMATION_SPEED = 36 * 0.6; // 60% of original

const PAST_EVENTS_PAGE_SIZE = 3;

const Globe = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let phi = 0;
    if (!canvasRef.current) return;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 600 * 2,
      height: 600 * 2,
      phi: 0,
      theta: 0,
      dark: 0,
      diffuse: 1.8,
      mapSamples: 16000,
      mapBrightness: 25,
      baseColor: GLOBE_AMBER,
      markerColor: GLOBE_AMBER,
      glowColor: GLOBE_AMBER,
      markers: [],
      onRender: (state) => {
        state.phi = phi;
        phi -= ANIMATION_SPEED * 0.00004; /* clockwise, same rate as event cards */
      },
    });

    return () => globe.destroy();
  }, []);

  return (
    <div className="relative w-full aspect-square max-w-[600px] mx-auto opacity-100 transition-all duration-1000 hidden md:block">
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", maxWidth: "100%", aspectRatio: "1" }}
      />
      {/* Overlay logo on top of globe */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Image
          src="/Untitled_design.png"
          alt="AI Collective mark"
          width={360}
          height={360}
          className="opacity-100 mix-blend-screen"
        />
      </div>
    </div>
  );
};

interface ApiEvent {
  id: string;
  lumaUrl: string;
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  timezone: string;
  location?: string;
  imageUrl?: string;
  type: string;
  addedAt: string;
}

interface DisplayEvent {
  title: string;
  type: string;
  date: string;
  time: string;
  ago: string;
  lumaUrl?: string;
  imageUrl?: string;
}

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatEventTime(startAt: string, endAt?: string): string {
  const start = new Date(startAt);
  const startTime = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (endAt) {
    const end = new Date(endAt);
    const endTime = end.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${startTime}-${endTime}`;
  }
  return startTime;
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  // Compare calendar days in local time so "yesterday 3 PM" shows "Yesterday" not "Today"
  const toLocalDate = (d: Date) => {
    const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return copy.getTime();
  };
  const dateDay = toLocalDate(date);
  const todayStart = toLocalDate(now);
  const diffDays = Math.round((todayStart - dateDay) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const futureDays = Math.abs(diffDays);
    if (futureDays === 0) return "Today";
    if (futureDays === 1) return "Tomorrow";
    if (futureDays < 7) return `In ${futureDays} days`;
    if (futureDays < 30) return `In ${Math.floor(futureDays / 7)} weeks`;
    return `In ${Math.floor(futureDays / 30)} months`;
  }

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return "Over 1 year ago";
}

function convertApiEventToDisplay(event: ApiEvent): DisplayEvent {
  // Get image URL - it can be a string or array
  let imageUrl: string | undefined;
  if (event.imageUrl) {
    imageUrl = Array.isArray(event.imageUrl) ? event.imageUrl[0] : event.imageUrl;
  }

  return {
    title: event.title,
    type: event.type,
    date: formatEventDate(event.startAt),
    time: formatEventTime(event.startAt, event.endAt),
    ago: getRelativeTime(event.startAt),
    lumaUrl: event.lumaUrl,
    imageUrl,
  };
}

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<DisplayEvent[]>([]);
  const [pastEvents, setPastEvents] = useState<DisplayEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [pastEventsPage, setPastEventsPage] = useState(0);

  const pastEventsSlice = pastEvents.slice(
    pastEventsPage * PAST_EVENTS_PAGE_SIZE,
    pastEventsPage * PAST_EVENTS_PAGE_SIZE + PAST_EVENTS_PAGE_SIZE
  );
  const hasNextPast = (pastEventsPage + 1) * PAST_EVENTS_PAGE_SIZE < pastEvents.length;
  const hasPrevPast = pastEventsPage > 0;

  // Fetch events from API
  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch("/api/events");
        const data = await response.json();
        const events: ApiEvent[] = data.events || [];

        const now = new Date();
        const upcoming: DisplayEvent[] = [];
        const pastWithTime: { displayEvent: DisplayEvent; startAt: string }[] = [];

        events.forEach((event) => {
          const eventDate = new Date(event.startAt);
          const displayEvent = convertApiEventToDisplay(event);

          if (eventDate > now) {
            upcoming.push(displayEvent);
          } else {
            pastWithTime.push({ displayEvent, startAt: event.startAt });
          }
        });

        // Sort upcoming by date ascending (soonest first)
        upcoming.sort(
          (a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // Sort past by date descending (most recent first)
        pastWithTime.sort(
          (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
        );

        setUpcomingEvents(upcoming);
        setPastEvents(pastWithTime.map((p) => p.displayEvent));
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setEventsLoading(false);
      }
    }

    fetchEvents();
  }, []);

  const team = [
    {
      name: "Bhola Chhetri",
      role: "CHAPTER LEAD",
      bio: "Bhola is a Solutions Architect at Broadcom and the founder of CropTop. He's deeply passionate about go-to-market initiatives for businesses and individuals. Outside of work, Bhola loves cars, events, and traveling.",
      img: "https://storage.googleapis.com/aic-platform-assets/images/team-members/bhola@aicollective.com.jpeg",
      linkedin: "https://www.linkedin.com/in/bhola-chhetri/"
    },
    {
      name: "Michael A. Agustin",
      role: "HEAD OF GROWTH",
      bio: "Michael Agustin has nearly 3 decades for experience building technical ecosystems across multiple parts of the world, for the IGDA, Apple, Malaysia (MaGIC), and VRARA. He's raised over $30M from investors across 3 ventures. Michael previously worked at Apple on macOS' Platform Experience team and built the 1st no-code solution for mobile, reaching 150M players per month by the time he vested. He recently co-founded Curie, focused on Commerce World Models for Physical AI.",
      img: "https://storage.googleapis.com/aic-platform-assets/images/team-members/michael-a.-agustin-ea4.jpeg",
      linkedin: "https://www.linkedin.com/in/michaelagustin/"
    },
    {
      name: "Ajita Ananth",
      role: "EVENTS LEAD",
      bio: "Ajita K Ananth is a Staff Technical Program Manager at Google where she leads engineering programs within Google Maps. Prior to Google, she led major product and technical initiatives at Coinbase and DocuSign. She thrives on empowering teams to tackle challenging engineering problems, and shipping products that improve people's lives. Outside of work, she loves trying new restaurants, and traveling to new countries.",
      img: "https://storage.googleapis.com/aic-platform-assets/images/team-members/ajita-ananth-b65.JPG",
      linkedin: "https://www.linkedin.com/in/ajita-ananth-47559531/"
    },
    {
      name: "Samridh Bhattacharjee",
      role: "GROWTH/COMMUNITY ORGANIZER",
      bio: "Samridh is an AI Product Manager at Mircosoft AI and the co-founder of Claimrunner. He's deeply passionate about advancing the human condition through AI and helping others however he can. Outside of work, Samridh enjoys golf, tennis, and DJ'ing.",
      img: "https://storage.googleapis.com/aic-platform-assets/images/team-members/samridhb@aicollective.com.jpg",
      linkedin: "https://www.linkedin.com/in/samridhb/"
    },
    {
      name: "Gurucharan Lingamallu",
      role: "TECHNICAL/MEDIA LEAD",
      bio: "Guru is a Computer Science student at the University of Washington focused on human-centered technology. He's interested in how tools shape memory, agency, and ownership, and focuses on building systems grounded in trust.",
      img: "https://storage.googleapis.com/aic-platform-assets/images/team-members/gurucharan-lingamallu-062.png",
      linkedin: "https://www.linkedin.com/in/gurul/"
    },
    {
      name: "Cyndi Song",
      role: "CHAPTER ORGANIZER",
      bio: "Cyndi is a Product Strategist and Chief of Staff at Google Cloud. Beyond her day job, she is deeply embedded in the Seattle startup ecosystem as the Chapter Lead for 12 Scrappy Founders, where she connects entrepreneurs to support their startup journeys. Driven by a passion for human-centered AI, she spends her downtime at hackathons prototyping new products, with a recent focus on voice agents. When she isn't building, she loves aerial yoga and dancing.",
      img: "https://storage.googleapis.com/aic-platform-assets/images/team-members/cyndi-song-9ab.jpeg",
      linkedin: "https://www.linkedin.com/in/sixuancyndsong/"
    },
    {
      name: "Abe Thomas",
      role: "CHAPTER ADVISOR",
      bio: "Abe is a seasoned technology executive with deep experience in product strategy, digital marketing, business intelligence, go-to-market execution, and business operations. He has held leadership roles at companies including Microsoft, eBay, and IBM, as well as startups and smaller organizations. Outside of work, Abe enjoys traveling, volunteering, mentoring, cooking, hiking, and engaging in thoughtful discussions about technology.",
      img: "/abe-thomas.png",
      linkedin: "https://www.linkedin.com/in/abethomas01/"
    },
    {
      name: "Rachel Kloepfer",
      role: "INSTITUTIONAL LEAD",
      bio: "Rachel is a Private Investments Analyst at Multi-Family Office Lenora Capital. She is a prior award-winning investigative journalist passionate about deep research and investing in great teams, and believes in bridging the gap between founders and funders through community. Outside of work, Rachel is a Global Shaper with the World Economic Forum and loves cooking, running, and writing.",
      img: "/rachel-kloepfer.png",
      linkedin: "https://www.linkedin.com/in/rachelkloepfer/"
    },
    {
      name: "Keshav Ummat",
      role: "STRATEGY LEAD",
      bio: "Keshav is an Enterprise Account Executive at Glean, where he leads tech sales for customers in the PNW. Prior to Glean, he worked at AWS for 6 years and was also part of the founding team at Intently AI. He's deeply passionate about public speaking and community building, and was also raised here in Seattle! Outside of work, Keshav enjoys tennis, new food experiences and traveling the world!",
      img: "/keshav.png",
      linkedin: "https://www.linkedin.com/in/keshav-ummat-8418b4106/"
    }
  ];

  return (
    <main className="min-h-screen bg-[#0c0a09] text-[#fafaf9] selection:bg-accent/30 selection:text-accent relative overflow-x-hidden">
      <div className="grain" />
      <div className="grid-bg fixed inset-0 pointer-events-none" />

      {/* Structural Decoration */}
      <div className="fixed top-0 left-[4%] w-px h-full bg-border/10 pointer-events-none" />
      <div className="fixed top-0 right-[4%] w-px h-full bg-border/10 pointer-events-none" />
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[100] border-b border-white/5 bg-background/80 backdrop-blur-xl px-6 md:px-12 py-4 flex justify-between items-center">
        <div className="flex items-center gap-12">
          <div className="font-serif italic text-xl tracking-tighter flex items-center gap-2 group cursor-pointer">
            <div className="w-4 h-4 bg-accent rotate-45 transition-transform group-hover:rotate-[135deg]" />
            <span className="font-bold tracking-widest uppercase text-sm font-mono">AISEA</span>
          </div>
          <div className="hidden xl:flex gap-8 border-l border-white/10 pl-12">
            <a href="#events" className="text-[9px] uppercase tracking-[0.3em] text-secondary hover:text-accent transition-colors font-mono">Events</a>
            <a href="#about-us" className="text-[9px] uppercase tracking-[0.3em] text-secondary hover:text-accent transition-colors font-mono">About Us</a>
            <a href="#partnerships" className="text-[9px] uppercase tracking-[0.3em] text-secondary hover:text-accent transition-colors font-mono">Partnerships</a>
            <a href="#get-involved" className="text-[9px] uppercase tracking-[0.3em] text-secondary hover:text-accent transition-colors font-mono">Get Involved</a>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <a 
            href="https://docs.google.com/forms/d/e/1FAIpQLScmUC8KSPhafE_8FZBUs2pNPJVkJkRl-E9eE2cE5b34RQ3BTQ/viewform"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-accent text-black px-5 py-2 text-[9px] font-mono font-bold hover:bg-white transition-all uppercase tracking-[0.2em] shadow-[3px_3px_0px_0px_rgba(255,122,26,0.2)] group"
          >
            Apply_Member
            <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
          <button className="xl:hidden text-secondary" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            className="fixed inset-0 z-[110] bg-background p-8 flex flex-col justify-center gap-12 border-l border-white/10"
          >
            <button className="absolute top-8 right-8 text-accent" onClick={() => setIsMenuOpen(false)}>
              <X size={32} />
            </button>
            <a href="#events" onClick={() => setIsMenuOpen(false)} className="text-5xl font-serif italic text-white hover:text-accent transition-colors">Events</a>
            <a href="#about-us" onClick={() => setIsMenuOpen(false)} className="text-5xl font-serif italic text-white hover:text-accent transition-colors">About Us</a>
            <a href="#partnerships" onClick={() => setIsMenuOpen(false)} className="text-5xl font-serif italic text-white hover:text-accent transition-colors">Partnerships</a>
            <a href="#get-involved" onClick={() => setIsMenuOpen(false)} className="text-5xl font-serif italic text-white hover:text-accent transition-colors">Get Involved</a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-6 md:px-12 max-w-[1400px] mx-auto min-h-[90vh] flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-px bg-accent/50" />
              <Mono className="text-accent">Seattle_Chapter</Mono>
            </div>
            <h1 className="text-6xl md:text-[7rem] font-serif leading-[0.9] tracking-tighter mb-10">
              The AI<br />
              <span className="italic text-accent">Collective.</span>
            </h1>
            <p className="text-xl md:text-2xl text-secondary font-light max-w-lg leading-relaxed mb-12 border-l border-accent/20 pl-8">
              Connect with local pioneers and innovators shaping the future of AI through <span className="text-white">meaningful gatherings</span> and collaborative exploration.
            </p>
            <div className="flex flex-wrap gap-6">
              <a 
                href="https://docs.google.com/forms/d/e/1FAIpQLScmUC8KSPhafE_8FZBUs2pNPJVkJkRl-E9eE2cE5b34RQ3BTQ/viewform?usp=header"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 bg-accent text-black border border-accent px-8 py-5 hover:bg-white hover:text-black hover:border-white transition-all"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold">Join Our Chapter</span>
                <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
              <a 
                href="https://docs.google.com/forms/d/e/1FAIpQLSelDyidSPMTyFagOEp7AYuRXH8-Wt8JgJqCwGnR_puhUScyJg/viewform?usp=header"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 bg-accent text-black border border-accent px-8 py-5 hover:bg-white hover:text-black hover:border-white transition-all"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold">Partner With Us</span>
                <ArrowUpRight size={14} className="text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>
          
          <div className="relative flex justify-center items-center group">
            <div className="absolute inset-0 bg-radial-gradient from-accent/10 to-transparent blur-[120px] rounded-full opacity-50" />
            <Globe />
            <div className="absolute bottom-4 left-4 p-6 border border-white/10 bg-background/60 backdrop-blur-md hidden md:block w-56">
              <div className="flex justify-between items-start mb-4">
                <Mono className="text-accent/60 text-[8px]">Active_Members</Mono>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-[8px] font-mono text-secondary">
                  <span>GLOBAL_COUNT</span>
                  <span className="text-white">150,000+</span>
                </div>
                <div className="flex justify-between text-[8px] font-mono text-secondary">
                  <span>SEATTLE_COUNT</span>
                  <span className="text-white">1,600+</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section id="events" className="py-24 border-y border-white/5 bg-muted/5">
        <div className="px-6 md:px-12 max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
            <div>
              <Mono className="text-accent mb-4 block">Schedule_Interface</Mono>
              <h2 className="text-5xl md:text-6xl font-serif italic">Upcoming Events.</h2>
            </div>
            <a
              href="https://www.aicollective.com/events"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-4 bg-accent text-black border border-accent px-8 py-5 text-[10px] font-mono font-bold uppercase tracking-[0.3em] hover:bg-white hover:text-black hover:border-white transition-all group"
            >
              See Global Events <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>

          {eventsLoading ? (
            <div className="border border-white/10 bg-[#0c0a09] p-12 text-center">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-secondary font-mono text-sm tracking-widest">LOADING EVENTS...</p>
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="border border-white/10 bg-[#0c0a09] p-12 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Calendar className="w-12 h-12 text-accent/20 mx-auto mb-6" />
              <p className="text-secondary font-mono text-sm tracking-widest mb-2">NO UPCOMING EVENTS AT THIS TIME.</p>
              <p className="text-white/40 text-[10px] font-mono">CHECK BACK SOON FOR UPDATES.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event, i) => (
                <motion.a
                  href={event.lumaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={`upcoming-${i}`}
                  className="group border border-accent/30 bg-accent/5 hover:border-accent transition-all flex flex-col h-full overflow-hidden"
                >
                  {event.imageUrl && (
                    <div className="relative w-full aspect-[16/9] overflow-hidden">
                      <Image
                        src={event.imageUrl}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a09] to-transparent opacity-60" />
                    </div>
                  )}
                  <div className="p-8 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-[8px] font-mono border border-accent/40 text-accent px-2 py-1 uppercase tracking-widest">
                        {event.type}
                      </span>
                      <span className="text-[9px] font-mono text-accent">{event.ago}</span>
                    </div>
                    <h3 className="text-lg font-serif italic leading-snug mb-8 group-hover:text-accent transition-colors flex-grow">
                      {event.title}
                    </h3>
                    <div className="pt-6 border-t border-accent/20 space-y-2">
                      <div className="flex items-center gap-3 text-secondary font-mono text-[9px]">
                        <Calendar size={10} className="text-accent/60" />
                        {event.date}
                      </div>
                      <div className="flex items-center gap-3 text-secondary font-mono text-[9px]">
                        <Clock size={10} className="text-accent/60" />
                        {event.time}
                      </div>
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>
          )}

          {/* Past Events - 3 at a time with Next/Prev */}
          {!eventsLoading && (
            <div id="past-events" className="mt-24 pt-16 border-t border-white/10">
              <Mono className="text-accent mb-4 block">Explore_Archive</Mono>
              <h2 className="text-5xl md:text-6xl font-serif italic mb-10 text-white">
                Past Events.
              </h2>
              {pastEvents.length === 0 ? (
                <p className="text-secondary font-mono text-sm">
                  No past events to show yet.
                </p>
              ) : (
                <>
                  {/* Mobile: all past events in one horizontal scroll, no buttons */}
                  <div className="flex flex-nowrap gap-4 overflow-x-auto overflow-y-hidden pb-2 -mx-6 px-6 scrollbar-hide snap-x snap-mandatory w-full md:hidden">
                    {pastEvents.map((event, i) => (
                      <a
                        href={event.lumaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        key={`past-mobile-${i}`}
                        className="group border border-white/20 bg-white/[0.07] hover:border-accent/30 transition-all flex flex-col overflow-hidden flex-shrink-0 w-[280px] min-w-[280px] h-[380px] min-h-[380px] snap-center"
                      >
                        {event.imageUrl ? (
                          <div className="relative w-full h-[140px] min-h-[140px] shrink-0 overflow-hidden bg-white/5">
                            <Image
                              src={event.imageUrl}
                              alt={event.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a09] to-transparent opacity-60" />
                          </div>
                        ) : (
                          <div className="w-full h-[140px] min-h-[140px] shrink-0 bg-white/5" />
                        )}
                        <div className="p-6 flex flex-col flex-grow min-h-0 overflow-hidden">
                          <div className="flex justify-between items-start gap-2 mb-3 shrink-0">
                            <span className="text-[8px] font-mono border border-accent/40 text-accent px-2 py-0.5 uppercase tracking-widest">
                              {event.type}
                            </span>
                            <span className="text-[9px] font-mono text-secondary shrink-0">{event.ago}</span>
                          </div>
                          <h3 className="text-base font-serif italic leading-snug mb-4 group-hover:text-accent transition-colors text-white line-clamp-2 shrink-0">
                            {event.title}
                          </h3>
                          <div className="pt-4 mt-auto border-t border-white/10 space-y-1 shrink-0">
                            <div className="flex items-center gap-2 text-secondary font-mono text-[9px]">
                              <Calendar size={10} className="text-accent/60 shrink-0" />
                              {event.date}
                            </div>
                            <div className="flex items-center gap-2 text-secondary font-mono text-[9px]">
                              <Clock size={10} className="text-accent/60 shrink-0" />
                              {event.time}
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                  {pastEvents.length > 1 && (
                    <p className="md:hidden mt-3 text-center text-[10px] font-mono text-secondary uppercase tracking-widest flex items-center justify-center gap-1.5">
                      <span>Swipe for more</span>
                      <ChevronRight size={12} className="opacity-70" aria-hidden />
                    </p>
                  )}
                  {/* Desktop: 3 at a time with Next/Prev */}
                  <div className="hidden md:block">
                    <div className="grid grid-cols-3 gap-8 w-full">
                      <AnimatePresence mode="wait">
                        {pastEventsSlice.map((event, i) => (
                          <motion.a
                            href={event.lumaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            key={`past-${pastEventsPage}-${i}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="group border border-white/20 bg-white/[0.07] hover:border-accent/30 transition-all flex flex-col overflow-hidden w-full h-[440px] min-h-[440px]"
                          >
                            {event.imageUrl ? (
                              <div className="relative w-full h-[180px] min-h-[180px] shrink-0 overflow-hidden bg-white/5">
                                <Image
                                  src={event.imageUrl}
                                  alt={event.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a09] to-transparent opacity-60" />
                              </div>
                            ) : (
                              <div className="w-full h-[180px] min-h-[180px] shrink-0 bg-white/5" />
                            )}
                            <div className="p-6 flex flex-col flex-grow min-h-0 overflow-hidden">
                              <div className="flex justify-between items-start gap-2 mb-3 shrink-0">
                                <span className="text-[8px] font-mono border border-accent/40 text-accent px-2 py-0.5 uppercase tracking-widest">
                                  {event.type}
                                </span>
                                <span className="text-[9px] font-mono text-secondary shrink-0">{event.ago}</span>
                              </div>
                              <h3 className="text-base font-serif italic leading-snug mb-4 group-hover:text-accent transition-colors text-white line-clamp-2 shrink-0">
                                {event.title}
                              </h3>
                              <div className="pt-4 mt-auto border-t border-white/10 space-y-1 shrink-0">
                                <div className="flex items-center gap-2 text-secondary font-mono text-[9px]">
                                  <Calendar size={10} className="text-accent/60 shrink-0" />
                                  {event.date}
                                </div>
                                <div className="flex items-center gap-2 text-secondary font-mono text-[9px]">
                                  <Clock size={10} className="text-accent/60 shrink-0" />
                                  {event.time}
                                </div>
                              </div>
                            </div>
                          </motion.a>
                        ))}
                      </AnimatePresence>
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-8">
                    <button
                      type="button"
                      onClick={() => setPastEventsPage((p) => Math.max(0, p - 1))}
                      disabled={!hasPrevPast}
                      className="font-mono text-[10px] uppercase tracking-widest text-accent hover:text-white disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 transition-colors"
                      aria-label="Previous 3 past events"
                    >
                      <ChevronLeft size={14} />
                      Previous
                    </button>
                    <span className="font-mono text-[9px] text-secondary uppercase tracking-widest">
                      {pastEvents.length === 0
                        ? "0 of 0"
                        : `${pastEventsPage * PAST_EVENTS_PAGE_SIZE + 1}–${Math.min(
                            pastEventsPage * PAST_EVENTS_PAGE_SIZE + pastEventsSlice.length,
                            pastEvents.length
                          )} of ${pastEvents.length}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPastEventsPage((p) => p + 1)}
                      disabled={!hasNextPast}
                      className="font-mono text-[10px] uppercase tracking-widest text-accent hover:text-white disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 transition-colors"
                      aria-label="Next 3 past events"
                    >
                      Next
                      <ChevronRight size={14} />
                    </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* About Us / Launch Video */}
      <section id="about-us" className="pt-32 pb-16 px-6 md:px-12 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="order-2 lg:order-1 aspect-video w-full overflow-hidden border border-white/10 bg-white/5">
            <iframe
              src="https://www.youtube.com/embed/36i7pkaHqow?start=9"
              title="About Us - AI Collective Seattle"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          
          <div className="order-1 lg:order-2 space-y-10">
            <div>
              <Mono className="text-accent mb-6 block">Legacy_Manifesto</Mono>
              <h2 className="text-5xl md:text-6xl font-serif italic mb-8">About Us.</h2>
              <p className="text-lg text-secondary leading-relaxed">
                The AI Collective is a non-profit, grassroots community uniting <span className="text-white">150,000+ pioneers</span> – founders, researchers, operators, and investors – exploring the frontier of AI.
              </p>
            </div>
            <p className="text-secondary leading-relaxed font-light">
              From its humble beginnings as an intimate gathering in a cozy San Francisco apartment, we've blossomed into a vibrant global community built on the belief that the most meaningful connections are made when exploring a shared curiosity together.
            </p>
            <a 
              href="https://www.aicollective.com/why"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.3em] text-accent hover:text-accent/90 transition-all"
            >
              Learn More About Our Mission <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* Values & Why */}
      <section className="pt-16 pb-32 px-6 md:px-12 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10 border border-white/10">
          <div className="bg-[#0c0a09] p-16 border-b md:border-b-0 md:border-r border-white/10">
            <Mono className="text-accent mb-8 block">Cultural_Directives</Mono>
            <h2 className="text-5xl font-serif italic mb-8">Our Values.</h2>
            <p className="text-secondary leading-relaxed mb-12 font-light">
              Our community is built on three core values that guide everything we do. These values shape our events, research, and interactions, ensuring that we create a space where diverse voices are heard and meaningful progress is made.
            </p>
            <div className="space-y-6">
              {["Trust & Integrity", "Radical Curiosity", "Human-Centered Innovation"].map((v, i) => (
                <div key={i} className="flex items-center gap-4 group cursor-default">
                  <div className="w-2 h-2 rounded-full bg-accent/40 group-hover:bg-accent transition-colors" />
                  <span className="text-sm font-mono tracking-widest text-white/60 group-hover:text-white transition-colors">{v}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-[#0c0a09] p-16">
            <Mono className="text-accent mb-8 block">Foundational_Thesis</Mono>
            <h2 className="text-5xl font-serif italic mb-8">Our Why.</h2>
            <p className="text-secondary leading-relaxed mb-12 font-light">
              We believe that the development of AI should be collaborative, transparent, and human-centered. Our mission is rooted in nine core beliefs about AI's trajectory and humanity's role in shaping it.
            </p>
            <p className="text-secondary leading-relaxed mb-10 italic">
              "The future of AI will be shaped by the conversations happening today. By bringing together the brightest minds across disciplines, we ensure that this future is one where AI serves as a force for human flourishing."
            </p>
            <a 
              href="https://www.aicollective.com/trust"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 text-[10px] font-mono font-normal uppercase tracking-[0.3em] text-accent hover:text-accent/90 transition-colors group"
            >
              Founding Perspective <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* How We Gather */}
      <section className="py-32 bg-white/[0.01] border-y border-white/5 overflow-hidden">
        <div className="px-6 md:px-12 max-w-[1400px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-20 items-end mb-24">
            <div className="lg:w-1/2">
              <Mono className="text-accent mb-6 block">Interaction_Framework</Mono>
              <h2 className="text-6xl font-serif italic mb-8">How We Gather.</h2>
              <p className="text-secondary text-lg leading-relaxed">
                We bring our community together through diverse, intentional gatherings designed for deep connection and meaningful dialogue. From intimate living room meetups to large-scale demo nights, every event centers on <span className="text-white">thoughtful conversation</span> and shared exploration.
              </p>
            </div>
            <div className="lg:w-1/2 lg:text-right pb-4">
              <a
                href="https://www.instagram.com/aicseattle/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-4 bg-accent text-black border border-accent px-8 py-5 text-[10px] font-mono font-bold uppercase tracking-[0.3em] hover:bg-white hover:text-black hover:border-white transition-all group"
              >
                Our Instagram
                <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { src: "/gather-1.png", alt: "Community gathering with hands raised" },
              { src: "/gather-2.png", alt: "Casual work session with food and laptops" },
              { src: "/gather-3.png", alt: "Fireside chat panel discussion" },
              { src: "/gather-4.png", alt: "Large event space with tables and presentations" }
            ].map((image, i) => (
              <div key={i} className="aspect-square bg-white/5 border border-white/5 relative overflow-hidden group">
                <Image 
                  src={image.src} 
                  alt={image.alt} 
                  fill 
                  className="object-cover group-hover:scale-110 transition-all duration-1000" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a09] to-transparent opacity-0 group-hover:opacity-80 transition-opacity" />
                <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                  <Mono className="text-white text-[8px]">Event_Fragment_0{i+1}</Mono>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Thank You to Our Sponsors & Partners */}
      <section id="partnerships" className="py-32 px-6 md:px-12 max-w-[1400px] mx-auto border-t border-white/5">
        <div className="mb-16">
          <Mono className="text-accent mb-6 block">Close_Friends</Mono>
          <h2 className="text-5xl md:text-6xl font-serif italic mb-6">Thank You to Our Sponsors & Partners.</h2>
          <p className="text-secondary text-lg leading-relaxed max-w-2xl">
            We are grateful for the continued support of our mission and community. These organizations help make our events, research, and gatherings possible.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="space-y-8">
            <div>
              <Mono className="text-accent/80 text-[9px] mb-4 block">Premier Partners</Mono>
              <ul className="space-y-3">
                {["Silicon Valley Bank", "Madrona", "Windsurf", "Fenwick & West LLP"].map((name) => (
                  <li key={name} className="text-white font-mono text-sm tracking-widest uppercase">
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="space-y-8">
            <div>
              <Mono className="text-accent/80 text-[9px] mb-4 block">Strategic Partners</Mono>
              <ul className="flex flex-wrap gap-x-6 gap-y-3">
                {[
                  "Meta",
                  "Anthropic",
                  "Andreessen Horowitz",
                  "Microsoft",
                  "Norwest Venture Partners",
                  "Lovable",
                  "Mercury",
                  "Linux Foundation",
                  "Product Hunt",
                  "Stanford Law School",
                  "TED AI",
                  "GitHub",
                  "Fidelity",
                  "Amazon Web Services",
                  "Notion",
                  "Oracle",
                  "Roam",
                ].map((name) => (
                  <li key={name} className="text-white font-mono text-xs tracking-widest uppercase">
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-white/10">
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSelDyidSPMTyFagOEp7AYuRXH8-Wt8JgJqCwGnR_puhUScyJg/viewform"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-4 bg-accent text-black px-8 py-5 text-[10px] font-mono font-bold uppercase tracking-[0.3em] hover:bg-white transition-all border-2 border-accent group"
          >
            Sponsor us
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-32 bg-white/[0.02] border-y border-white/5">
        <div className="px-6 md:px-12 max-w-[1400px] mx-auto">
          <div className="max-w-3xl mb-24">
            <Mono className="text-accent mb-6 block">The_Human_Layer</Mono>
            <h2 className="text-6xl md:text-7xl font-serif italic mb-8">Meet the Seattle Team.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10">
            {team.map((member, i) => (
              <a
                key={i}
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#0c0a09] p-10 flex flex-col group relative overflow-hidden block border border-transparent hover:border-accent/20 transition-colors"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 -mr-12 -mt-12 rotate-45 group-hover:bg-accent/10 transition-colors" />
                <div className="mb-8 relative w-16 h-16 rounded-full overflow-hidden">
                  <div className="absolute inset-0 border border-accent/20 -m-1 group-hover:m-0 transition-all rounded-full" />
                  <Image src={member.img} alt={member.name} width={64} height={64} className="object-cover w-full h-full" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-2xl font-serif italic">{member.name}</h3>
                  <span className="text-secondary group-hover:text-accent transition-colors">
                    <Linkedin size={16} />
                  </span>
                </div>
                <Mono className="text-accent/60 mb-6 block text-[9px]">{member.role}</Mono>
                <p className="text-secondary text-sm leading-relaxed font-light">
                  {member.bio}
                </p>
                <div className="mt-auto pt-10 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                  <Mono className="text-[8px]">PROFILE_00{i+1}</Mono>
                  <span className="text-secondary group-hover:text-accent transition-colors">
                    <ArrowUpRight size={14} />
                  </span>
                </div>
              </a>
            ))}
            {/* Join the team CTA card */}
            <a
              id="get-involved"
              key="cta"
              href="https://docs.google.com/forms/d/e/1FAIpQLSexvCAcYFJASap0tDcu29esoWj-56x87gcoUKj0HQfQ9GbczA/viewform?usp=header"
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-full bg-accent p-10 flex flex-col items-center text-center group relative overflow-hidden border border-transparent hover:border-black/20 transition-colors text-black"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-black/5 -mr-12 -mt-12 rotate-45 group-hover:bg-black/10 transition-colors" />
              <h3 className="text-5xl md:text-6xl font-serif italic mb-6 text-black">You?</h3>
              <p className="text-black text-lg leading-relaxed font-normal mb-8 max-w-xl">
                We&apos;re always looking for volunteers to help organize events and shape the future of AI in Seattle.
              </p>
              <div className="mt-auto pt-6">
                <span className="inline-flex items-center justify-center gap-2 py-4 px-6 bg-black text-white text-base font-mono font-bold uppercase tracking-[0.2em] border-2 border-black group-hover:bg-white group-hover:text-black transition-colors">
                  Apply to volunteer
                  <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Join Section */}
      <section id="join-collective" className="py-40 bg-accent text-black relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] border border-black/20 rounded-full -mr-96 -mt-96" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] border border-black/20 rounded-full -mr-64 -mt-64" />
        </div>
        
        <div className="px-6 md:px-12 max-w-[1400px] mx-auto text-center relative z-10">
          <h2 className="text-6xl md:text-8xl font-serif italic mb-12 tracking-tighter">Explore the global collective.</h2>
          <a 
            href="https://www.aicollective.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-4 bg-black text-white px-12 py-6 text-xs font-mono font-bold uppercase tracking-[0.4em] border-2 border-black hover:bg-white hover:text-black transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] group"
          >
            ＼(＾O＾)／
            <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-32 pb-16 px-6 md:px-12 bg-[#0c0a09] border-t border-white/5">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row lg:justify-between lg:items-start gap-12">
          <div>
            <div className="flex flex-wrap gap-16">
              <div className="space-y-6">
                <Mono className="text-white block mb-4">Legal</Mono>
                <div className="flex flex-wrap gap-x-8 gap-y-2">
                  <a href="https://www.aicollective.com/files/Code%20of%20Conduct%20~%20The%20AI%20Collective.pdf" target="_blank" rel="noopener noreferrer" className="block text-xs text-secondary hover:text-white transition-colors uppercase font-mono tracking-widest">Code of Conduct</a>
                  <a href="https://www.aicollective.com/files/Data%20Privacy%20and%20Use%20Policy%20~%20The%20AI%20Collective.pdf" target="_blank" rel="noopener noreferrer" className="block text-xs text-secondary hover:text-white transition-colors uppercase font-mono tracking-widest">Privacy Policy</a>
                  <a href="https://www.aicollective.com/press" target="_blank" rel="noopener noreferrer" className="block text-xs text-secondary hover:text-white transition-colors uppercase font-mono tracking-widest">Press Kit</a>
                </div>
              </div>
              <div className="space-y-6">
                <Mono className="text-white block mb-4">Social</Mono>
                <div className="flex flex-wrap gap-x-8 gap-y-2">
                  <a href="https://www.instagram.com/aicseattle/" target="_blank" rel="noopener noreferrer" className="block text-xs text-secondary hover:text-white transition-colors uppercase font-mono tracking-widest">Instagram</a>
                  <a href="https://www.linkedin.com/company/ai-collective-seattle/" target="_blank" rel="noopener noreferrer" className="block text-xs text-secondary hover:text-white transition-colors uppercase font-mono tracking-widest">LinkedIn</a>
                </div>
              </div>
            </div>
            <p className="mt-16 pt-8 border-t border-white/5 text-[9px] font-mono text-secondary uppercase tracking-[0.3em]">
              Made with <span className="text-accent">❤</span> in Seattle
            </p>
            {process.env.NEXT_PUBLIC_LAST_UPDATED && (
              <p className="mt-4 text-[9px] font-mono text-secondary/70 uppercase tracking-[0.2em]">
                Last updated:{" "}
                {new Date(process.env.NEXT_PUBLIC_LAST_UPDATED).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "America/Los_Angeles",
                })}
              </p>
            )}
          </div>
          <div className="hidden lg:flex lg:justify-center lg:items-center lg:w-[200px] shrink-0">
            <Image
              src="/logo-footer.png"
              alt="The AI Collective"
              width={200}
              height={200}
              className="w-[200px] h-auto object-contain"
            />
          </div>
        </div>
      </footer>
    </main>
  );
}
