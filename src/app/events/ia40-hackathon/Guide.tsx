"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, Check, Copy, MapPin, Calendar, Laptop, Wifi, Flame, FileStack, HeartPulse, Trophy } from "lucide-react";

// Pacific Daylight Time on the day of the event.
const DAY = "2026-09-29";
const OFFSET = "-07:00";

const SCHEDULE = [
  { start: "12:30", end: "13:00", time: "12:30 PM", what: "Doors open and check-in", dur: "30 min" },
  { start: "13:00", end: "13:15", time: "1:00 PM", what: "Kickoff and rules", dur: "15 min" },
  { start: "13:15", end: "13:30", time: "1:15 PM", what: "Team formation", dur: "15 min" },
  { start: "13:30", end: "15:45", time: "1:30 PM", what: "Build begins", dur: "2 h 30 min to build" },
  { start: "15:45", end: "16:00", time: "3:45 PM", what: "Submission form sent by email and posted on Orena", dur: "15 min to submit" },
  { start: "16:00", end: "16:15", time: "4:00 PM", what: "Submissions close, and the top 5 finalists are selected", dur: "15 min" },
  { start: "16:15", end: "16:45", time: "4:15 PM", what: "Live demos from the top 5 finalists, 5 minutes each", dur: "30 min" },
  { start: "16:45", end: "16:55", time: "4:45 PM", what: "Judges deliberate and vote", dur: "10 min" },
  { start: "16:55", end: "17:00", time: "4:55 PM", what: "Winners announced", dur: "5 min" },
  { start: "17:00", end: "19:00", time: "5:00 PM", what: "IA40 Welcome Reception", dur: "" },
];

const FOCUS_AREAS = [
  {
    title: "AI that gives people more agency",
    body: "Put people back in charge of their own day. Fewer forms, fewer waits, fewer dead ends, and more say in what happens next.",
  },
  {
    title: "Tools for trust and digital safety",
    body: "Help people tell what's real and protect what's theirs. Every scam caught early is an evening someone doesn't lose to cleanup.",
  },
];

const IDEAS = [
  "AI that takes action",
  "AI that runs a function or workflow",
  "AI that handles work people usually ignore",
  "AI that makes someone meaningfully better at their job",
  "AI with memory, evals, guardrails, or real-world execution",
  "Or something completely new",
];

const V0_RATES = [
  { model: "Mini", input: "$0.20", output: "$1.20" },
  { model: "Pro", input: "$2", output: "$10" },
  { model: "Max", input: "$5", output: "$25" },
  { model: "Max Fast", input: "$10", output: "$50" },
];

const PRIZES = [
  { place: "1st", vercel: "$30,000", openai: "$10,000" },
  { place: "2nd", vercel: "$12,000", openai: "$5,000" },
  { place: "3rd", vercel: "$2,400", openai: "$1,000" },
];

const WINNERS = [
  {
    place: "1st",
    rank: 1,
    icon: Flame,
    tagline: "AI air-attack command for wildfires",
    prize: "$30,000 Vercel · $10,000 OpenAI",
    name: "FireLine",
    team: "Jacob Lee, Jay Shivanna, Graeme Huntley",
    summary:
      "A command console for wildfire air attack. An AI planner reads a live fire map and assigns tankers and helicopters to fire sectors. Every order passes a fixed safety check that blocks unsafe drops, and if the AI fails, a rules-based planner takes over. It also includes a 3D terrain view, alerts to crew phones, supervisor approval steps, synthetic radio voices and a replay of the Lahaina fire. It ran on a simulated fire world, and the team built it from scratch during the event, with 18 commits.",
  },
  {
    place: "2nd",
    rank: 2,
    icon: FileStack,
    tagline: "Boxes of paper into organized records",
    prize: "$12,000 Vercel · $5,000 OpenAI",
    name: "DocHand",
    team: "Sam Crombie, Amaya Kejriwal, Morgan White, Arpitha Dhanapathi, Shweta Jindal",
    summary:
      "Turns boxes of paper into organized digital records. You photograph pages with an iPhone, and the app flags blurry, glare-covered or cut-off shots. Text recognition and voice-note transcription run on a Mac. An agent then groups loose pages into documents, puts them back in order, and pulls out key details, action items, names and mismatches onto a live board.",
  },
  {
    place: "3rd",
    rank: 3,
    icon: HeartPulse,
    tagline: "Medical trip reimbursements, filled in",
    prize: "$2,400 Vercel · $1,000 OpenAI",
    name: "WA Medicaid Helper",
    team: "Adam Burgh, solo",
    summary:
      "A ChatGPT/Codex plugin that helps Washington Medicaid members get reimbursed for trips to medical appointments. It matches MyChart visits against Google Calendar, fills in the Hopelink trip-reimbursement forms, and lists anything still missing. The user reviews everything, and it never submits on its own. Adam's pitch: the paperwork takes about 10 minutes per trip for a $2.50–$5 reimbursement, so most people never claim it.",
  },
];

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "winners", label: "Winners" },
  { id: "schedule", label: "Schedule" },
  { id: "challenge", label: "Challenge" },
  { id: "credits", label: "Credits" },
  { id: "bring", label: "What to bring" },
  { id: "prizes", label: "Prizes" },
];

// Narration: an authored script, one segment per section, written to be heard.
const NARRATION = [
  "Welcome to the I A forty Hackathon, Harnessing the Value of AI, Building Agency. This year's theme is technology that gives time back. It's presented by Madrona with Vercel and Open A I, in partnership with AI Collective Seattle. It runs Tuesday, September twenty ninth, from one to five in the afternoon, at the Four Seasons Seattle, ninety nine Union Street, on the second floor. Check-in opens at twelve thirty. The WiFi network and password are on this page, with copy buttons. Please arrive before kickoff to make sure you get a spot, and update your R S V P if you can no longer come.",
  "And the winners. First place went to FireLine, by Jacob Lee, Jay Shivanna and Graeme Huntley: a command console for wildfire air attack, where an AI planner assigns tankers and helicopters to fire sectors, and every order passes a fixed safety check. Second place went to DocHand, by Sam Crombie, Amaya Kejriwal, Morgan White, Arpitha Dhanapathi and Shweta Jindal, which turns boxes of paper into organized digital records. Third place went to W A Medicaid Helper, by Adam Burgh, a Chat G P T and Codex plugin that helps Washington Medicaid members get reimbursed for trips to medical appointments. Congratulations to all three teams.",
  "Here's the afternoon. Doors open at twelve thirty. Kickoff and rules at one. Team formation at one fifteen. Building starts at one thirty, and you have two and a half hours. At three forty five, the submission form goes out by email and on Orena, and submissions close at four. The top five finalists then demo live, five minutes each, starting at four fifteen. Judges deliberate at four forty five, winners are announced at four fifty five, and the I A forty Welcome Reception starts at five.",
  "The theme is technology that gives time back. Every hour a tool hands back is an hour someone spends with family, on the work they care about, or simply resting. This year, two areas matter most. AI that gives people more agency over their own day. And tools for trust and digital safety, so people can tell what's real and protect what's theirs. Whatever you pick, build something with real agency. Not AI that only advises, summarizes, or drafts, but AI that does useful work. Think AI that takes action, runs a workflow, handles work people usually ignore, or makes someone meaningfully better at their job. Memory, evals, guardrails and real-world execution all count. So does something completely new. Come solo, or find a team.",
  "Every participant gets four credit codes. From Vercel, one for v zero, Vercel's AI app builder, which pays for the model tokens it uses as it writes your app. And one for the A I Gateway, a single A P I key for models from Open A I, Anthropic, Google and others, billed at each provider's list price with no markup. Pick a cheaper v zero model for small edits to make the credits last. From Open A I, one hundred dollars of Codex credit and fifty dollars of A P I credit. The codes arrive by email after you check in. Ask the Vercel and Open A I staff on site if you get stuck.",
  "Bring your laptop and power cord. Snacks and drinks are provided. Before you arrive, install Node, sign in to Vercel with GitHub linked, and install the Vercel command line tool. Sign in to Chat G P T, and install the Codex command line tool or the VS Code extension. The install commands are on the page.",
  "Prizes. First place wins thirty thousand dollars in Vercel credits and ten thousand in Open A I credits. Second place wins twelve thousand and five thousand. Third wins two thousand four hundred and one thousand. Winners get their codes by email after the event. Good luck.",
];

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(
          () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          },
          () => {}
        );
      }}
      className="inline-flex items-center gap-1.5 border border-accent/40 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-accent hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent transition-colors"
      aria-label={`${label} ${text}`}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copied" : label}
    </button>
  );
}

function Command({ cmd }: { cmd: string }) {
  return (
    <div className="flex items-center gap-3 border border-white/10 bg-background px-3 py-2 min-w-0">
      <code className="flex-1 min-w-0 overflow-x-auto whitespace-nowrap font-mono text-[13px]">
        <span className="text-secondary">$ </span>
        {cmd}
      </code>
      <CopyButton text={cmd} />
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">{children}</p>;
}

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="space-y-3">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="text-3xl md:text-4xl font-serif text-balance">{title}</h2>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-white/10 bg-white/[0.03] p-6 space-y-4 min-w-0">
      <h3 className="text-2xl font-serif">{title}</h3>
      {children}
    </div>
  );
}

function Details({ summary, children }: { summary: string; children: React.ReactNode }) {
  return (
    <details className="group border border-white/10 bg-white/[0.03]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 font-medium [&::-webkit-details-marker]:hidden">
        {summary}
        <span className="font-mono text-accent group-open:hidden">+</span>
        <span className="hidden font-mono text-accent group-open:inline">−</span>
      </summary>
      <div className="space-y-4 px-6 pb-6">{children}</div>
    </details>
  );
}

function Steps({ children }: { children: React.ReactNode }) {
  return (
    <ol className="list-decimal space-y-2 pl-6 text-[15px] leading-relaxed marker:font-mono marker:text-accent max-w-[70ch]">
      {children}
    </ol>
  );
}

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4 hover:text-white">
      {children}
    </a>
  );
}

function useNow(intervalMs = 30000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [intervalMs]);
  return now;
}

const noopSubscribe = () => () => {};

type NarrationState = "idle" | "playing" | "paused";

function useNarration() {
  const supported = useSyncExternalStore(
    noopSubscribe,
    () => "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined",
    () => true
  );
  const [state, setState] = useState<NarrationState>("idle");
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState(`Audio walkthrough · ${NARRATION.length} sections · about 4 min`);
  const stateRef = useRef<NarrationState>("idle");

  const setBoth = (s: NarrationState) => {
    stateRef.current = s;
    setState(s);
  };

  useEffect(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    const onHidden = () => {
      if (document.hidden && stateRef.current !== "idle") {
        synth.cancel();
        setBoth("idle");
        setStatus("Stopped because the tab was hidden. Press Listen to start again.");
      }
    };
    const onUnload = () => synth.cancel();
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("beforeunload", onUnload);
      synth.cancel();
    };
  }, [supported]);

  const speak = (i: number) => {
    const synth = window.speechSynthesis;
    if (i >= NARRATION.length) {
      setBoth("idle");
      setStatus(`Finished · ${NARRATION.length} sections`);
      return;
    }
    setIndex(i);
    setStatus(`Section ${i + 1} of ${NARRATION.length}`);
    const el = document.getElementById(SECTIONS[i].id);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });

    const u = new SpeechSynthesisUtterance(NARRATION[i]);
    const voices = synth.getVoices();
    const voice =
      voices.find((v) => /en[-_]US/i.test(v.lang) && /natural|samantha|google/i.test(v.name)) ||
      voices.find((v) => /^en/i.test(v.lang));
    if (voice) u.voice = voice;
    u.onend = () => {
      if (stateRef.current === "playing") speak(i + 1);
    };
    u.onerror = (e) => {
      if (e.error === "interrupted" || e.error === "canceled") return;
      setBoth("idle");
      setStatus(`Audio stopped: ${e.error}`);
    };
    synth.speak(u);
  };

  const toggle = () => {
    const synth = window.speechSynthesis;
    if (stateRef.current === "idle") {
      synth.cancel();
      setBoth("playing");
      speak(0);
    } else if (stateRef.current === "playing") {
      synth.pause();
      setBoth("paused");
      setStatus(`Paused · section ${index + 1} of ${NARRATION.length}`);
    } else {
      synth.resume();
      setBoth("playing");
      setStatus(`Section ${index + 1} of ${NARRATION.length}`);
    }
  };

  const stop = () => {
    setBoth("idle");
    window.speechSynthesis.cancel();
    setStatus(`Stopped · ${NARRATION.length} sections · about 4 min`);
  };

  return {
    supported,
    state,
    index,
    status: supported ? status : "Audio walkthrough isn't available in this browser.",
    toggle,
    stop,
  };
}

// Podium order left to right: 2nd, 1st, 3rd. Heights are in rem.
const PODIUM_ORDER = [1, 0, 2];
const PODIUM_HEIGHT = [12, 9, 7];

function WinnersPodium() {
  const [selected, setSelected] = useState(0);
  const reduce = useReducedMotion();
  const active = WINNERS[selected];
  const ActiveIcon = active.icon;

  return (
    <div className="border border-white/10 bg-white/[0.02]">
      <div className="relative overflow-hidden px-3 pt-10 md:px-10">
        {/* Spotlight over first place */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-full w-[60%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.18),transparent_65%)]"
        />
        <div className="relative grid grid-cols-3 items-end gap-2 md:gap-4" role="tablist" aria-label="Winners">
          {PODIUM_ORDER.map((idx, col) => {
            const w = WINNERS[idx];
            const Icon = w.icon;
            const isFirst = w.rank === 1;
            const isActive = selected === idx;
            return (
              <motion.button
                key={w.name}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="winner-detail"
                onClick={() => setSelected(idx)}
                className="group flex min-w-0 flex-col items-center text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                initial={reduce ? false : "hidden"}
                whileInView="shown"
                viewport={{ once: true, amount: 0.3 }}
              >
                <motion.span
                  className="flex flex-col items-center"
                  variants={{ hidden: { opacity: 0, y: 24 }, shown: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.6, delay: reduce ? 0 : [0.5, 0.9, 0.2][col], ease: "easeOut" }}
                >
                  <motion.span
                    className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full border md:h-16 md:w-16 ${
                      isFirst ? "border-accent bg-accent/15 text-accent" : "border-white/20 bg-white/5 text-foreground"
                    } ${isActive ? "ring-2 ring-accent/60 ring-offset-2 ring-offset-background" : ""}`}
                    animate={isFirst && !reduce ? { boxShadow: ["0 0 0px rgba(245,158,11,0)", "0 0 28px rgba(245,158,11,0.45)", "0 0 0px rgba(245,158,11,0)"] } : undefined}
                    transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {isFirst ? <Trophy size={22} /> : <Icon size={20} />}
                  </motion.span>
                  <span className={`font-serif text-base leading-tight md:text-2xl ${isActive ? "text-accent" : "group-hover:text-accent"} transition-colors`}>
                    {w.name}
                  </span>
                  <span className="mt-1 hidden font-mono text-[10px] uppercase tracking-[0.15em] text-secondary md:block">
                    {w.tagline}
                  </span>
                </motion.span>
                <motion.span
                  className={`mt-4 flex w-full origin-bottom items-start justify-center border-x border-t pt-3 ${
                    isFirst
                      ? "border-accent/60 bg-gradient-to-b from-accent/30 to-accent/[0.04]"
                      : "border-white/15 bg-gradient-to-b from-white/[0.09] to-white/[0.02]"
                  } ${isActive ? "brightness-125" : "group-hover:brightness-125"} transition-[filter]`}
                  style={{ height: `${PODIUM_HEIGHT[idx]}rem` }}
                  variants={{ hidden: { scaleY: 0 }, shown: { scaleY: 1 } }}
                  transition={{ duration: 0.7, delay: reduce ? 0 : [0.3, 0.6, 0][col], ease: "easeOut" }}
                >
                  <span className={`font-serif text-5xl leading-none md:text-7xl ${isFirst ? "text-accent" : "text-white/70"}`}>{w.rank}</span>
                </motion.span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div id="winner-detail" role="tabpanel" className="border-t border-white/10 p-6 md:p-8" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.name}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]"
          >
            <div className="space-y-3">
              <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                <ActiveIcon size={12} />
                {active.place} place
              </p>
              <h3 className="text-3xl font-serif">{active.name}</h3>
              <p className="font-mono text-[11px] leading-relaxed text-secondary">{active.team}</p>
              <p className="font-mono text-[11px] tabular-nums text-foreground/80">{active.prize}</p>
            </div>
            <p className="max-w-[68ch] leading-relaxed">{active.summary}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function Guide() {
  const now = useNow();
  const narration = useNarration();
  const speakingId = narration.state === "idle" ? null : SECTIONS[narration.index]?.id;

  const sectionClass = (id: string) =>
    `scroll-mt-32 pt-20 space-y-6 transition-colors ${
      speakingId === id ? "border-l-2 border-accent bg-gradient-to-r from-accent/[0.06] to-transparent pl-5" : ""
    }`;

  return (
    <main className="min-h-screen bg-background text-foreground grid-bg">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-5 py-4">
          <Link href="/#events" className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-secondary hover:text-accent transition-colors">
            <ArrowLeft size={12} />
            AISEA Events
          </Link>
          <nav aria-label="Sections" className="scrollbar-hide flex gap-5 overflow-x-auto">
            {SECTIONS.slice(1).map((s) => (
              <a key={s.id} href={`#${s.id}`} className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.2em] text-secondary hover:text-accent transition-colors">
                {s.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 pb-32">
        {/* Overview */}
        <section id="overview" className={`${sectionClass("overview")} pt-12`}>
          <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_260px] items-start">
            <div className="space-y-5 min-w-0">
              <Eyebrow>Know before you go</Eyebrow>
              <h1 className="text-4xl md:text-6xl font-serif leading-[1.05] text-balance">
                IA40 Hackathon: Harnessing the Value of AI, Building Agency
              </h1>
              <p className="flex flex-wrap items-baseline gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-secondary">Theme</span>
                <span className="font-serif text-2xl text-accent">Technology that gives time back</span>
              </p>
              <p className="max-w-[60ch] text-secondary">
                Presented by Madrona with Vercel and OpenAI, in partnership with AI Collective Seattle.
              </p>
            </div>
            <Image
              src="/events/ia40-hackathon.jpg"
              alt="Madrona IA40 Summit Hackathon poster with AI Collective Seattle, Vercel, OpenAI and Madrona"
              width={520}
              height={520}
              priority
              className="w-full max-w-[320px] md:max-w-none border border-white/10"
            />
          </div>

          <div className="grid border border-white/10 md:grid-cols-3">
            {[
              { icon: Calendar, k: "When", v: "Tuesday, September 29", s: "1:00–5:00 PM · check-in 12:30 PM" },
              { icon: MapPin, k: "Where", v: "Four Seasons Seattle", s: "99 Union St, 2nd Floor" },
              { icon: Laptop, k: "Bring", v: "Laptop and charger", s: "Snacks and drinks provided" },
            ].map(({ icon: Icon, k, v, s }, i) => (
              <div key={k} className={`space-y-1 p-5 ${i > 0 ? "border-t border-white/10 md:border-t-0 md:border-l" : ""}`}>
                <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-secondary">
                  <Icon size={11} className="text-accent/70" />
                  {k}
                </p>
                <p className="font-medium">{v}</p>
                <p className="text-sm text-secondary">{s}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-10 gap-y-3 border border-accent/35 bg-accent/[0.07] p-5">
            <Wifi size={16} className="text-accent" aria-hidden="true" />
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-secondary">WiFi</span>
              <code className="font-mono">IA40 Summit</code>
              <CopyButton text="IA40 Summit" />
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-secondary">Password</span>
              <code className="font-mono">Madrona26</code>
              <CopyButton text="Madrona26" />
            </div>
          </div>

          <p className="max-w-[70ch] text-sm text-secondary">
            Arrive before kickoff to make sure you get a spot. If you can no longer attend, please update your RSVP so the organizers have an accurate count.
          </p>

          <div className="flex flex-wrap items-center gap-3 border border-white/10 bg-white/[0.03] px-4 py-3" aria-label="Audio walkthrough">
            <button
              type="button"
              onClick={narration.toggle}
              disabled={!narration.supported}
              className="bg-accent px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-black hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent transition-colors"
            >
              {narration.state === "idle" ? "Listen" : narration.state === "playing" ? "Pause" : "Resume"}
            </button>
            <button
              type="button"
              onClick={narration.stop}
              disabled={narration.state === "idle"}
              className="border border-accent/50 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-accent disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Stop
            </button>
            <span role="status" aria-live="polite" className="font-mono text-[11px] text-secondary">
              {narration.status}
            </span>
          </div>
        </section>

        {/* Winners */}
        <section id="winners" className={sectionClass("winners")}>
          <SectionHead eyebrow="Results · Sep 29" title="Congratulations to the winners" />
          <p className="max-w-[60ch] text-secondary">Select a project on the podium to read about it.</p>
          <WinnersPodium />
        </section>

        {/* Schedule */}
        <section id="schedule" className={sectionClass("schedule")}>
          <SectionHead eyebrow="Tuesday, Sep 29 · Pacific time" title="Schedule" />
          <div className="border-t border-white/10">
            {SCHEDULE.map((slot) => {
              const s = Date.parse(`${DAY}T${slot.start}:00${OFFSET}`);
              const e = Date.parse(`${DAY}T${slot.end}:00${OFFSET}`);
              const live = now !== null && now >= s && now < e;
              const done = now !== null && now >= e;
              return (
                <div
                  key={slot.start}
                  className={`grid grid-cols-[80px_minmax(0,1fr)] md:grid-cols-[100px_minmax(0,1fr)_auto] items-baseline gap-4 border-b border-white/10 px-2 py-3.5 ${
                    live ? "bg-accent/10" : ""
                  } ${done ? "opacity-50" : ""}`}
                >
                  <time className="font-mono text-sm tabular-nums text-accent">{slot.time}</time>
                  <span>
                    {slot.what}
                    {live && (
                      <span className="ml-3 bg-accent px-1.5 py-0.5 align-[2px] font-mono text-[9px] uppercase tracking-[0.15em] text-black">
                        Happening now
                      </span>
                    )}
                  </span>
                  <span className="hidden md:block font-mono text-xs tabular-nums text-secondary">{slot.dur}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Challenge */}
        <section id="challenge" className={sectionClass("challenge")}>
          <SectionHead eyebrow="The challenge" title="Build something with real agency" />
          <p className="max-w-[65ch] leading-relaxed">
            This year&apos;s theme is <strong>technology that gives time back</strong>. Every hour a tool hands back is an hour someone spends with family, on the work they care about, or simply resting. Build AI that does useful work, rather than AI that only advises, summarizes, or drafts. Come solo or find a team at team formation.
          </p>
          <h3 className="font-mono text-xs uppercase tracking-[0.15em] text-secondary pt-2">Where time back matters most</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {FOCUS_AREAS.map((area) => (
              <div key={area.title} className="space-y-3 border border-accent/25 bg-accent/[0.04] p-6 min-w-0">
                <h4 className="text-2xl font-serif leading-snug text-balance">{area.title}</h4>
                <p className="text-[15px] leading-relaxed text-secondary">{area.body}</p>
              </div>
            ))}
          </div>
          <h3 className="font-mono text-xs uppercase tracking-[0.15em] text-secondary pt-2">What counts as real agency</h3>
          <ul className="grid border-l border-t border-white/10 md:grid-cols-2">
            {IDEAS.map((idea) => (
              <li key={idea} className="border-b border-r border-white/10 px-4 py-3.5 text-[15px]">
                <span className="font-mono text-accent">→ </span>
                {idea}
              </li>
            ))}
          </ul>
        </section>

        {/* Credits */}
        <section id="credits" className={sectionClass("credits")}>
          <SectionHead eyebrow="Tools and credits" title="Four codes for every participant" />
          <p className="max-w-[65ch]">Vercel and OpenAI are giving credits to every hackathon participant. You get four redemption codes.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Vercel">
              <ul className="list-disc space-y-1.5 pl-5 text-[15px]">
                <li>v0 credits, with their own code</li>
                <li>AI Gateway credits, with a separate code</li>
              </ul>
            </Card>
            <Card title="OpenAI">
              <ul className="list-disc space-y-1.5 pl-5 text-[15px]">
                <li>Codex, OpenAI&apos;s coding agent: $100</li>
                <li>API platform, to build your own apps: $50</li>
              </ul>
            </Card>
          </div>

          <h3 className="font-mono text-xs uppercase tracking-[0.15em] text-secondary">How to get your codes</h3>
          <Steps>
            <li>Check in at the hackathon on September 29.</li>
            <li>Look for an email at the address you registered with. It has your codes and redemption instructions.</li>
          </Steps>
          <p className="text-sm text-secondary">Vercel and OpenAI staff will be on-site to help with redemption and answer questions.</p>

          <h3 className="font-mono text-xs uppercase tracking-[0.15em] text-secondary pt-4">What the Vercel credits cover</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="v0">
              <p className="text-[15px] leading-relaxed">
                v0 is Vercel&apos;s AI app builder. You describe a UI or app in plain language, and it writes the code, which you can edit visually, sync to GitHub, and deploy to Vercel.
              </p>
              <ul className="list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed">
                <li>Credits pay for the AI model tokens v0 uses, both your prompts and its output. They don&apos;t pay for hosting.</li>
                <li>Longer prompts and bigger generations use more credits, and v0 adds its own instructions to every request.</li>
                <li>You choose the model tier, which sets how fast credits go.</li>
              </ul>
              <div className="overflow-x-auto border border-white/10">
                <table className="w-full min-w-[260px] text-left tabular-nums">
                  <thead>
                    <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-[0.15em] text-secondary">
                      <th className="px-3 py-2 font-medium">v0 model</th>
                      <th className="px-3 py-2 font-medium">Input</th>
                      <th className="px-3 py-2 font-medium">Output</th>
                    </tr>
                  </thead>
                  <tbody>
                    {V0_RATES.map((r) => (
                      <tr key={r.model} className="border-b border-white/10 last:border-0">
                        <td className="px-3 py-2">{r.model}</td>
                        <td className="px-3 py-2 font-mono text-sm">{r.input}</td>
                        <td className="px-3 py-2 font-mono text-sm">{r.output}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="border-t border-white/10 px-3 py-2 text-xs text-secondary">
                  Per million tokens. Use Mini for small edits and save Max for complex, multi-step builds.
                </p>
              </div>
            </Card>
            <Card title="AI Gateway">
              <p className="text-[15px] leading-relaxed">
                AI Gateway is one API and one key for models from OpenAI, Anthropic, Google and many other providers. Your app calls the gateway, and it routes the request, fails over between providers, and logs cost per request.
              </p>
              <ul className="list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed">
                <li>Credits pay for model usage at each provider&apos;s list price. Vercel adds no markup.</li>
                <li>It covers text, images, video, speech, transcription, embeddings and more.</li>
                <li>Your app doesn&apos;t have to run on Vercel. Use the key from anywhere.</li>
                <li>You can set a spend budget per project or per key, which helps when a team shares one balance.</li>
                <li>Without paid credits, the gateway&apos;s free tier only covers some models, with lower rate limits. Ask Vercel staff which models your hackathon credits unlock.</li>
              </ul>
              <p className="text-xs text-secondary">
                Model names look like <code className="font-mono">openai/…</code> or <code className="font-mono">anthropic/…</code>. It works with the AI SDK, and with the OpenAI and Anthropic API formats.
              </p>
              <Command cmd="export AI_GATEWAY_API_KEY=your-key" />
              <p className="text-xs text-secondary break-words">
                OpenAI-compatible base URL: <code className="font-mono">https://ai-gateway.vercel.sh/v1</code>
              </p>
            </Card>
          </div>
          <p className="text-sm text-secondary max-w-[75ch]">
            Your code amounts and expiry date are in your check-in email. Vercel&apos;s docs:{" "}
            <ExtLink href="https://vercel.com/docs/ai-gateway">AI Gateway</ExtLink>,{" "}
            <ExtLink href="https://vercel.com/docs/ai-gateway/pricing">AI Gateway pricing</ExtLink>,{" "}
            <ExtLink href="https://v0.app/pricing">v0 pricing</ExtLink>, and the{" "}
            <ExtLink href="https://vercel.com/ai-gateway/models">model list</ExtLink>.
          </p>

          <Details summary="Redeem your Vercel credits">
            <p className="text-[15px] leading-relaxed max-w-[70ch]">
              Your email has two different Vercel codes, one for v0 and one for AI Gateway. They aren&apos;t interchangeable, so use each code only in its own steps below.
            </p>
            <h4 className="font-sans text-sm font-semibold">v0 credits: use your v0 code</h4>
            <Steps>
              <li>
                Go to <ExtLink href="https://v0.app/">v0.app</ExtLink> and sign in, or create an account if you&apos;re new.
              </li>
              <li>Click your credit balance in the bottom-left corner, next to your name.</li>
              <li>
                Click Redeem Code and enter the v0 code from your email.
              </li>
            </Steps>
            <h4 className="font-sans text-sm font-semibold">AI Gateway credits: use your AI Gateway code</h4>
            <Steps>
              <li>
                Sign in at <ExtLink href="https://vercel.com">vercel.com</ExtLink>, or create a Vercel account if you&apos;re new.
              </li>
              <li>
                Select the team that should receive the credits. Go to Settings, then General, scroll to Team ID, and copy the full ID starting with <code className="font-mono text-sm">team_</code>. Copy it directly. Don&apos;t use your team name, project ID, or personal user ID.
              </li>
              <li>
                Go to <ExtLink href="https://credits.vercel.sh/">credits.vercel.sh</ExtLink> and enter your email, the Team ID you copied, and your AI Gateway code.
              </li>
              <li>Select Redeem Code and check the result. Submitting sends your request for processing. It doesn&apos;t mean the credits are available yet.</li>
              <li>Once the organizer applies your credits, select the same team in Vercel and open AI Gateway.</li>
              <li>If you don&apos;t have an AI Gateway key yet, open the AI Gateway sidebar, then API Keys, then Create API Key. Give it a name you&apos;ll recognize.</li>
              <li>Go back to AI Gateway, then Overview. Your credit balance shows in the top-right corner. Use your credits before the expiration date in your email.</li>
            </Steps>
            <p className="text-sm text-secondary max-w-[70ch]">
              Your Team ID is only visible inside your own Vercel account. Organizers and Vercel staff can&apos;t look it up for you, so find it yourself in step 2.
            </p>
          </Details>

          <Details summary="Redeem your OpenAI credits">
            <Steps>
              <li>
                <strong>API credits.</strong> Sign in or create an account at <ExtLink href="https://platform.openai.com">platform.openai.com</ExtLink>. Open your unique API redemption link and select your API organization. The $50 credit applies automatically.
              </li>
              <li>
                <strong>Codex credits.</strong> Open your unique Codex redemption link while signed in to a personal ChatGPT workspace. The link won&apos;t work in a Business, Team, or managed workspace. The $100 in Codex credits applies automatically.
              </li>
            </Steps>
          </Details>
        </section>

        {/* What to bring */}
        <section id="bring" className={sectionClass("bring")}>
          <SectionHead eyebrow="What to bring" title="Set up before you arrive" />
          <p className="max-w-[65ch] leading-relaxed">
            Bring your laptop, power cord, and anything you need to get through the afternoon. Light snacks and refreshments are provided. Setting these up at home saves you build time.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Vercel">
              <ul className="list-disc space-y-1.5 pl-5 text-[15px]">
                <li>Node.js (LTS) and a package manager: npm, pnpm, or yarn</li>
                <li>A Vercel account, signed in and linked to your GitHub</li>
                <li>A code editor. VS Code is recommended.</li>
                <li>The Vercel CLI:</li>
              </ul>
              <Command cmd="npm i -g vercel" />
            </Card>
            <Card title="Codex">
              <ul className="list-disc space-y-1.5 pl-5 text-[15px]">
                <li>A ChatGPT account, signed in</li>
                <li>For terminal access, the Codex CLI. If you&apos;d rather stay in your editor, use the VS Code extension.</li>
              </ul>
              <Command cmd="npm i -g @openai/codex" />
            </Card>
          </div>
        </section>

        {/* Prizes */}
        <section id="prizes" className={sectionClass("prizes")}>
          <SectionHead eyebrow="Prizes" title="What the winners take home" />
          <div className="overflow-x-auto border border-white/10">
            <table className="w-full min-w-[420px] text-left tabular-nums">
              <thead>
                <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-[0.15em] text-secondary">
                  <th className="px-5 py-3 font-medium">Place</th>
                  <th className="px-5 py-3 font-medium">Vercel credits</th>
                  <th className="px-5 py-3 font-medium">OpenAI credits</th>
                </tr>
              </thead>
              <tbody>
                {PRIZES.map((p, i) => (
                  <tr key={p.place} className="border-b border-white/10 last:border-0">
                    <td className="px-5 py-3.5">{p.place}</td>
                    <td className={`px-5 py-3.5 font-mono ${i === 0 ? "text-accent" : ""}`}>{p.vercel}</td>
                    <td className={`px-5 py-3.5 font-mono ${i === 0 ? "text-accent" : ""}`}>{p.openai}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>Prizes go to the winning team by email as personal codes after the hackathon ends.</p>
        </section>

        <footer className="mt-24 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-secondary">
          <p>Thanks for coming, and good luck.</p>
          <a href="https://www.ia40.com/summit" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] hover:text-accent">
            IA40 Summit
            <ArrowUpRight size={11} />
          </a>
        </footer>
      </div>
    </main>
  );
}
