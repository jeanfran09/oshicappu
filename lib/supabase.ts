import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

// Initialize with dummy values if missing to prevent runtime crash
// The console warning will help the user identify the issue
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "CRITICAL: Supabase environment variables are missing! " +
    "Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY " +
    "are set in your .env.local file and restart your dev server."
  );
}

// createClient will still throw if url is empty, so we provide a fallback string
// but the console error above is the main indicator for the user.
export const supabase = createClient(
  supabaseUrl || "https://placeholder-url.supabase.co", 
  supabaseAnonKey || "placeholder-key"
);
