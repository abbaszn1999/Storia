import { Link } from "wouter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Twitter, 
  Linkedin, 
  Github, 
  Youtube,
  ArrowRight,
  Mail,
  MapPin,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

const footerLinks = {
  product: {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Storyboard", href: "/features/storyboard" },
      { label: "Video Generator", href: "/features/video-generator" },
      { label: "Auto Production", href: "/features/auto-production" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  resources: {
    title: "Resources",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Documentation", href: "/docs" },
      { label: "Tutorials", href: "/tutorials" },
      { label: "API Reference", href: "/api" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
      { label: "Partners", href: "/partners" },
      { label: "Press Kit", href: "/press" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "GDPR", href: "/gdpr" },
    ],
  },
};

const socialLinks = [
  { icon: Twitter, href: "https://twitter.com/storia", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com/company/storia", label: "LinkedIn" },
  { icon: Github, href: "https://github.com/storia", label: "GitHub" },
  { icon: Youtube, href: "https://youtube.com/storia", label: "YouTube" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-white/10">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[300px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[250px] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Newsletter Section */}
        <div className="py-16 border-b border-white/10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm text-primary font-medium">Stay Updated</span>
              </div>
              
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Subscribe to our newsletter
              </h3>
              <p className="text-white/60 mb-8 max-w-xl mx-auto">
                Get the latest updates, tips, and exclusive content delivered straight to your inbox.
              </p>

              <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className={cn(
                      "w-full h-12 pl-12 pr-4 rounded-xl",
                      "bg-white/5 border border-white/10",
                      "text-white placeholder:text-white/40",
                      "focus:outline-none focus:border-primary/50 focus:bg-white/10",
                      "transition-all duration-300"
                    )}
                  />
                </div>
                <Button 
                  type="submit"
                  className="h-12 px-6 bg-primary hover:bg-primary/90 group"
                >
                  Subscribe
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </form>
            </motion.div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
            {/* Brand Column */}
            <div className="col-span-2">
              <Link href="/">
                <motion.div 
                  className="mb-6"
                  whileHover={{ scale: 1.02 }}
                >
                  <img 
                    src="/storia-logo-white.png" 
                    alt="Storia" 
                    className="h-12 w-auto"
                  />
                </motion.div>
              </Link>
              
              <p className="text-white/60 mb-6 max-w-xs leading-relaxed">
                Transform your ideas into stunning videos with AI-powered tools. Create professional content in minutes.
              </p>

              {/* Social Links */}
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center",
                      "bg-white/5 border border-white/10",
                      "text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20",
                      "transition-all duration-300"
                    )}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={social.label}
                  >
                    <social.icon className="h-5 w-5" />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Links Columns */}
            {Object.entries(footerLinks).map(([key, section]) => (
              <div key={key}>
                <h4 className="text-white font-semibold mb-4">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href}>
                        <motion.span
                          className="text-white/50 hover:text-white transition-colors cursor-pointer inline-block"
                          whileHover={{ x: 3 }}
                        >
                          {link.label}
                        </motion.span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-white/40 text-sm">
              © {new Date().getFullYear()} Storia. All rights reserved.
            </p>

            {/* Location & Status */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-white/40 text-sm">
                <MapPin className="h-4 w-4" />
                <span>Lebanon, Beirut</span>
              </div>
              
              {/* Status Indicator */}
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-white/40 text-sm">All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
