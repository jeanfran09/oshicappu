"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { User as UserIcon } from "lucide-react";

type NotificationType = "like" | "comment" | "follow";

type NotificationProps = {
  type: NotificationType;
  username: string;
  avatar: string | null;
  content?: string;
  time: string;
  image?: string | null; // post preview image
  read?: boolean;
  onClick?: () => void;
};

export default function Notification({
  type,
  username,
  avatar,
  content,
  time,
  image,
  read = true,
  onClick,
}: NotificationProps) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setAvatarFailed(false);
  }, [avatar]);

  useEffect(() => {
    setImageFailed(false);
  }, [image]);

  const notificationText = {
    like: "liked your post",
    comment: "commented on your post",
    follow: "started following you",
  };

  const showAvatar = !!avatar && !avatarFailed;
  const showImage =
    (type === "like" || type === "comment") &&
    !!image &&
    !imageFailed;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 p-4 text-left ${
        read ? "" : "bg-accent/15"
      }`}
    >
      {/* User Avatar */}
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-accent">
        {showAvatar ? (
          <Image
            src={avatar as string}
            alt={username}
            fill
            sizes="48px"
            className="object-cover"
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <UserIcon size={24} className="text-foreground/30" />
          </div>
        )}
      </div>

      {/* Notification Content */}
      <div className="min-w-0 flex-1">
        <p className="text-base">
          <span className="font-semibold">
            {username}
          </span>{" "}
          {notificationText[type]}
        </p>

        {/* Comment text */}
        {type === "comment" && content && (
          <p className="text-base text-gray-500 line-clamp-1">
            {content}
          </p>
        )}

        <p className="text-xs text-gray-400">
          {time}
        </p>
      </div>

      {/* Post Preview */}
      {showImage && (
        <div className="relative h-[50px] w-[50px] shrink-0 overflow-hidden rounded-md">
          <Image
            src={image as string}
            alt="Post preview"
            fill
            sizes="50px"
            className="object-cover"
            onError={() => setImageFailed(true)}
          />
        </div>
      )}
    </button>
  );
}