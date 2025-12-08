import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { Loader2, Eye, EyeOff, Mail, ArrowLeft, AlertCircle } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const verificationSchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits"),
});

type SignInFormData = z.infer<typeof signInSchema>;
type VerificationFormData = z.infer<typeof verificationSchema>;

type Step = "signin" | "verify";

export default function SignIn() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<Step>("signin");
  const [userEmail, setUserEmail] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error) {
      const errorMessages: Record<string, string> = {
        oauth_denied: "Google sign-in was cancelled",
        oauth_failed: "Google sign-in failed. Please try again.",
        invalid_state: "Invalid session. Please try signing in again.",
        no_code: "Google sign-in failed. Please try again.",
      };
      setOauthError(errorMessages[error] || "Sign-in failed. Please try again.");
      window.history.replaceState({}, "", "/auth/sign-in");
    }
  }, [location]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const verifyForm = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: SignInFormData) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      const result = await response.json();
      if (!response.ok) {
        throw { ...result, status: response.status };
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    },
    onError: (error: any) => {
      if (error.requiresVerification) {
        setUserEmail(error.email || form.getValues("email"));
        setStep("verify");
        setResendTimer(60);
        toast({
          title: "Verification required",
          description: "Please check your email for the verification code",
        });
      } else if (error.useGoogle) {
        toast({
          variant: "destructive",
          title: "Use Google Sign-in",
          description: error.message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: error.message || "Invalid email or password",
        });
      }
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

  const onSubmit = (data: SignInFormData) => {
    setOauthError(null);
    loginMutation.mutate(data);
  };

  const onVerify = (data: VerificationFormData) => {
    verifyMutation.mutate(data);
  };

  const handleGoogleSignIn = () => {
    setOauthError(null);
    window.location.href = "/api/auth/google";
  };

  if (step === "verify") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <img src="/storia-logo.png" alt="Storia" className="h-8 w-8" />
                <span className="text-xl font-bold">Storia</span>
              </div>
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-fit -ml-2 mb-2"
                onClick={() => setStep("signin")}
                data-testid="button-back-to-signin"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-center">Verify Your Email</CardTitle>
              <CardDescription className="text-center">
                We sent a 6-digit code to <span className="font-medium text-foreground">{userEmail}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...verifyForm}>
                <form onSubmit={verifyForm.handleSubmit(onVerify)} className="space-y-6">
                  <FormField
                    control={verifyForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem className="flex flex-col items-center">
                        <FormControl>
                          <InputOTP
                            maxLength={6}
                            value={field.value}
                            onChange={field.onChange}
                            data-testid="input-verification-code"
                          >
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={verifyMutation.isPending}
                    data-testid="button-verify"
                  >
                    {verifyMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify Email"
                    )}
                  </Button>
                </form>
              </Form>
              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Didn't receive the code? </span>
                <Button
                  variant="link"
                  className="p-0 h-auto font-normal"
                  disabled={resendTimer > 0 || resendMutation.isPending}
                  onClick={() => resendMutation.mutate()}
                  data-testid="button-resend-code"
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <img src="/storia-logo.png" alt="Storia" className="h-8 w-8" />
              <span className="text-xl font-bold">Storia</span>
            </div>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {oauthError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{oauthError}</AlertDescription>
              </Alert>
            )}

            <Button
              variant="outline"
              className="w-full mb-6"
              onClick={handleGoogleSignIn}
              data-testid="button-google-signin"
            >
              <SiGoogle className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          data-testid="input-email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <Link href="/auth/forgot-password">
                          <span className="text-sm text-primary hover:underline cursor-pointer" data-testid="link-forgot-password">
                            Forgot password?
                          </span>
                        </Link>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            data-testid="input-password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                  data-testid="button-sign-in"
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </Form>
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link href="/auth/sign-up">
                <span className="text-primary hover:underline cursor-pointer" data-testid="link-sign-up">
                  Sign up
                </span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
