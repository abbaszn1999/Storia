import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Mail, Loader2, CheckCircle, Eye, EyeOff, KeyRound, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import { LightPillar } from "@/website/components/ui/light-pillar";

type Step = "email" | "code" | "password" | "success";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

const codeSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

const passwordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type EmailFormData = z.infer<typeof emailSchema>;
type CodeFormData = z.infer<typeof codeSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

// Floating particles component
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-amber-500/30 rounded-full"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            y: [null, Math.random() * -200 - 100],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 5,
          }}
        />
      ))}
    </div>
  );
}

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("email");
  const [userEmail, setUserEmail] = useState("");
  const [verifiedCode, setVerifiedCode] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const sendCodeMutation = useMutation({
    mutationFn: async (data: EmailFormData) => {
      const response = await apiRequest("POST", "/api/auth/forgot-password", data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      setUserEmail(variables.email);
      setStep("code");
      setResendTimer(60);
      toast({
        title: "Code sent",
        description: "Check your email for the reset code.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset code",
        variant: "destructive",
      });
    },
  });

  const verifyCodeMutation = useMutation({
    mutationFn: async (data: CodeFormData) => {
      const response = await apiRequest("POST", "/api/auth/verify-reset-code", {
        email: userEmail,
        code: data.code,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      setVerifiedCode(variables.code);
      setStep("password");
    },
    onError: (error: Error) => {
      toast({
        title: "Invalid code",
        description: error.message || "The code is incorrect or expired",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      const response = await apiRequest("POST", "/api/auth/reset-password", {
        email: userEmail,
        code: verifiedCode,
        newPassword: data.newPassword,
      });
      return response.json();
    },
    onSuccess: () => {
      setStep("success");
      toast({
        title: "Password reset",
        description: "Your password has been reset successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  const resendCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/forgot-password", { email: userEmail });
      return response.json();
    },
    onSuccess: () => {
      setResendTimer(60);
      toast({
        title: "Code resent",
        description: "A new code has been sent to your email.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resend code",
        variant: "destructive",
      });
    },
  });

  if (step === "success") {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* LightPillar Background */}
        <div className="fixed inset-0 z-0">
          <LightPillar />
        </div>

        {/* Dark Overlay */}
        <div className="fixed inset-0 bg-gray-950/70 z-[1]" />

        {/* Content */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
          <Link href="/">
            <motion.img 
              src="/storia-logo-white.png" 
              alt="Storia" 
              className="h-10 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            />
          </Link>
          </motion.div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            <div 
              className="relative rounded-3xl border border-white/10 backdrop-blur-2xl p-8 shadow-2xl text-center"
              style={{ backgroundColor: 'rgba(13, 13, 13, 0.8)' }}
            >
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 rounded-3xl blur-xl opacity-50" />
              
              <div className="relative">
                {/* Success Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="flex items-center justify-center mb-6"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-500/30 rounded-full blur-xl" />
                    <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-green-500/30 to-emerald-500/30 border border-green-500/30 flex items-center justify-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring" }}
                      >
                        <CheckCircle className="h-12 w-12 text-green-400" />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-white mb-3"
                >
                  Password Reset Complete
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/60 mb-8"
                >
                  Your password has been reset successfully. You can now sign in with your new password.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-green-500/25 border-0"
                    onClick={() => setLocation("/auth/sign-in")}
                    data-testid="button-go-to-signin"
                  >
                    Go to Sign In
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (step === "password") {
    return <PasswordStep onSubmit={resetPasswordMutation.mutate} isPending={resetPasswordMutation.isPending} onBack={() => setStep("code")} />;
  }

  if (step === "code") {
    return (
      <CodeStep
        email={userEmail}
        onSubmit={verifyCodeMutation.mutate}
        isPending={verifyCodeMutation.isPending}
        onBack={() => setStep("email")}
        onResend={() => resendCodeMutation.mutate()}
        resendTimer={resendTimer}
        isResending={resendCodeMutation.isPending}
      />
    );
  }

  return <EmailStep onSubmit={sendCodeMutation.mutate} isPending={sendCodeMutation.isPending} />;
}

function EmailStep({ onSubmit, isPending }: { onSubmit: (data: EmailFormData) => void; isPending: boolean }) {
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* LightPillar Background */}
      <div className="fixed inset-0 z-0">
        <LightPillar />
      </div>

      {/* Dark Overlay */}
      <div className="fixed inset-0 bg-gray-950/70 z-[1]" />

      {/* Floating Particles */}
      <FloatingParticles />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/">
            <motion.img 
              src="/storia-logo-white.png" 
              alt="Storia" 
              className="h-10 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            />
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div 
            className="relative rounded-3xl border border-white/10 backdrop-blur-2xl p-8 shadow-2xl"
            style={{ backgroundColor: 'rgba(13, 13, 13, 0.8)' }}
          >
            {/* Animated Border Glow - Disabled */}
            <motion.div
              className="absolute -inset-[1px] rounded-3xl opacity-0"
              style={{
                background: 'linear-gradient(90deg, #F59E0B, #FBBF24, #F59E0B)',
                backgroundSize: '200% 100%',
              }}
              animate={{
                opacity: 0,
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                opacity: { duration: 0.3 },
                backgroundPosition: { duration: 3, repeat: Infinity, ease: 'linear' }
              }}
            />
            
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 rounded-3xl blur-xl opacity-50" />
            
            <div className="relative">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="flex items-center justify-center mb-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-500/30 rounded-full blur-xl" />
                  <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-amber-500/30 to-yellow-500/30 border border-amber-500/30 flex items-center justify-center">
                    <Mail className="h-10 w-10 text-amber-400" />
                  </div>
                </div>
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-bold text-white text-center mb-2"
              >
                Forgot Password
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-white/60 text-center mb-8"
              >
                Enter your email address and we'll send you a code to reset your password.
              </motion.p>

              {/* Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" autoComplete="off">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/80 font-medium">Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="your@email.com"
                              className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-white/10 focus:ring-0 transition-all"
                              autoComplete="email"
                              data-testid="input-email"
                              onFocus={() => setFocusedField('email')}
                              onBlur={() => setFocusedField(null)}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25 border-0" 
                      disabled={isPending} 
                      data-testid="button-send-code"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Reset Code
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </Form>

              {/* Back to Sign In */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 text-center"
              >
                <Link href="/auth/sign-in">
                  <motion.span 
                    className="inline-flex items-center gap-2 text-white/60 hover:text-white cursor-pointer transition-colors"
                    whileHover={{ x: -5 }}
                    data-testid="link-back-to-signin"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Sign In
                  </motion.span>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function CodeStep({
  email,
  onSubmit,
  isPending,
  onBack,
  onResend,
  resendTimer,
  isResending,
}: {
  email: string;
  onSubmit: (data: CodeFormData) => void;
  isPending: boolean;
  onBack: () => void;
  onResend: () => void;
  resendTimer: number;
  isResending: boolean;
}) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = Array.from({ length: 6 }, () => useState<HTMLInputElement | null>(null));

  const form = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    form.setValue("code", newDigits.join(""));

    if (digit && index < 5) {
      inputRefs[index + 1][0]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newDigits = [...digits];
      if (digits[index]) {
        newDigits[index] = "";
        setDigits(newDigits);
        form.setValue("code", newDigits.join(""));
      } else if (index > 0) {
        newDigits[index - 1] = "";
        setDigits(newDigits);
        form.setValue("code", newDigits.join(""));
        inputRefs[index - 1][0]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs[index - 1][0]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs[index + 1][0]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData) {
      const newDigits = pastedData.padEnd(6, "").split("").slice(0, 6);
      setDigits(newDigits);
      form.setValue("code", newDigits.join(""));
      const lastIndex = Math.min(pastedData.length - 1, 5);
      inputRefs[lastIndex][0]?.focus();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* LightPillar Background */}
      <div className="fixed inset-0 z-0">
        <LightPillar />
      </div>

      {/* Dark Overlay */}
      <div className="fixed inset-0 bg-gray-950/70 z-[1]" />

      {/* Floating Particles */}
      <FloatingParticles />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/">
            <motion.img 
              src="/storia-logo-white.png" 
              alt="Storia" 
              className="h-10 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            />
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div 
            className="relative rounded-3xl border border-white/10 backdrop-blur-2xl p-8 shadow-2xl"
            style={{ backgroundColor: 'rgba(13, 13, 13, 0.8)' }}
          >
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 rounded-3xl blur-xl opacity-50" />
            
            <div className="relative">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="flex items-center justify-center mb-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-500/30 rounded-full blur-xl" />
                  <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-amber-500/30 to-yellow-500/30 border border-amber-500/30 flex items-center justify-center">
                    <ShieldCheck className="h-10 w-10 text-amber-400" />
                  </div>
                </div>
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-bold text-white text-center mb-2"
              >
                Enter Reset Code
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-white/60 text-center mb-8"
              >
                We sent a 6-digit code to{" "}
                <span className="text-amber-400 font-medium">{email}</span>
              </motion.p>

              {/* Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" autoComplete="off" data-form-type="other">
                  <FormField
                    control={form.control}
                    name="code"
                    render={() => (
                      <FormItem>
                        <FormControl>
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex justify-center gap-3" 
                            data-testid="input-reset-code"
                          >
                            {digits.map((digit, index) => (
                              <input
                                key={index}
                                ref={(el) => inputRefs[index][1](el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleDigitChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                className="w-12 h-14 text-center text-xl font-bold border border-white/20 rounded-xl bg-white/5 text-white focus:outline-none focus:ring-0 focus:border-white/20 transition-all"
                                autoComplete="off"
                                data-lpignore="true"
                                data-1p-ignore="true"
                                data-testid={`input-code-digit-${index}`}
                              />
                            ))}
                          </motion.div>
                        </FormControl>
                        <FormMessage className="text-center text-red-400" />
                      </FormItem>
                    )}
                  />

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25 border-0" 
                      disabled={isPending || digits.join("").length < 6} 
                      data-testid="button-verify-code"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Verify Code
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </Form>

              {/* Resend */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 text-center text-sm text-white/40"
              >
                Didn't receive the code?{" "}
                {resendTimer > 0 ? (
                  <span>Resend in {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
                    onClick={onResend}
                    disabled={isResending}
                    data-testid="button-resend-code"
                  >
                    {isResending ? "Sending..." : "Resend code"}
                  </button>
                )}
              </motion.div>

              {/* Back */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-4 text-center"
              >
                <motion.button
                  onClick={onBack}
                  className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                  whileHover={{ x: -5 }}
                  data-testid="button-back-to-email"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Use a different email
                </motion.button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function PasswordStep({ onSubmit, isPending, onBack }: { onSubmit: (data: PasswordFormData) => void; isPending: boolean; onBack: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* LightPillar Background */}
      <div className="fixed inset-0 z-0">
        <LightPillar />
      </div>

      {/* Dark Overlay */}
      <div className="fixed inset-0 bg-gray-950/70 z-[1]" />

      {/* Floating Particles */}
      <FloatingParticles />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/">
            <motion.img 
              src="/storia-logo-white.png" 
              alt="Storia" 
              className="h-10 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            />
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div 
            className="relative rounded-3xl border border-white/10 backdrop-blur-2xl p-8 shadow-2xl"
            style={{ backgroundColor: 'rgba(13, 13, 13, 0.8)' }}
          >
            {/* Animated Border Glow - Disabled */}
            <motion.div
              className="absolute -inset-[1px] rounded-3xl opacity-0"
              style={{
                background: 'linear-gradient(90deg, #F59E0B, #FBBF24, #F59E0B)',
                backgroundSize: '200% 100%',
              }}
              animate={{
                opacity: 0,
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                opacity: { duration: 0.3 },
                backgroundPosition: { duration: 3, repeat: Infinity, ease: 'linear' }
              }}
            />
            
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 rounded-3xl blur-xl opacity-50" />
            
            <div className="relative">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="flex items-center justify-center mb-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-500/30 rounded-full blur-xl" />
                  <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-amber-500/30 to-yellow-500/30 border border-amber-500/30 flex items-center justify-center">
                    <KeyRound className="h-10 w-10 text-amber-400" />
                  </div>
                </div>
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-bold text-white text-center mb-2"
              >
                Set New Password
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-white/60 text-center mb-8"
              >
                Enter your new password below.
              </motion.p>

              {/* Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" autoComplete="off">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <FormField
                      control={form.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/80 font-medium">New Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="At least 6 characters"
                                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-white/10 focus:ring-0 pr-12 transition-all"
                                autoComplete="new-password"
                                data-testid="input-new-password"
                                onFocus={() => setFocusedField('newPassword')}
                                onBlur={() => setFocusedField(null)}
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-white/40 hover:text-white/80"
                                onClick={() => setShowPassword(!showPassword)}
                                data-testid="button-toggle-password"
                              >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/80 font-medium">Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm your password"
                                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-white/10 focus:ring-0 pr-12 transition-all"
                                autoComplete="new-password"
                                data-testid="input-confirm-password"
                                onFocus={() => setFocusedField('confirmPassword')}
                                onBlur={() => setFocusedField(null)}
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-white/40 hover:text-white/80"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                data-testid="button-toggle-confirm-password"
                              >
                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="pt-2"
                  >
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25 border-0" 
                      disabled={isPending} 
                      data-testid="button-reset-password"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        <>
                          Reset Password
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </Form>

              {/* Back */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6 text-center"
              >
                <motion.button
                  onClick={onBack}
                  className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                  whileHover={{ x: -5 }}
                  data-testid="button-back-to-code"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </motion.button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
