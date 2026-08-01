"use client";

import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import { LogOut, User as UserIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import CreatePostButton from "@/components/CreatePostButton";

interface Post {
  id: string;
  content: string;
  created_at: string;
}

export default function ProfilePage() {
  const { user, profile, isLoggedIn, logout, isLoading } = useSupabaseAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchUserPosts();
    }
  }, [user]);

  const fetchUserPosts = async () => {
    if (!user) return;
    try {
      setLoadingPosts(true);
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching posts:", error);
      } else {
        setPosts(data || []);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="md:hidden min-h-screen flex flex-col items-center justify-center">
        <p className="text-foreground">Loading...</p>
      </div>
    );
  }

  // If not logged in, we return null as the useEffect handles the redirect
  if (!isLoggedIn || !user) {
    return null;
  }

  return (
    <div className="md:hidden min-h-screen flex flex-col">
      {/* Header */}
      <div className="pt-4 pb-2 px-4">
        <h1 className="font-sacramento text-4xl text-center">
          OshiCappu
        </h1>
      </div>

      {/* Profile Content */}
      <div className="flex-1 pb-20 px-4 overflow-y-auto">
        {/* Avatar & Name */}
        <div className="flex flex-col items-center mt-4">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-accent shadow-sm flex items-center justify-center bg-accent/20">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={`${profile.display_name}'s avatar`}
                width={96}
                height={96}
                className="object-cover"
              />
            ) : (
              <UserIcon size={48} className="text-foreground/20" />
            )}
          </div>

          <h2 className="mt-3 text-xl font-semibold text-foreground">
            {profile?.username ? `@${profile.username}` : "New User"}
          </h2>
          <p className="text-sm text-foreground/60">
            {profile?.display_name || user.email}
          </p>
          
          {!profile && (
            <p className="text-xs text-red-500 mt-2 text-center max-w-[200px]">
              Profile data missing. Please ensure you ran the SQL Trigger script in Supabase.
            </p>
          )}
        </div>

        {/* Logout Button - Always visible if logged in */}
        <div className="mt-6">
          <button
            onClick={handleLogout}
            className="w-full py-3 bg-foreground text-background font-medium rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>

        {/* Posts Section */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Your Posts ({posts.length})
          </h3>

          {loadingPosts ? (
            <p className="text-foreground/60 text-center py-4">Loading posts...</p>
          ) : posts.length === 0 ? (
            <p className="text-foreground/60 text-center py-4">
              You haven't created any posts yet.
            </p>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-accent/30 rounded-xl p-4 border border-accent"
                >
                  <p className="text-foreground">{post.content}</p>
                  <p className="text-xs text-foreground/50 mt-2">
                    {new Date(post.created_at).toLocaleDateString()} at{" "}
                    {new Date(post.created_at).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <CreatePostButton />
    </div>
  );
}
