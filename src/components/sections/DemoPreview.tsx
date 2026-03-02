import { motion } from 'motion/react';
import { ArrowRight, Image as ImageIcon, Radar, Radio, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { buildDemoUrl, DEFAULT_DEMO_SCENARIO, getDemoScenario } from '../../lib/demo';

const previewFeatures = [
  'EXIF GPS',
  'OSV Corpus',
  'Verifier',
  'Anomaly Layers',
  'Shareable Report',
];

export function DemoPreview() {
  const heroScenario = getDemoScenario(DEFAULT_DEMO_SCENARIO);

  return (
    <section id="product" className="relative overflow-hidden bg-[#040506] py-24 md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(243,184,97,0.12),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(113,166,214,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_30%)]" />
      <div className="absolute inset-0 opacity-[0.08]" style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.32) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.32) 1px, transparent 1px)',
        backgroundSize: '120px 120px',
      }} />

      <div className="relative z-10 w-full px-5 md:px-[120px]">
        <div className="mx-auto grid max-w-7xl gap-10 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div className="max-w-2xl">
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] font-mono uppercase tracking-[0.28em] text-white/55"
            >
              <Radio className="h-3.5 w-3.5 text-[var(--gw-accent)]" />
              Demo Split Surface
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              className="mt-6 font-display text-4xl leading-[0.95] text-white md:text-6xl"
            >
              Marketing up front.
              <span className="block text-[var(--gw-accent)]">Mission console underneath.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.14 }}
              className="mt-6 max-w-xl text-base leading-relaxed text-white/58 md:text-lg"
            >
              The landing page now previews the hybrid stack without burying the site in controls.
              Open the dedicated Mission Console to inspect verifier traces, anomaly overlays, report
              export, and live local service readiness.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-8 flex flex-wrap gap-2"
            >
              {previewFeatures.map((feature) => (
                <span
                  key={feature}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.18em] text-white/62"
                >
                  {feature}
                </span>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.28 }}
              className="mt-10 flex flex-col gap-3 sm:flex-row"
            >
              <Link
                to={buildDemoUrl(DEFAULT_DEMO_SCENARIO)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--gw-accent)] px-7 py-4 text-sm font-semibold text-black transition-transform duration-300 hover:-translate-y-0.5"
              >
                Open Demo Console
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#examples"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 bg-white/[0.03] px-7 py-4 text-sm font-medium text-white/78 transition-colors duration-300 hover:bg-white/[0.07] hover:text-white"
              >
                Browse Scenarios
                <Radar className="h-4 w-4" />
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16 }}
            className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[rgba(9,10,14,0.82)] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(243,184,97,0.14),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_40%)]" />
            <div className="relative z-10">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                  <span className="ml-2 text-[11px] font-mono uppercase tracking-[0.24em] text-white/36">
                    Mission Console Preview
                  </span>
                </div>
                <div className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-amber-200">
                  Replay Ready
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="overflow-hidden rounded-[26px] border border-white/10 bg-black/30">
                  <img
                    src={heroScenario.imageSrc}
                    alt={heroScenario.title}
                    className="h-[320px] w-full object-cover"
                  />
                </div>

                <div className="space-y-4">
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.22em] text-white/38">
                      <ShieldCheck className="h-3.5 w-3.5 text-[var(--gw-accent)]" />
                      Active Scenario
                    </div>
                    <h3 className="mt-3 font-display text-2xl text-white">{heroScenario.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/58">
                      {heroScenario.description}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-white/38">
                        Result
                      </p>
                      <p className="mt-3 font-display text-3xl text-white">
                        {Math.round(heroScenario.result.confidence * 100)}%
                      </p>
                      <p className="mt-1 text-sm text-white/58">confidence score</p>
                    </div>
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-white/38">
                        Overlay Stack
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-white/72">
                        <ImageIcon className="h-5 w-5 text-[var(--gw-accent)]" />
                        <span className="text-sm">map, brief, anomaly, report</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
