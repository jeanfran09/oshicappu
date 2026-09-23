"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  banner_url: string | null;
}

interface SupabaseAuthContextType {
  user: SupabaseUser | null;
  profile: UserProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string, username: string, displayName: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (data) {
        setProfile(data);
      } else if (error) {
        console.warn("Profile not found for user:", userId);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
        setIsHydrated(true);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return { error: null };
    } catch (error) {
      return { error: "An unexpected error occurred" };
    }
  };

  const signup = async (email: string, password: string, username: string, displayName: string) => {
    try {
      // Pass metadata in options.data
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.trim(),
            display_name: displayName.trim(),
          },
        },
      });

      if (error) return { error: error.message };
      return { error: null };
    } catch (error) {
      return { error: "An unexpected error occurred" };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <SupabaseAuthContext.Provider
      value={{
        user,
        profile,
        isLoggedIn: !!user,
        isLoading,
        login,
        signup,
        logout,
        refreshProfile,
      }}
    >
      {isHydrated ? children : null}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error("useSupabaseAuth must be used within a SupabaseAuthProvider");
  }
  return context;
}