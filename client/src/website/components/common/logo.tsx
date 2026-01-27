import { Link } from "wouter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "light" | "dark" | "auto";
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-12 w-12",
  lg: "h-16 w-16",
  xl: "h-20 w-20",
};

const textSizeClasses = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl",
};

export function Logo({ 
  variant = "auto", 
  className,
  showText = true,
  size = "md"
}: LogoProps) {
  const logoSrc = variant === "light" 
    ? "/storia-logo-white.png" 
    : variant === "dark" 
      ? "/storia-logo-black.png"
      : "/storia-logo-white.png"; // auto uses white, CSS handles dark mode

  return (
    <Link href="/">
      <motion.div 
        className={cn(
          "flex items-center gap-2.5 cursor-pointer group",
          className
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Logo Icon with Glow Effect */}
        <div className="relative">
          {/* Glow Effect */}
          <motion.div
            className="absolute inset-0 bg-primary/20 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            initial={false}
          />
          
          {/* Logo Image */}
          <motion.img
            src={logoSrc}
            alt="Storia"
            className={cn(
              sizeClasses[size],
              "relative z-10 object-contain",
              variant === "auto" && "dark:invert-0 invert"
            )}
            initial={{ rotate: 0 }}
            whileHover={{ 
              rotate: [0, -5, 5, 0],
              transition: { duration: 0.5 }
            }}
          />
        </div>

        {/* Logo Text */}
        {showText && (
          <motion.span 
            className={cn(
              textSizeClasses[size],
              "font-bold tracking-tight",
              variant === "light" && "text-white",
              variant === "dark" && "text-gray-900",
              variant === "auto" && "text-white"
            )}
            initial={{ opacity: 1 }}
          >
            <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent group-hover:from-primary group-hover:to-purple-400 transition-all duration-300">
              Storia
            </span>
          </motion.span>
        )}
      </motion.div>
    </Link>
  );
}

// Animated Logo for special occasions
export function AnimatedLogo({ className }: { className?: string }) {
  return (
    <Link href="/">
      <motion.div 
        className={cn("flex items-center gap-2.5 cursor-pointer", className)}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.img
          src="/storia-logo-white.png"
          alt="Storia"
          className="h-8 w-8"
          animate={{ 
            rotate: [0, 360],
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.span 
          className="text-xl font-bold text-white"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          Storia
        </motion.span>
      </motion.div>
    </Link>
  );
}
