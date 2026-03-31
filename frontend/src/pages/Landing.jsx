import React from 'react'
import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: '"General Sans", sans-serif' }}>
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/scoutx-logo.png" alt="ScoutX logo" className="h-10 w-10 object-contain" />
            <span className="font-semibold tracking-[0.08em]">SCOUTX</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-white/80">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#how" className="hover:text-white">How It Works</a>
            <a href="#waitlist" className="hover:text-white">Waitlist</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="rounded-full border border-white/25 px-4 py-2 text-sm hover:border-white/60">Sign In</Link>
            <Link to="/signup" className="rounded-full bg-white px-4 py-2 text-sm text-black font-semibold">Sign Up</Link>
          </div>
        </header>

        <main className="pt-14 md:pt-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-lime" />
              India&apos;s First Multi-Sport Discovery Platform
            </div>
            <h1 className="mt-5 text-5xl md:text-7xl font-semibold leading-[0.95]">
              WHERE
              <br />
              ATHLETES
              <br />
              GET FOUND.
            </h1>
            <p className="mt-5 text-white/75 max-w-2xl">
              The professional network built for sport. Starting with football, expanding across cricket, kabaddi,
              volleyball, throwball and beyond. Build your verified profile and get discovered.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to="/signup" className="rounded-full bg-white px-6 py-3 text-black text-sm font-semibold">Join Waitlist</Link>
              <a href="#how" className="rounded-full border border-white/25 px-6 py-3 text-sm text-white/90">See How It Works</a>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl">
            <Metric value="500+" label="Pre-Registered" />
            <Metric value="Football" label="Current Focus" />
            <Metric value="All India" label="Coverage" />
            <Metric value="Verified" label="Trust First" />
          </div>
        </main>

        <section id="features" className="mt-20">
          <h2 className="text-3xl md:text-4xl font-semibold max-w-2xl">Everything a scout needs. Everything an athlete deserves.</h2>
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <FeatureCard emoji="🏅" title="Verified Profiles" desc="Career history and stats verifiable by clubs and coaches." />
            <FeatureCard emoji="🔭" title="Scout Engine" desc="Filter by sport, position, age and fitness score in seconds." />
            <FeatureCard emoji="⚡" title="Fitness Module" desc="Standardized tests attached directly to each athlete profile." />
          </div>
        </section>

        <section id="how" className="mt-16">
          <h2 className="text-3xl md:text-4xl font-semibold">From grassroots to global stage.</h2>
          <div className="mt-6 grid md:grid-cols-4 gap-3">
            <Step idx="1" title="Build Profile" desc="Add sport, history and highlight clips." />
            <Step idx="2" title="Get Verified" desc="Authenticity builds trust with top clubs." />
            <Step idx="3" title="Get Discovered" desc="Appear in scout searches across India." />
            <Step idx="4" title="Make Your Move" desc="Connect with your next team on ScoutX." />
          </div>
        </section>

        <section id="waitlist" className="mt-16 mb-10 rounded-2xl border border-white/15 bg-white/[0.03] p-5 md:p-7">
          <h3 className="text-2xl md:text-3xl font-semibold">Join the waitlist</h3>
          <p className="mt-2 text-white/70 text-sm">Be first to know when ScoutX launches for your sport.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/signup" className="rounded-full bg-white px-5 py-2.5 text-black text-sm font-semibold">Sign Up</Link>
            <Link to="/login" className="rounded-full border border-white/25 px-5 py-2.5 text-sm">Sign In</Link>
          </div>
        </section>
      </div>
    </div>
  )
}

function Metric({ value, label }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 text-center">
      <div className="text-white text-xl font-semibold">{value}</div>
      <div className="text-white/65 text-xs mt-1">{label}</div>
    </div>
  )
}

function FeatureCard({ title, desc, emoji }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/[0.03] p-5">
      <div className="text-2xl">{emoji}</div>
      <div className="mt-2 text-white font-semibold">{title}</div>
      <div className="mt-2 text-white/70 text-sm leading-relaxed">{desc}</div>
    </div>
  )
}

function Step({ idx, title, desc }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
      <div className="text-white/50 text-xs">{idx}</div>
      <div className="mt-1 font-semibold">{title}</div>
      <div className="mt-2 text-sm text-white/70">{desc}</div>
    </div>
  )
}

