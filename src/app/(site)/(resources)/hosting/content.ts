import {
  Globe2,
  RefreshCw,
  ShieldCheck,
  Sliders,
  Timer,
  Zap,
} from "lucide-react";

export const hostingCopy = {
  eyebrow: "We recommend Pine Hosting for Rust servers",

  subhead:
    "We hold the filters. Pine handles the servers. Low-ping, DDoS-protected Rust hosting that's live the moment you pay, so your server is ready in time for the wipe.",

  ctaPrimary: "Get started with Pine",
  ctaSecondary: "Build your filters first",

  disclosure:
    "Honest heads-up: Pine is our recommended hosting partner. If you sign up through this link we may earn a commission, at no extra cost to you. We only recommend hosts we'd actually trust for our own server.",

  stats: [
    { value: "< 5 min", label: "From checkout to live server" },
    { value: "99.99%", label: "Uptime, wipe day included" },
    { value: "24/7", label: "Support from server owners" },
    { value: "Tbps+", label: "DDoS attacks absorbed" },
  ],

  sharedFeatures: [
    "Instant deployment",
    "Wipe scheduling",
    "One-click Oxide / Carbon",
    "DDoS protection",
    "24/7 support",
  ],

  plans: [
    {
      name: "Essential",
      price: "$14.99",
      period: "/mo",
      slots: 50,
      ram: "8GB",
      cpu: "150%",
      highlight: false,
      cta: "Start with Essential",
      note: "Good for starting out",
    },
    {
      name: "Performance",
      price: "$29.99",
      period: "/mo",
      slots: 75,
      ram: "12GB",
      cpu: "200%",
      highlight: true,
      cta: "Get Performance",
      note: "Most popular, cost-effective",
    },
    {
      name: "Extreme",
      price: "$38.99",
      period: "/mo",
      slots: 100,
      ram: "16GB",
      cpu: "300%",
      highlight: false,
      cta: "Go Extreme",
      note: "Solo servers, plugins experimentation",
    },
  ],

  planNote:
    "Need more? Custom plans go up to 150, 200, 300 or 400 slots. Scale between wipes as your community grows.",

  benefits: [
    {
      icon: Timer,
      title: "Live in a blink",
      body: "Server is deployed the instant payment clears. Configure your map, seed and rates, then let 'em in.",
    },
    {
      icon: Zap,
      title: "Holds when it counts",
      body: "NVMe SSDs and high-clock AMD CPUs hold the tick rate with a full server and a war kicking off. The server stays stable when it's fullest.",
    },
    {
      icon: ShieldCheck,
      title: "DDoS protection that actually works",
      body: "Anycasted via CosmicGuard, handles multi-terabit attacks. Someone angry enough to point a botnet at your server won't bring your community down. Your ranking in the server browser stays intact too.",
    },
    {
      icon: Sliders,
      title: "Wipe scheduling built in",
      body: "Set your wipe schedule from the panel: monthly, bi-weekly, weekly. No more forgetting to manually reset. Oxide/Carbon install is one click. Plugins, rates, and decay are all editable without touching a config file.",
    },
    {
      icon: RefreshCw,
      title: "Updates that take a restart",
      body: "Rust updates constantly. Pine handles it. Restart the server and it updates automatically. Your players always run the latest version without you babysitting patch notes.",
    },
    {
      icon: Globe2,
      title: "Low ping where your community plays",
      body: "Datacenters across NA, EU and Australia. Put the server close to your players. Pick a region at checkout, swap it between wipes if you need to.",
    },
  ],

  steps: [
    {
      n: "01",
      title: "Pick your plan and region",
      body: "Choose your slot count and a datacenter close to your community. Start at 50 — you can scale up between wipes.",
    },
    {
      n: "02",
      title: "Configure your server",
      body: "Set your map size, world seed, gather rates and plugins from the Pine Panel. Install Oxide or Carbon in one click. Schedule your next wipe from the calendar.",
    },
    {
      n: "03",
      title: "Go live",
      body: "Your server appears in the Rust server browser the moment it starts. Share the connection details with your community, or let new players find it through the browser.",
    },
  ],

  faq: [
    {
      q: "How much does it cost to host a Rust server?",
      a: "Pine starts at $14.99/mo for 50 slots (Essential). The 75-slot Performance plan is $29.99/mo and the most popular for active community servers. 100-slot Extreme is $38.99/mo. Custom plans up to 400 slots are available. Pricing scales with slot count. Save 10–30% on longer billing cycles.",
    },
    {
      q: "How many slots does my server need?",
      a: "50 slots is a solid starting point for a new community or lightly modded server. 75 slots suits a mid-size community with active PvP and steady player counts. 100+ slots are for established servers that regularly fill. You can scale up between wipes as your community grows.",
    },
    {
      q: "Can I run a modded Rust server?",
      a: "Yes. Pine supports both Oxide and Carbon with a one-click installer. From there you have access to thousands of community plugins: custom rates, quality-of-life mods, PvP balance tweaks, admin tools, whatever your server needs.",
    },
    {
      q: "Will my server lag during a raid?",
      a: "Pine runs NVMe storage and high-clock AMD CPUs to hold the tick rate when your server is at peak capacity. DDoS protection stays on silently so external attacks don't drop your server mid-fight. Pick a datacenter near your players and ping stays low.",
    },
    {
      q: "How do I schedule wipes?",
      a: "The Pine Panel has a built-in wipe scheduler. Set your wipe day and time, and the server resets automatically. No manual intervention needed. Updates apply on the next restart, so your server always runs the latest Rust version.",
    },
  ],

  finalCta: {
    title: "Your community is waiting for a server worth the grind.",
    body: "Lag drives players off, and they don't come back. Pine deploys before your wipe goes live, holds its tick rate through raid hour, and shrugs off the botnet some sore loser points at you. Pick your slots and a region near your players — you'll be online before your community finishes reading the announcement.",
    reassurances: [
      "Online in under 5 minutes",
      "No setup fees",
      "Cancel anytime",
    ],
  },
} as const;
