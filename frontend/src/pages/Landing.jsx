import React from 'react'
import { Link } from 'react-router-dom'
import { Dumbbell, Search, CheckCircle, ShieldAlert, Award, User, Compass, Star } from 'lucide-react'

export default function Landing() {
  const [mobileOpen, setMobileOpen] = React.useState(false)

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
              Talented grassroots football players in India have no digital presence—so scouts can't find them.
              ScoutX gives athletes a verified profile, career history, and standardized fitness scores, and gives clubs a powerful recruitment pipeline.
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
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-display">Everything a scout needs. Everything an athlete deserves.</h2>
            <p className="text-text3 text-sm max-w-xl mx-auto">Standardized physical data combined with verified athletic match histories.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <FeatureCard icon={<CheckCircle className="text-lime" />} title="Verified Athlete Profiles" desc="Say goodbye to fake profiles. Our verification system builds credibility with scouts instantly." />
            <FeatureCard icon={<Search className="text-lime" />} title="Club Scout Pipeline" desc="Clubs and scouts can query athletes by age, height, position, and fitness scores in seconds." />
            <FeatureCard icon={<Award className="text-lime" />} title="Performance Records" desc="Keep track of every goal, match, and assist inside your dynamic verified professional record." />
          </div>
        </section>

        {/* Dynamic Showcase Panel */}
        <section id="showcase" className="mt-24 bg-surface/30 border border-edge/30 rounded-2xl p-6 md:p-10 space-y-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs text-lime font-bold uppercase tracking-widest">Designed for discovery</span>
              <h3 className="text-3xl font-bold tracking-tight">The Modern Sports Recruitment Pipeline</h3>
              <p className="text-text2 text-sm leading-relaxed">
                Gone are the days of sending blurry video clips over WhatsApp. ScoutX organizes trials, matches verified profiles with open opportunities, and updates athletic records in real-time.
              </p>
              <ul className="space-y-2.5 text-xs text-text1 font-semibold">
                <li className="flex items-center gap-2">✓ Dynamic followers system to keep track of rising prospects.</li>
                <li className="flex items-center gap-2">✓ Advanced sorting based on verified match statistics.</li>
                <li className="flex items-center gap-2">✓ Standardized fitness analytics charts.</li>
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

        {/* Footer Waitlist Box */}
        <section className="mt-24 mb-12 rounded-3xl border border-lime/10 bg-gradient-to-tr from-lime/5 to-surface/20 p-8 md:p-12 text-center space-y-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-lime/10 to-transparent opacity-30 pointer-events-none" />
          <h3 className="text-3xl font-bold tracking-tight">Ready to build your digital presence?</h3>
          <p className="text-text2 text-sm max-w-md mx-auto">Be first to know when ScoutX launches for your sport and division. Setup your dashboard catalog today.</p>
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
