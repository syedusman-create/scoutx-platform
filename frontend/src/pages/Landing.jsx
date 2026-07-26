import React from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Dumbbell, Search, CheckCircle, ShieldAlert, Award, User, Compass, Star } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { resolvePostAuthRoute } from '../utils/authFlow.js'

export default function Landing() {
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  // If already logged in, redirect to the correct dashboard
  if (user) {
    return <Navigate to={resolvePostAuthRoute(user.role, user.onboarding_completed)} replace />
  }

  return (
    <div className="min-h-screen premium-gradient-bg text-white font-body selection:bg-lime/20 selection:text-lime">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">

        {/* Header */}
        <header className="flex items-center justify-between border-b border-edge/30 pb-4 relative">
          <div className="flex items-center gap-3">
            <img src="/scoutx-logo.png" alt="ScoutX logo" className="h-16 w-16 object-contain" />
            <span className="font-semibold tracking-[0.2em] text-white text-lg">SCOUTX</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-text3">
            <a href="#features" className="hover:text-lime transition-colors">Features</a>
            <a href="#showcase" className="hover:text-lime transition-colors">Platform Live</a>
            <a href="#stories" className="hover:text-lime transition-colors">Success Stories</a>
            <a href="#how" className="hover:text-lime transition-colors">How It Works</a>
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3">
              <Link to="/login" className="rounded-xl border border-edge bg-surface/40 px-4 py-2 text-xs font-bold uppercase tracking-wider hover:border-line hover:text-white transition-all">Sign In</Link>
              <Link to="/signup" className="rounded-xl bg-lime px-4 py-2 text-xs text-background font-black uppercase tracking-wider hover:brightness-110 hover:-translate-y-px transition-all">Get Discovered</Link>
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-text2 hover:text-lime transition-colors focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile dropdown */}
          {mobileOpen && (
            <div className="absolute top-20 left-0 right-0 z-50 bg-surface border border-edge rounded-2xl p-5 flex flex-col gap-4 md:hidden shadow-2xl animate-fade-up">
              <a href="#features" onClick={() => setMobileOpen(false)} className="text-text2 hover:text-lime font-bold uppercase tracking-wider text-xs">Features</a>
              <a href="#showcase" onClick={() => setMobileOpen(false)} className="text-text2 hover:text-lime font-bold uppercase tracking-wider text-xs">Platform Live</a>
              <a href="#stories" onClick={() => setMobileOpen(false)} className="text-text2 hover:text-lime font-bold uppercase tracking-wider text-xs">Success Stories</a>
              <a href="#how" onClick={() => setMobileOpen(false)} className="text-text2 hover:text-lime font-bold uppercase tracking-wider text-xs">How It Works</a>
              <hr className="border-edge/40" />
              <div className="flex flex-col gap-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="w-full text-center rounded-xl border border-edge bg-surface/40 py-2.5 text-xs font-bold uppercase tracking-wider text-text1">Sign In</Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)} className="w-full text-center rounded-xl bg-lime py-2.5 text-xs text-background font-black uppercase tracking-wider">Get Discovered</Link>
              </div>
            </div>
          )}
        </header>

        {/* Hero */}
        <main className="pt-14 md:pt-24 grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-lime/20 bg-lime/10 px-3 py-1.5 text-xs text-lime font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-lime animate-pulse" />
              India's Football Discovery Network
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.95] text-display">
              WHERE TALENT
              <br />
              <span className="text-lime glow-text-lime font-display font-light">MEETS OPPORTUNITY</span>
            </h1>

            <p className="text-text2 text-sm md:text-base max-w-xl leading-relaxed">
              Every year, thousands of talented Indian footballers go unnoticed — not because they lack skill, but because they have no digital presence.
              ScoutX changes that. A verified profile. Standardized fitness scores. Direct access to clubs and scouts who are actively recruiting.
              No more WhatsApp video clips. No more waiting for someone to "discover" you.
            </p>

            <div className="pt-3 flex flex-wrap items-center gap-3">
              <Link to="/signup" className="rounded-xl bg-lime px-6 py-3.5 text-background text-sm font-bold uppercase tracking-wider hover:brightness-110 hover:shadow-[0_0_20px_-3px_rgba(198,241,53,0.4)] transition-all">Join ScoutX Now</Link>
              <a href="#showcase" className="rounded-xl border border-edge bg-surface/30 px-6 py-3.5 text-sm font-bold text-text1 hover:border-line transition-all">Explore Platform Demo</a>
            </div>

            <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-xl">
              <Metric value="1,200+" label="Registered Players" />
              <Metric value="45+" label="Coaches & Scouts" />
              <Metric value="100% Raw" label="No ORM / Instant DB" />
              <Metric value="Verified" label="Age & Stats" />
            </div>
          </div>

          {/* Interactive Live Hero Preview Widget */}
          <div className="lg:col-span-5 relative mt-6 lg:mt-0 flex justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-lime/20 to-ice/20 rounded-full blur-[100px] opacity-40 pointer-events-none" />

            {/* Visual Athlete Showcase Card */}
            <div className="w-full max-w-sm glass-card rounded-2xl p-5 glow-lime border border-white/10 relative z-10 animate-fade-up">
              <div className="flex items-center justify-between border-b border-edge/30 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-lime animate-pulse" />
                  <span className="text-[10px] font-bold tracking-widest uppercase text-lime">Live Profile Draft</span>
                </div>
                <span className="text-[9px] font-mono text-text3">ID: IN-9382</span>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-raised border border-edge flex items-center justify-center font-bold text-lg text-lime">
                  JD
                </div>
                <div>
                  <div className="font-semibold text-text1 text-sm flex items-center gap-1.5">
                    Jeje Lalpekhlua
                    <CheckCircle size={12} className="text-lime" />
                  </div>
                  <div className="text-text3 text-xs">Striker · Mizoram FC</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="bg-raised/40 border border-edge/30 rounded-lg p-2">
                  <div className="text-[9px] text-text3 uppercase font-bold">Goals</div>
                  <div className="text-sm font-semibold text-lime mt-0.5">14</div>
                </div>
                <div className="bg-raised/40 border border-edge/30 rounded-lg p-2">
                  <div className="text-[9px] text-text3 uppercase font-bold">Matches</div>
                  <div className="text-sm font-semibold text-text1 mt-0.5">22</div>
                </div>
                <div className="bg-raised/40 border border-edge/30 rounded-lg p-2">
                  <div className="text-[9px] text-text3 uppercase font-bold">Fitness</div>
                  <div className="text-sm font-semibold text-ember mt-0.5">85</div>
                </div>
              </div>

              <div className="mt-4 bg-raised/20 border border-edge/30 rounded-xl p-3 space-y-1.5">
                <div className="text-[9px] text-text3 uppercase font-bold tracking-wide">Standardized Evaluation</div>
                <div className="flex justify-between text-xs">
                  <span className="text-text2">30m Sprint:</span>
                  <span className="font-mono text-text1 font-bold">4.20 sec</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text2">Vertical Leap:</span>
                  <span className="font-mono text-text1 font-bold">62 cm</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Feature Cards Grid */}
        <section id="features" className="mt-28 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-display">Built for the way recruitment actually works.</h2>
            <p className="text-text3 text-sm max-w-xl mx-auto">Scouts need verified data. Athletes need visibility. We built the bridge.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <FeatureCard icon={<CheckCircle className="text-lime" />} title="Verified Athlete Profiles" desc="Every profile is backed by real match data and standardized fitness scores. Scouts stop guessing and start trusting — before they even message you." />
            <FeatureCard icon={<Search className="text-lime" />} title="Smart Scout Pipeline" desc="Filter by position, fitness score, age, and location. Find exactly the athlete you need in seconds — no more scrolling through unverified WhatsApp forwards." />
            <FeatureCard icon={<Award className="text-lime" />} title="Live Performance Record" desc="Every goal, assist, match, and fitness test is tracked and visible. Your career history grows with you — from grassroots trials to professional contracts." />
          </div>
        </section>

        {/* Dynamic Showcase Panel */}
        <section id="showcase" className="mt-24 bg-surface/30 border border-edge/30 rounded-2xl p-6 md:p-10 space-y-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs text-lime font-bold uppercase tracking-widest">See it in action</span>
              <h3 className="text-3xl font-bold tracking-tight">Recruitment should be this simple</h3>
              <p className="text-text2 text-sm leading-relaxed">
                A club posts a trial. Athletes with matching fitness scores and position requirements get notified. The club reviews verified profiles — not highlight reels curated by agents.
                No WhatsApp chaos. No unreliable scouts. Just data-driven recruitment.
              </p>
              <ul className="space-y-2.5 text-xs text-text1 font-semibold">
                <li className="flex items-center gap-2">✓ Follow rising prospects and get notified when they update their stats.</li>
                <li className="flex items-center gap-2">✓ Sort and filter by verified match data — not reputation.</li>
                <li className="flex items-center gap-2">✓ Standardized fitness scores so you compare athletes objectively.</li>
              </ul>
            </div>
            <div className="bg-raised border border-edge rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between text-xs border-b border-edge/30 pb-3">
                <span className="text-text1 font-bold">Quick Filter Trial Opportunities</span>
                <span className="text-lime font-mono">active</span>
              </div>
              <div className="space-y-2">
                <ShowcaseOppItem title="Under-19 I-League Trials" position="Central Defender" club="Dempo SC" minFitness="80" />
                <ShowcaseOppItem title="State League Selection" position="Goalkeeper" club="Mizoram FA" minFitness="75" />
              </div>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section id="how" className="mt-28 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">From Grassroots to Global Stage</h2>
            <p className="text-text3 text-sm">Four simple steps to digitize Indian sports discovery.</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Step idx="01" title="Build Profile" desc="Input your stats, history, and highlight clips in minutes." />
            <Step idx="02" title="Verify Status" desc="Certify your records through licensed coaches." />
            <Step idx="03" title="Grow Network" desc="Follow scouts and have clubs follow your progress." />
            <Step idx="04" title="Attend Trials" desc="Apply directly to verified club trials across India." />
          </div>
        </section>

        {/* Success Stories */}
        <section id="stories" className="mt-28 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-display">Exposure changes everything</h2>
            <p className="text-text3 text-sm max-w-xl mx-auto">These players didn't just have talent. They had someone watching at the right time. Thousands of others never got that.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">

            {/* Jamie Vardy — released at 16, factory worker, Premier League winner */}
            <div className="rounded-xl border border-edge/40 bg-surface/20 p-6 glow-card-hover relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full -mr-8 -mt-8" />
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl font-bold text-amber-400 flex-shrink-0">JV</div>
                <div className="flex-1 min-w-0">
                  <div className="text-text1 font-bold text-lg">Jamie Vardy</div>
                  <div className="text-text3 text-xs mt-0.5">Released at 16. Working in a factory at 25. Premier League winner at 29.</div>
                </div>
              </div>
              <div className="mt-4 text-text2 text-xs leading-relaxed space-y-3">
                <p>
                  Vardy was released by Sheffield Wednesday's academy at 16. By 25 he was playing seventh-tier football for Stocksbridge Park Steels while working at a carbon fibre factory. No academy scout was going to find him there.
                </p>
                <p className="text-lime font-semibold">
                  A move to Fleetwood Town in the Conference put him on a bigger stage. Within 18 months Leicester City signed him. Two years later he was in the Premier League. A year after that, he'd won it.
                </p>
                <p>
                  Same player. Same lungs. Same finishing. The only thing that changed was the number of people watching.
                </p>
              </div>
              <div className="mt-3 text-[11px] text-text3 italic border-t border-edge/20 pt-3">
                How many 25-year-olds in India are still playing on the wrong stage?
              </div>
            </div>

            {/* Sunil Chhetri — Delhi local circuit to India legend */}
            <div className="rounded-xl border border-edge/40 bg-surface/20 p-6 glow-card-hover relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-lime/5 rounded-bl-full -mr-8 -mt-8" />
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center text-xl font-bold text-lime flex-shrink-0">SC</div>
                <div className="flex-1 min-w-0">
                  <div className="text-text1 font-bold text-lg">Sunil Chhetri</div>
                  <div className="text-text3 text-xs mt-0.5">Started in Delhi's local club scene. Now India's most-capped player.</div>
                </div>
              </div>
              <div className="mt-4 text-text2 text-xs leading-relaxed space-y-3">
                <p>
                  Chhetri grew up in Delhi with no football academy pathway. He played for City Club, a local side, while finishing school. There was no structured scouting system — just word of mouth and trial requests.
                </p>
                <p className="text-lime font-semibold">
                  He broke into professional football through Mohun Bagan's youth setup. From there, his performances earned him an India call-up at 20. Twenty years later, he has 94 international goals — the third-highest among active players worldwide.
                </p>
                <p>
                  If his local coach hadn't recommended him for that trial, one of India's greatest careers might have never left Delhi.
                </p>
              </div>
              <div className="mt-3 text-[11px] text-text3 italic border-t border-edge/20 pt-3">
                How many other Delhi kids are waiting on a recommendation that never comes?
              </div>
            </div>

            {/* Mohamed Salah — from village to global stage */}
            <div className="rounded-xl border border-edge/40 bg-surface/20 p-6 glow-card-hover relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-ruby/5 rounded-bl-full -mr-8 -mt-8" />
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-xl bg-ruby/10 border border-ruby/20 flex items-center justify-center text-xl font-bold text-ruby flex-shrink-0">MS</div>
                <div className="flex-1 min-w-0">
                  <div className="text-text1 font-bold text-lg">Mohamed Salah</div>
                  <div className="text-text3 text-xs mt-0.5">Grew up in a village with no pitch. Became a global superstar.</div>
                </div>
              </div>
              <div className="mt-4 text-text2 text-xs leading-relaxed space-y-3">
                <p>
                  Salah grew up in Nagrig, a small Egyptian village with no football infrastructure. He commuted hours each way to train on whatever pitch was available. There were no scouts at his matches, no agents tracking young talent in the Nile Delta.
                </p>
                <p className="text-lime font-semibold">
                  A trial with El Mokawloon SC in Cairo — secured through a local connection — gave him his first professional contract. Within four years he was at Chelsea. Within eight he was breaking the Premier League scoring record.
                </p>
                <p>
                  In a different system, a player with his drive and ability gets identified long before he has to travel four hours for a training session.
                </p>
              </div>
              <div className="mt-3 text-[11px] text-text3 italic border-t border-edge/20 pt-3">
                Talent that travels four hours for training doesn't need more talent. It needs more visibility.
              </div>
            </div>

            {/* Victor Osimhen — from Lagos streets to Serie A champion */}
            <div className="rounded-xl border border-edge/40 bg-surface/20 p-6 glow-card-hover relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-ice/5 rounded-bl-full -mr-8 -mt-8" />
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-xl bg-ice/10 border border-ice/20 flex items-center justify-center text-xl font-bold text-ice flex-shrink-0">VO</div>
                <div className="flex-1 min-w-0">
                  <div className="text-text1 font-bold text-lg">Victor Osimhen</div>
                  <div className="text-text3 text-xs mt-0.5">Lost his mother at 14. Serie A top scorer at 23. €70M striker.</div>
                </div>
              </div>
              <div className="mt-4 text-text2 text-xs leading-relaxed space-y-3">
                <p>
                  Osimhen grew up in the Olusosun slum in Lagos. After losing his mother, he sold bottled water and newspapers on the streets to help his family. He played on dirt pitches with no boots and no one documenting his games.
                </p>
                <p className="text-lime font-semibold">
                  A grassroots academy in Lagos — Ultimate Strikers — took him in. His performances there earned him a spot at the U-17 World Cup in 2015, where European scouts finally saw him. He signed with Wolfsburg at 17.
                </p>
                <p>
                  At every step before that World Cup, his career depended on someone in his local community deciding to help. A more connected system wouldn't leave that to chance.
                </p>
              </div>
              <div className="mt-3 text-[11px] text-text3 italic border-t border-edge/20 pt-3">
                How many players need to sell water before someone notices?
              </div>
            </div>

          </div>
        </section>

        {/* Belief Statement */}
        <section className="mt-24 max-w-3xl mx-auto text-center space-y-6 px-4">
          <div className="w-16 h-0.5 bg-lime/40 mx-auto" />
          <p className="text-text2 text-sm md:text-base leading-relaxed">
            There have been thousands of Indian footballers who trained harder, played smarter, and wanted it more than the names you just read.
            They never made it. Not because they lacked talent — but because no one knew they existed.
          </p>
          <p className="text-text2 text-sm md:text-base leading-relaxed">
            <span className="text-lime font-semibold">Exposure</span> is the difference between potential and greatness.
            In a country of 1.5 billion people, we produce world-class talent in every field — yet we struggle to build one World Cup-ready team.
            The problem isn't the players. It never was.
            It's a system that fails to find them at the right time, connect them to the right people, and put their story in front of the right clubs.
          </p>
          <p className="text-text1 font-semibold text-base">
            ScoutX exists to fix that pipeline. Not by creating talent — by making sure it gets seen.
          </p>
          <div className="pt-4">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-lime px-6 py-3 text-background text-sm font-bold uppercase tracking-wider hover:brightness-110 hover:shadow-[0_0_20px_-3px_rgba(198,241,53,0.4)] transition-all"
            >
              Be part of the system
            </Link>
          </div>
        </section>

        {/* Footer Waitlist Box */}
        <section className="mt-24 mb-12 rounded-3xl border border-lime/10 bg-gradient-to-tr from-lime/5 to-surface/20 p-8 md:p-12 text-center space-y-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-lime/10 to-transparent opacity-30 pointer-events-none" />
          <h3 className="text-3xl font-bold tracking-tight">Your profile is your pitch. Make it count.</h3>
          <p className="text-text2 text-sm max-w-md mx-auto">Join India's fastest-growing football discovery network. Create your verified profile in minutes — connect with clubs and scouts who are actively searching for talent like yours.</p>
          <div className="flex justify-center gap-3 pt-2">
            <Link to="/signup" className="rounded-xl bg-lime px-6 py-3 text-background text-xs font-bold uppercase tracking-wider hover:brightness-110 hover:-translate-y-px transition-all">Create Account</Link>
            <Link to="/login" className="rounded-xl border border-edge bg-surface/50 px-6 py-3 text-xs font-bold uppercase tracking-wider hover:border-line hover:text-white transition-all">Login</Link>
          </div>
        </section>
      </div>
    </div>
  )
}

function Metric({ value, label }) {
  return (
    <div className="rounded-xl border border-edge bg-surface/30 px-3 py-3 text-center glow-card-hover">
      <div className="text-white text-lg font-bold font-mono">{value}</div>
      <div className="text-text3 text-[10px] uppercase font-bold tracking-wide mt-1">{label}</div>
    </div>
  )
}

function FeatureCard({ title, desc, icon }) {
  return (
    <div className="rounded-xl border border-edge bg-surface/30 p-5 space-y-3 glow-card-hover">
      <div className="h-10 w-10 rounded-lg bg-raised flex items-center justify-center border border-edge">
        {icon}
      </div>
      <div className="text-text1 font-bold text-base">{title}</div>
      <div className="text-text2 text-xs leading-relaxed">{desc}</div>
    </div>
  )
}

function Step({ idx, title, desc }) {
  return (
    <div className="rounded-xl border border-edge bg-surface/20 p-5 space-y-2 glow-card-hover">
      <div className="text-lime font-mono text-sm font-semibold">{idx}</div>
      <div className="text-text1 font-bold text-sm">{title}</div>
      <div className="text-text3 text-xs leading-relaxed">{desc}</div>
    </div>
  )
}

function ShowcaseOppItem({ title, position, club, minFitness }) {
  return (
    <div className="bg-raised border border-edge/30 rounded-lg p-3 flex justify-between items-center text-xs">
      <div>
        <div className="text-text1 font-semibold">{title}</div>
        <div className="text-text3 text-[11px] mt-0.5">{club} · {position}</div>
      </div>
      <span className="tag-ember text-[9px] px-1.5 py-0.5">FS &gt;= {minFitness}</span>
    </div>
  )
}
