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
import { Loader2, Eye, EyeOff, Mail, ArrowLeft, ArrowRight, Rocket } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CustomOTPInput } from "@/components/ui/custom-otp-input";
import { LightPillar } from "@/website/components/ui/light-pillar";

const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const verificationSchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits"),
});

type SignUpFormData = z.infer<typeof signUpSchema>;
type VerificationFormData = z.infer<typeof verificationSchema>;

type Step = "signup" | "verify";

// Floating particles component
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-emerald-500/30 rounded-full"
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


export default function SignUp() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<Step>("signup");
  const [userEmail, setUserEmail] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const verifyForm = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: "",
    },
  });

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const registerMutation = useMutation({
    mutationFn: async (data: SignUpFormData) => {
      const { confirmPassword, ...registerData } = data;
      const response = await apiRequest("POST", "/api/auth/register", registerData);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.requiresVerification) {
        setUserEmail(form.getValues("email"));
        setStep("verify");
        setResendTimer(60);
        toast({
          title: "Verification code sent",
          description: "Please check your email for the 6-digit code",
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        toast({
          title: "Account created",
          description: "Welcome to Storia!",
        });
        setLocation("/");
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message || "Could not create account",
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (data: VerificationFormData) => {
      const response = await apiRequest("POST", "/api/auth/verify-email", {
        email: userEmail,
        code: data.code,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Email verified",
        description: "Welcome to Storia!",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: error.message || "Invalid verification code",
      });
    },
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/resend-verification", {
        email: userEmail,
      });
      return response.json();
    },
    onSuccess: () => {
      setResendTimer(60);
      toast({
        title: "Code sent",
        description: "A new verification code has been sent to your email",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to resend",
        description: error.message || "Could not resend verification code",
      });
    },
  });

  const onSubmit = (data: SignUpFormData) => {
    registerMutation.mutate(data);
  };

  const onVerify = (data: VerificationFormData) => {
    verifyMutation.mutate(data);
  };

  const handleGoogleSignUp = () => {
    window.location.href = "/api/auth/google";
  };

  if (step === "verify") {
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
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 rounded-3xl blur-xl opacity-50" />
              
              <div className="relative">
                {/* Back Button */}
                <motion.button
                  onClick={() => setStep("signup")}
                  className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
                  whileHover={{ x: -5 }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </motion.button>

                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="flex items-center justify-center mb-6"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-xl" />
                    <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border border-emerald-500/30 flex items-center justify-center">
                      <Mail className="h-10 w-10 text-emerald-400" />
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
                  Verify Your Email
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-white/60 text-center mb-8"
                >
                  We sent a 6-digit code to{" "}
                  <span className="text-emerald-400 font-medium">{userEmail}</span>
                </motion.p>

                {/* Form */}
                <Form {...verifyForm}>
                  <form onSubmit={verifyForm.handleSubmit(onVerify)} className="space-y-6">
                    <FormField
                      control={verifyForm.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem className="flex flex-col items-center">
                          <FormControl>
                            <CustomOTPInput
                              length={6}
                              value={field.value}
                              onChange={field.onChange}
                              data-testid="input-verification-code"
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="submit"
                        className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 border-0"
                        disabled={verifyMutation.isPending}
                        data-testid="button-verify"
                      >
                        {verifyMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            Verify Email
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </form>
                </Form>

                {/* Resend */}
                <div className="mt-6 text-center">
                  <span className="text-white/40">Didn't receive the code? </span>
                  <button
                    className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors disabled:opacity-50"
                    disabled={resendTimer > 0 || resendMutation.isPending}
                    onClick={() => resendMutation.mutate()}
                    data-testid="button-resend-code"
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

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
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 py-12">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
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
                background: 'linear-gradient(90deg, #10B981, #14B8A6, #10B981)',
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
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 rounded-3xl blur-xl opacity-50" />
            
            <div className="relative">
              {/* Header */}
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4"
                >
                  <Rocket className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-400 font-medium">Start Creating</span>
                </motion.div>
                
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-bold text-white"
                >
                  Create Account
                </motion.h1>
              </div>

              {/* Google Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white rounded-xl mb-6 transition-all"
                  onClick={handleGoogleSignUp}
                  data-testid="button-google-signup"
                >
                  <SiGoogle className="mr-3 h-5 w-5" />
                  Continue with Google
                </Button>
              </motion.div>

              {/* Divider */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="relative mb-6"
              >
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-4 text-white/40" style={{ backgroundColor: 'rgba(13, 13, 13, 0.8)' }}>
                    Or continue with email
                  </span>
                </div>
              </motion.div>

              {/* Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Name Fields */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="grid grid-cols-2 gap-4"
                  >
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => {
                        const { onBlur, ...restField } = field;
                        return (
                          <FormItem>
                            <FormLabel className="text-white/80 font-medium">First Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="John"
                                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-white/10 focus:ring-0 transition-all"
                                data-testid="input-first-name"
                                onFocus={() => setFocusedField('firstName')}
                                onBlur={(e) => {
                                  onBlur();
                                  setFocusedField(null);
                                }}
                                {...restField}
                              />
                            </FormControl>
                            <FormMessage className="text-red-400 text-xs" />
                          </FormItem>
                        );
                      }}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => {
                        const { onBlur, ...restField } = field;
                        return (
                          <FormItem>
                            <FormLabel className="text-white/80 font-medium">Last Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Doe"
                                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-white/10 focus:ring-0 transition-all"
                                data-testid="input-last-name"
                                onFocus={() => setFocusedField('lastName')}
                                onBlur={(e) => {
                                  onBlur();
                                  setFocusedField(null);
                                }}
                                {...restField}
                              />
                            </FormControl>
                            <FormMessage className="text-red-400 text-xs" />
                          </FormItem>
                        );
                      }}
                    />
                  </motion.div>

                  {/* Email */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.65 }}
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => {
                        const { onBlur, ...restField } = field;
                        return (
                          <FormItem>
                            <FormLabel className="text-white/80 font-medium">Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="you@example.com"
                                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-white/10 focus:ring-0 transition-all"
                                data-testid="input-email"
                                onFocus={() => setFocusedField('email')}
                                onBlur={(e) => {
                                  onBlur();
                                  setFocusedField(null);
                                }}
                                {...restField}
                              />
                            </FormControl>
                            <FormMessage className="text-red-400 text-xs" />
                          </FormItem>
                        );
                      }}
                    />
                  </motion.div>

                  {/* Password */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => {
                        const { onBlur, ...restField } = field;
                        return (
                          <FormItem>
                            <FormLabel className="text-white/80 font-medium">Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="At least 6 characters"
                                  className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-white/10 focus:ring-0 pr-12 transition-all"
                                  data-testid="input-password"
                                  onFocus={() => setFocusedField('password')}
                                  onBlur={(e) => {
                                    onBlur();
                                    setFocusedField(null);
                                  }}
                                  {...restField}
                                />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-white/40 hover:text-white/80"
                                onClick={() => setShowPassword(!showPassword)}
                                data-testid="button-toggle-password"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-5 w-5" />
                                ) : (
                                  <Eye className="h-5 w-5" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      );
                    }}
                    />
                  </motion.div>

                  {/* Confirm Password */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.75 }}
                  >
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => {
                        const { onBlur, ...restField } = field;
                        return (
                          <FormItem>
                            <FormLabel className="text-white/80 font-medium">Confirm Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showConfirmPassword ? "text" : "password"}
                                  placeholder="Confirm your password"
                                  className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-white/10 focus:ring-0 pr-12 transition-all"
                                  data-testid="input-confirm-password"
                                  onFocus={() => setFocusedField('confirmPassword')}
                                  onBlur={(e) => {
                                    onBlur();
                                    setFocusedField(null);
                                  }}
                                  {...restField}
                                />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-white/40 hover:text-white/80"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                data-testid="button-toggle-confirm-password"
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-5 w-5" />
                                ) : (
                                  <Eye className="h-5 w-5" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      );
                    }}
                    />
                  </motion.div>

                  {/* Submit Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="pt-2"
                  >
                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 border-0"
                      disabled={registerMutation.isPending}
                      data-testid="button-sign-up"
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        <>
                          Create Account
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </Form>

              {/* Sign In Link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="mt-6 text-center"
              >
                <span className="text-white/40">Already have an account? </span>
                <Link href="/auth/sign-in">
                  <span className="text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer transition-colors" data-testid="link-sign-in">
                    Sign in
                  </span>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Footer Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 text-white/30 text-sm text-center max-w-md"
        >
          By creating an account, you agree to our{" "}
          <Link href="/terms">
            <span className="text-white/50 hover:text-white/80 cursor-pointer transition-colors">Terms of Service</span>
          </Link>{" "}
          and{" "}
          <Link href="/privacy">
            <span className="text-white/50 hover:text-white/80 cursor-pointer transition-colors">Privacy Policy</span>
          </Link>
        </motion.p>
      </div>
    </div>
  );
}
