// Page Transition Component - Slide from Right Animation

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

// Slide from right animation variants
const slideVariants = {
  initial: {
    x: "100%",
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94], // Custom easing for smooth slide
    },
  },
  exit: {
    x: "-30%",
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

// Fade + Scale animation (alternative)
const fadeScaleVariants = {
  initial: {
    opacity: 0,
    scale: 0.98,
    x: 50,
  },
  animate: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    x: -50,
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
};

/**
 * Page Transition Wrapper
 * Wraps page content with slide-from-right animation
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={slideVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Subtle Page Transition
 * Uses fade + scale for a more subtle effect
 */
export function SubtlePageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeScaleVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggered Content Animation
 * For animating multiple children with stagger effect
 */
interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

const staggerContainerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const staggerItemVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

export function StaggerContainer({ children, className }: StaggerContainerProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: PageTransitionProps) {
  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  );
}

/**
 * Overlay Transition
 * For modal-like transitions with backdrop
 */
interface OverlayTransitionProps {
  children: ReactNode;
  isOpen: boolean;
  onClose?: () => void;
}

export function OverlayTransition({ children, isOpen, onClose }: OverlayTransitionProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-0 z-50"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

