function toDate(date?: string, time?: string): Date {
  if (!date) return new Date();
  const ms = Date.parse(date);
  if (!Number.isNaN(ms)) return new Date(ms);
  return new Date(`${date.replace('T', ' ')}${time ? ` ${time}` : ''}`);
}

export function timeAgo(date?: string, time?: string): string {
  const d = toDate(date, time);
  const seconds = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export function truncateWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(' ')}…`;
}

export function formatDate(date?: string, time?: string): string {
  const d = toDate(date, time);
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}