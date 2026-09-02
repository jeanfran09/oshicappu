"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import CreatePostButton from "@/components/CreatePostButton";
import OshiList from "@/components/Profile/OshiList";
import BottomSheet from "@/components/BottomSheet";
import ProfileTabs from "@/components/Profile/ProfileTabs";
import PullToRefresh from "@/components/PullToRefresh";
import PostGrid from "@/components/Profile/PostGrid";
import PostModal, {
  type ProfilePost,
} from "@/components/Profile/PostModal";
import EditProfileModal from "@/components/Profile/EditProfileModal";
import AddOshiForm from "@/components/AddOshiForm";
import ImageCropper from "@/components/CreatePost/ImageCropper";
import type { Oshi } from "@/components/CreatePost/OshiPicker";
import UserList from "@/components/UserList";

import {
  formatTimeAgo,
  parsePostImages,
} from "@/utils/formatNumber";

interface Post {
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
}

export default function ProfilePage() {
  const {
    user,
    profile,
    isLoggedIn,
    logout,
    isLoading,
  } = useSupabaseAuth();

  const router = useRouter();

  const [userListType, setUserListType] = useState<
    "followers" | "following" | null
  >(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [oshis, setOshis] = useState<Oshi[]>([]);
  const [oshisLoading, setOshisLoading] = useState(true);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const [activeTab, setActiveTab] = useState<
    "posts" | "saved" | "liked"
  >("posts");

  const [selectedPostId, setSelectedPostId] =
    useState<string | null>(null);

  const [showBottomSheet, setShowBottomSheet] =
    useState(false);

  const [showEditProfile, setShowEditProfile] =
    useState(false);

  const [likedPosts, setLikedPosts] =
    useState<ProfilePost[]>([]);

  const [likedPostsLoaded, setLikedPostsLoaded] =
    useState(false);

  const [savedPosts, setSavedPosts] =
    useState<ProfilePost[]>([]);

  const [savedPostsLoaded, setSavedPostsLoaded] =
    useState(false);

  const [showCropper, setShowCropper] = useState(false);
  const [cropImage, setCropImage] =
    useState<string | null>(null);

  const [croppedOshiImage, setCroppedOshiImage] =
    useState<File | null>(null);

  const userPosts = posts.map((post) => ({
    id: post.id,
    image: parsePostImages(post.image_url)[0] ?? null,
  }));

  const profileFeedPosts: ProfilePost[] = posts.map(
    (post) => ({
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
    })
  );

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, isLoading, router]);

  useEffect(() => {
    if (!user) return;

    fetchUserPosts();
    fetchUserOshis();
    fetchFollowCounts();
  }, [user]);

  useEffect(() => {
    if (
      activeTab === "liked" &&
      user &&
      !likedPostsLoaded
    ) {
      fetchLikedPosts();
    }
  }, [activeTab, user, likedPostsLoaded]);

  useEffect(() => {
    if (
      activeTab === "saved" &&
      user &&
      !savedPostsLoaded
    ) {
      fetchSavedPosts();
    }
  }, [activeTab, user, savedPostsLoaded]);

  const fetchFollowCounts = async () => {
    if (!user) return;

    const [followersRes, followingRes] =
      await Promise.all([
        supabase
          .from("follows")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("following_id", user.id),

        supabase
          .from("follows")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("follower_id", user.id),
      ]);

    if (followersRes.error) {
      console.error(
        "Error fetching followers count:",
        followersRes.error
      );
    } else {
      setFollowersCount(followersRes.count ?? 0);
    }

    if (followingRes.error) {
      console.error(
        "Error fetching following count:",
        followingRes.error
      );
    } else {
      setFollowingCount(followingRes.count ?? 0);
    }
  };

  const fetchUserOshis = async () => {
    if (!user) return;

    setOshisLoading(true);

    try {
      const { data, error } = await supabase
        .from("oshis")
        .select("id, name, image_url")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: true,
        });

      if (error) {
        console.error("Error fetching oshis:", error);
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

  const fetchUserPosts = async () => {
    if (!user) return;

    try {
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
        console.error("Error fetching posts:", error);
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

          likes_count:
            post.likes?.[0]?.count ?? 0,

          comments_count:
            post.comments?.[0]?.count ?? 0,

          oshis: (post.post_oshis ?? []).map(
            (item: any) => ({
              id: item.oshis.id,
              name: item.oshis.name,
              image:
                item.oshis.image_url ?? "",
            })
          ),

          fandoms: (post.post_fandoms ?? []).map(
            (item: any) => ({
              id: item.fandoms.id,
              name: item.fandoms.name,
            })
          ),

          hashtags: (post.post_hashtags ?? []).map(
            (item: any) => item.hashtags.tag
          ),
        }))
      );
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const fetchLikedPosts = async () => {
    if (!user) return;

    try {
      const { data: likedRows, error: likesError } =
        await supabase
          .from("likes")
          .select("post_id")
          .eq("user_id", user.id);

      if (likesError) {
        console.error(
          "Error fetching liked posts:",
          likesError
        );
        return;
      }

      const postIds =
        likedRows?.map((row) => row.post_id) ?? [];

      if (postIds.length === 0) {
        setLikedPosts([]);
        setLikedPostsLoaded(true);
        return;
      }

      const { data: postData, error: postsError } =
        await supabase
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
          .in("id", postIds)
          .order("created_at", {
            ascending: false,
          });

      if (postsError) {
        console.error(
          "Error fetching liked posts:",
          postsError
        );
        return;
      }

      const fetchedPosts = postData ?? [];

      const posterIds = [
        ...new Set(
          fetchedPosts.map(
            (post: any) => post.user_id
          )
        ),
      ];

      const { data: profiles, error: profilesError } =
        await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", posterIds);

      if (profilesError) {
        console.error(
          "Error fetching poster profiles:",
          profilesError
        );
        return;
      }

      const profileMap = new Map(
        (profiles ?? []).map((poster) => [
          poster.id,
          poster,
        ])
      );

      const formattedPosts: ProfilePost[] =
        fetchedPosts.map((post: any) => {
          const poster = profileMap.get(
            post.user_id
          );

          return {
            id: post.id,
            images: parsePostImages(
              post.image_url
            ),
            caption: post.content,
            time: formatTimeAgo(
              post.created_at
            ),
            location:
              post.location ?? undefined,

            likes:
              post.likes?.[0]?.count ?? 0,

            comments:
              post.comments?.[0]?.count ?? 0,

            oshis: (
              post.post_oshis ?? []
            ).map((item: any) => ({
              id: item.oshis.id,
              name: item.oshis.name,
              image:
                item.oshis.image_url ?? "",
            })),

            fandoms: (
              post.post_fandoms ?? []
            ).map((item: any) => ({
              id: item.fandoms.id,
              name: item.fandoms.name,
            })),

            hashtags: (
              post.post_hashtags ?? []
            ).map(
              (item: any) =>
                item.hashtags.tag
            ),

            username:
              poster?.username ?? "username",

            avatar:
              poster?.avatar_url ?? null,

            userId: post.user_id,
          };
        });

      setLikedPosts(formattedPosts);
      setLikedPostsLoaded(true);
    } catch (error) {
      console.error(
        "Error fetching liked posts:",
        error
      );
    }
  };

  const fetchSavedPosts = async () => {
    if (!user) return;

    try {
      const { data: savedRows, error: savedError } =
        await supabase
          .from("saved_posts")
          .select("post_id")
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          });

      if (savedError) {
        console.error(
          "Error fetching saved posts:",
          savedError
        );
        return;
      }

      const postIds =
        savedRows?.map((row) => row.post_id) ?? [];

      if (postIds.length === 0) {
        setSavedPosts([]);
        setSavedPostsLoaded(true);
        return;
      }

      const { data: postData, error: postsError } =
        await supabase
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
          .in("id", postIds);

      if (postsError) {
        console.error(
          "Error fetching saved posts:",
          postsError
        );
        return;
      }

      const fetchedPosts = postData ?? [];

      // Preserve the order the posts were saved in.
      const postsById = new Map(
        fetchedPosts.map((post: any) => [
          post.id,
          post,
        ])
      );

      const orderedPosts = postIds
        .map((postId) => postsById.get(postId))
        .filter(Boolean) as any[];

      const posterIds = [
        ...new Set(
          orderedPosts.map(
            (post: any) => post.user_id
          )
        ),
      ];

      const { data: profiles, error: profilesError } =
        await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", posterIds);

      if (profilesError) {
        console.error(
          "Error fetching poster profiles:",
          profilesError
        );
        return;
      }

      const profileMap = new Map(
        (profiles ?? []).map((poster) => [
          poster.id,
          poster,
        ])
      );

      const formattedPosts: ProfilePost[] =
        orderedPosts.map((post: any) => {
          const poster = profileMap.get(
            post.user_id
          );

          return {
            id: post.id,
            images: parsePostImages(
              post.image_url
            ),
            caption: post.content,
            time: formatTimeAgo(
              post.created_at
            ),
            location:
              post.location ?? undefined,

            likes:
              post.likes?.[0]?.count ?? 0,

            comments:
              post.comments?.[0]?.count ?? 0,

            oshis: (
              post.post_oshis ?? []
            ).map((item: any) => ({
              id: item.oshis.id,
              name: item.oshis.name,
              image:
                item.oshis.image_url ?? "",
            })),

            fandoms: (
              post.post_fandoms ?? []
            ).map((item: any) => ({
              id: item.fandoms.id,
              name: item.fandoms.name,
            })),

            hashtags: (
              post.post_hashtags ?? []
            ).map(
              (item: any) =>
                item.hashtags.tag
            ),

            username:
              poster?.username ?? "username",

            avatar:
              poster?.avatar_url ?? null,

            userId: post.user_id,
          };
        });

      setSavedPosts(formattedPosts);
      setSavedPostsLoaded(true);
    } catch (error) {
      console.error(
        "Error fetching saved posts:",
        error
      );
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleOpenOshiCropper = (
    imageUrl: string
  ) => {
    setCropImage(imageUrl);
    setShowCropper(true);
  };

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

  const refreshFeed = async () => {
    if (!user) return;

    await Promise.all([
      fetchUserPosts(),
      fetchUserOshis(),
      fetchFollowCounts(),
    ]);

    if (likedPostsLoaded) {
      await fetchLikedPosts();
    }

    if (savedPostsLoaded) {
      await fetchSavedPosts();
    }
  };

  if (isLoading) {
    return (
      <div className="md:hidden min-h-screen flex items-center justify-center">
        <p className="text-foreground">
          Loading...
        </p>
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return null;
  }

  const selectedLikedPost =
    likedPosts.find(
      (post) => post.id === selectedPostId
    );

  const selectedSavedPost =
    savedPosts.find(
      (post) => post.id === selectedPostId
    );

  return (
    <div className="md:hidden min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-foreground/10 bg-background px-4 py-3">
        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold">
          {profile?.username ?? "username"}
        </h1>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => router.push("/settings")}
            className="flex h-9 w-9 items-center justify-center"
          >
            <Settings size={22} />
          </button>

          <button
            onClick={handleLogout}
            className="flex h-9 w-9 items-center justify-center"
          >
            <LogOut size={22} />
          </button>
        </div>
      </header>

      <PullToRefresh onRefresh={refreshFeed}>
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

        <div className="px-4">
          <div
            className={`flex items-center gap-6 ${
              profile?.banner_url
                ? "relative z-10 -mt-12"
                : "mt-5"
            }`}
          >
            <div
              className={`h-24 w-24 shrink-0 overflow-hidden rounded-full bg-accent ${
                profile?.banner_url
                  ? "border-4 border-background"
                  : ""
              }`}
            >
              {profile?.avatar_url ? (
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

            <div
              className={`flex-1 ${
                profile?.banner_url
                  ? "translate-y-8"
                  : ""
              }`}
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

                <button
                  type="button"
                  onClick={() =>
                    setUserListType("followers")
                  }
                  className="text-center"
                >
                  <p className="font-semibold">
                    {followersCount}
                  </p>
                  <p className="text-xs">
                    Followers
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setUserListType("following")
                  }
                  className="text-center"
                >
                  <p className="font-semibold">
                    {followingCount}
                  </p>
                  <p className="text-xs">
                    Following
                  </p>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-2 space-y-1">
            <p className="font-semibold">
              {profile?.display_name}
            </p>

            {profile?.bio && (
              <p className="whitespace-pre-line text-sm text-foreground/70">
                {profile.bio}
              </p>
            )}
          </div>

          <button
            onClick={() =>
              setShowEditProfile(true)
            }
            className="mt-3 h-10 w-full rounded-lg border border-foreground/20 bg-accent/50 text-base font-medium"
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
          <>
            {!savedPostsLoaded ? (
              <div className="flex min-h-40 items-center justify-center">
                <p className="text-sm text-foreground/40">
                  Loading saved posts...
                </p>
              </div>
            ) : savedPosts.length === 0 ? (
              <div className="flex min-h-40 items-center justify-center">
                <p className="text-sm text-foreground/40">
                  No saved posts yet.
                </p>
              </div>
            ) : (
              <PostGrid
                posts={savedPosts.map(
                  (post) => ({
                    id: post.id,
                    image:
                      post.images[0] ?? null,
                  })
                )}
                onPostClick={setSelectedPostId}
              />
            )}
          </>
        )}

        {activeTab === "liked" && (
          <>
            {!likedPostsLoaded ? (
              <div className="flex min-h-40 items-center justify-center">
                <p className="text-sm text-foreground/40">
                  Loading liked posts...
                </p>
              </div>
            ) : likedPosts.length === 0 ? (
              <div className="flex min-h-40 items-center justify-center">
                <p className="text-sm text-foreground/40">
                  No liked posts yet.
                </p>
              </div>
            ) : (
              <PostGrid
                posts={likedPosts.map(
                  (post) => ({
                    id: post.id,
                    image:
                      post.images[0] ?? null,
                  })
                )}
                onPostClick={setSelectedPostId}
              />
            )}
          </>
        )}
      </PullToRefresh>

      <CreatePostButton />

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

      {selectedPostId && (
        <PostModal
          posts={
            activeTab === "liked"
              ? likedPosts
              : activeTab === "saved"
              ? savedPosts
              : profileFeedPosts
          }
          initialPostId={selectedPostId}
          username={
            activeTab === "liked"
              ? selectedLikedPost?.username ??
                "username"
              : activeTab === "saved"
              ? selectedSavedPost?.username ??
                "username"
              : profile?.username ??
                "username"
          }
          avatar={
            activeTab === "liked"
              ? selectedLikedPost?.avatar ??
                null
              : activeTab === "saved"
              ? selectedSavedPost?.avatar ??
                null
              : profile?.avatar_url ??
                null
          }
          ownerId={
            activeTab === "liked"
              ? selectedLikedPost?.userId
              : activeTab === "saved"
              ? selectedSavedPost?.userId
              : user.id
          }
          onClose={() =>
            setSelectedPostId(null)
          }
          onPostDeleted={(postId) => {
            if (activeTab === "liked") {
              setLikedPosts((prev) =>
                prev.filter(
                  (post) =>
                    post.id !== postId
                )
              );
            } else if (activeTab === "saved") {
              setSavedPosts((prev) =>
                prev.filter(
                  (post) =>
                    post.id !== postId
                )
              );
            } else {
              setPosts((prev) =>
                prev.filter(
                  (post) =>
                    post.id !== postId
                )
              );
            }

            setSelectedPostId(null);
          }}
        />
      )}

      <AnimatePresence>
        {showEditProfile && (
          <EditProfileModal
            onClose={() =>
              setShowEditProfile(false)
            }
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {userListType && (
          <UserList
            userId={user.id}
            type={userListType}
            onClose={() =>
              setUserListType(null)
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
}