export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  if (src.startsWith('http')) {
    return src;
  }
  return `${basePath}${src}`;
} 