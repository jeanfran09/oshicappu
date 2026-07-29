export function formatCount(count: number) {
  if (count >= 1_000_000) {
    return `${Math.floor(count / 100_000) / 10}M`;
  }

  if (count >= 1_000) {
    return `${Math.floor(count / 100) / 10}K`;
  }

  return count.toString();
}