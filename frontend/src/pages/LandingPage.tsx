import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Shield, Brain, Lock } from 'lucide-react'
import { Button } from '../components/ui/primitives'
import { AlertCard } from '../components/ui/HealthCards'
import { ConsentCard } from '../components/ui/ContentCards'
import { DigitalTwinVisualization } from '../components/digital-twin/DigitalTwinVisualization'

const flowSteps = [
  { label: 'Medical Records', icon: '📄' },
  { label: 'AI Understanding', icon: '🧠' },
  { label: 'Digital Health Twin', icon: '🧬' },
  { label: 'Safety Intelligence', icon: '🛡️' },
]

const scatteredRecords = [
  { label: 'Prescription', icon: '💊', x: '10%', y: '20%', rotate: -8 },
  { label: 'Lab Report', icon: '🧪', x: '75%', y: '15%', rotate: 6 },
  { label: 'Hospital Record', icon: '🏥', x: '5%', y: '65%', rotate: 4 },
  { label: 'Scan Report', icon: '📷', x: '80%', y: '55%', rotate: -5 },
  { label: 'Diagnosis', icon: '📋', x: '45%', y: '75%', rotate: 3 },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-navy-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-navy-900 to-indigo-600 text-sm">🧬</div>
            <div>
              <p className="text-sm font-bold text-navy-900">HealthTwin</p>
              <p className="text-[10px] text-navy-400">Universal Patient Information System</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-navy-600 hover:text-navy-900">Sign In</Link>
            <Link to="/login">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-50 via-white to-cyan-50/30" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <p className="text-sm font-medium text-indigo-600">From Medical Records to Medical Intelligence.</p>
              <h1 className="mt-4 text-4xl font-bold leading-tight text-navy-900 sm:text-5xl">
                Your Health. Your Data. Your <span className="gradient-text">Digital Twin.</span>
              </h1>
              <p className="mt-6 text-lg text-navy-600">
                Transform fragmented medical records into one intelligent, patient-controlled health profile.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/login"><Button size="lg">Create Your Health Twin <ArrowRight className="h-4 w-4" /></Button></Link>
                <a href="#features"><Button variant="outline" size="lg">Explore the Platform</Button></a>
              </div>
            </motion.div>

            {/* Hero flow visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="rounded-2xl border border-navy-100 bg-white p-8 shadow-xl shadow-navy-100/50">
                <div className="flex flex-col items-center gap-4">
                  {flowSteps.map((step, i) => (
                    <div key={step.label} className="flex w-full flex-col items-center">
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.15 }}
                        className="flex w-full items-center gap-4 rounded-xl border border-navy-100 bg-navy-50/50 px-5 py-3"
                      >
                        <span className="text-2xl">{step.icon}</span>
                        <span className="font-medium text-navy-800">{step.label}</span>
                      </motion.div>
                      {i < flowSteps.length - 1 && (
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ delay: 0.6 + i * 0.15 }}
                          className="my-1 h-6 w-px bg-gradient-to-b from-indigo-400 to-cyan-400"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="features" className="bg-navy-900 py-24 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold">Your health story shouldn't be scattered.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-navy-300">
            Prescriptions, lab reports, hospital records — spread across systems, never connected.
          </p>

          <div className="relative mx-auto mt-16 h-[400px] max-w-3xl">
            {scatteredRecords.map((record, i) => (
              <motion.div
                key={record.label}
                initial={{ opacity: 0, x: parseInt(record.x), y: parseInt(record.y), rotate: record.rotate }}
                whileInView={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                  transform: `translate(calc(-50% + ${(i - 2) * 20}px), calc(-50% + ${Math.sin(i) * 30}px))`,
                }}
              >
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <span>{record.icon}</span>
                  <span className="text-sm font-medium">{record.label}</span>
                </div>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-indigo-600/30 to-cyan-600/20 px-8 py-6 text-center backdrop-blur-md">
                <span className="text-3xl">🧬</span>
                <p className="mt-2 text-lg font-bold">Universal Health Vault</p>
                <p className="text-sm text-cyan-200">One unified health profile</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Digital Twin Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-navy-900">Meet your Digital Health Twin.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-navy-600">
              A living, intelligent representation of your complete health context — always evolving, always connected.
            </p>
          </div>
          <div className="mt-16 flex justify-center">
            <DigitalTwinVisualization size="lg" />
          </div>
        </div>
      </section>

      {/* Safety AI */}
      <section className="bg-gradient-to-b from-navy-50 to-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="flex items-center gap-2 text-indigo-600">
                <Brain className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-wider">Safety Intelligence</span>
              </div>
              <h2 className="mt-4 text-3xl font-bold text-navy-900">AI that checks before it advises.</h2>
              <p className="mt-4 text-navy-600">
                Every insight is cross-referenced against your complete medical context — medications, allergies, lab results, and history.
              </p>
            </div>
            <AlertCard
              priority="high"
              title="Potential medication conflict detected"
              description="The new prescription may conflict with information already present in the patient's medical history."
            />
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {['Medication', 'Allergy', 'Recent Lab', 'Existing Prescription'].map((item) => (
              <div key={item} className="rounded-lg border border-navy-100 bg-white p-4 text-center">
                <p className="text-sm font-medium text-navy-700">{item}</p>
                <p className="mt-1 text-xs text-navy-400">Cross-referenced ✓</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Patient Ownership */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-indigo-600">
              <Lock className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wider">Patient Ownership</span>
            </div>
            <h2 className="mt-4 text-3xl font-bold text-navy-900">Your health data. Your rules.</h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ConsentCard id="demo-1" who="Dr. Arun" data="Clinical Access" permission="Full Read" expiry="2027-08-12" status="active" />
            <ConsentCard id="demo-lp" who="City Hospital" data="Lab Reports" permission="Read & Upload" expiry="2026-12-31" status="active" />
            <ConsentCard id="demo-lp" who="Family Member" data="Medical History" permission="Emergency Only" expiry="—" status="restricted" />
            <ConsentCard id="demo-lp" who="HealthTwin AI" data="AI Analysis" permission="Authorized" expiry="—" status="active" />
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-t border-navy-100 bg-white py-16">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 px-4">
          {[
            { icon: Shield, label: 'Patient-Controlled Access' },
            { icon: Brain, label: 'Explainable AI Insights' },
            { icon: Lock, label: 'Privacy-First Design' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-navy-600">
              <Icon className="h-5 w-5 text-indigo-600" />
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy-900 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to take control of your health story?</h2>
          <p className="mt-4 text-navy-300">Join the future of patient-centric healthcare intelligence.</p>
          <Link to="/login" className="mt-8 inline-block">
            <Button size="lg" variant="secondary">Create Your Health Twin <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-navy-100 bg-white py-8 text-center text-xs text-navy-400">
        <p>HealthTwin — Universal Patient Information System · Demo Prototype · SIH 2026</p>
        <p className="mt-1">DEMO ENVIRONMENT — NOT REAL MEDICAL DATA</p>
      </footer>
    </div>
  )
}
