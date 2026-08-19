"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginPayloadSchema as loginSchema,
  LoginPayload as LoginFormData,
  forgotPasswordSchema,
  ForgotPasswordPayload as ForgotPasswordFormData,
} from "@/schemas/auth.schema";
import { useAuth } from "@/context/AuthContext";
import { useLoginMutation, useForgotPasswordMutation } from "@/hooks/queries/useLoginMutation";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { setAuth, isAuthenticated } = useAuth();
  const loginMutation = useLoginMutation();
  const forgotMutation = useForgotPasswordMutation();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  // Login form
  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Forgot password form
  const {
    register: registerForgot,
    handleSubmit: handleSubmitForgot,
    formState: { errors: forgotErrors },
    reset: resetForgot,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data, {
      onSuccess: (response) => {
        setAuth(
          response.data.user,
          response.data.tokens.access.token,
          response.data.tokens.refresh.token,
          response.data.tokens.access.expires,
          response.data.tokens.refresh.expires,
        );
        router.push("/dashboard");
      },
      onError: (error) => {
        toast.error(error.message || "Unable to sign in. Please try again.");
      },
    });
  };

  const onForgotSubmit = (data: ForgotPasswordFormData) => {
    forgotMutation.mutate(data, {
      onSuccess: () => {
        resetForgot();
        setMode("login");
      },
    });
  };

  if (isAuthenticated) return null;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-page p-4 sm:p-6">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface shadow-pop transition-all duration-300">
        {/* Saffron rule ties the sign-in card to the sidebar's wordmark. */}
        <div className="h-1 bg-gradient-to-r from-saffron via-gold to-gold-deep" />
        <div className="p-6 sm:p-8">

          {mode === "login" ? (
            <>
              <div className="mb-8 text-center">
                <p className="mb-3 text-lg font-bold tracking-tight text-ink">
                  Divya <span className="text-gold-deep">Sadhana</span>
                </p>
                <h1 className="mb-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                  Welcome Back
                </h1>
                <p className="text-moon">Sign in to your admin dashboard</p>
              </div>

              <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-moon" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      className="h-11 pl-10"
                      {...registerLogin("email")}
                    />
                  </div>
                  {loginErrors.email && (
                    <p className="text-sm text-danger">{loginErrors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2 mb-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-moon" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-11 pl-10 pr-10"
                      {...registerLogin("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-moon transition-colors hover:text-charcoal focus:outline-none"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p className="text-sm text-danger">
                      {loginErrors.password.message}
                    </p>
                  )}
                </div>
                <div className="text-right">  <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-sm font-medium text-gold-press hover:text-gold-deep transition-colors"
                >
                  Forgot password?
                </button></div>

                <Button
                  type="submit"
                  className="h-11 w-full bg-gold-deep hover:bg-gold-deep"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Logging in..." : "Log In"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="mb-2 text-2xl font-bold text-ink sm:text-3xl">
                  Reset Password
                </h1>
                <p className="text-moon">Enter your email to receive reset instructions</p>
              </div>

              <form onSubmit={handleSubmitForgot(onForgotSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-moon" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="admin@example.com"
                      className="h-11 pl-10"
                      {...registerForgot("email")}
                    />
                  </div>
                  {forgotErrors.email && (
                    <p className="text-sm text-danger">{forgotErrors.email.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full bg-gold-deep hover:bg-gold-deep"
                  disabled={forgotMutation.isPending}
                >
                  {forgotMutation.isPending ? "Sending..." : "Send Reset Instructions"}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    resetForgot();
                    setMode("login");
                  }}
                  className="w-full flex items-center justify-center text-sm font-medium text-charcoal hover:text-ink py-2 transition-colors mt-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Login
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
