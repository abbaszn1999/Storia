import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/website/components/common/logo";
import { MegaMenu } from "./mega-menu";
import { MobileMenu } from "./mobile-menu";
import { useScroll } from "@/website/hooks/use-scroll";
import { useMobileMenu } from "@/website/hooks/use-mobile-menu";
import { navLinks } from "@/website/constants/navigation";
import { ChevronDown, Menu, ArrowRight } from "lucide-react";

export function Header() {
  const [location] = useLocation();
  const { isScrolled } = useScroll(20);
  const { isOpen: isMobileMenuOpen, toggle: toggleMobileMenu, close: closeMobileMenu } = useMobileMenu();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(true);

  // Handle theme
  useEffect(() => {
    const theme = localStorage.getItem("storia-theme");
    setIsDark(theme !== "light");
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("storia-theme", newTheme);
  };

  // Close mega menu when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-mega-menu]") && !target.closest("[data-menu-trigger]")) {
        setActiveMenu(null);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Close mega menu on route change
  useEffect(() => {
    setActiveMenu(null);
  }, [location]);

  return (
    <>
      <motion.header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isScrolled
            ? "backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/10"
            : "bg-transparent"
        )}
        style={{
          backgroundColor: isScrolled ? "rgba(13, 13, 13, 0.8)" : "transparent"
        }}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="container mx-auto px-4">
          <nav
            className={cn(
              "flex items-center justify-between transition-all duration-300",
              isScrolled ? "h-16" : "h-20"
            )}
          >
            {/* Logo */}
            <Logo variant="light" size={isScrolled ? "lg" : "xl"} showText={false} />

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <div key={link.id} className="relative">
                  {link.hasMegaMenu ? (
                    <button
                      data-menu-trigger
                      onClick={() => setActiveMenu(activeMenu === link.id ? null : link.id)}
                      className={cn(
                        "flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium",
                        "text-white/80 hover:text-white transition-colors",
                        "hover:bg-white/10",
                        activeMenu === link.id && "bg-white/10 text-white"
                      )}
                    >
                      {link.label}
                      <motion.div
                        animate={{ rotate: activeMenu === link.id ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </motion.div>
                    </button>
                  ) : (
                    <Link href={link.href}>
                      <NavLink isActive={location === link.href}>
                        {link.label}
                      </NavLink>
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Sign In */}
              <Link href="/auth/sign-in">
                <Button
                  variant="ghost"
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  Sign In
                </Button>
              </Link>

              {/* Get Started - CTA */}
              <Link href="/auth/sign-up">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button className="bg-primary hover:bg-primary/90 group relative overflow-hidden">
                    {/* Glow Effect */}
                    <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <span className="relative flex items-center gap-2">
                      Get Started
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </motion.div>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              className="lg:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              onClick={toggleMobileMenu}
              whileTap={{ scale: 0.95 }}
            >
              <Menu className="h-6 w-6" />
            </motion.button>
          </nav>
        </div>

        {/* Mega Menu */}
        <AnimatePresence>
          {activeMenu === "features" && (
            <div data-mega-menu>
              <MegaMenu 
                isOpen={activeMenu === "features"} 
                onClose={() => setActiveMenu(null)} 
              />
            </div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Mobile Menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
    </>
  );
}

// NavLink Component with animated underline
function NavLink({ 
  children, 
  isActive 
}: { 
  children: React.ReactNode; 
  isActive?: boolean;
}) {
  return (
    <motion.span
      className={cn(
        "relative px-4 py-2 rounded-lg text-sm font-medium cursor-pointer block",
        "text-white/80 hover:text-white transition-colors",
        "hover:bg-white/10",
        isActive && "text-white"
      )}
      whileHover="hover"
    >
      {children}
      
      {/* Animated Underline */}
      <motion.span
        className="absolute bottom-1 left-4 right-4 h-0.5 bg-primary rounded-full"
        initial={{ scaleX: isActive ? 1 : 0 }}
        variants={{
          hover: { scaleX: 1 }
        }}
        transition={{ duration: 0.2 }}
        style={{ originX: 0 }}
      />
    </motion.span>
  );
}

export default Header;
