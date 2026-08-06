"use client";

import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import { LogOut, User as UserIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import CreatePostButton from "@/components/CreatePostButton";
import OshiList from "@/components/Profile/OshiList";
import BottomSheet from "@/components/BottomSheet";
import ProfileTabs from "@/components/Profile/ProfileTabs";
import PullToRefresh from "@/components/PullToRefresh";
import PostGrid from "@/components/Profile/PostGrid";
import PostModal from "@/components/Profile/PostModal";
import EditProfileModal from "@/components/Profile/EditProfileModal";
import { formatTimeAgo, parsePostImages } from "@/utils/formatNumber";

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
}

async function refreshFeed() {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // fetch posts here
}

export default function ProfilePage() {
  const { user, profile, isLoggedIn, logout, isLoading } = useSupabaseAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [showBottomSheet, setShowBottomSheet] = useState(false);//temp
  const [activeTab, setActiveTab] = useState<"posts" | "saved" | "liked">("posts");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);

  //change later
  const dummyOshis = [
    {
      id: "1",
      name: "sogo",
      image: "/posts/post1.png",
    },
    {
      id: "2",
      name: "abe-chan",
      image: "/posts/post2.jpg",
    },
  ];

  // Real posts created by this user, mapped to the grid's shape.
  // Uses the first image (if any) as the thumbnail.
  const userPosts = posts.map((post) => ({
    id: post.id,
    image: parsePostImages(post.image_url)[0] ?? null,
  }));

  // Same posts, mapped to the shape PostModal's scrollable feed expects.
  const profileFeedPosts = posts.map((post) => ({
    id: post.id,
    images: parsePostImages(post.image_url),
    caption: post.content,
    time: formatTimeAgo(post.created_at),
  }));

  const savedPosts = [
    {
      id: "3",
      image: "/posts/post1.png",
    },
  ];

  const likedPosts: {
    id: string;
    image: string;
  }[] = [];

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
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-foreground/10 bg-background px-4 py-3">
        <h1 className="text-xl font-semibold">
          @{profile?.username ?? "username"}
        </h1>

        <button onClick={handleLogout}>
          <LogOut size={22} />
        </button>
      </header>

      <PullToRefresh onRefresh={refreshFeed}>
        {/* Banner (only rendered when the user has set one).
            Avatar overlaps the bottom-left of the banner, same as
            the edit profile screen. */}
        {profile?.banner_url && (
          <div className="relative h-32 w-full bg-accent/20">
            <Image
              src={profile.banner_url}
              alt="Profile banner"
              fill
              className="object-cover"
            />

            <div className="absolute -bottom-10 left-4 h-20 w-20 overflow-hidden rounded-full border-4 border-background bg-accent/20">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={`${profile.display_name}'s avatar`}
                  width={80}
                  height={80}
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <UserIcon size={32} className="text-foreground/20" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile Content */}
        <div className="px-4">
          {profile?.banner_url ? (
            // Banner layout: avatar already sits above (overlapping
            // the banner), so just clear enough space for it and
            // show the stats on their own below.
            <div className="mt-12 flex justify-around">
              <div className="text-center">
                <p className="font-semibold">{posts.length}</p>
                <p className="text-xs">Posts</p>
              </div>

              <div className="text-center">
                <p className="font-semibold">8</p>
                <p className="text-xs">Followers</p>
              </div>

              <div className="text-center">
                <p className="font-semibold">24</p>
                <p className="text-xs">Following</p>
              </div>
            </div>
          ) : (
            // No-banner layout: avatar and stats side by side, as before.
            <div className="mt-5 flex items-center gap-6">
              <div className="h-24 w-24 overflow-hidden rounded-full bg-accent/20">
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

              <div className="flex-1">
                <div className="flex justify-around">
                  <div className="text-center">
                    <p className="font-semibold">{posts.length}</p>
                    <p className="text-xs">Posts</p>
                  </div>

                  <div className="text-center">
                    <p className="font-semibold">8</p>
                    <p className="text-xs">Followers</p>
                  </div>

                  <div className="text-center">
                    <p className="font-semibold">24</p>
                    <p className="text-xs">Following</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-1">
            <p className="font-semibold">
              {profile?.display_name}
            </p>

            <p className="text-sm text-foreground/70">
              {profile?.bio || "Your bio goes here..."}
            </p>
          </div>

          <button
            onClick={() => setShowEditProfile(true)}
            className="mt-4 h-10 w-full rounded-lg border border-foreground/20 font-medium"
          >
            Edit Profile
          </button>

          <OshiList
            oshis={dummyOshis}
            onAdd={() => setShowBottomSheet(true)}
          />
        </div>

        <ProfileTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        {activeTab === "posts" && (
          <PostGrid
            posts={userPosts}
            onPostClick={setSelectedPostId}
          />
        )}

        {activeTab === "saved" && (
          <PostGrid posts={savedPosts} />
        )}

        {activeTab === "liked" && (
          <PostGrid posts={likedPosts} />
        )}
      </PullToRefresh>

      <CreatePostButton />

      {showBottomSheet && (
        <BottomSheet
          title="Add Oshi"
          onClose={() => setShowBottomSheet(false)}
        >
          add form
        </BottomSheet>
      )}

      {selectedPostId && (
        <PostModal
          posts={profileFeedPosts}
          initialPostId={selectedPostId}
          username={profile?.username ?? "username"}
          avatar={profile?.avatar_url || "/icons/temp.jpg"}
          onClose={() => setSelectedPostId(null)}
        />
      )}

      {showEditProfile && (
        <EditProfileModal onClose={() => setShowEditProfile(false)} />
      )}
    </div>
  );
}