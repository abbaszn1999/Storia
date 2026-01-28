import { useRef, useState } from "react";
import { motion, useScroll, useMotionValueEvent, useVelocity, AnimatePresence } from "framer-motion";
import { Header } from "@/website/components/layout/header";
import { Footer } from "@/website/components/layout/footer";
import { LightPillar, LightPillarRef } from "@/website/components/ui/light-pillar";
import BlurText from "@/website/components/ui/blur-text";
import { 
  Check, 
  X, 
  Sparkles, 
  Zap, 
  Crown, 
  Building2, 
  ArrowRight,
  Shield,
  Clock,
  Users,
  Star,
  BadgeCheck,
  HelpCircle,
  ChevronDown,
  Play,
  Rocket,
  Gift,
  CreditCard,
  RefreshCcw
} from "lucide-react";

// Pricing plans data
const plans = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for individuals getting started with AI video creation",
    price: { monthly: 19, yearly: 15 },
    icon: Zap,
    color: "#06B6D4",
    popular: false,
    features: [
      { text: "50 videos per month", included: true },
      { text: "720p video quality", included: true },
      { text: "Basic AI voices (5)", included: true },
      { text: "5 video templates", included: true },
      { text: "Email support", included: true },
      { text: "Basic analytics", included: true },
      { text: "Watermark on videos", included: true },
      { text: "Priority rendering", included: false },
      { text: "Custom branding", included: false },
      { text: "API access", included: false },
    ],
    cta: "Start Free Trial",
  },
  {
    id: "pro",
    name: "Pro",
    description: "For creators who need more power and professional features",
    price: { monthly: 49, yearly: 39 },
    icon: Sparkles,
    color: "#8B5CF6",
    popular: true,
    features: [
      { text: "200 videos per month", included: true },
      { text: "1080p video quality", included: true },
      { text: "All AI voices (50+)", included: true },
      { text: "Unlimited templates", included: true },
      { text: "Priority support", included: true },
      { text: "Advanced analytics", included: true },
      { text: "No watermark", included: true },
      { text: "Priority rendering", included: true },
      { text: "Custom branding", included: true },
      { text: "API access", included: false },
    ],
    cta: "Get Pro",
  },
  {
    id: "business",
    name: "Business",
    description: "For teams and businesses scaling their content production",
    price: { monthly: 99, yearly: 79 },
    icon: Crown,
    color: "#F59E0B",
    popular: false,
    features: [
      { text: "Unlimited videos", included: true },
      { text: "4K video quality", included: true },
      { text: "All AI voices + cloning", included: true },
      { text: "Unlimited templates", included: true },
      { text: "24/7 priority support", included: true },
      { text: "Team analytics dashboard", included: true },
      { text: "No watermark", included: true },
      { text: "Instant rendering", included: true },
      { text: "White-label branding", included: true },
      { text: "API access", included: true },
    ],
    cta: "Start Business",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Custom solutions for large organizations with specific needs",
    price: { monthly: 0, yearly: 0 },
    icon: Building2,
    color: "#10B981",
    popular: false,
    features: [
      { text: "Everything in Business", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "Custom AI model training", included: true },
      { text: "On-premise deployment", included: true },
      { text: "SLA guarantee (99.9%)", included: true },
      { text: "Custom integrations", included: true },
      { text: "Advanced security", included: true },
      { text: "Unlimited team members", included: true },
      { text: "Custom contracts", included: true },
      { text: "Priority roadmap input", included: true },
    ],
    cta: "Contact Sales",
  },
];

// Trust badges
const trustBadges = [
  { icon: Shield, text: "256-bit SSL Encryption" },
  { icon: RefreshCcw, text: "30-Day Money Back" },
  { icon: CreditCard, text: "Secure Payments" },
  { icon: Clock, text: "Cancel Anytime" },
];

// Testimonials
const testimonials = [
  {
    quote: "Storia has transformed our content production. We went from creating 5 videos a month to over 100. The ROI has been incredible.",
    author: "Sarah Chen",
    role: "Marketing Director",
    company: "TechStart Inc.",
    avatar: "SC",
    rating: 5,
  },
  {
    quote: "The Pro plan gives us everything we need. The AI voices are incredibly natural, and the speed of generation is mind-blowing.",
    author: "Michael Rodriguez",
    role: "Content Creator",
    company: "Creative Studios",
    avatar: "MR",
    rating: 5,
  },
  {
    quote: "As an enterprise client, the dedicated support and custom integrations have been game-changers for our workflow.",
    author: "Emily Watson",
    role: "VP of Content",
    company: "Global Media Corp",
    avatar: "EW",
    rating: 5,
  },
];

// FAQ data
const faqs = [
  {
    question: "Can I change my plan at any time?",
    answer: "Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll get immediate access to new features. When downgrading, changes take effect at your next billing cycle.",
  },
  {
    question: "What happens when I exceed my video limit?",
    answer: "We'll notify you when you're approaching your limit. You can either upgrade your plan or purchase additional video credits at $0.50 per video.",
  },
  {
    question: "Do you offer refunds?",
    answer: "Yes, we offer a 30-day money-back guarantee. If you're not satisfied with Storia within the first 30 days, contact us for a full refund.",
  },
  {
    question: "Can I use Storia for commercial purposes?",
    answer: "Absolutely! All plans allow commercial use. You own full rights to the videos you create with Storia.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and for Enterprise plans, we also offer invoicing and bank transfers.",
  },
  {
    question: "Is there a free trial?",
    answer: "Yes! All plans come with a 14-day free trial. No credit card required to start. You can explore all features before committing.",
  },
];

// Comparison table features
const comparisonFeatures = [
  { name: "Videos per month", starter: "50", pro: "200", business: "Unlimited", enterprise: "Unlimited" },
  { name: "Video quality", starter: "720p", pro: "1080p", business: "4K", enterprise: "4K+" },
  { name: "AI voices", starter: "5 basic", pro: "50+ premium", business: "All + cloning", enterprise: "Custom" },
  { name: "Templates", starter: "5", pro: "Unlimited", business: "Unlimited", enterprise: "Custom" },
  { name: "Rendering speed", starter: "Standard", pro: "Priority", business: "Instant", enterprise: "Dedicated" },
  { name: "Support", starter: "Email", pro: "Priority", business: "24/7", enterprise: "Dedicated" },
  { name: "Analytics", starter: "Basic", pro: "Advanced", business: "Team dashboard", enterprise: "Custom" },
  { name: "API access", starter: false, pro: false, business: true, enterprise: true },
  { name: "Custom branding", starter: false, pro: true, business: true, enterprise: true },
  { name: "Team members", starter: "1", pro: "3", business: "10", enterprise: "Unlimited" },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  // Ref for controlling LightPillar
  const lightPillarRef = useRef<LightPillarRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track scroll progress and velocity
  const { scrollYProgress, scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);

  // Update LightPillar with progress
  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    if (lightPillarRef.current) {
      lightPillarRef.current.setScrollProgress(progress);
    }
  });

  // Update LightPillar with velocity
  useMotionValueEvent(scrollVelocity, "change", (velocity) => {
    if (lightPillarRef.current) {
      const normalizedVelocity = Math.max(-0.5, Math.min(0.5, velocity / 4000));
      lightPillarRef.current.setScrollVelocity(normalizedVelocity);
    }
  });

  return (
    <div className="website min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <Header />

      {/* Main Content with Background */}
      <main className="relative">
        {/* LightPillar Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <LightPillar
            ref={lightPillarRef}
            topColor="#5227FF"
            bottomColor="#FF9FFC"
            intensity={1}
            rotationSpeed={0.3}
          />
        </div>

        {/* Dark Overlay */}
        <div className="fixed inset-0 z-[1] bg-gray-950/60 pointer-events-none" />

        {/* Content */}
        <div ref={containerRef} className="relative z-10">
          
          {/* Hero Section */}
          <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-4">
            <div className="max-w-[1400px] mx-auto text-center">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10 mb-6 sm:mb-8"
              >
                <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <span className="text-xs sm:text-sm text-white/70">14-Day Free Trial • No Credit Card Required</span>
              </motion.div>

              {/* Title */}
              <BlurText
                text="Simple, Transparent Pricing"
                delay={100}
                animateBy="words"
                direction="top"
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 font-heading px-2"
              />

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-base sm:text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-8 sm:mb-10 md:mb-12 px-2"
              >
                Choose the perfect plan for your creative journey. 
                Start free, scale as you grow.
              </motion.p>

              {/* Billing Toggle */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-wrap items-center justify-center gap-3 sm:gap-4"
              >
                <span className={`text-xs sm:text-sm font-medium transition-colors ${billingCycle === "monthly" ? "text-white" : "text-white/40"}`}>
                  Monthly
                </span>
                <button
                  onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
                  className="relative w-14 sm:w-16 h-7 sm:h-8 rounded-full bg-white/10 border border-white/20 transition-colors hover:bg-white/15"
                >
                  <motion.div
                    className="absolute top-1 w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-gradient-to-r from-primary to-pink-500"
                    animate={{ left: billingCycle === "yearly" ? "calc(100% - 24px)" : "4px" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
                <span className={`text-xs sm:text-sm font-medium transition-colors ${billingCycle === "yearly" ? "text-white" : "text-white/40"}`}>
                  Yearly
                </span>
                <motion.span 
                  className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-green-500/20 text-green-400 text-[10px] sm:text-xs font-bold"
                  animate={{ scale: billingCycle === "yearly" ? [1, 1.1, 1] : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  Save 20%
                </motion.span>
              </motion.div>
            </div>
          </section>

          {/* Trust Badges */}
          <section className="pb-8 sm:pb-10 md:pb-12 px-4">
            <div className="max-w-[1400px] mx-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-4 sm:gap-6 md:gap-12"
              >
                {trustBadges.map((badge, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                    className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-white/50"
                  >
                    <badge.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">{badge.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* Pricing Cards */}
          <section className="py-8 sm:py-10 md:py-12 px-4">
            <div className="max-w-[1400px] mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                {plans.map((plan, index) => (
                  <PricingCard 
                    key={plan.id} 
                    plan={plan} 
                    billingCycle={billingCycle}
                    index={index}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Feature Comparison Table */}
          <section className="py-12 sm:py-16 md:py-20 px-4">
            <div className="max-w-[1400px] mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="text-center mb-8 sm:mb-10 md:mb-12"
              >
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 font-heading">
                  Compare Plans
                </h2>
                <p className="text-sm sm:text-base text-white/50 max-w-xl mx-auto px-2">
                  See all features side by side to find the perfect plan for you
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="overflow-x-auto scrollbar-hide -mx-4 px-4"
              >
                <div 
                  className="min-w-[700px] rounded-xl sm:rounded-2xl border border-white/10 overflow-hidden"
                  style={{ backgroundColor: "rgba(13, 13, 13, 0.8)" }}
                >
                  {/* Table Header */}
                  <div className="grid grid-cols-5 gap-2 sm:gap-4 p-3 sm:p-4 border-b border-white/10 bg-white/5">
                    <div className="text-xs sm:text-sm font-semibold text-white/60">Features</div>
                    {plans.map((plan) => (
                      <div key={plan.id} className="text-center">
                        <span 
                          className="text-xs sm:text-sm font-bold"
                          style={{ color: plan.color }}
                        >
                          {plan.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Table Body */}
                  {comparisonFeatures.map((feature, index) => (
                    <div 
                      key={index}
                      className={`grid grid-cols-5 gap-2 sm:gap-4 p-3 sm:p-4 ${index % 2 === 0 ? "bg-white/[0.02]" : ""}`}
                    >
                      <div className="text-xs sm:text-sm text-white/70">{feature.name}</div>
                      <div className="text-center text-xs sm:text-sm text-white/60">
                        {typeof feature.starter === "boolean" ? (
                          feature.starter ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 mx-auto" /> : <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/20 mx-auto" />
                        ) : feature.starter}
                      </div>
                      <div className="text-center text-xs sm:text-sm text-white/60">
                        {typeof feature.pro === "boolean" ? (
                          feature.pro ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 mx-auto" /> : <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/20 mx-auto" />
                        ) : feature.pro}
                      </div>
                      <div className="text-center text-xs sm:text-sm text-white/60">
                        {typeof feature.business === "boolean" ? (
                          feature.business ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 mx-auto" /> : <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/20 mx-auto" />
                        ) : feature.business}
                      </div>
                      <div className="text-center text-xs sm:text-sm text-white/60">
                        {typeof feature.enterprise === "boolean" ? (
                          feature.enterprise ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 mx-auto" /> : <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/20 mx-auto" />
                        ) : feature.enterprise}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="py-12 sm:py-16 md:py-20 px-4">
            <div className="max-w-[1400px] mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="text-center mb-8 sm:mb-10 md:mb-12"
              >
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 font-heading">
                  Loved by Creators Worldwide
                </h2>
                <p className="text-sm sm:text-base text-white/50 max-w-xl mx-auto px-2">
                  Join thousands of creators who have transformed their content with Storia
                </p>
              </motion.div>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                {testimonials.map((testimonial, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-white/10 hover:border-white/20 transition-colors"
                    style={{ backgroundColor: "rgba(13, 13, 13, 0.8)" }}
                  >
                    {/* Stars */}
                    <div className="flex gap-0.5 sm:gap-1 mb-3 sm:mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500 fill-yellow-500" />
                      ))}
                    </div>

                    {/* Quote */}
                    <p className="text-sm sm:text-base text-white/70 mb-4 sm:mb-6 leading-relaxed">
                      "{testimonial.quote}"
                    </p>

                    {/* Author */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-white">{testimonial.author}</p>
                        <p className="text-[10px] sm:text-xs text-white/50">{testimonial.role}, {testimonial.company}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-12 sm:py-16 md:py-20 px-4">
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="text-center mb-8 sm:mb-10 md:mb-12"
              >
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 font-heading">
                  Frequently Asked Questions
                </h2>
                <p className="text-sm sm:text-base text-white/50 px-2">
                  Everything you need to know about our pricing
                </p>
              </motion.div>

              <div className="space-y-3 sm:space-y-4">
                {faqs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className="rounded-lg sm:rounded-xl border border-white/10 overflow-hidden"
                    style={{ backgroundColor: "rgba(13, 13, 13, 0.8)" }}
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-white/5 transition-colors"
                    >
                      <span className="text-sm sm:text-base text-white font-medium pr-4 sm:pr-8">{faq.question}</span>
                      <motion.div
                        animate={{ rotate: openFaq === index ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-shrink-0"
                      >
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-white/50" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {openFaq === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm sm:text-base text-white/60 leading-relaxed">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Bottom CTA */}
          <section className="py-12 sm:py-16 md:py-20 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl border border-white/10 relative overflow-hidden"
                style={{ backgroundColor: "rgba(13, 13, 13, 0.8)" }}
              >
                {/* Background glow */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-1/4 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-primary/20 rounded-full blur-[100px]" />
                  <div className="absolute bottom-0 right-1/4 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-pink-500/20 rounded-full blur-[100px]" />
                </div>

                <div className="relative">
                  <motion.div
                    className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center mx-auto mb-4 sm:mb-5 md:mb-6"
                    animate={{ 
                      boxShadow: [
                        "0 0 30px rgba(139,92,246,0.3)",
                        "0 0 60px rgba(139,92,246,0.5)",
                        "0 0 30px rgba(139,92,246,0.3)",
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Rocket className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                  </motion.div>

                  <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 font-heading px-2">
                    Ready to Transform Your Content?
                  </h2>
                  <p className="text-sm sm:text-base text-white/60 mb-6 sm:mb-8 max-w-lg mx-auto px-2">
                    Start your 14-day free trial today. No credit card required. 
                    Cancel anytime.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                    <motion.button
                      className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-gradient-to-r from-primary to-pink-500 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Start Free Trial
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>
                    <motion.button
                      className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-full border border-white/20 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                      Watch Demo
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Footer */}
          <Footer />
        </div>
      </main>
    </div>
  );
}

// Pricing Card Component
interface PricingCardProps {
  plan: typeof plans[0];
  billingCycle: "monthly" | "yearly";
  index: number;
}

function PricingCard({ plan, billingCycle, index }: PricingCardProps) {
  const Icon = plan.icon;
  const price = plan.price[billingCycle];
  const isEnterprise = plan.id === "enterprise";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`relative p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border transition-all duration-300 ${
        plan.popular 
          ? "border-primary/50 sm:scale-105 z-10" 
          : "border-white/10 hover:border-white/20"
      }`}
      style={{ backgroundColor: "rgba(13, 13, 13, 0.9)" }}
    >
      {/* Popular Badge */}
      {plan.popular && (
        <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
          <div className="px-3 sm:px-4 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-primary to-pink-500 text-white text-[10px] sm:text-xs font-bold">
            Most Popular
          </div>
        </div>
      )}

      {/* Glow effect for popular */}
      {plan.popular && (
        <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
      )}

      <div className="relative">
        {/* Icon */}
        <div 
          className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4"
          style={{ backgroundColor: `${plan.color}20` }}
        >
          <Icon className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6" style={{ color: plan.color }} />
        </div>

        {/* Name & Description */}
        <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5 sm:mb-2">{plan.name}</h3>
        <p className="text-xs sm:text-sm text-white/50 mb-4 sm:mb-5 md:mb-6 line-clamp-2">{plan.description}</p>

        {/* Price */}
        <div className="mb-4 sm:mb-5 md:mb-6">
          {isEnterprise ? (
            <div className="text-2xl sm:text-3xl font-bold text-white">Custom</div>
          ) : (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">${price}</span>
                <span className="text-xs sm:text-sm text-white/50">/month</span>
              </div>
              {billingCycle === "yearly" && (
                <p className="text-xs sm:text-sm text-green-400 mt-1">
                  Billed annually (${price * 12}/year)
                </p>
              )}
            </>
          )}
        </div>

        {/* CTA Button */}
        <motion.button
          className={`w-full py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base mb-4 sm:mb-5 md:mb-6 transition-all ${
            plan.popular
              ? "bg-gradient-to-r from-primary to-pink-500 text-white"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {plan.cta}
        </motion.button>

        {/* Features */}
        <div className="space-y-2 sm:space-y-3">
          {plan.features.map((feature, i) => (
            <div key={i} className="flex items-center gap-2 sm:gap-3">
              {feature.included ? (
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/20 flex-shrink-0" />
              )}
              <span className={`text-xs sm:text-sm ${feature.included ? "text-white/70" : "text-white/30"}`}>
                {feature.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
