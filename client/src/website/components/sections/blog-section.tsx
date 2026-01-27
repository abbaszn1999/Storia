import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import BlurText from "../ui/blur-text";
import { 
  ChevronLeft,
  ChevronRight,
  Clock,
  ArrowRight,
  BookOpen,
  TrendingUp,
  Sparkles,
  Video,
  Lightbulb,
  Users
} from "lucide-react";

// Blog categories
const categories = [
  { id: "all", label: "All Posts" },
  { id: "tutorials", label: "Tutorials" },
  { id: "tips", label: "Tips & Tricks" },
  { id: "updates", label: "Product Updates" },
  { id: "stories", label: "Creator Stories" },
];

// Blog posts data
const blogPosts = [
  {
    id: 1,
    title: "10 AI Video Editing Techniques That Will Transform Your Content",
    excerpt: "Discover the cutting-edge AI techniques that professional creators use to produce stunning videos in half the time.",
    category: "tutorials",
    image: "https://picsum.photos/seed/video1/800/500",
    author: {
      name: "Sarah Chen",
      avatar: "SC",
      role: "Content Strategist",
    },
    date: "Jan 18, 2026",
    readTime: "8 min read",
    featured: true,
    icon: Video,
    color: "#8B5CF6",
  },
  {
    id: 2,
    title: "How to Create Viral Short-Form Videos with AI",
    excerpt: "Learn the secrets behind viral TikTok and Instagram Reels content using AI-powered tools.",
    category: "tips",
    image: "https://picsum.photos/seed/viral2/800/500",
    author: {
      name: "Michael Torres",
      avatar: "MT",
      role: "Growth Expert",
    },
    date: "Jan 15, 2026",
    readTime: "6 min read",
    featured: false,
    icon: TrendingUp,
    color: "#EC4899",
  },
  {
    id: 3,
    title: "Introducing Storia 2.0: The Future of Video Creation",
    excerpt: "We're excited to announce our biggest update yet with revolutionary new features for creators.",
    category: "updates",
    image: "https://picsum.photos/seed/storia3/800/500",
    author: {
      name: "Storia Team",
      avatar: "ST",
      role: "Product Team",
    },
    date: "Jan 12, 2026",
    readTime: "4 min read",
    featured: true,
    icon: Sparkles,
    color: "#F59E0B",
  },
  {
    id: 4,
    title: "From Zero to 1M Subscribers: A Creator's Journey with Storia",
    excerpt: "How Emma built her YouTube empire using AI-powered video creation tools.",
    category: "stories",
    image: "https://picsum.photos/seed/creator4/800/500",
    author: {
      name: "Emma Williams",
      avatar: "EW",
      role: "Featured Creator",
    },
    date: "Jan 10, 2026",
    readTime: "10 min read",
    featured: false,
    icon: Users,
    color: "#10B981",
  },
  {
    id: 5,
    title: "The Ultimate Guide to AI Storyboarding",
    excerpt: "Everything you need to know about creating professional storyboards with artificial intelligence.",
    category: "tutorials",
    image: "https://picsum.photos/seed/story5/800/500",
    author: {
      name: "David Park",
      avatar: "DP",
      role: "Creative Director",
    },
    date: "Jan 8, 2026",
    readTime: "12 min read",
    featured: false,
    icon: BookOpen,
    color: "#06B6D4",
  },
  {
    id: 6,
    title: "5 Creative Ways to Use AI Voice Generation",
    excerpt: "Unlock the full potential of AI voice technology for your video projects.",
    category: "tips",
    image: "https://picsum.photos/seed/voice6/800/500",
    author: {
      name: "Lisa Johnson",
      avatar: "LJ",
      role: "Audio Specialist",
    },
    date: "Jan 5, 2026",
    readTime: "7 min read",
    featured: false,
    icon: Lightbulb,
    color: "#8B5CF6",
  },
  {
    id: 7,
    title: "Mastering Color Grading with AI Assistance",
    excerpt: "How AI can help you achieve cinematic color grades in your videos effortlessly.",
    category: "tutorials",
    image: "https://picsum.photos/seed/color7/800/500",
    author: {
      name: "Alex Rivera",
      avatar: "AR",
      role: "Colorist",
    },
    date: "Jan 3, 2026",
    readTime: "9 min read",
    featured: false,
    icon: Video,
    color: "#EC4899",
  },
  {
    id: 8,
    title: "Building a Content Empire: Automation Strategies",
    excerpt: "Scale your content production with smart automation and AI workflows.",
    category: "tips",
    image: "https://picsum.photos/seed/auto8/800/500",
    author: {
      name: "Chris Anderson",
      avatar: "CA",
      role: "Marketing Lead",
    },
    date: "Jan 1, 2026",
    readTime: "8 min read",
    featured: false,
    icon: TrendingUp,
    color: "#F59E0B",
  },
];

export function BlogSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  
  const [activeCategory, setActiveCategory] = useState("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(3);

  // Filter posts by category
  const filteredPosts = activeCategory === "all" 
    ? blogPosts 
    : blogPosts.filter(post => post.category === activeCategory);

  // Update cards per view based on screen size
  useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth < 640) {
        setCardsPerView(1);
      } else if (window.innerWidth < 1024) {
        setCardsPerView(2);
      } else {
        setCardsPerView(3);
      }
    };

    updateCardsPerView();
    window.addEventListener("resize", updateCardsPerView);
    return () => window.removeEventListener("resize", updateCardsPerView);
  }, []);

  // Reset index when category changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeCategory]);

  const maxIndex = Math.max(0, filteredPosts.length - cardsPerView);

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

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
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            <span className="text-xs sm:text-sm text-white/70">From Our Blog</span>
          </motion.div>
          
          <BlurText
            text="Learn & Get Inspired"
            delay={150}
            animateBy="words"
            direction="top"
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 font-heading"
          />
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-sm sm:text-base md:text-lg text-white/50 max-w-2xl mx-auto px-2"
          >
            Tutorials, tips, and insights to help you create amazing content
          </motion.p>
        </div>

        {/* Category Tabs - Horizontal scrollable on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-start sm:justify-center gap-2 sm:gap-3 mb-8 sm:mb-10 md:mb-12 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 flex-shrink-0 whitespace-nowrap ${
                activeCategory === category.id
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10"
              }`}
            >
              {category.label}
            </button>
          ))}
        </motion.div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          <div className="absolute -left-2 sm:-left-4 md:-left-6 top-1/2 -translate-y-1/2 z-20">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className={`w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                currentIndex === 0
                  ? "bg-white/5 text-white/20 cursor-not-allowed"
                  : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
              }`}
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
          </div>

          <div className="absolute -right-2 sm:-right-4 md:-right-6 top-1/2 -translate-y-1/2 z-20">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextSlide}
              disabled={currentIndex >= maxIndex}
              className={`w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                currentIndex >= maxIndex
                  ? "bg-white/5 text-white/20 cursor-not-allowed"
                  : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
              }`}
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
          </div>

          {/* Cards Carousel */}
          <div ref={carouselRef} className="overflow-hidden px-2">
            <motion.div
              className="flex gap-3 sm:gap-4 md:gap-6"
              animate={{ x: `-${currentIndex * (100 / cardsPerView)}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <AnimatePresence mode="wait">
                {filteredPosts.map((post, index) => {
                  const Icon = post.icon;
                  
                  return (
                    <motion.article
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={isInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
                      className="group flex-shrink-0"
                      style={{ 
                        width: `calc(${100 / cardsPerView}% - ${(cardsPerView - 1) * (cardsPerView === 1 ? 12 : cardsPerView === 2 ? 16 : 24) / cardsPerView}px)` 
                      }}
                    >
                      <div 
                        className="h-full rounded-2xl sm:rounded-3xl border border-white/10 overflow-hidden transition-all duration-500 hover:border-white/20 hover:shadow-2xl hover:shadow-primary/10"
                        style={{ backgroundColor: "rgba(13, 13, 13, 0.8)" }}
                      >
                        {/* Image */}
                        <div className="relative h-40 sm:h-44 md:h-52 overflow-hidden">
                          <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          
                          {/* Overlay Gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          
                          {/* Category Badge */}
                          <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
                            <div 
                              className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1 sm:gap-1.5"
                              style={{ backgroundColor: `${post.color}30`, color: post.color }}
                            >
                              <Icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              <span className="hidden sm:inline">{categories.find(c => c.id === post.category)?.label}</span>
                              <span className="sm:hidden">{categories.find(c => c.id === post.category)?.label.split(' ')[0]}</span>
                            </div>
                          </div>

                          {/* Featured Badge */}
                          {post.featured && (
                            <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                              <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-primary to-pink-500 text-white text-[10px] sm:text-xs font-semibold flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                Featured
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-4 sm:p-5 md:p-6">
                          {/* Title */}
                          <h3 className="text-sm sm:text-base md:text-lg font-bold text-white mb-2 sm:mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                            {post.title}
                          </h3>
                          
                          {/* Excerpt */}
                          <p className="text-white/50 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4 md:mb-5 line-clamp-2">
                            {post.excerpt}
                          </p>

                          {/* Author & Meta */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div 
                                className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-semibold"
                                style={{ background: `linear-gradient(135deg, ${post.color}, ${post.color}99)` }}
                              >
                                {post.author.avatar}
                              </div>
                              <div>
                                <p className="text-white text-xs sm:text-sm font-medium">{post.author.name}</p>
                                <div className="flex items-center gap-1 sm:gap-2 text-white/40 text-[10px] sm:text-xs">
                                  <span>{post.date}</span>
                                  <span>•</span>
                                  <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                  <span>{post.readTime}</span>
                                </div>
                              </div>
                            </div>

                            {/* Read More */}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-primary hover:text-white transition-all duration-300"
                            >
                              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Dots Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex justify-center gap-1.5 sm:gap-2 mt-6 sm:mt-8"
          >
            {Array.from({ length: maxIndex + 1 }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                  currentIndex === index
                    ? "w-6 sm:w-8 bg-primary"
                    : "w-1.5 sm:w-2 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-10 sm:mt-12 md:mt-16"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-5 sm:px-6 md:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-white text-sm sm:text-base font-semibold hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
          >
            <span>View All Articles</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

export default BlogSection;
