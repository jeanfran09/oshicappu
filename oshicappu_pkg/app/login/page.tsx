"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const { login, signup } = useSupabaseAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let result;
      if (isSignup) {
        result = await signup(email, password, username, displayName);
      } else {
        result = await login(email, password);
      }

      if (result.error) {
        setError(result.error);
      } else {
        router.push("/");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 pb-16">
        <h1 className="font-sacramento text-5xl text-foreground mb-8">
          OshiCappu
        </h1>

        <div className="w-full max-w-sm bg-accent/50 rounded-2xl p-6 shadow-sm">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              {isSignup ? "Create Account" : "Sign In"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <>
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    className="w-full px-4 py-3 rounded-xl bg-background border border-accent focus:border-foreground focus:outline-none text-foreground placeholder:text-foreground/40 transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="displayName"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Display Name
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                    className="w-full px-4 py-3 rounded-xl bg-background border border-accent focus:border-foreground focus:outline-none text-foreground placeholder:text-foreground/40 transition-colors"
                  />
                </div>
              </>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-xl bg-background border border-accent focus:border-foreground focus:outline-none text-foreground placeholder:text-foreground/40 transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-xl bg-background border border-accent focus:border-foreground focus:outline-none text-foreground placeholder:text-foreground/40 transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-foreground text-background font-medium rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? (isSignup ? "Creating account..." : "Signing in...") : (isSignup ? "Sign Up" : "Sign In")}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-foreground/60">
              {isSignup ? "Already have an account?" : "Don't have an account?"}
            </p>
            <button
              onClick={() => {
                setIsSignup(!isSignup);
                setError("");
              }}
              className="text-sm font-medium text-foreground hover:underline mt-1"
            >
              {isSignup ? "Sign In" : "Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
