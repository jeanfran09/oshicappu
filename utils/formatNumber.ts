export function formatCount(count: number) {
  if (count >= 1_000_000) {
    return `${Math.floor(count / 100_000) / 10}M`;
  }

  if (count >= 1_000) {
    return `${Math.floor(count / 100) / 10}K`;
  }

  return count.toString();
}

export function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const seconds = Math.floor(
    (now.getTime() - date.getTime()) / 1000
  );

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  // 7+ days ago — show the actual date
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });
  }

  // Previous years
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatCommentTime(dateString: string) {
  const date = new Date(dateString);
  const seconds = Math.floor(
    (Date.now() - date.getTime()) / 1000
  );

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;

  const years = Math.floor(days / 365);
  return `${years}y`;
}

// The `posts.image_url` column stores either a single URL, or (for
// multi-image posts) a JSON-stringified array of URLs. This normalizes
// either case into a plain string array.
export function parsePostImages(imageUrl: string | null): string[] {
  if (!imageUrl) return [];

  try {
    const parsed = JSON.parse(imageUrl);
    if (Array.isArray(parsed)) return parsed;
    return [imageUrl];
  } catch {
    return [imageUrl];
  }
}