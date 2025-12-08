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
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Mail, Loader2, CheckCircle, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">Password Reset Complete</CardTitle>
            <CardDescription>
              Your password has been reset successfully. You can now sign in with your new password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => setLocation("/auth/sign-in")}
              data-testid="button-go-to-signin"
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
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
  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a code to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        autoComplete="email"
                        data-testid="input-email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPending} data-testid="button-send-code">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Code"
                )}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm">
            <Link href="/auth/sign-in" className="text-primary hover:underline" data-testid="link-back-to-signin">
              <ArrowLeft className="inline h-4 w-4 mr-1" />
              Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Enter Reset Code</CardTitle>
          <CardDescription>
            We sent a 6-digit code to <span className="font-medium">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" autoComplete="off" data-form-type="other">
              <FormField
                control={form.control}
                name="code"
                render={() => (
                  <FormItem>
                    <FormControl>
                      <div className="flex justify-center gap-2" data-testid="input-reset-code">
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
                            className="w-12 h-14 text-center text-xl font-bold border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            autoComplete="off"
                            data-lpignore="true"
                            data-1p-ignore="true"
                            data-testid={`input-code-digit-${index}`}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage className="text-center" />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPending || digits.join("").length < 6} data-testid="button-verify-code">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Code"
                )}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Didn't receive the code?{" "}
            {resendTimer > 0 ? (
              <span>Resend in {resendTimer}s</span>
            ) : (
              <button
                type="button"
                className="text-primary hover:underline font-normal"
                onClick={onResend}
                disabled={isResending}
                data-testid="button-resend-code"
              >
                {isResending ? "Sending..." : "Resend code"}
              </button>
            )}
          </div>
          <div className="mt-4 text-center">
            <Button variant="ghost" onClick={onBack} data-testid="button-back-to-email">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Use a different email
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PasswordStep({ onSubmit, isPending, onBack }: { onSubmit: (data: PasswordFormData) => void; isPending: boolean; onBack: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Set New Password</CardTitle>
          <CardDescription>
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="At least 6 characters"
                          autoComplete="new-password"
                          data-testid="input-new-password"
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
                          {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          autoComplete="new-password"
                          data-testid="input-confirm-password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          data-testid="button-toggle-confirm-password"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPending} data-testid="button-reset-password">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center">
            <Button variant="ghost" onClick={onBack} data-testid="button-back-to-code">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
