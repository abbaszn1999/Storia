import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { features, navLinks } from "@/website/constants/navigation";
import { X, ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuVariants = {
  closed: {
    x: "100%",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 40,
    },
  },
  open: {
    x: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 40,
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
};

const overlayVariants = {
  closed: { opacity: 0 },
  open: { opacity: 1 },
};

const itemVariants = {
  closed: { x: 20, opacity: 0 },
  open: { 
    x: 0, 
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    }
  },
};

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [location] = useLocation();
  const [expandedSection, setExpandedSection] = useState<string | null>("features");

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            onClick={onClose}
          />

          {/* Menu Panel */}
          <motion.div
            className={cn(
              "fixed top-0 right-0 h-full w-full max-w-sm z-50 lg:hidden",
              "border-l border-white/10 shadow-2xl"
            )}
            style={{ backgroundColor: "rgba(10, 10, 15, 0.97)" }}
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <motion.span 
                className="text-lg font-bold text-white"
                variants={itemVariants}
              >
                Menu
              </motion.span>
              <motion.button
                variants={itemVariants}
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </motion.button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4">
              <nav className="px-4 space-y-2">
                {/* Features Accordion */}
                <motion.div variants={itemVariants}>
                  <button
                    onClick={() => toggleSection("features")}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl",
                      "text-white hover:bg-white/10 transition-colors"
                    )}
                  >
                    <span className="font-medium">Features</span>
                    <motion.div
                      animate={{ rotate: expandedSection === "features" ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-5 w-5 text-white/60" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {expandedSection === "features" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-4 py-2 space-y-1">
                          {features.map((feature) => {
                            const Icon = feature.icon;
                            return (
                              <Link 
                                key={feature.id} 
                                href={feature.href}
                                onClick={onClose}
                              >
                                <motion.div
                                  className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg",
                                    "hover:bg-white/10 transition-colors cursor-pointer group"
                                  )}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <div className={cn(
                                    "h-9 w-9 rounded-lg bg-gradient-to-br flex items-center justify-center",
                                    feature.color
                                  )}>
                                    <Icon className="h-4 w-4 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-white">
                                        {feature.title}
                                      </span>
                                      {feature.badge && (
                                        <span className={cn(
                                          "px-1.5 py-0.5 text-[9px] font-semibold rounded-full",
                                          feature.badge === "New" && "bg-green-500/20 text-green-400",
                                          feature.badge === "Popular" && "bg-blue-500/20 text-blue-400"
                                        )}>
                                          {feature.badge}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs text-white/50 line-clamp-1">
                                      {feature.description}
                                    </span>
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-white/60 transition-colors" />
                                </motion.div>
                              </Link>
                            );
                          })}
                          
                          {/* All Features Link */}
                          <Link href="/features" onClick={onClose}>
                            <motion.div
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg mt-2",
                                "hover:bg-white/10 transition-colors cursor-pointer group",
                                "border-t border-white/10 pt-3"
                              )}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/20 to-pink-500/20 flex items-center justify-center">
                                <ArrowRight className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1">
                                <span className="text-sm font-medium text-white">
                                  All Features
                                </span>
                              </div>
                              <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-white/60 transition-colors" />
                            </motion.div>
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Other Links */}
                {navLinks.filter(link => !link.hasMegaMenu).map((link) => (
                  <motion.div key={link.id} variants={itemVariants}>
                    <Link href={link.href} onClick={onClose}>
                      <motion.div
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl",
                          "text-white hover:bg-white/10 transition-colors cursor-pointer",
                          location === link.href && "bg-white/10"
                        )}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="font-medium">{link.label}</span>
                        <ChevronRight className="h-5 w-5 text-white/30" />
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </nav>
            </div>

            {/* Footer - Auth Buttons */}
            <div className="p-4 border-t border-white/10 space-y-3">
              <motion.div variants={itemVariants}>
                <Link href="/auth/sign-in" onClick={onClose}>
                  <Button 
                    variant="outline" 
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    Sign In
                  </Button>
                </Link>
              </motion.div>
              <motion.div variants={itemVariants}>
                <Link href="/auth/sign-up" onClick={onClose}>
                  <Button className="w-full bg-primary hover:bg-primary/90 group">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
