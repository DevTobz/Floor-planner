"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/lib/supabase";
import { Building2, Eye, EyeOff, Sparkles, CheckCircle2 } from "lucide-react";

type LoginMode = "signin" | "signup" | "forgot" | "recovery";

export default function LoginPage() {
  const router = useRouter();
  const { login, signUp, resetPassword, updatePassword, logout, isAuthenticated, error, checkSession } = useAuthStore();
  const [email, setEmail] = useState("demo@buildai.studio");
  const [password, setPassword] = useState("demo123");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<LoginMode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Handle automatic redirect only if we are not resetting/recovering password
  useEffect(() => {
    const isRecoveryMode = typeof window !== "undefined" && (
      window.location.hash.includes("type=recovery") ||
      window.location.hash.includes("recovery") ||
      window.location.search.includes("type=recovery")
    );

    if (isAuthenticated && mode !== "recovery" && !isRecoveryMode) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, mode, router]);

  // Detect recovery mode from URL search/hash or Supabase Auth state change
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (
        window.location.hash.includes("type=recovery") ||
        window.location.hash.includes("recovery") ||
        window.location.search.includes("type=recovery")
      ) {
        setMode("recovery");
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("recovery");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);

    let success = false;
    if (mode === "signup") {
      success = await signUp(email, password, name || email.split("@")[0]);
      if (success) {
        router.push("/dashboard");
      }
    } else if (mode === "signin") {
      success = await login(email, password);
      if (success) {
        router.push("/dashboard");
      }
    } else if (mode === "forgot") {
      const resetRedirectUrl = `${window.location.origin}/login`;
      success = await resetPassword(email, resetRedirectUrl);
      if (success) {
        setSuccessMessage("Password reset email sent! Please check your inbox.");
      }
    } else if (mode === "recovery") {
      success = await updatePassword(password);
      if (success) {
        await logout();
        setSuccessMessage("Password updated successfully! You can now sign in.");
        setMode("signin");
        setPassword("");
      }
    }
    setIsSubmitting(false);
  };

  const renderHeader = () => {
    switch (mode) {
      case "signup":
        return { title: "Create Account", subtitle: "Start designing with AI" };
      case "forgot":
        return { title: "Reset Password", subtitle: "Get back into your account" };
      case "recovery":
        return { title: "New Password", subtitle: "Choose a secure password" };
      case "signin":
      default:
        return { title: "BuildAI Studio", subtitle: "AI-Powered Design" };
    }
  };

  const headerText = renderHeader();

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden">
      {/* Animated gradient background */}
      <div
        className="absolute inset-0 animate-gradient"
        style={{
          background:
            "linear-gradient(135deg, #09090b 0%, #1a0533 25%, #0c1445 50%, #09090b 75%, #1a1a2e 100%)",
          backgroundSize: "400% 400%",
        }}
      />

      {/* Floating orbs */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-20 animate-float"
        style={{
          background: "radial-gradient(circle, var(--accent-start) 0%, transparent 70%)",
          top: "-10%",
          right: "-10%",
          animationDelay: "0s",
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-15 animate-float"
        style={{
          background: "radial-gradient(circle, var(--accent-end) 0%, transparent 70%)",
          bottom: "-15%",
          left: "-5%",
          animationDelay: "1.5s",
        }}
      />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-fade-in-up">
        <div className="glass-card p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div
              className="flex items-center justify-center w-12 h-12 rounded-xl"
              style={{
                background: "linear-gradient(135deg, var(--accent-start), var(--accent-end))",
              }}
            >
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{headerText.title}</h1>
              <p className="text-xs text-[var(--text-tertiary)]">{headerText.subtitle}</p>
            </div>
          </div>

          {/* Tagline (only for sign in/up) */}
          {(mode === "signin" || mode === "signup") && (
            <div className="flex items-center gap-2 justify-center mb-6 px-4 py-2 rounded-full bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)]">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-start)]" />
              <span className="text-xs text-[var(--text-secondary)]">
                Design buildings with AI in seconds
              </span>
            </div>
          )}

          {/* Success message banner */}
          {successMessage && (
            <div className="flex items-start gap-2.5 text-sm text-[var(--success)] bg-[rgba(34,197,94,0.1)] px-3 py-2.5 rounded-lg border border-[rgba(34,197,94,0.2)] mb-4">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="John Doe"
                  required
                />
              </div>
            )}

            {/* Email field (not shown in recovery mode) */}
            {mode !== "recovery" && (
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="demo@buildai.studio"
                  required
                />
              </div>
            )}

            {/* Password field (shown in signin, signup, recovery) */}
            {mode !== "forgot" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-xs font-medium text-[var(--text-secondary)]"
                  >
                    {mode === "recovery" ? "New Password" : "Password"}
                  </label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setSuccessMessage(null);
                      }}
                      className="text-xs text-[var(--accent-mid)] hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pr-10"
                    placeholder="••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 btn-icon"
                    style={{ width: 28, height: 28 }}
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="text-sm text-[var(--error)] bg-[rgba(239,68,68,0.1)] px-3 py-2 rounded-lg border border-[rgba(239,68,68,0.2)]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-lg w-full"
              style={{ height: 44 }}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : mode === "signup" ? (
                "Sign Up"
              ) : mode === "forgot" ? (
                "Send Reset Link"
              ) : mode === "recovery" ? (
                "Update Password"
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Switchers */}
          <div className="mt-4 text-center">
            {mode === "signin" && (
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setEmail("");
                  setPassword("");
                  setSuccessMessage(null);
                }}
                className="text-xs text-[var(--accent-mid)] hover:underline"
              >
                Don't have an account? Sign Up
              </button>
            )}

            {mode === "signup" && (
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setEmail("demo@buildai.studio");
                  setPassword("demo123");
                  setSuccessMessage(null);
                }}
                className="text-xs text-[var(--accent-mid)] hover:underline"
              >
                Already have an account? Sign In
              </button>
            )}

            {(mode === "forgot" || mode === "recovery") && (
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setEmail("demo@buildai.studio");
                  setPassword("demo123");
                  setSuccessMessage(null);
                }}
                className="text-xs text-[var(--accent-mid)] hover:underline"
              >
                Back to Sign In
              </button>
            )}
          </div>

          {/* Demo hint */}
          {mode === "signin" && (
            <div className="mt-6 p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-default)]">
              <p className="text-xs text-[var(--text-tertiary)] text-center">
                Demo credentials:{" "}
                <span className="text-[var(--text-secondary)] font-mono">
                  demo@buildai.studio
                </span>{" "}
                /{" "}
                <span className="text-[var(--text-secondary)] font-mono">demo123</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
