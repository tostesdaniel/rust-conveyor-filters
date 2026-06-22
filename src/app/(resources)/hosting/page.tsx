import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Star } from "lucide-react";
import type { FAQPage, WithContext } from "schema-dts";

import { cn } from "@/lib/utils";
import {
  HeaderSectionContainer,
  HeaderSectionContent,
  HeaderSectionTitle,
} from "@/components/layout/header-sections";

import { hostingCopy } from "./content";
import { PineCta } from "./cta";

export const metadata: Metadata = {
  title: "Rust Server Hosting — Recommended Host for Your Wipe",
  description:
    "Looking for Rust server hosting? We recommend Pine Hosting: low-ping, DDoS-protected, modded-ready and online in under 5 minutes. Built to survive raid hour. Affiliate.",
  alternates: { canonical: "/hosting" },
};

const GRADIENT_CLIP =
  "polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)";

export default function HostingPage() {
  const c = hostingCopy;

  const faqJsonLd: WithContext<FAQPage> = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <div className='isolate'>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <section className='relative full-bleed -mt-6 lg:-mt-8'>
        <div
          aria-hidden='true'
          className='pointer-events-none absolute inset-0 -z-10 overflow-hidden [mask-image:linear-gradient(to_bottom,black_45%,transparent)]'
        >
          <div className='absolute top-0 right-[-12rem] transform-gpu blur-3xl'>
            <div
              style={{ clipPath: GRADIENT_CLIP }}
              className='aspect-1108/632 w-[60rem] bg-linear-to-r from-[#4cc9f0] to-[#4361ee] opacity-20 lg:w-[80rem]'
            />
          </div>
          <div className='absolute top-0 left-[-12rem] hidden transform-gpu blur-3xl sm:block'>
            <div
              style={{ clipPath: GRADIENT_CLIP }}
              className='aspect-1108/632 w-[60rem] -scale-x-100 bg-linear-to-r from-[#4cc9f0] to-[#4361ee] opacity-20 lg:w-[80rem]'
            />
          </div>
        </div>

        <div className='mx-auto max-w-3xl px-6 pt-16 pb-16 text-center sm:pt-20'>
          <p
            style={{ "--i": 0 } as CSSProperties}
            className='reveal-on-load text-base/7 font-semibold text-blue-400'
          >
            {c.eyebrow}
          </p>
          <h1
            style={{ "--i": 1 } as CSSProperties}
            className='reveal-on-load mt-4 text-[clamp(2.5rem,5vw+1.5rem,4.5rem)] leading-[1.05] font-extrabold tracking-tight text-balance'
          >
            Your players deserve a server that{" "}
            <span className='text-blue-400'>can take a raid</span>.
          </h1>
          <p
            style={{ "--i": 2 } as CSSProperties}
            className='reveal-on-load mx-auto mt-6 max-w-[65ch] text-lg text-pretty text-muted-foreground'
          >
            {c.subhead}
          </p>

          <div
            style={{ "--i": 3 } as CSSProperties}
            className='reveal-on-load mt-6 flex items-center justify-center gap-2'
          >
            <div className='flex gap-0.5'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className='size-4 fill-emerald-400 text-emerald-400'
                />
              ))}
            </div>
            <span className='text-sm font-medium text-muted-foreground'>
              4.9 / 5 on Trustpilot · Excellent
            </span>
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-6xl px-6 pt-16 pb-24'>
        <div className='grid gap-6 lg:grid-cols-3'>
          {c.plans.map((plan, i) => (
            <div
              key={plan.name}
              style={{ "--i": i } as CSSProperties}
              className={cn(
                "reveal-on-load relative flex flex-col rounded-2xl border bg-card p-8",
                plan.highlight
                  ? "border-blue-400/60 shadow-xl shadow-blue-500/10"
                  : "border-border",
              )}
            >
              {plan.highlight && (
                <div className='absolute inset-0 -z-10 rounded-2xl bg-linear-to-br from-[#4cc9f0]/5 to-[#4361ee]/5' />
              )}
              {plan.highlight && (
                <span className='absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-4 py-1 text-xs font-bold text-white'>
                  Most popular
                </span>
              )}

              <div>
                <h3 className='text-lg font-semibold'>{plan.name}</h3>
                <p className='mt-1 text-sm text-muted-foreground'>
                  {plan.note}
                </p>
              </div>

              <div className='mt-6 flex items-baseline gap-1'>
                <span className='font-brand text-5xl leading-none tracking-wide'>
                  {plan.price}
                </span>
                <span className='text-muted-foreground'>{plan.period}</span>
              </div>

              <div className='mt-6 border-t border-border pt-6'>
                <div className='flex items-baseline gap-2'>
                  <span className='font-brand text-4xl leading-none tracking-wide text-foreground'>
                    {plan.slots}
                  </span>
                  <span className='text-sm text-muted-foreground'>
                    player slots
                  </span>
                </div>
                <dl className='mt-5 grid grid-cols-2 gap-4'>
                  <div>
                    <dt className='font-brand text-2xl leading-none tracking-wide text-foreground'>
                      {plan.ram}
                    </dt>
                    <dd className='mt-1.5 text-xs text-muted-foreground'>
                      RAM
                    </dd>
                  </div>
                  <div>
                    <dt className='font-brand text-2xl leading-none tracking-wide text-foreground'>
                      {plan.cpu}
                    </dt>
                    <dd className='mt-1.5 text-xs text-muted-foreground'>
                      CPU priority
                    </dd>
                  </div>
                </dl>
              </div>

              <div className='flex-1' />

              <PineCta
                className={cn(
                  "mt-8 w-full justify-center py-3 text-sm font-semibold",
                  plan.highlight
                    ? "bg-[#4361ee] text-white hover:bg-[#3a4fd6]"
                    : "border border-border text-foreground hover:border-[#4361ee]/50 hover:text-[#4361ee]",
                )}
              >
                {plan.cta}
              </PineCta>
            </div>
          ))}
        </div>

        <div className='mt-10 text-center'>
          <p className='text-sm font-medium text-foreground'>
            Every plan includes
          </p>
          <ul className='mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm'>
            {c.sharedFeatures.map((feat) => (
              <li key={feat} className='flex items-center gap-1.5'>
                <Check className='size-4 shrink-0 text-blue-400' />
                <span className='text-muted-foreground'>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className='mt-8 flex flex-col items-center gap-1 text-center text-sm text-muted-foreground'>
          <p>{c.planNote}</p>
          <p>Save 10–30% on longer billing cycles.</p>
        </div>
      </section>

      <section className='full-bleed border-y border-border bg-muted/30'>
        <dl className='mx-auto grid max-w-5xl grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0'>
          {c.stats.map((s) => (
            <div key={s.label} className='px-6 py-8 text-center'>
              <dt className='font-brand text-5xl leading-none tracking-wide text-foreground'>
                {s.value}
              </dt>
              <dd className='mt-2 text-sm text-muted-foreground'>{s.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      <HeaderSectionContainer center>
        <HeaderSectionContent center>
          <HeaderSectionTitle className='mt-0 text-[clamp(1.875rem,3vw+1rem,3rem)] text-balance'>
            Everything you need to run a community
          </HeaderSectionTitle>
        </HeaderSectionContent>

        <div className='mt-16 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3'>
          {c.benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                style={{ "--i": i } as CSSProperties}
                className='reveal-on-load group bg-card p-6 transition-colors hover:bg-muted/30'
              >
                <Icon
                  className='size-7 text-muted-foreground transition-colors group-hover:text-blue-400'
                  strokeWidth={1.5}
                />
                <h3 className='mt-4 text-lg font-semibold'>{b.title}</h3>
                <p className='mt-2 text-sm leading-relaxed text-muted-foreground'>
                  {b.body}
                </p>
              </div>
            );
          })}
        </div>
      </HeaderSectionContainer>

      <section className='full-bleed border-y border-border bg-muted/30'>
        <div className='mx-auto max-w-6xl px-6 py-24'>
          <HeaderSectionTitle className='mt-0 text-center text-[clamp(1.875rem,3vw+1rem,3rem)] text-balance'>
            Live before wipe day
          </HeaderSectionTitle>
          <div className='mt-16 grid gap-10 md:grid-cols-3'>
            {c.steps.map((s) => (
              <div key={s.n} className='relative'>
                <span className='font-brand text-7xl leading-none text-blue-400/50'>
                  {s.n}
                </span>
                <h3 className='mt-2 text-xl font-semibold'>{s.title}</h3>
                <p className='mt-2 leading-relaxed text-muted-foreground'>
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-3xl px-6 pt-24'>
        <HeaderSectionTitle className='mt-0 text-center text-[clamp(1.875rem,3vw+1rem,3rem)] text-balance'>
          Rust server hosting, answered
        </HeaderSectionTitle>
        <dl className='mt-16 divide-y divide-border'>
          {c.faq.map((item, i) => (
            <div
              key={item.q}
              style={{ "--i": i } as CSSProperties}
              className='reveal-on-load py-6 first:pt-0'
            >
              <dt className='text-lg font-semibold'>{item.q}</dt>
              <dd className='mt-3 leading-relaxed text-pretty text-muted-foreground'>
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className='mx-auto max-w-6xl px-6 pt-24 pb-28'>
        <div className='relative isolate overflow-hidden rounded-3xl border border-blue-400/30 bg-card px-6 py-20 text-center sm:px-12'>
          <div
            aria-hidden='true'
            className='absolute inset-0 -z-20 bg-linear-to-br from-[#4cc9f0]/15 via-card to-[#4361ee]/15'
          />
          <div
            aria-hidden='true'
            className='pointer-events-none absolute -top-32 left-1/2 -z-10 h-72 w-[44rem] max-w-full -translate-x-1/2 rounded-full bg-[#4361ee]/25 blur-3xl'
          />
          <div
            aria-hidden='true'
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
            className='absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_60%_55%_at_50%_38%,black,transparent)] opacity-40'
          />

          <div className='mx-auto flex max-w-2xl flex-col items-center'>
            <h2 className='text-[clamp(1.875rem,3vw+1rem,3rem)] font-extrabold tracking-tight text-balance'>
              {c.finalCta.title}
            </h2>
            <p className='mt-5 text-lg leading-relaxed text-pretty text-muted-foreground'>
              {c.finalCta.body}
            </p>

            <div className='mt-10 flex flex-col items-center gap-x-6 gap-y-4 sm:flex-row'>
              <PineCta className='bg-[#4361ee] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/25 hover:bg-[#3a4fd6] hover:shadow-blue-500/40 active:translate-y-px'>
                {c.ctaPrimary}
              </PineCta>
              <Link
                href='/'
                className='group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
              >
                {c.ctaSecondary}
                <ArrowRight className='size-4 transition-transform group-hover:translate-x-0.5' />
              </Link>
            </div>

            <ul className='mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2'>
              {c.finalCta.reassurances.map((item) => (
                <li
                  key={item}
                  className='flex items-center gap-1.5 text-sm text-muted-foreground'
                >
                  <Check className='size-4 shrink-0 text-blue-400' />
                  {item}
                </li>
              ))}
            </ul>

            <p className='mt-10 max-w-lg text-xs text-muted-foreground'>
              {c.disclosure}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
