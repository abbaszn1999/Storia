import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import BlurText from "../ui/blur-text";
import { AnimatedCounter } from "../common";
import { 
  Target,
  Lightbulb,
  Users,
  Rocket,
  Heart,
  Globe,
  Zap,
  Shield,
  Award,
  TrendingUp
} from "lucide-react";

// Company values
const values = [
  {
    icon: Lightbulb,
    title: "Innovation First",
    description: "Pushing the boundaries of AI-powered video creation",
    color: "#8B5CF6",
  },
  {
    icon: Users,
    title: "Creator Focused",
    description: "Building tools that empower storytellers worldwide",
    color: "#EC4899",
  },
  {
    icon: Shield,
    title: "Trust & Quality",
    description: "Delivering reliable, professional-grade results",
    color: "#06B6D4",
  },
  {
    icon: Globe,
    title: "Global Impact",
    description: "Making video creation accessible to everyone",
    color: "#10B981",
  },
];

// Stats
const stats = [
  { value: "500K+", label: "Creators" },
  { value: "10M+", label: "Videos Created" },
  { value: "150+", label: "Countries" },
  { value: "99.9%", label: "Uptime" },
];

// Team highlights
const teamHighlights = [
  {
    icon: Award,
    text: "Founded by industry veterans from Google, Adobe, and Netflix",
  },
  {
    icon: TrendingUp,
    text: "Backed by leading AI and media technology investors",
  },
  {
    icon: Zap,
    text: "Pioneering the future of automated content creation",
  },
];

export function AboutSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section ref={containerRef} className="relative py-16 sm:py-24 md:py-32 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Part 1: Mission & Vision */}
        <div className="max-w-6xl mx-auto mb-16 sm:mb-24 md:mb-32">
          {/* Section Header */}
          <div className="text-center mb-10 sm:mb-14 md:mb-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10 mb-4 sm:mb-6"
            >
              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-500" />
              <span className="text-xs sm:text-sm text-white/70">Our Story</span>
            </motion.div>
            
            <BlurText
              text="About Storia"
              delay={150}
              animateBy="words"
              direction="top"
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 font-heading"
            />
          </div>

          {/* Mission & Vision Cards */}
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-10 sm:mb-14 md:mb-20">
            {/* Mission */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative group"
            >
              <div 
                className="relative p-5 sm:p-6 md:p-8 lg:p-10 rounded-2xl sm:rounded-3xl border border-white/10 h-full overflow-hidden"
                style={{ backgroundColor: "rgba(13, 13, 13, 0.8)" }}
              >
                {/* Decorative gradient */}
                <div className="absolute top-0 right-0 w-40 sm:w-64 h-40 sm:h-64 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity" />
                
                <div className="relative">
                  <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl bg-primary/20 flex items-center justify-center">
                      <Target className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary" />
                    </div>
                    <div>
                      <span className="text-[10px] sm:text-xs text-white/40 uppercase tracking-wider">Our Mission</span>
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white font-heading">Why We Exist</h3>
                    </div>
                  </div>
                  
                  <p className="text-sm sm:text-base md:text-lg text-white/70 leading-relaxed mb-4 sm:mb-6">
                    We believe everyone has a story worth telling. Our mission is to democratize video creation by harnessing the power of AI, enabling creators of all skill levels to produce professional, engaging content that captivates audiences.
                  </p>
                  
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 sm:w-10 md:w-12 h-1 bg-gradient-to-r from-primary to-purple-500 rounded-full" />
                    <span className="text-xs sm:text-sm text-white/50">Empowering creators since 2023</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Vision */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative group"
            >
              <div 
                className="relative p-5 sm:p-6 md:p-8 lg:p-10 rounded-2xl sm:rounded-3xl border border-white/10 h-full overflow-hidden"
                style={{ backgroundColor: "rgba(13, 13, 13, 0.8)" }}
              >
                {/* Decorative gradient */}
                <div className="absolute top-0 left-0 w-40 sm:w-64 h-40 sm:h-64 bg-gradient-to-br from-pink-500/20 to-transparent rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity" />
                
                <div className="relative">
                  <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl bg-pink-500/20 flex items-center justify-center">
                      <Rocket className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-pink-500" />
                    </div>
                    <div>
                      <span className="text-[10px] sm:text-xs text-white/40 uppercase tracking-wider">Our Vision</span>
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white font-heading">Where We're Going</h3>
                    </div>
                  </div>
                  
                  <p className="text-sm sm:text-base md:text-lg text-white/70 leading-relaxed mb-4 sm:mb-6">
                    We envision a future where ideas flow seamlessly from imagination to screen. Where language barriers dissolve, and every creator—from individuals to enterprises—can produce cinema-quality content with just a few clicks.
                  </p>
                  
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 sm:w-10 md:w-12 h-1 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full" />
                    <span className="text-xs sm:text-sm text-white/50">Building the future of storytelling</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                className="text-center p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-white/5"
                style={{ backgroundColor: "rgba(13, 13, 13, 0.4)" }}
              >
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-0.5 sm:mb-1 font-heading">
                  <AnimatedCounter value={stat.value} duration={2} />
                </div>
                <div className="text-xs sm:text-sm text-white/40">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Part 2: Values & Team */}
        <div className="max-w-6xl mx-auto">
          {/* Values Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="text-center mb-8 sm:mb-12 md:mb-16"
          >
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-4 font-heading">
              Our Core Values
            </h3>
            <p className="text-sm sm:text-base md:text-lg text-white/50 max-w-2xl mx-auto px-2">
              The principles that guide everything we do
            </p>
          </motion.div>

          {/* Values Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 mb-10 sm:mb-14 md:mb-20">
            {values.map((value, index) => {
              const Icon = value.icon;
              
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group relative p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-white/10 text-center transition-all duration-300 hover:border-white/20"
                  style={{ backgroundColor: "rgba(13, 13, 13, 0.6)" }}
                >
                  {/* Icon */}
                  <div 
                    className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mx-auto rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${value.color}15` }}
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" style={{ color: value.color }} />
                  </div>

                  <h4 className="text-sm sm:text-base md:text-lg font-semibold text-white mb-1 sm:mb-2">
                    {value.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-white/50 line-clamp-2">
                    {value.description}
                  </p>

                  {/* Hover Glow */}
                  <div 
                    className="absolute inset-0 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ 
                      background: `radial-gradient(circle at 50% 30%, ${value.color}15 0%, transparent 70%)`,
                    }}
                  />
                </motion.div>
              );
            })}
          </div>

          {/* Team Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 1 }}
            className="relative rounded-2xl sm:rounded-3xl border border-white/10 overflow-hidden"
            style={{ backgroundColor: "rgba(13, 13, 13, 0.6)" }}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-1/4 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-pink-500/20 rounded-full blur-3xl" />
            </div>

            <div className="relative p-5 sm:p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 items-center">
                {/* Left - Text */}
                <div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4 font-heading">
                    Built by Experts,{" "}
                    <span className="text-primary">For Creators</span>
                  </h3>
                  <p className="text-sm sm:text-base text-white/60 leading-relaxed mb-5 sm:mb-6 md:mb-8">
                    Our team combines decades of experience in AI, video production, and creative tools. 
                    We've worked at the world's leading technology and media companies, and now we're 
                    channeling that expertise into building the future of content creation.
                  </p>

                  {/* Team Highlights */}
                  <div className="space-y-3 sm:space-y-4">
                    {teamHighlights.map((highlight, index) => {
                      const Icon = highlight.icon;
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={isInView ? { opacity: 1, x: 0 } : {}}
                          transition={{ duration: 0.4, delay: 1.1 + index * 0.1 }}
                          className="flex items-center gap-3 sm:gap-4"
                        >
                          <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                          </div>
                          <span className="text-white/70 text-xs sm:text-sm">{highlight.text}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Right - Visual - Animated Orbital System */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.6, delay: 1.2 }}
                  className="relative"
                >
                  <div className="aspect-square max-w-[200px] sm:max-w-xs md:max-w-md mx-auto relative">
                    {/* Outer Ring - Slowest rotation */}
                    <motion.div 
                      className="absolute inset-0 rounded-full border border-white/10"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                    >
                      {/* Outer ring glow points */}
                      {[0, 90, 180, 270].map((deg) => (
                        <motion.div
                          key={`outer-${deg}`}
                          className="absolute w-2 h-2 rounded-full bg-primary/50"
                          style={{
                            top: `${50 + 50 * Math.sin((deg * Math.PI) / 180)}%`,
                            left: `${50 + 50 * Math.cos((deg * Math.PI) / 180)}%`,
                            transform: "translate(-50%, -50%)",
                          }}
                          animate={{
                            opacity: [0.3, 1, 0.3],
                            scale: [1, 1.5, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: deg / 180,
                          }}
                        />
                      ))}
                    </motion.div>
                    
                    {/* Middle Ring - Medium rotation (opposite direction) */}
                    <motion.div 
                      className="absolute inset-8 rounded-full border border-white/15"
                      animate={{ rotate: -360 }}
                      transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    >
                      {/* Middle ring particles */}
                      {[0, 120, 240].map((deg) => (
                        <motion.div
                          key={`mid-${deg}`}
                          className="absolute w-3 h-3 rounded-full"
                          style={{
                            top: `${50 + 50 * Math.sin((deg * Math.PI) / 180)}%`,
                            left: `${50 + 50 * Math.cos((deg * Math.PI) / 180)}%`,
                            transform: "translate(-50%, -50%)",
                            background: "linear-gradient(135deg, #8B5CF6, #EC4899)",
                          }}
                          animate={{
                            opacity: [0.5, 1, 0.5],
                            boxShadow: [
                              "0 0 5px #8B5CF6",
                              "0 0 20px #8B5CF6, 0 0 40px #EC4899",
                              "0 0 5px #8B5CF6",
                            ],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: deg / 120,
                          }}
                        />
                      ))}
                    </motion.div>
                    
                    {/* Inner Ring - Fastest rotation */}
                    <motion.div 
                      className="absolute inset-16 rounded-full border border-white/20"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    >
                      {/* Inner ring glowing dots */}
                      {[0, 180].map((deg) => (
                        <motion.div
                          key={`inner-${deg}`}
                          className="absolute w-2 h-2 rounded-full bg-pink-500"
                          style={{
                            top: `${50 + 50 * Math.sin((deg * Math.PI) / 180)}%`,
                            left: `${50 + 50 * Math.cos((deg * Math.PI) / 180)}%`,
                            transform: "translate(-50%, -50%)",
                          }}
                          animate={{
                            opacity: [0.6, 1, 0.6],
                            scale: [1, 1.3, 1],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: deg / 360,
                          }}
                        />
                      ))}
                    </motion.div>
                    
                    {/* Pulsing background glow */}
                    <motion.div
                      className="absolute inset-20 rounded-full bg-gradient-to-br from-primary/20 to-pink-500/20 blur-xl"
                      animate={{
                        opacity: [0.3, 0.6, 0.3],
                        scale: [0.9, 1.1, 0.9],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    
                    {/* Center Logo with pulse */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div 
                        className="w-14 h-14 sm:w-18 sm:h-18 md:w-24 md:h-24 rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center shadow-2xl"
                        animate={{
                          boxShadow: [
                            "0 0 30px rgba(139, 92, 246, 0.3), 0 0 60px rgba(236, 72, 153, 0.2)",
                            "0 0 50px rgba(139, 92, 246, 0.5), 0 0 100px rgba(236, 72, 153, 0.3)",
                            "0 0 30px rgba(139, 92, 246, 0.3), 0 0 60px rgba(236, 72, 153, 0.2)",
                          ],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <img 
                          src="/logo-circle.png" 
                          alt="Storia Logo" 
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                    </div>

                    {/* Orbiting Elements - Main satellites */}
                    <motion.div
                      className="absolute inset-0"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    >
                      {[0, 60, 120, 180, 240, 300].map((degree, i) => {
                        const colors = ["#8B5CF6", "#EC4899", "#06B6D4", "#F59E0B", "#10B981", "#8B5CF6"];
                        return (
                          <motion.div
                            key={i}
                            className="absolute w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 rounded-full backdrop-blur-sm border border-white/20 flex items-center justify-center"
                            style={{
                              top: `${50 + 40 * Math.sin((degree * Math.PI) / 180)}%`,
                              left: `${50 + 40 * Math.cos((degree * Math.PI) / 180)}%`,
                              transform: "translate(-50%, -50%)",
                              background: `linear-gradient(135deg, ${colors[i]}20, ${colors[i]}10)`,
                            }}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={isInView ? { 
                              opacity: 1, 
                              scale: [1, 1.1, 1],
                            } : {}}
                            transition={{ 
                              opacity: { duration: 0.4, delay: 1.3 + i * 0.1 },
                              scale: { duration: 2 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }
                            }}
                          >
                            <motion.div 
                              className="w-4 h-4 sm:w-5 sm:h-5 md:w-8 md:h-8 rounded-full"
                              style={{
                                background: `linear-gradient(135deg, ${colors[i]}40, ${colors[i]}20)`,
                              }}
                              animate={{
                                rotate: -360,
                              }}
                              transition={{
                                duration: 30,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            />
                          </motion.div>
                        );
                      })}
                    </motion.div>

                    {/* Floating particles */}
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={`particle-${i}`}
                        className="absolute w-1 h-1 rounded-full bg-white/40"
                        style={{
                          top: `${20 + Math.random() * 60}%`,
                          left: `${20 + Math.random() * 60}%`,
                        }}
                        animate={{
                          y: [0, -20, 0],
                          x: [0, Math.random() * 10 - 5, 0],
                          opacity: [0, 1, 0],
                        }}
                        transition={{
                          duration: 3 + Math.random() * 2,
                          repeat: Infinity,
                          delay: i * 0.5,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
