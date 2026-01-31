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
  Zap,
  Shield,
  Search,
  Menu,
  X,
  Calendar,
  Users,
  ExternalLink,
  MapPin,
  Clock
} from "lucide-react";
import Image from "next/image";

const Mono = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`font-mono text-[10px] uppercase tracking-[0.2em] text-accent ${className}`}>
    {children}
  </span>
);

const GLOBE_AMBER = [245 / 255, 158 / 255, 11 / 255] as [number, number, number];

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
      dark: 0.2,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 12,
      baseColor: GLOBE_AMBER,
      markerColor: GLOBE_AMBER,
      glowColor: GLOBE_AMBER,
      markers: [],
      onRender: (state) => {
        state.phi = phi;
        phi += 0.003;
      },
    });

    return () => globe.destroy();
  }, []);

  return (
    <div className="relative w-full aspect-square max-w-[600px] mx-auto opacity-70 transition-all duration-1000">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', maxWidth: '100%', aspectRatio: '1' }}
      />
    </div>
  );
};

const CONSOLE_LOGS = [
  "SYNCING_SEA_NODES",
  "POLLING_COMMUNITY_METRICS",
  "VERIFYING_PROTOCOL_V2",
  "ENCRYPTING_SHARED_INTELLIGENCE",
  "UPLOADING_EVENT_TELEMETRY",
  "CONNECTION_ESTABLISHED",
];

const ConsoleSystem = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % CONSOLE_LOGS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="font-mono text-[9px] text-secondary/40 leading-none h-4 flex items-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div 
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2"
        >
          <span className="w-1 h-1 bg-accent animate-pulse shrink-0" />
          {CONSOLE_LOGS[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAllPastEvents, setShowAllPastEvents] = useState(false);

  const pastEvents = [
    { title: "ConvergeAI Summit - Rethinking AI: Challenging the Status Quo", type: "Summit", date: "Thu, Oct 23rd, 2025", time: "9am-5pm", ago: "3 months ago" },
    { title: "The AI Collective Seattle X Pioneer Square Labs | Technical AI Roundtable", type: "Roundtable", date: "Wed, Sep 24th, 2025", time: "6-9pm", ago: "4 months ago" },
    { title: "The AI Collective Seattle | Make.com - Let's Build and Automate", type: "Workshop", date: "Mon, Dec 15th, 2025", time: "5-9pm", ago: "2 months ago" },
    { title: "Why We Invested: VC × Founder Case Studies", type: "Forum", date: "Wed, Dec 3rd, 2025", time: "5:30-7:30pm", ago: "2 months ago" },
    { title: "The AI Collective Seattle x AI Student Collective UW | Why We Invested: VC × Founder Case Studies", type: "Forum", date: "Tue, Dec 2nd, 2025", time: "5:30-7:30pm", ago: "2 months ago" },
    { title: "AISC @ UW Demo Day Batch 02 | The AI Collective Seattle", type: "Demo Night", date: "Thu, Nov 20th, 2025", time: "6:30-8:30pm", ago: "2 months ago" },
    { title: "The AI Collective Seattle x Innomat AI | The Robotic AI Revolution", type: "Meetup", date: "Thu, Nov 13th, 2025", time: "5-7pm", ago: "3 months ago" },
    { title: "AI Collective Seattle X Vercept: Madrona IA Summit Roundtable 2025", type: "Forum", date: "Tue, Sep 30th, 2025", time: "3-5pm", ago: "4 months ago" },
    { title: "Windsurf Open Build powered by The AI Collective", type: "Workshop", date: "Wed, Aug 27th, 2025", time: "5-7:30pm", ago: "5 months ago" },
    { title: "Scoop & Scale: Ice Cream Social for Founders & Funders 🍦", type: "Meetup", date: "Mon, Jul 28th, 2025", time: "8:30-9:30pm", ago: "6 months ago" },
    { title: "Zero to Product: Building with 100% AI", type: "Workshop", date: "Fri, Jul 25th, 2025", time: "1-3:30pm", ago: "6 months ago" },
    { title: "Seattle Demo Day - ROAM", type: "Demo Night", date: "Tue, May 27th, 2025", time: "6-9pm", ago: "8 months ago" },
    { title: "Demos & Discussions: 🧠GenAI Collective x Madrona Ventures", type: "Demo Night", date: "Thu, Jan 30th, 2025", time: "4:30-7pm", ago: "12 months ago" },
    { title: "GenAI Collective x Madrona ☔ Seattle Frontier Technologies Forum", type: "Forum", date: "Tue, Oct 1st, 2024", time: "3:30-5:30pm", ago: "Over 1 year ago" },
  ];

  const visibleEvents = showAllPastEvents ? pastEvents : pastEvents.slice(0, 3);

  const team = [
    {
      name: "Bhola Chhetri",
      role: "SEATTLE CHAPTER LEAD",
      bio: "Bhola is a Solutions Architect at Broadcom and the founder of CropTop. He's deeply passionate about go-to-market initiatives for businesses and individuals. Outside of work, Bhola loves cars, events, and traveling.",
      img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
    },
    {
      name: "Michael A. Agustin",
      role: "HEAD OF GROWTH",
      bio: "Michael Agustin has nearly 3 decades for experience building technical ecosystems across multiple parts of the world, for the IGDA, Apple, Malaysia (MaGIC), and VRARA. He’s raised over $30M from investors across 3 ventures. Michael previously worked at Apple on macOS’ Platform Experience team and built the 1st no-code solution for mobile, reaching 150M players per month by the time he vested. He recently co-founded Curie, focused on Commerce World Models for Physical AI.",
      img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200"
    },
    {
      name: "Ajita Ananth",
      role: "EVENTS LEAD",
      bio: "Ajita K Ananth is a Staff Technical Program Manager at Google where she leads engineering programs within Google Maps. Prior to Google, she led major product and technical initiatives at Coinbase and DocuSign. She thrives on empowering teams to tackle challenging engineering problems, and shipping products that improve people's lives. Outside of work, she loves trying new restaurants, and traveling to new countries.",
      img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200"
    },
    {
      name: "Samridh Bhattacharjee",
      role: "GROWTH/COMMUNITY ORGANIZER",
      bio: "Samridh is an AI Product Manager at Mircosoft AI and the co-founder of Claimrunner. He’s deeply passionate about advancing the human condition through AI and helping others however he can. Outside of work, Samridh enjoys golf, tennis, and DJ’ing 🎧",
      img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200"
    },
    {
      name: "Gurucharan Lingamallu",
      role: "NEWS/MEDIA CURATOR",
      bio: "Guru is a Computer Science student at the University of Washington focused on AI, systems, and human-centered technology. He’s interested in how tools shape memory, agency, and ownership, and focuses on building systems grounded in trust.",
      img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200"
    },
    {
      name: "Cyndi Song",
      role: "SEATTLE CHAPTER ORGANIZER",
      bio: "Cyndi is a Product Strategist and Chief of Staff at Google Cloud. Beyond her day job, she is deeply embedded in the Seattle startup ecosystem as the Chapter Lead for 12 Scrappy Founders, where she connects entrepreneurs to support their startup journeys. Driven by a passion for human-centered AI, she spends her downtime at hackathons prototyping new products, with a recent focus on voice agents. When she isn't building, she loves aerial yoga and dancing.",
      img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200"
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
            <span className="font-bold tracking-widest uppercase text-sm font-mono">AIC_SEA</span>
          </div>
          <div className="hidden xl:flex gap-8 border-l border-white/10 pl-12">
            {["About Us", "Chapters", "Events", "Get Involved", "Partnerships"].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`} className="text-[9px] uppercase tracking-[0.3em] text-secondary hover:text-accent transition-colors font-mono">
                {item}
              </a>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="hidden lg:block">
            <ConsoleSystem />
          </div>
          <button 
            onClick={() => window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: "https://tally.so/r/n0r0xR" } }, "*")}
            className="bg-accent text-black px-5 py-2 text-[9px] font-mono font-bold hover:bg-white transition-all uppercase tracking-[0.2em] shadow-[3px_3px_0px_0px_rgba(245,158,11,0.2)]"
          >
            Apply_Member
          </button>
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
            {["About Us", "Chapters", "Events", "Get Involved", "Partnerships"].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`} onClick={() => setIsMenuOpen(false)} className="text-5xl font-serif italic text-white hover:text-accent transition-colors">
                {item}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-6 md:px-12 max-w-[1400px] mx-auto min-h-[90vh] flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-px bg-accent/50" />
              <Mono className="text-accent">Seattle Chapter_04</Mono>
            </div>
            <h1 className="text-6xl md:text-[7rem] font-serif leading-[0.9] tracking-tighter mb-10">
              The AI<br />
              <span className="italic text-accent">Collective.</span>
            </h1>
            <p className="text-xl md:text-2xl text-secondary font-light max-w-lg leading-relaxed mb-12 border-l border-accent/20 pl-8">
              Join our vibrant AI community in Seattle! Connect with local pioneers and innovators shaping the future of AI through <span className="text-white">meaningful gatherings</span> and collaborative exploration.
            </p>
            <div className="flex flex-wrap gap-6">
              <button 
                onClick={() => window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: "https://tally.so/r/n0r0xR" } }, "*")}
                className="group flex items-center gap-4 bg-white/5 border border-white/10 px-8 py-5 hover:bg-white hover:text-black transition-all"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold">Join Our Chapter</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="group flex items-center gap-4 border border-white/10 px-8 py-5 hover:border-accent transition-all">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em]">Partner With Us</span>
                <ExternalLink size={14} className="text-secondary group-hover:text-accent" />
              </button>
            </div>
          </div>
          
          <div className="relative flex justify-center items-center group">
            <div className="absolute inset-0 bg-radial-gradient from-accent/10 to-transparent blur-[120px] rounded-full opacity-50" />
            <Globe />
            <div className="absolute bottom-4 left-4 p-6 border border-white/10 bg-background/60 backdrop-blur-md hidden md:block w-56">
              <div className="flex justify-between items-start mb-4">
                <Mono className="text-accent/60 text-[8px]">Network_Pulse</Mono>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              </div>
              <div className="space-y-3">
                <div className="h-1 bg-white/5 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "78%" }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                    className="h-full bg-accent"
                  />
                </div>
                <div className="flex justify-between text-[8px] font-mono text-secondary">
                  <span>LATENCY</span>
                  <span className="text-white">12.4ms</span>
                </div>
                <div className="flex justify-between text-[8px] font-mono text-secondary">
                  <span>ACTIVE_NODES</span>
                  <span className="text-white">1,402</span>
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
            <button className="text-[10px] font-mono uppercase tracking-widest text-secondary hover:text-accent transition-colors flex items-center gap-2 group">
              See All Events <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="border border-white/10 bg-[#0c0a09] p-12 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Calendar className="w-12 h-12 text-accent/20 mx-auto mb-6" />
            <p className="text-secondary font-mono text-sm tracking-widest mb-2">NO UPCOMING EVENTS AT THIS TIME.</p>
            <p className="text-white/40 text-[10px] font-mono">CHECK BACK SOON FOR UPDATES.</p>
          </div>
        </div>
      </section>

      {/* Past Events */}
      <section className="py-24 px-6 md:px-12 max-w-[1400px] mx-auto">
        <div className="mb-16">
          <Mono className="text-secondary/40 mb-4 block">Archive_Log</Mono>
          <h2 className="text-5xl font-serif italic">Past Events.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleEvents.map((event, i) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={event.title} 
              className="group border border-white/5 bg-white/[0.02] p-8 hover:border-accent/30 transition-all flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-6">
                <span className="text-[8px] font-mono border border-accent/20 text-accent px-2 py-1 uppercase tracking-widest">
                  {event.type}
                </span>
                <span className="text-[9px] font-mono text-secondary">{event.ago}</span>
              </div>
              <h3 className="text-lg font-serif italic leading-snug mb-8 group-hover:text-accent transition-colors flex-grow">
                {event.title}
              </h3>
              <div className="pt-6 border-t border-white/5 space-y-2">
                <div className="flex items-center gap-3 text-secondary font-mono text-[9px]">
                  <Calendar size={10} className="text-accent/40" />
                  {event.date}
                </div>
                <div className="flex items-center gap-3 text-secondary font-mono text-[9px]">
                  <Clock size={10} className="text-accent/40" />
                  {event.time}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <button 
            onClick={() => setShowAllPastEvents(!showAllPastEvents)}
            className="text-[10px] font-mono uppercase tracking-[0.3em] text-secondary hover:text-white transition-colors border-b border-white/10 pb-1"
          >
            {showAllPastEvents ? "View Less_Archives" : "View More_Archives"}
          </button>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-32 bg-white/[0.02] border-y border-white/5">
        <div className="px-6 md:px-12 max-w-[1400px] mx-auto">
          <div className="max-w-3xl mb-24">
            <Mono className="text-accent mb-6 block underline underline-offset-8 decoration-accent/20">The_Human_Layer</Mono>
            <h2 className="text-6xl md:text-7xl font-serif italic mb-8">Meet the Seattle Team.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10">
            {team.map((member, i) => (
              <div key={i} className="bg-[#0c0a09] p-10 flex flex-col group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 -mr-12 -mt-12 rotate-45 group-hover:bg-accent/10 transition-colors" />
                <div className="mb-8 relative w-16 h-16 grayscale group-hover:grayscale-0 transition-all duration-500">
                  <div className="absolute inset-0 border border-accent/20 -m-1 group-hover:m-0 transition-all" />
                  <Image src={member.img} alt={member.name} width={64} height={64} className="object-cover w-full h-full" />
                </div>
                <h3 className="text-2xl font-serif italic mb-2">{member.name}</h3>
                <Mono className="text-accent/60 mb-6 block text-[9px]">{member.role}</Mono>
                <p className="text-secondary text-sm leading-relaxed font-light">
                  {member.bio}
                </p>
                <div className="mt-auto pt-10 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                  <Mono className="text-[8px]">PROFILE_00{i+1}</Mono>
                  <ArrowUpRight size={14} className="text-secondary group-hover:text-accent" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Us / Launch Video */}
      <section id="about-us" className="py-32 px-6 md:px-12 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="aspect-video w-full overflow-hidden border border-white/10 bg-white/5">
            <iframe
              src="https://www.youtube.com/embed/36i7pkaHqow?start=9"
              title="About Us - AI Collective Seattle"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          
          <div className="space-y-10">
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
            <button className="group flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.3em] text-accent border-b border-accent/20 pb-1 hover:border-accent transition-all">
              Learn More About Our Mission <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </button>
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
              <button className="bg-white/5 border border-white/10 px-8 py-5 text-[10px] font-mono uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all">
                Explore Events Archive
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-square bg-white/5 border border-white/5 relative grayscale hover:grayscale-0 transition-all duration-700 overflow-hidden group">
                <Image 
                  src={`https://images.unsplash.com/photo-${1515187029135 + i}?auto=format&fit=crop&q=80&w=600`} 
                  alt={`Event ${i}`} 
                  fill 
                  className="object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a09] to-transparent opacity-0 group-hover:opacity-80 transition-opacity" />
                <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                  <Mono className="text-white text-[8px]">Event_Fragment_0{i}</Mono>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values & Why */}
      <section className="py-32 px-6 md:px-12 max-w-[1400px] mx-auto">
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
            <button className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-[0.3em] text-white hover:text-accent transition-colors group">
              Founding Perspective <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Join Section */}
      <section id="get-involved" className="py-40 bg-accent text-black relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] border border-black/20 rounded-full -mr-96 -mt-96" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] border border-black/20 rounded-full -mr-64 -mt-64" />
        </div>
        
        <div className="px-6 md:px-12 max-w-[1400px] mx-auto text-center relative z-10">
          <Mono className="text-black/60 mb-8 block tracking-[0.5em]">Network_Expansion_Protocol</Mono>
          <h2 className="text-6xl md:text-8xl font-serif italic mb-12 tracking-tighter">Join Our Team.</h2>
          <p className="text-xl max-w-2xl mx-auto mb-16 leading-relaxed">
            Get involved with our chapter! We're always looking for passionate volunteers to help organize events and shape the future of AI in our community.
          </p>
          <button 
            onClick={() => window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: "https://tally.so/r/n0r0xR" } }, "*")}
            className="bg-black text-white px-12 py-6 text-xs font-mono font-bold uppercase tracking-[0.4em] hover:bg-white hover:text-black transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)]"
          >
            Apply_To_Volunteer
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-32 pb-16 px-6 md:px-12 bg-[#0c0a09] border-t border-white/5">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-16 mb-24">
            <div className="col-span-2 space-y-8">
              <div className="font-serif italic text-3xl font-bold tracking-tighter">AIC.</div>
              <p className="text-secondary text-sm max-w-xs leading-relaxed">
                Exploring the frontier of intelligence through meaningful connection and collaborative research.
              </p>
              <div className="flex gap-4">
                {["Slack", "LinkedIn", "Twitter", "YouTube"].map((social) => (
                  <button key={social} className="w-10 h-10 border border-white/10 flex items-center justify-center hover:border-accent hover:text-accent transition-all">
                    <span className="text-[10px] font-mono uppercase">{social[0]}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-6">
              <Mono className="text-white block mb-4">Navigation</Mono>
              {["About Us", "Community", "Institute", "Partnerships", "Chapters"].map(link => (
                <a key={link} href="#" className="block text-xs text-secondary hover:text-white transition-colors uppercase font-mono tracking-widest">{link}</a>
              ))}
            </div>

            <div className="space-y-6">
              <Mono className="text-white block mb-4">Chapters</Mono>
              {["San Francisco", "New York City", "Washington DC", "Seattle", "Chicago"].map(link => (
                <a key={link} href="#" className="block text-xs text-secondary hover:text-white transition-colors uppercase font-mono tracking-widest">{link}</a>
              ))}
            </div>

            <div className="space-y-6">
              <Mono className="text-white block mb-4">Get Involved</Mono>
              {["Join Community", "Attend Event", "Local Team", "Start Chapter", "Global Roles"].map(link => (
                <a key={link} href="#" className="block text-xs text-secondary hover:text-white transition-colors uppercase font-mono tracking-widest">{link}</a>
              ))}
            </div>

            <div className="space-y-6">
              <Mono className="text-white block mb-4">Legal</Mono>
              {["Code of Conduct", "Privacy Policy", "Press Kit", "Team Login"].map(link => (
                <a key={link} href="#" className="block text-xs text-secondary hover:text-white transition-colors uppercase font-mono tracking-widest">{link}</a>
              ))}
            </div>
          </div>
          
          <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="text-[9px] font-mono text-secondary uppercase tracking-[0.3em]">
              © 2026 THE AI COLLECTIVE. MADE WITHIN <span className="text-accent">❤</span> AND AROUND THE WORLD.
            </div>
            <div className="flex gap-8 text-[9px] font-mono text-secondary/40 uppercase tracking-[0.2em]">
              <span>EST. SF_2023</span>
              <span>VER_4.2.0_SEA</span>
              <span className="text-white/20">47.6062° N, 122.3321° W</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
