"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreatePostPage() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user, isLoggedIn, isLoading } = useSupabaseAuth();
  const router = useRouter();

  // Redirect if not logged in
  if (!isLoading && !isLoggedIn) {
    router.push("/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!user) {
      setError("You must be logged in to create a post");
      setLoading(false);
      return;
    }

    if (!content.trim()) {
      setError("Post content cannot be empty");
      setLoading(false);
      return;
    }

    try {
      const { error: insertError } = await supabase.from("posts").insert({
        user_id: user.id,
        content: content.trim(),
      });

      if (insertError) {
        setError(insertError.message);
      } else {
        setContent("");
        // Redirect to profile to see the new post
        router.push("/profile");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="md:hidden min-h-screen flex flex-col items-center justify-center">
        <p className="text-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="md:hidden min-h-screen flex flex-col">
      {/* Header */}
      <div className="pt-4 pb-2 px-4 flex items-center gap-3">
        <Link href="/">
          <ArrowLeft size={24} className="text-foreground" />
        </Link>
        <h1 className="font-sacramento text-3xl text-foreground">
          Create Post
        </h1>
      </div>

      {/* Form Content */}
      <div className="flex-1 pb-20 px-4 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-foreground mb-2"
            >
              What's on your mind?
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts about your favorite idols..."
              className="w-full px-4 py-3 rounded-xl bg-accent/30 border border-accent focus:border-foreground focus:outline-none text-foreground placeholder:text-foreground/40 transition-colors min-h-40 resize-none"
            />
            <p className="text-xs text-foreground/50 mt-1">
              {content.length} characters
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-xl p-3">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="w-full py-3 bg-foreground text-background font-medium rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Posting..." : "Post"}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="w-full py-3 bg-accent/30 text-foreground font-medium rounded-xl border border-accent hover:opacity-90 transition-opacity"
          >
            Cancel
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}
