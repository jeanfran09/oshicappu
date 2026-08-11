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
import AddOshiForm from "@/components/AddOshiForm";
import ImageCropper from "@/components/CreatePost/ImageCropper";
import type { Oshi } from "@/components/CreatePost/OshiPicker";
import { formatTimeAgo, parsePostImages } from "@/utils/formatNumber";
import { AnimatePresence } from "framer-motion";

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  location: string | null;
  likes_count: number;
  comments_count: number;
  oshis: { id: string; name: string; image: string }[];
  fandoms: { id: string; name: string }[];
  hashtags: string[];
}

async function refreshFeed() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

export default function ProfilePage() {
  const { user, profile, isLoggedIn, logout, isLoading } =
    useSupabaseAuth();

  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const [showBottomSheet, setShowBottomSheet] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "posts" | "saved" | "liked"
  >("posts");

  const [selectedPostId, setSelectedPostId] =
    useState<string | null>(null);

  const [showEditProfile, setShowEditProfile] =
    useState(false);

  const [oshis, setOshis] = useState<Oshi[]>([]);
  const [oshisLoading, setOshisLoading] =
    useState(true);

  // Oshi cropper state
  const [showCropper, setShowCropper] =
    useState(false);

  const [cropImage, setCropImage] =
    useState<string | null>(null);

  const [croppedOshiImage, setCroppedOshiImage] =
    useState<File | null>(null);

  const userPosts = posts.map((post) => ({
    id: post.id,
    image:
      parsePostImages(post.image_url)[0] ?? null,
  }));

  const profileFeedPosts = posts.map((post) => ({
    id: post.id,
    images: parsePostImages(post.image_url),
    caption: post.content,
    time: formatTimeAgo(post.created_at),
    location: post.location ?? undefined,
    likes: post.likes_count,
    comments: post.comments_count,
    oshis: post.oshis,
    fandoms: post.fandoms,
    hashtags: post.hashtags,
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
      fetchUserOshis();
    }
  }, [user]);

  const fetchUserOshis = async () => {
    if (!user) return;

    try {
      setOshisLoading(true);

      const { data, error } = await supabase
        .from("oshis")
        .select("id, name, image_url")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: true,
        });

      if (error) {
        console.error(
          "Error fetching oshis:",
          error
        );
      } else {
        setOshis(
          (data ?? []).map((o) => ({
            id: o.id,
            name: o.name,
            image:
              o.image_url ??
              "/icons/temp.jpg",
          }))
        );
      }
    } catch (error) {
      console.error(
        "Error fetching oshis:",
        error
      );
    } finally {
      setOshisLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    if (!user) return;

    try {
      setLoadingPosts(true);

      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          *,
          likes(count),
          comments(count),
          post_oshis(oshis(id, name, image_url)),
          post_fandoms(fandoms(id, name)),
          post_hashtags(hashtags(tag))
          `
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Error fetching posts:",
          error
        );
      } else {
        setPosts(
          (data || []).map((post: any) => ({
            id: post.id,
            user_id: post.user_id,
            content: post.content,
            image_url: post.image_url,
            created_at: post.created_at,
            location: post.location,
            likes_count:
              post.likes?.[0]?.count ?? 0,
            comments_count:
              post.comments?.[0]?.count ?? 0,
            oshis: (post.post_oshis ?? []).map(
              (po: any) => ({
                id: po.oshis.id,
                name: po.oshis.name,
                image:
                  po.oshis.image_url ??
                  "/icons/temp.jpg",
              })
            ),
            fandoms: (post.post_fandoms ?? []).map(
              (pf: any) => ({
                id: pf.fandoms.id,
                name: pf.fandoms.name,
              })
            ),
            hashtags: (post.post_hashtags ?? []).map(
              (ph: any) => ph.hashtags.tag
            ),
          }))
        );
      }
    } catch (error) {
      console.error(
        "Error fetching posts:",
        error
      );
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  /*
   * Open the cropper WITHOUT closing the BottomSheet.
   *
   * The BottomSheet stays mounted underneath the cropper,
   * so the form state is preserved.
   */
  const handleOpenOshiCropper = (
    imageUrl: string
  ) => {
    setCropImage(imageUrl);
    setShowCropper(true);

    // IMPORTANT:
    // Do NOT setShowBottomSheet(false)
  };

  /*
   * Crop completed.
   *
   * The BottomSheet is still open underneath.
   */
  const handleOshiCropComplete = (
    croppedFile: File
  ) => {
    setCroppedOshiImage(croppedFile);

    setShowCropper(false);

    if (cropImage) {
      URL.revokeObjectURL(cropImage);
    }

    setCropImage(null);
  };

  /*
   * Cancel cropping.
   *
   * The BottomSheet remains open.
   */
  const handleCancelOshiCropper = () => {
    if (cropImage) {
      URL.revokeObjectURL(cropImage);
    }

    setCropImage(null);
    setShowCropper(false);
  };

  /*
   * Completely close/reset the Add Oshi flow.
   */
  const resetOshiForm = () => {
    setShowBottomSheet(false);

    setCroppedOshiImage(null);

    if (cropImage) {
      URL.revokeObjectURL(cropImage);
    }

    setCropImage(null);
    setShowCropper(false);
  };

  if (isLoading) {
    return (
      <div className="md:hidden min-h-screen flex flex-col items-center justify-center">
        <p className="text-foreground">
          Loading...
        </p>
      </div>
    );
  }

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
        {/* Banner */}
        {profile?.banner_url && (
          <div className="relative h-32 w-full bg-accent/20">
            <Image
              src={profile.banner_url}
              alt="Profile banner"
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Profile Content */}
        <div className="px-4">
          <div
            className={`
              flex items-center gap-6
              ${
                profile?.banner_url
                  ? "relative z-10 -mt-12"
                  : "mt-5"
              }
            `}
          >
            <div
              className={`
                h-24
                w-24
                shrink-0
                overflow-hidden
                rounded-full
                bg-accent/20
                ${
                  profile?.banner_url
                    ? "border-4 border-background"
                    : ""
                }
              `}
            >
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={`${profile.display_name}'s avatar`}
                  width={96}
                  height={96}
                  className="object-cover"
                />
              ) : (
                <UserIcon
                  size={48}
                  className="text-foreground/20"
                />
              )}
            </div>

            <div
              className={`
                flex-1
                ${
                  profile?.banner_url
                    ? "translate-y-8"
                    : ""
                }
              `}
            >
              <div className="flex justify-around">
                <div className="text-center">
                  <p className="font-semibold">
                    {posts.length}
                  </p>
                  <p className="text-xs">
                    Posts
                  </p>
                </div>

                <div className="text-center">
                  <p className="font-semibold">
                    8
                  </p>
                  <p className="text-xs">
                    Followers
                  </p>
                </div>

                <div className="text-center">
                  <p className="font-semibold">
                    24
                  </p>
                  <p className="text-xs">
                    Following
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 space-y-1">
            <p className="font-semibold">
              {profile?.display_name}
            </p>

            {profile?.bio && (
              <p className="text-sm text-foreground/70">
                {profile.bio}
              </p>
            )}
          </div>

          <button
            onClick={() =>
              setShowEditProfile(true)
            }
            className="mt-3 h-10 w-full rounded-lg border border-foreground/20 font-medium"
          >
            Edit Profile
          </button>

          {!oshisLoading && (
            <OshiList
              oshis={oshis}
              onAdd={() =>
                setShowBottomSheet(true)
              }
            />
          )}
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

      {/* Add Oshi Bottom Sheet */}
      {showBottomSheet && (
        <BottomSheet
          title="Add Oshi"
          onClose={resetOshiForm}
        >
          <AddOshiForm
            onCreated={(newOshi) =>
              setOshis((prev) => [
                ...prev,
                newOshi,
              ])
            }
            onClose={() =>
              setShowBottomSheet(false)
            }
            onOpenCropper={
              handleOpenOshiCropper
            }
            croppedImage={
              croppedOshiImage
            }
          />
        </BottomSheet>
      )}

      {/* Oshi Image Cropper */}
      {showCropper && cropImage && (
        <div className="fixed inset-0 z-[1100]">
          <ImageCropper
            image={cropImage}
            aspectRatio={1}
            isFirstImage={true}
            onCropChange={() => {}}
            onRatioChange={() => {}}
            onComplete={
              handleOshiCropComplete
            }
            onCancel={
              handleCancelOshiCropper
            }
          />
        </div>
      )}

      {/* Post Modal */}
      {selectedPostId && (
        <PostModal
          posts={profileFeedPosts}
          initialPostId={selectedPostId}
          username={
            profile?.username ?? "username"
          }
          avatar={
            profile?.avatar_url ||
            "/icons/temp.jpg"
          }
          onClose={() =>
            setSelectedPostId(null)
          }
        />
      )}

      {/* Edit Profile */}
      <AnimatePresence>
        {showEditProfile && (
          <EditProfileModal
            onClose={() =>
              setShowEditProfile(false)
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
}