import Image from "next/image";
import { Heart, MessageCircle, UserPlus } from "lucide-react";

type NotificationType = "like" | "comment" | "follow";

type NotificationProps = {
  type: NotificationType;
  username: string;
  avatar: string;
  content?: string;
  time: string;
  image?: string; // post preview image
};

export default function Notification({
  type,
  username,
  avatar,
  content,
  time,
  image,
}: NotificationProps) {

  const notificationText = {
    like: "liked your post",
    comment: "commented on your post",
    follow: "started following you",
  };

  return (
    <div className="flex items-center gap-3 p-4">
      {/* User Avatar */}
      <Image
        src={avatar}
        alt={username}
        width={48}
        height={48}
        className="rounded-full object-cover"
      />

      {/* Notification Content */}
      <div className="flex-1">
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
      {(type === "like" || type === "comment") && image && (
        <Image
          src={image}
          alt="Post preview"
          width={50}
          height={50}
          className="rounded-md aspect-square object-cover"
        />
      )}

      {/* Follow icon
      {type === "follow" && (
        <UserPlus
          size={22}
          className="text-foreground"
        />
      )} */}
    </div>
  );
}