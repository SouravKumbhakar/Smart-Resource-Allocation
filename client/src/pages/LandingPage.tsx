import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { 
  Shield, ArrowRight, CheckCircle2, Users, Heart, 
  MapPin, Zap, Layout, Globe, Github, Menu, X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getStats } from "@/api";

const IMPACT_CONFIG = [
  { key: "peopleHelped",    label: "People Helped",        icon: Heart,          color: "text-red-500" },
  { key: "volunteersCount", label: "Volunteers Connected", icon: Users,          color: "text-blue-500" },
  { key: "ngosCount",       label: "NGOs Connected",       icon: Globe,          color: "text-green-500" },
  { key: "tasksCompleted",  label: "Tasks Completed",      icon: CheckCircle2,   color: "text-purple-500" },
];

const HOW_IT_WORKS = [
  { step: "01", title: "NGOs Post Needs", desc: "Organizations identify and list resource requirements on the platform." },
  { step: "02", title: "System Prioritizes", desc: "Our AI-driven engine ranks needs based on urgency and impact." },
  { step: "03", title: "Volunteers Matched", desc: "Smart matching connects the right skills to the most critical tasks." },
  { step: "04", title: "Tasks Completed", desc: "Real-time tracking and verification ensure relief reaches those in need." },
];

const FEATURES = [
  { title: "Smart Matching", desc: "Skill-based allocation ensures maximum efficiency.", icon: Zap },
  { title: "Location-based", desc: "Hyper-local discovery for faster response times.", icon: MapPin },
  { title: "Verified Tasks", desc: "Proof of work system for transparency and trust.", icon: Shield },
  { title: "Multi-role Governance", desc: "Dedicated dashboards for NGOs and Coordinators.", icon: Layout },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const { data: stats } = useQuery({ 
    queryKey: ["stats"], 
    queryFn: getStats,
    refetchInterval: 30000 // Refresh every 30s
  });

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-primary/20">
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary z-50 origin-left"
        style={{ scaleX }}
      />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-40 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary grid place-items-center text-white">
                <Shield className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl tracking-tight">ReliefOps</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
              <a href="#about" className="hover:text-primary transition-colors">About</a>
              <a href="#how-it-works" className="hover:text-primary transition-colors">How it Works</a>
              <a href="#features" className="hover:text-primary transition-colors">Features</a>
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link to="/login">Join Us</Link>
              </Button>
            </div>

            {/* Mobile Nav Toggle */}
            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-b px-4 py-6 space-y-4"
          >
            <a href="#about" className="block text-lg font-medium" onClick={() => setIsMenuOpen(false)}>About</a>
            <a href="#how-it-works" className="block text-lg font-medium" onClick={() => setIsMenuOpen(false)}>How it Works</a>
            <a href="#features" className="block text-lg font-medium" onClick={() => setIsMenuOpen(false)}>Features</a>
            <Button asChild className="w-full rounded-xl">
              <Link to="/login">Join Us</Link>
            </Button>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              Empowering Relief Through Technology
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6">
              Connecting Communities with <br />
              <span className="text-primary">Relief Through Technology</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              ReliefOps is a smart resource allocation platform designed to streamline NGO coordination, 
              volunteer matching, and disaster response.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="rounded-full h-14 px-8 text-lg font-semibold shadow-lg shadow-primary/20">
                <Link to="/register" className="flex items-center gap-2">
                  Join as Volunteer <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full h-14 px-8 text-lg font-semibold">
                <Link to="/login">Explore Platform</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {IMPACT_CONFIG.map((stat, i) => {
              const rawValue = stats ? stats[stat.key] : 0;
              const displayValue = rawValue >= 1000 ? `${(rawValue / 1000).toFixed(1)}k+` : rawValue;
              
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center p-6 rounded-2xl bg-white border shadow-sm"
                >
                  <stat.icon className={`h-8 w-8 mx-auto mb-4 ${stat.color}`} />
                  <h3 className="text-3xl font-bold text-slate-900 mb-1">
                    {stats ? displayValue : "..."}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How ReliefOps Works</h2>
            <div className="h-1.5 w-20 bg-primary mx-auto rounded-full" />
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative group"
              >
                <div className="text-6xl font-black text-slate-100 absolute -top-4 -left-4 z-0 group-hover:text-primary/5 transition-colors">
                  {item.step}
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Revolutionizing Resource Intelligence</h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                Our platform provides real-time visibility into humanitarian needs, 
                enabling organizations to deploy resources exactly where they'll make the most impact.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {FEATURES.map((feature, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{feature.title}</h4>
                      <p className="text-xs text-slate-400">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-blue-500/20" />
              <div className="h-full w-full bg-slate-800 grid place-items-center border border-slate-700">
                <Shield className="h-32 w-32 text-primary opacity-50" />
              </div>
              <div className="absolute bottom-8 left-8 right-8 p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Live Status: Mumbai Crisis</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full mb-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: "75%" }}
                    className="h-full bg-primary"
                  />
                </div>
                <div className="flex justify-between text-[10px] font-medium text-slate-400">
                  <span>75% Resources Allocated</span>
                  <span>12m response time</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 text-center">
        <div className="max-w-3xl mx-auto p-12 rounded-[2rem] bg-gradient-to-br from-primary to-blue-600 text-white shadow-2xl">
          <h2 className="text-4xl font-bold mb-6">Join Us to Make an Impact</h2>
          <p className="text-white/80 text-lg mb-10">
            Be part of the solution. Whether you're an NGO looking for support or a volunteer wanting to help, 
            ReliefOps provides the tools you need to make a difference.
          </p>
          <Button asChild size="lg" variant="secondary" className="rounded-full h-14 px-10 text-lg font-bold text-primary hover:bg-white transition-colors">
            <Link to="/register">Join the Movement</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">ReliefOps</span>
            </div>
            <div className="flex gap-8 text-sm text-slate-500">
              <Link to="/about" className="hover:text-primary transition-colors">About Us</Link>
              <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                <Github className="h-4 w-4" /> GitHub
              </a>
            </div>
            <p className="text-sm text-slate-400">
              © 2026 ReliefOps Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
