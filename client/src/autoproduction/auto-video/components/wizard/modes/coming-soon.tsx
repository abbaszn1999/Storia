import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Construction, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import type { VideoMode } from "../../../types";
import { VIDEO_MODES } from "../../../types";

interface ComingSoonProps {
  mode: VideoMode;
  onBack: () => void;
}

export function ComingSoon({ mode, onBack }: ComingSoonProps) {
  const modeConfig = VIDEO_MODES.find((m) => m.id === mode);

  return (
    <div className="space-y-8 w-full">
      {/* Animated Header */}
      <motion.div
        className="text-center space-y-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-center gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Construction className="h-8 w-8 text-amber-500" />
          </motion.div>
          <h2 className="text-3xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-500">
            Coming Soon
          </h2>
        </div>
      </motion.div>

      {/* Coming Soon Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-lg mx-auto"
      >
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5" />
          <CardContent className="p-10 text-center space-y-6 relative z-10">
            {/* Icon */}
            <motion.div
              className="mx-auto w-20 h-20 rounded-2xl bg-amber-500/10 flex items-center justify-center"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Construction className="h-10 w-10 text-amber-500" />
            </motion.div>

            {/* Mode Name */}
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                {modeConfig?.title || 'This Mode'}
              </h3>
              <p className="text-muted-foreground">
                {modeConfig?.description || 'This video mode is currently under development.'}
              </p>
            </div>

            {/* Message */}
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                We're working hard to bring you this feature. Please check back soon or try the{" "}
                <span className="font-semibold">Ambient Visual</span> mode which is available now.
              </p>
            </div>

            {/* Back Button */}
            <Button
              variant="outline"
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back to Mode Selection
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
