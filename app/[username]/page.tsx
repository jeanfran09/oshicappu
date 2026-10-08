"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, Settings, User as UserIcon } from "lucide-react";
import { AnimatePresence } from "framer-motion";

import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";

import CreatePostButton from "@/components/CreatePostButton";
import OshiList from "@/components/Profile/OshiList";
import BottomSheet from "@/components/BottomSheet";
import ProfileTabs from "@/components/Profile/ProfileTabs";
import PullToRefresh from "@/components/PullToRefresh";
import PostGrid from "@/components/Profile/PostGrid";
import PostModal, { type ProfilePost } from "@/components/Profile/PostModal";
import EditProfileModal from "@/components/Profile/EditProfileModal";
import AddOshiForm from "@/components/AddOshiForm";
import ImageCropper from "@/components/CreatePost/ImageCropper";
import FollowButton from "@/components/FollowButton";
import MessageButton from "@/components/MessageButton";
import UserList from "@/components/UserList";

import type { Oshi } from "@/components/CreatePost/OshiPicker";

import { formatTimeAgo, parsePostImages } from "@/utils/formatNumber";

import PostGridSkeleton from "@/components/Skeleton/PostGridSkeleton";
import OshiListSkeleton from "@/components/Skeleton/OshiListSkeleton";
import PublicProfileSkeleton from "@/components/Skeleton/PublicProfileSkeleton";

type TargetProfile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
};

type Post = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  location: string | null;
  likes_count: number;
  comments_count: number;
  oshis: {
    id: string;
    name: string;
    image: string;
  }[];
  fandoms: {
    id: string;
    name: string;
  }[];
  hashtags: string[];
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { user, isLoading: authLoading } = useSupabaseAuth();

  const username = typeof params.username === "string" ? params.username : null;

  const [profile, setProfile] = useState<TargetProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const [oshis, setOshis] = useState<Oshi[]>([]);
  const [oshisLoading, setOshisLoading] = useState(true);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const [activeTab, setActiveTab] = useState<"posts" | "saved" | "liked">("posts");

  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const [userListType, setUserListType] = useState<"followers" | "following" | null>(null);

  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const [showCropper, setShowCropper] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [croppedOshiImage, setCroppedOshiImage] = useState<File | null>(null);

  const [likedPosts, setLikedPosts] = useState<ProfilePost[]>([]);
  const [likedPostsLoaded, setLikedPostsLoaded] = useState(false);

  const [savedPosts, setSavedPosts] = useState<ProfilePost[]>([]);
  const [savedPostsLoaded, setSavedPostsLoaded] = useState(false);

  const isOwnProfile = !!user && !!profile && user.id === profile.id;

  /*
   * Open a post automatically when a post ID is provided
   * through the URL.
   *
   * This is mainly used after editing a post:
   * /username?post=123
   */
  useEffect(() => {
    const postId = searchParams.get("post");

    if (postId) {
      setSelectedPostId(postId);
    }
  }, [searchParams]);

  /*
   * Fetch profile from URL username.
   */
  useEffect(() => {
    async function fetchProfile() {
      if (!username) {
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);

      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          username,
          display_name,
          avatar_url,
          banner_url,
          bio
        `)
        .eq("username", username)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        setProfile(null);
      } else {
        setProfile(data);
      }

      setLoadingProfile(false);
    }

    fetchProfile();
  }, [username]);

  /*
   * Reset profile-specific data when changing profile.
   */
  useEffect(() => {
    if (!profile) return;

    setPosts([]);
    setOshis([]);

    setLikedPosts([]);
    setLikedPostsLoaded(false);

    setSavedPosts([]);
    setSavedPostsLoaded(false);

    setActiveTab("posts");

    fetchPosts();
    fetchOshis();
    fetchFollowCounts();
  }, [profile?.id]);

  /*
   * Fetch liked posts only for your own profile.
   */
  useEffect(() => {
    if (activeTab === "liked" && isOwnProfile && user && !likedPostsLoaded) {
      fetchLikedPosts();
    }
  }, [activeTab, isOwnProfile, user, likedPostsLoaded]);

  /*
   * Fetch saved posts only for your own profile.
   */
  useEffect(() => {
    if (activeTab === "saved" && isOwnProfile && user && !savedPostsLoaded) {
      fetchSavedPosts();
    }
  }, [activeTab, isOwnProfile, user, savedPostsLoaded]);

  const fetchPosts = async () => {
    if (!profile) return;

    setLoadingPosts(true);

    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          likes(count),
          comments(count),
          post_oshis(oshis(id, name, image_url)),
          post_fandoms(fandoms(id, name)),
          post_hashtags(hashtags(tag))
        `)
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching posts:", error);
        setPosts([]);
        return;
      }

      setPosts(
        (data ?? []).map((post: any) => ({
          id: post.id,
          user_id: post.user_id,
          content: post.content,
          image_url: post.image_url,
          created_at: post.created_at,
          location: post.location,
          likes_count: post.likes?.[0]?.count ?? 0,
          comments_count: post.comments?.[0]?.count ?? 0,
          oshis: (post.post_oshis ?? []).map((item: any) => ({
            id: item.oshis.id,
            name: item.oshis.name,
            image: item.oshis.image_url ?? "",
          })),
          fandoms: (post.post_fandoms ?? []).map((item: any) => ({
            id: item.fandoms.id,
            name: item.fandoms.name,
          })),
          hashtags: (post.post_hashtags ?? []).map((item: any) => item.hashtags.tag),
        }))
      );
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchOshis = async () => {
    if (!profile) return;

    setOshisLoading(true);

    try {
      const { data, error } = await supabase
        .from("oshis")
        .select("id, name, image_url")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching oshis:", error);
        setOshis([]);
        return;
      }

      setOshis(
        (data ?? []).map((oshi) => ({
          id: oshi.id,
          name: oshi.name,
          image: oshi.image_url ?? "",
        }))
      );
    } finally {
      setOshisLoading(false);
    }
  };

  const fetchFollowCounts = async () => {
    if (!profile) return;

    const [followersRes, followingRes] = await Promise.all([
      supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", profile.id),
      supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("follower_id", profile.id),
    ]);

    if (followersRes.error) {
      console.error("Error fetching followers count:", followersRes.error);
    } else {
      setFollowersCount(followersRes.count ?? 0);
    }

    if (followingRes.error) {
      console.error("Error fetching following count:", followingRes.error);
    } else {
      setFollowingCount(followingRes.count ?? 0);
    }
  };

  const fetchLikedPosts = async () => {
    if (!user || !isOwnProfile) return;

    try {
      const { data: likedRows, error: likesError } = await supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", user.id);

      if (likesError) {
        console.error("Error fetching liked posts:", likesError);
        setLikedPostsLoaded(true);
        return;
      }

      const postIds = likedRows?.map((row) => row.post_id) ?? [];

      if (postIds.length === 0) {
        setLikedPosts([]);
        setLikedPostsLoaded(true);
        return;
      }

      const { data: postData, error: postsError } = await supabase
        .from("posts")
        .select(`
          *,
          likes(count),
          comments(count),
          post_oshis(oshis(id, name, image_url)),
          post_fandoms(fandoms(id, name)),
          post_hashtags(hashtags(tag))
        `)
        .in("id", postIds)
        .order("created_at", { ascending: false });

      if (postsError) {
        console.error("Error fetching liked posts:", postsError);
        setLikedPostsLoaded(true);
        return;
      }

      const fetchedPosts = postData ?? [];

      const posterIds = [...new Set(fetchedPosts.map((post: any) => post.user_id))];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", posterIds);

      if (profilesError) {
        console.error("Error fetching poster profiles:", profilesError);
        setLikedPostsLoaded(true);
        return;
      }

      const profileMap = new Map(
        (profiles ?? []).map((poster) => [poster.id, poster])
      );

      const formattedPosts: ProfilePost[] = fetchedPosts.map((post: any) => {
        const poster = profileMap.get(post.user_id);

        return {
          id: post.id,
          images: parsePostImages(post.image_url),
          caption: post.content,
          time: formatTimeAgo(post.created_at),
          location: post.location ?? undefined,
          likes: post.likes?.[0]?.count ?? 0,
          comments: post.comments?.[0]?.count ?? 0,
          oshis: (post.post_oshis ?? []).map((item: any) => ({
            id: item.oshis.id,
            name: item.oshis.name,
            image: item.oshis.image_url ?? "",
          })),
          fandoms: (post.post_fandoms ?? []).map((item: any) => ({
            id: item.fandoms.id,
            name: item.fandoms.name,
          })),
          hashtags: (post.post_hashtags ?? []).map((item: any) => item.hashtags.tag),
          username: poster?.username ?? "username",
          avatar: poster?.avatar_url ?? null,
          userId: post.user_id,
        };
      });

      setLikedPosts(formattedPosts);
      setLikedPostsLoaded(true);
    } catch (error) {
      console.error("Error fetching liked posts:", error);
      setLikedPostsLoaded(true);
    }
  };

  const fetchSavedPosts = async () => {
    if (!user || !isOwnProfile) return;

    try {
      const { data: savedRows, error: savedError } = await supabase
        .from("saved_posts")
        .select("post_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (savedError) {
        console.error("Error fetching saved posts:", savedError);
        setSavedPostsLoaded(true);
        return;
      }

      const postIds = savedRows?.map((row) => row.post_id) ?? [];

      if (postIds.length === 0) {
        setSavedPosts([]);
        setSavedPostsLoaded(true);
        return;
      }

      const { data: postData, error: postsError } = await supabase
        .from("posts")
        .select(`
          *,
          likes(count),
          comments(count),
          post_oshis(oshis(id, name, image_url)),
          post_fandoms(fandoms(id, name)),
          post_hashtags(hashtags(tag))
        `)
        .in("id", postIds);

      if (postsError) {
        console.error("Error fetching saved posts:", postsError);
        setSavedPostsLoaded(true);
        return;
      }

      const fetchedPosts = postData ?? [];

      const postsById = new Map(
        fetchedPosts.map((post: any) => [post.id, post])
      );

      const orderedPosts = postIds
        .map((postId) => postsById.get(postId))
        .filter(Boolean) as any[];

      const posterIds = [...new Set(orderedPosts.map((post: any) => post.user_id))];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", posterIds);

      if (profilesError) {
        console.error("Error fetching poster profiles:", profilesError);
        setSavedPostsLoaded(true);
        return;
      }

      const profileMap = new Map(
        (profiles ?? []).map((poster) => [poster.id, poster])
      );

      const formattedPosts: ProfilePost[] = orderedPosts.map((post: any) => {
        const poster = profileMap.get(post.user_id);

        return {
          id: post.id,
          images: parsePostImages(post.image_url),
          caption: post.content,
          time: formatTimeAgo(post.created_at),
          location: post.location ?? undefined,
          likes: post.likes?.[0]?.count ?? 0,
          comments: post.comments?.[0]?.count ?? 0,
          oshis: (post.post_oshis ?? []).map((item: any) => ({
            id: item.oshis.id,
            name: item.oshis.name,
            image: item.oshis.image_url ?? "",
          })),
          fandoms: (post.post_fandoms ?? []).map((item: any) => ({
            id: item.fandoms.id,
            name: item.fandoms.name,
          })),
          hashtags: (post.post_hashtags ?? []).map((item: any) => item.hashtags.tag),
          username: poster?.username ?? "username",
          avatar: poster?.avatar_url ?? null,
          userId: post.user_id,
        };
      });

      setSavedPosts(formattedPosts);
      setSavedPostsLoaded(true);
    } catch (error) {
      console.error("Error fetching saved posts:", error);
      setSavedPostsLoaded(true);
    }
  };

  const userPosts = posts.map((post) => ({
    id: post.id,
    image: parsePostImages(post.image_url)[0] ?? null,
  }));

  const profileFeedPosts: ProfilePost[] = posts.map((post) => ({
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
    username: profile?.username ?? "username",
    avatar: profile?.avatar_url ?? null,
    userId: post.user_id,
  }));

  /*
   * Open a post modal from the profile.
   *
   * Normal profile clicks do NOT modify the URL.
   */
  const handleOpenPost = (postId: string) => {
    setSelectedPostId(postId);
  };

  /*
   * Close the post modal.
   *
   * If the modal was opened through ?post=,
   * remove the parameter from the URL.
   */
  const handleClosePost = () => {
    setSelectedPostId(null);

    if (!searchParams.get("post")) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("post");

    const query = params.toString();

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const handleLikeChange = (postId: string, likes: number) => {
    if (isOwnProfile && activeTab === "liked") {
      setLikedPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, likes } : post
        )
      );
      return;
    }

    if (isOwnProfile && activeTab === "saved") {
      setSavedPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, likes } : post
        )
      );
      return;
    }

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, likes_count: likes } : post
      )
    );
  };

  const handleFollowChange = (isFollowing: boolean) => {
    setFollowersCount((prev) =>
      isFollowing ? prev + 1 : Math.max(0, prev - 1)
    );
  };

  const handleOpenOshiCropper = (imageUrl: string) => {
    setCropImage(imageUrl);
    setShowCropper(true);
  };

  const handleOshiCropComplete = (croppedFile: File) => {
    setCroppedOshiImage(croppedFile);
    setShowCropper(false);

    if (cropImage) {
      URL.revokeObjectURL(cropImage);
    }

    setCropImage(null);
  };

  const handleCancelOshiCropper = () => {
    if (cropImage) {
      URL.revokeObjectURL(cropImage);
    }

    setCropImage(null);
    setShowCropper(false);
  };

  const resetOshiForm = () => {
    setShowBottomSheet(false);
    setCroppedOshiImage(null);

    if (cropImage) {
      URL.revokeObjectURL(cropImage);
    }

    setCropImage(null);
    setShowCropper(false);
  };

  const refreshProfile = async () => {
    await Promise.all([
      fetchPosts(),
      fetchOshis(),
      fetchFollowCounts(),
    ]);

    if (isOwnProfile && likedPostsLoaded) {
      await fetchLikedPosts();
    }

    if (isOwnProfile && savedPostsLoaded) {
      await fetchSavedPosts();
    }
  };

  const selectedLikedPost = likedPosts.find(
    (post) => post.id === selectedPostId
  );

  const selectedSavedPost = savedPosts.find(
    (post) => post.id === selectedPostId
  );

  if (loadingProfile || authLoading) {
    return <PublicProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="md:hidden flex min-h-screen flex-col items-center justify-center gap-3">
        <p className="text-foreground/50">User not found.</p>

        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm font-medium"
        >
          Go back
        </button>
      </div>
    );
  }

  const content = (
    <>
      {/* Banner */}
      {profile.banner_url && (
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
          className={`flex items-center gap-6 ${
            profile.banner_url
              ? "relative z-10 -mt-12"
              : "mt-5"
          }`}
        >
          {/* Avatar */}
          <div
            className={`h-24 w-24 shrink-0 overflow-hidden rounded-full bg-accent ${
              profile.banner_url
                ? "border-4 border-background"
                : ""
            }`}
          >
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={`${profile.display_name}'s avatar`}
                width={96}
                height={96}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <UserIcon
                  size={48}
                  className="text-foreground/30"
                />
              </div>
            )}
          </div>

          {/* Stats */}
          <div
            className={`flex-1 ${
              profile.banner_url ? "translate-y-8" : ""
            }`}
          >
            <div className="flex justify-around">
              <div className="text-center">
                <p className="font-semibold">{posts.length}</p>
                <p className="text-xs">Posts</p>
              </div>

              <button
                type="button"
                onClick={() => setUserListType("followers")}
                className="text-center"
              >
                <p className="font-semibold">
                  {followersCount}
                </p>
                <p className="text-xs">Followers</p>
              </button>

              <button
                type="button"
                onClick={() => setUserListType("following")}
                className="text-center"
              >
                <p className="font-semibold">
                  {followingCount}
                </p>
                <p className="text-xs">Following</p>
              </button>
            </div>
          </div>
        </div>

        {/* Name + Bio */}
        <div className="mt-2 space-y-1">
          <p className="font-semibold">
            {profile.display_name}
          </p>

          {profile.bio && (
            <p className="whitespace-pre-line text-sm text-foreground/70">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Own Profile */}
        {isOwnProfile ? (
          <button
            type="button"
            onClick={() => setShowEditProfile(true)}
            className="mt-3 h-10 w-full rounded-lg border border-foreground/20 bg-accent/50 text-base font-medium"
          >
            Edit Profile
          </button>
        ) : (
          <div className="mt-3 flex gap-2">
            <FollowButton
              targetUserId={profile.id}
              onChange={handleFollowChange}
              className="flex-1"
            />

            <MessageButton
              targetUserId={profile.id}
              className="flex-1"
            />
          </div>
        )}

        {/* Oshis */}
        {oshisLoading ? (
          <OshiListSkeleton showAdd={isOwnProfile} />
        ) : (
          <>
            {isOwnProfile ? (
              <OshiList
                oshis={oshis}
                onAdd={() => setShowBottomSheet(true)}
              />
            ) : (
              oshis.length > 0 && (
                <OshiList
                  oshis={oshis}
                  showAdd={false}
                />
              )
            )}
          </>
        )}
      </div>

      {/* Tabs only on your own profile */}
      {isOwnProfile && (
        <ProfileTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}

      {/* Posts */}
      {(!isOwnProfile || activeTab === "posts") && (
        <>
          {loadingPosts ? (
            <PostGridSkeleton count={6} />
          ) : userPosts.length > 0 ? (
            <PostGrid
              posts={userPosts}
              onPostClick={handleOpenPost}
            />
          ) : (
            <div className="flex min-h-40 items-center justify-center">
              <p className="text-sm text-foreground/40">
                No posts yet.
              </p>
            </div>
          )}
        </>
      )}

      {/* Saved */}
      {isOwnProfile && activeTab === "saved" && (
        <>
          {!savedPostsLoaded ? (
            <PostGridSkeleton count={6} />
          ) : savedPosts.length === 0 ? (
            <div className="flex min-h-40 items-center justify-center">
              <p className="text-sm text-foreground/40">
                No saved posts yet.
              </p>
            </div>
          ) : (
            <PostGrid
              posts={savedPosts.map((post) => ({
                id: post.id,
                image: post.images[0] ?? null,
              }))}
              onPostClick={handleOpenPost}
            />
          )}
        </>
      )}

      {/* Liked */}
      {isOwnProfile && activeTab === "liked" && (
        <>
          {!likedPostsLoaded ? (
            <PostGridSkeleton count={6} />
          ) : likedPosts.length === 0 ? (
            <div className="flex min-h-40 items-center justify-center">
              <p className="text-sm text-foreground/40">
                No liked posts yet.
              </p>
            </div>
          ) : (
            <PostGrid
              posts={likedPosts.map((post) => ({
                id: post.id,
                image: post.images[0] ?? null,
              }))}
              onPostClick={handleOpenPost}
            />
          )}
        </>
      )}
    </>
  );

  return (
    <div className="md:hidden min-h-screen flex flex-col pb-16">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center border-b border-foreground/10 bg-background py-3">
        {isOwnProfile ? (
          <div className="ml-auto">
            <button
              type="button"
              onClick={() => router.push("/settings")}
              className="flex h-9 w-9 items-center justify-center"
              aria-label="Settings"
            >
              <Settings size={22} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full"
            aria-label="Go back"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold">
          {profile.username}
        </h1>
      </header>

      {isOwnProfile ? (
        <PullToRefresh onRefresh={refreshProfile}>
          {content}
        </PullToRefresh>
      ) : (
        content
      )}

      {/* Own-profile controls */}
      {isOwnProfile && <CreatePostButton />}

      {isOwnProfile && showBottomSheet && (
        <BottomSheet
          title="Add Oshi"
          onClose={resetOshiForm}
        >
          <AddOshiForm
            onCreated={(newOshi) =>
              setOshis((prev) => [...prev, newOshi])
            }
            onClose={() => setShowBottomSheet(false)}
            onOpenCropper={handleOpenOshiCropper}
            croppedImage={croppedOshiImage}
          />
        </BottomSheet>
      )}

      {isOwnProfile && showCropper && cropImage && (
        <ImageCropper
          image={cropImage}
          aspectRatio={1}
          isFirstImage={true}
          onCropChange={() => {}}
          onRatioChange={() => {}}
          onComplete={handleOshiCropComplete}
          onCancel={handleCancelOshiCropper}
        />
      )}

      {/* Post Modal */}
      {selectedPostId && (
        <PostModal
          posts={
            isOwnProfile && activeTab === "liked"
              ? likedPosts
              : isOwnProfile && activeTab === "saved"
                ? savedPosts
                : profileFeedPosts
          }
          initialPostId={selectedPostId}
          username={
            isOwnProfile && activeTab === "liked"
              ? selectedLikedPost?.username ?? "username"
              : isOwnProfile && activeTab === "saved"
                ? selectedSavedPost?.username ?? "username"
                : profile.username
          }
          avatar={
            isOwnProfile && activeTab === "liked"
              ? selectedLikedPost?.avatar ?? null
              : isOwnProfile && activeTab === "saved"
                ? selectedSavedPost?.avatar ?? null
                : profile.avatar_url
          }
          ownerId={
            isOwnProfile && activeTab === "liked"
              ? selectedLikedPost?.userId
              : isOwnProfile && activeTab === "saved"
                ? selectedSavedPost?.userId
                : profile.id
          }
          onClose={handleClosePost}
          onLikeChange={handleLikeChange}
          onPostDeleted={
            isOwnProfile
              ? (postId) => {
                  if (activeTab === "liked") {
                    setLikedPosts((prev) =>
                      prev.filter(
                        (post) => post.id !== postId
                      )
                    );
                  } else if (activeTab === "saved") {
                    setSavedPosts((prev) =>
                      prev.filter(
                        (post) => post.id !== postId
                      )
                    );
                  } else {
                    setPosts((prev) =>
                      prev.filter(
                        (post) => post.id !== postId
                      )
                    );
                  }

                  handleClosePost();
                }
              : undefined
          }
        />
      )}

      {/* Edit Profile */}
      <AnimatePresence>
        {isOwnProfile && showEditProfile && (
          <EditProfileModal
            onClose={() => setShowEditProfile(false)}
          />
        )}
      </AnimatePresence>

      {/* Followers / Following */}
      <AnimatePresence>
        {userListType && (
          <UserList
            userId={profile.id}
            type={userListType}
            onClose={() => setUserListType(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}