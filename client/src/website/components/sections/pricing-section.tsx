import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import BlurText from "../ui/blur-text";
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
  BadgeCheck
} from "lucide-react";

// Pricing plans
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
      { text: "Basic AI voices", included: true },
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
      { text: "Unlimited videos", included: true },
      { text: "4K video quality", included: true },
      { text: "Premium AI voices (50+)", included: true },
      { text: "All video templates", included: true },
      { text: "Priority support", included: true },
      { text: "Advanced analytics", included: true },
      { text: "No watermark", included: true },
      { text: "Priority rendering", included: true },
      { text: "Custom branding", included: true },
      { text: "API access", included: false },
    ],
    cta: "Start Free Trial",
  },
  {
    id: "business",
    name: "Business",
    description: "For teams and businesses with advanced requirements",
    price: { monthly: 149, yearly: 119 },
    icon: Crown,
    color: "#F59E0B",
    popular: false,
    features: [
      { text: "Unlimited videos", included: true },
      { text: "4K + HDR quality", included: true },
      { text: "All AI voices + cloning", included: true },
      { text: "Custom templates", included: true },
      { text: "Dedicated support", included: true },
      { text: "Enterprise analytics", included: true },
      { text: "No watermark", included: true },
      { text: "Fastest rendering", included: true },
      { text: "White-label solution", included: true },
      { text: "Full API access", included: true },
    ],
    cta: "Contact Sales",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Custom solutions for large organizations",
    price: { monthly: null, yearly: null },
    icon: Building2,
    color: "#EC4899",
    popular: false,
    features: [
      { text: "Everything in Business", included: true },
      { text: "Unlimited team members", included: true },
      { text: "Custom AI model training", included: true },
      { text: "On-premise deployment", included: true },
      { text: "24/7 dedicated support", included: true },
      { text: "SLA guarantee", included: true },
      { text: "Custom integrations", included: true },
      { text: "Security compliance", included: true },
      { text: "Training & onboarding", included: true },
      { text: "Account manager", included: true },
    ],
    cta: "Contact Us",
  },
];

// Trust badges
const trustBadges = [
  { icon: Shield, text: "Secure Payment" },
  { icon: Clock, text: "14-Day Free Trial" },
  { icon: Users, text: "500K+ Creators" },
  { icon: BadgeCheck, text: "99.9% Uptime" },
];

// Testimonials for social proof
const testimonials = [
  {
    quote: "Storia transformed our content workflow. We produce 10x more videos now.",
    author: "Sarah Chen",
    role: "Content Director",
    company: "TechFlow Inc.",
    avatar: "SC",
  },
  {
    quote: "The ROI was immediate. Best investment we've made for our marketing.",
    author: "Michael Torres",
    role: "Marketing Lead",
    company: "GrowthHub",
    avatar: "MT",
  },
  {
    quote: "Finally, a tool that delivers on its promises. Absolutely game-changing.",
    author: "Emma Williams",
    role: "Creative Producer",
    company: "MediaSpark",
    avatar: "EW",
  },
];

// FAQ items
const faqs = [
  {
    question: "Can I switch plans anytime?",
    answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any differences.",
  },
  {
    question: "What happens after my free trial?",
    answer: "After your 14-day trial, you'll be charged for the plan you selected. You can cancel anytime before the trial ends with no charges.",
  },
  {
    question: "Do you offer refunds?",
    answer: "Yes, we offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund.",
  },
  {
    question: "Can I use videos for commercial purposes?",
    answer: "Absolutely! All plans include commercial usage rights. You own the content you create with Storia.",
  },
];

export function PricingSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <section ref={containerRef} className="relative py-16 sm:py-24 md:py-32 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10 mb-4 sm:mb-6"
          >
            <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500" />
            <span className="text-xs sm:text-sm text-white/70">Simple, Transparent Pricing</span>
          </motion.div>
          
          <BlurText
            text="Choose Your Perfect Plan"
            delay={150}
            animateBy="words"
            direction="top"
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 font-heading"
          />
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-sm sm:text-base md:text-lg text-white/50 max-w-2xl mx-auto mb-6 sm:mb-8 md:mb-10 px-2"
          >
            Start free, scale as you grow. No hidden fees, no surprises.
            Cancel anytime.
          </motion.p>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-4"
          >
            <span className={`text-xs sm:text-sm transition-colors ${billingCycle === "monthly" ? "text-white" : "text-white/40"}`}>
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
            <span className={`text-xs sm:text-sm transition-colors ${billingCycle === "yearly" ? "text-white" : "text-white/40"}`}>
              Yearly
            </span>
            <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-green-500/20 text-green-400 text-[10px] sm:text-xs font-medium">
              Save 20%
            </span>
          </motion.div>
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-2 sm:gap-4 md:gap-6 mb-8 sm:mb-12 md:mb-16"
        >
          {trustBadges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10"
              >
                <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                <span className="text-[10px] sm:text-sm text-white/60">{badge.text}</span>
              </div>
            );
          })}
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mb-12 sm:mb-16 md:mb-24">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const isPopular = plan.popular;
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                className={`relative group ${isPopular ? "sm:-mt-2 lg:-mt-4 sm:mb-2 lg:mb-4" : ""}`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 z-10">
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={isInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.3, delay: 0.6 }}
                      className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-primary to-pink-500 text-white text-[10px] sm:text-xs font-semibold flex items-center gap-1 sm:gap-1.5"
                    >
                      <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      Most Popular
                    </motion.div>
                  </div>
                )}

                <div 
                  className={`relative h-full p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border transition-all duration-300 ${
                    isPopular 
                      ? "border-primary/50 bg-gradient-to-b from-primary/10 to-transparent" 
                      : "border-white/10 hover:border-white/20"
                  }`}
                  style={{ backgroundColor: isPopular ? "rgba(139, 92, 246, 0.08)" : "rgba(13, 13, 13, 0.8)" }}
                >
                  {/* Glow effect for popular */}
                  {isPopular && (
                    <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                  )}

                  <div className="relative">
                    {/* Icon & Name */}
                    <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                      <div 
                        className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: `${plan.color}20` }}
                      >
                        <Icon className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6" style={{ color: plan.color }} />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-white">{plan.name}</h3>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-white/50 mb-4 sm:mb-5 md:mb-6 min-h-[32px] sm:min-h-[40px] line-clamp-2">
                      {plan.description}
                    </p>

                    {/* Price */}
                    <div className="mb-4 sm:mb-5 md:mb-6">
                      {plan.price.monthly !== null ? (
                        <>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                              ${billingCycle === "yearly" ? plan.price.yearly : plan.price.monthly}
                            </span>
                            <span className="text-white/40 text-xs sm:text-sm">/month</span>
                          </div>
                          {billingCycle === "yearly" && (
                            <p className="text-[10px] sm:text-xs text-white/40 mt-1">
                              Billed annually (${(plan.price.yearly ?? 0) * 12}/year)
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="text-2xl sm:text-3xl font-bold text-white">
                          Custom
                        </div>
                      )}
                    </div>

                    {/* CTA Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-300 mb-4 sm:mb-5 md:mb-6 ${
                        isPopular
                          ? "bg-gradient-to-r from-primary to-pink-500 text-white shadow-lg shadow-primary/30 hover:shadow-primary/50"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </motion.button>

                    {/* Features */}
                    <div className="space-y-2 sm:space-y-3">
                      {plan.features.map((feature, fIndex) => (
                        <div 
                          key={fIndex}
                          className="flex items-center gap-2 sm:gap-3"
                        >
                          {feature.included ? (
                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                              <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-400" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                              <X className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/20" />
                            </div>
                          )}
                          <span className={`text-xs sm:text-sm ${feature.included ? "text-white/70" : "text-white/30"}`}>
                            {feature.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Social Proof - Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mb-12 sm:mb-16 md:mb-24"
        >
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3 font-heading">
              Loved by Creators Worldwide
            </h3>
            <p className="text-sm sm:text-base text-white/50">See what our customers are saying</p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
                whileHover={{ y: -4 }}
                className="relative p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-white/10 transition-all duration-300 hover:border-white/20"
                style={{ backgroundColor: "rgba(13, 13, 13, 0.6)" }}
              >
                {/* Quote */}
                <div className="mb-4 sm:mb-5 md:mb-6">
                  <div className="flex gap-0.5 sm:gap-1 mb-3 sm:mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-white/70 text-xs sm:text-sm leading-relaxed italic">
                    "{testimonial.quote}"
                  </p>
                </div>

                {/* Author */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center text-white text-xs sm:text-sm font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-white text-xs sm:text-sm font-medium">{testimonial.author}</p>
                    <p className="text-white/40 text-[10px] sm:text-xs">{testimonial.role}, {testimonial.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 1 }}
          className="max-w-3xl mx-auto"
        >
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3 font-heading">
              Frequently Asked Questions
            </h3>
            <p className="text-sm sm:text-base text-white/50">Everything you need to know about our pricing</p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.3, delay: 1.1 + index * 0.1 }}
                className="rounded-xl sm:rounded-2xl border border-white/10 overflow-hidden"
                style={{ backgroundColor: "rgba(13, 13, 13, 0.6)" }}
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                >
                  <span className="text-sm sm:text-base text-white font-medium pr-4">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: expandedFaq === index ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0"
                  >
                    <span className="text-white text-sm sm:text-lg leading-none">+</span>
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {expandedFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 sm:px-6 pb-3 sm:pb-4 text-white/60 text-xs sm:text-sm leading-relaxed">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mt-12 sm:mt-16 md:mt-24 text-center"
        >
          <div 
            className="max-w-4xl mx-auto p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl border border-white/10 relative overflow-hidden"
            style={{ backgroundColor: "rgba(13, 13, 13, 0.8)" }}
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-pink-500/10" />
            
            <div className="relative">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4 font-heading">
                Still Have Questions?
              </h3>
              <p className="text-sm sm:text-base text-white/50 mb-6 sm:mb-8 max-w-xl mx-auto">
                Our team is here to help. Get in touch and we'll find the perfect plan for your needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-primary to-pink-500 text-white text-sm sm:text-base font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow"
                >
                  Talk to Sales
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-white/10 text-white text-sm sm:text-base font-semibold hover:bg-white/20 transition-colors"
                >
                  View Documentation
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Money-back guarantee */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 1.3 }}
          className="mt-8 sm:mt-10 md:mt-12 text-center"
        >
          <div className="inline-flex items-center gap-1.5 sm:gap-2 text-white/40 text-xs sm:text-sm">
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>30-day money-back guarantee • No questions asked</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default PricingSection;
