"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, User as UserIcon } from "lucide-react";
import { AnimatePresence } from "framer-motion";

import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";

import OshiList from "@/components/Profile/OshiList";
import PostGrid from "@/components/Profile/PostGrid";
import PostModal, {
  type ProfilePost,
} from "@/components/Profile/PostModal";
import FollowButton from "@/components/FollowButton";
import UserList from "@/components/UserList";

import {
  formatTimeAgo,
  parsePostImages,
} from "@/utils/formatNumber";

type TargetProfile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
};

type Oshi = {
  id: string;
  name: string;
  image: string;
};

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useSupabaseAuth();

  const username =
    typeof params.username === "string"
      ? params.username
      : null;

  const [profile, setProfile] =
    useState<TargetProfile | null>(null);

  const [loadingProfile, setLoadingProfile] =
    useState(true);

  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [loadingPosts, setLoadingPosts] =
    useState(true);

  const [oshis, setOshis] = useState<Oshi[]>([]);
  const [oshisLoading, setOshisLoading] =
    useState(true);

  const [followersCount, setFollowersCount] =
    useState(0);

  const [followingCount, setFollowingCount] =
    useState(0);

  const [selectedPostId, setSelectedPostId] =
    useState<string | null>(null);

  const [userListType, setUserListType] =
    useState<"followers" | "following" | null>(
      null
    );

  /*
   * Fetch the target profile by username.
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
        .select(
          "id, username, display_name, avatar_url, banner_url, bio"
        )
        .eq("username", username)
        .single();

      if (error) {
        console.error(
          "Error fetching profile:",
          error
        );

        setProfile(null);
      } else {
        setProfile(data);
      }

      setLoadingProfile(false);
    }

    fetchProfile();
  }, [username]);

  /*
   * If this is the logged-in user's own profile,
   * redirect them to their private profile page.
   */
  useEffect(() => {
    if (
      profile &&
      user &&
      profile.id === user.id
    ) {
      router.replace("/profile");
    }
  }, [profile, user, router]);

  /*
   * Fetch posts, oshis, and follower/following counts.
   */
  useEffect(() => {
    if (!profile) return;

    async function fetchPosts() {
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
        .eq("user_id", profile!.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Error fetching posts:",
          error
        );

        setPosts([]);
      } else {
        setPosts(
          (data ?? []).map((post: any) => ({
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
            ).map((po: any) => ({
              id: po.oshis.id,
              name: po.oshis.name,
              image:
                po.oshis.image_url ??
                "/icons/temp.jpg",
            })),
            fandoms: (
              post.post_fandoms ?? []
            ).map((pf: any) => ({
              id: pf.fandoms.id,
              name: pf.fandoms.name,
            })),
            hashtags: (
              post.post_hashtags ?? []
            ).map(
              (ph: any) =>
                ph.hashtags.tag
            ),
          }))
        );
      }

      setLoadingPosts(false);
    }

    async function fetchOshis() {
      setOshisLoading(true);

      const { data, error } = await supabase
        .from("oshis")
        .select(
          "id, name, image_url"
        )
        .eq("user_id", profile!.id)
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

      setOshisLoading(false);
    }

    async function fetchCounts() {
      const [
        followersRes,
        followingRes,
      ] = await Promise.all([
        supabase
          .from("follows")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq(
            "following_id",
            profile!.id
          ),

        supabase
          .from("follows")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq(
            "follower_id",
            profile!.id
          ),
      ]);

      if (followersRes.error) {
        console.error(
          "Error fetching followers count:",
          followersRes.error
        );
      } else {
        setFollowersCount(
          followersRes.count ?? 0
        );
      }

      if (followingRes.error) {
        console.error(
          "Error fetching following count:",
          followingRes.error
        );
      } else {
        setFollowingCount(
          followingRes.count ?? 0
        );
      }
    }

    fetchPosts();
    fetchOshis();
    fetchCounts();
  }, [profile]);

  const postGridItems = posts.map(
    (post) => ({
      id: post.id,
      image:
        post.images[0] ?? null,
    })
  );

  /*
   * Called immediately by FollowButton when
   * the user clicks Follow/Following.
   *
   * This means the follower count changes
   * immediately without waiting for another
   * database fetch.
   */
  const handleFollowChange = (
    isFollowing: boolean
  ) => {
    setFollowersCount((prev) =>
      isFollowing
        ? prev + 1
        : Math.max(0, prev - 1)
    );
  };

  if (loadingProfile) {
    return (
      <div className="md:hidden flex min-h-screen items-center justify-center">
        <p className="text-foreground/50">
          Loading...
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="md:hidden flex min-h-screen flex-col items-center justify-center gap-3">
        <p className="text-foreground/50">
          User not found.
        </p>

        <button
          onClick={() => router.back()}
          className="text-sm font-medium"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="md:hidden min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center gap-3 border-b border-foreground/10 bg-background px-4 py-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full"
        >
          <ArrowLeft size={22} />
        </button>

        <h1 className="text-xl font-semibold">
          @{profile.username}
        </h1>
      </header>

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
          className={`
            flex items-center gap-6
            ${
              profile.banner_url
                ? "relative z-10 -mt-12"
                : "mt-5"
            }
          `}
        >
          {/* Avatar */}
          <div
            className={`
              h-24
              w-24
              shrink-0
              overflow-hidden
              rounded-full
              bg-accent/20
              ${
                profile.banner_url
                  ? "border-4 border-background"
                  : ""
              }
            `}
          >
            {profile.avatar_url ? (
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

          {/* Stats */}
          <div
            className={`
              flex-1
              ${
                profile.banner_url
                  ? "translate-y-8"
                  : ""
              }
            `}
          >
            <div className="flex justify-around">
              {/* Posts */}
              <div className="text-center">
                <p className="font-semibold">
                  {posts.length}
                </p>

                <p className="text-xs">
                  Posts
                </p>
              </div>

              {/* Followers */}
              <button
                type="button"
                onClick={() =>
                  setUserListType(
                    "followers"
                  )
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

              {/* Following */}
              <button
                type="button"
                onClick={() =>
                  setUserListType(
                    "following"
                  )
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

        {/* Name + Bio */}
        <div className="mt-2 space-y-1">
          <p className="font-semibold">
            {profile.display_name}
          </p>

          {profile.bio && (
            <p className="text-sm text-foreground/70">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Follow Button */}
        <FollowButton
          targetUserId={profile.id}
          onChange={handleFollowChange}
          className="mt-3 h-10 w-full"
        />

        {/* Oshis */}
        {!oshisLoading &&
          oshis.length > 0 && (
            <OshiList
              oshis={oshis}
              showAdd={false}
            />
          )}
      </div>

      {/* Post Divider */}
      <div className="mt-2 border-t border-foreground/10" />

      {/* Posts */}
      {!loadingPosts && (
        <PostGrid
          posts={postGridItems}
          onPostClick={setSelectedPostId}
        />
      )}

      {/* Post Modal */}
      {selectedPostId && (
        <PostModal
          posts={posts}
          initialPostId={selectedPostId}
          username={profile.username}
          avatar={
            profile.avatar_url ||
            "/icons/temp.jpg"
          }
          onClose={() =>
            setSelectedPostId(null)
          }
        />
      )}

      {/* Followers / Following List */}
      <AnimatePresence>
        {userListType && (
          <UserList
            userId={profile.id}
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