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
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "JUST NOW";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} MINUTE${minutes === 1 ? "" : "S"} AGO`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} HOUR${hours === 1 ? "" : "S"} AGO`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} DAY${days === 1 ? "" : "S"} AGO`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} WEEK${weeks === 1 ? "" : "S"} AGO`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} MONTH${months === 1 ? "" : "S"} AGO`;

  const years = Math.floor(days / 365);
  return `${years} YEAR${years === 1 ? "" : "S"} AGO`;
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