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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300">
        <div className="p-8">

          {mode === "login" ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Welcome Back
                </h1>
                <p className="text-slate-500">Sign in to your admin dashboard</p>
              </div>

              <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      className="pl-10"
                      {...registerLogin("email")}
                    />
                  </div>
                  {loginErrors.email && (
                    <p className="text-sm text-rose-500">{loginErrors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2 mb-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      {...registerLogin("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p className="text-sm text-rose-500">
                      {loginErrors.password.message}
                    </p>
                  )}
                </div>
                <div className="text-right">  <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  Forgot password?
                </button></div>

                <Button
                  type="submit"
                  className="w-full h-10 bg-indigo-600 hover:bg-indigo-700"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Logging in..." : "Log In"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Reset Password
                </h1>
                <p className="text-slate-500">Enter your email to receive reset instructions</p>
              </div>

              <form onSubmit={handleSubmitForgot(onForgotSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="admin@example.com"
                      className="pl-10"
                      {...registerForgot("email")}
                    />
                  </div>
                  {forgotErrors.email && (
                    <p className="text-sm text-rose-500">{forgotErrors.email.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 bg-indigo-600 hover:bg-indigo-700"
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
                  className="w-full flex items-center justify-center text-sm font-medium text-slate-600 hover:text-slate-800 py-2 transition-colors mt-2"
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
