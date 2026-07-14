"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { Building2, Eye, EyeOff, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, signUp, isAuthenticated, error, checkSession } = useAuthStore();
  const [email, setEmail] = useState("demo@buildai.studio");
  const [password, setPassword] = useState("demo123");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    let success = false;
    if (isSignUp) {
      success = await signUp(email, password, name || email.split("@")[0]);
    } else {
      success = await login(email, password);
    }
    if (success) {
      router.push("/dashboard");
    }
    setIsSubmitting(false);
  };

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
              <h1 className="text-xl font-bold tracking-tight">BuildAI Studio</h1>
              <p className="text-xs text-[var(--text-tertiary)]">AI-Powered Design</p>
            </div>
          </div>

          {/* Tagline */}
          <div className="flex items-center gap-2 justify-center mb-6 px-4 py-2 rounded-full bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)]">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent-start)]" />
            <span className="text-xs text-[var(--text-secondary)]">
              Design buildings with AI in seconds
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
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
                  required={isSignUp}
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
              >
                Email
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

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
              >
                Password
              </label>
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
              ) : (
                isSignUp ? "Sign Up" : "Sign In"
              )}
            </button>
          </form>

          {/* Toggle Switcher */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                if (isSignUp) {
                  setEmail("demo@buildai.studio");
                  setPassword("demo123");
                } else {
                  setEmail("");
                  setPassword("");
                }
              }}
              className="text-xs text-[var(--accent-mid)] hover:underline"
            >
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </button>
          </div>

          {/* Demo hint */}
          {!isSignUp && (
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
