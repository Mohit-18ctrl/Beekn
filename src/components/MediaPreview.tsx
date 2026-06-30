import React, { useRef, useState } from "react";
import { Play, RotateCcw } from "lucide-react";

interface MediaPreviewProps {
  src?: string;
  alt: string;
  mediaType?: "image" | "video";
  className?: string;
  badgeClassName?: string;
  showVideoBadge?: boolean;
}

function getCloudinaryVideoPoster(src?: string) {
  if (!src || !src.includes("res.cloudinary.com") || !src.includes("/video/upload/")) {
    return undefined;
  }

  const [baseUrl, queryString] = src.split("?");
  const posterUrl = baseUrl.replace("/video/upload/", "/video/upload/so_0.2,f_jpg,q_auto,w_900/").replace(/\.[a-z0-9]+$/i, ".jpg");
  return queryString ? `${posterUrl}?${queryString}` : posterUrl;
}

export default function MediaPreview({
  src,
  alt,
  mediaType = "image",
  className = "h-full w-full object-cover",
  badgeClassName = "absolute bottom-2 right-2",
  showVideoBadge = true,
}: MediaPreviewProps) {
  const isVideo = mediaType === "video";
  const poster = getCloudinaryVideoPoster(src);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  const handleVideoAction = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const video = videoRef.current;
    if (!video) return;

    if (hasEnded) {
      video.currentTime = 0;
      setHasEnded(false);
    }

    try {
      await video.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  if (!src) {
    return (
      <div className={`${className} flex items-center justify-center bg-slate-100 text-xs font-semibold text-slate-400 dark:bg-slate-800 dark:text-slate-500`}>
        No media
      </div>
    );
  }

  return (
    <>
      {isVideo ? (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted
          playsInline
          preload="metadata"
          className={`${className} pointer-events-none`}
          aria-label={alt}
          onPlay={() => {
            setIsPlaying(true);
            setHasEnded(false);
          }}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            setHasEnded(true);
          }}
        />
      ) : (
        <img
          src={src}
          alt={alt}
          className={className}
          referrerPolicy="no-referrer"
        />
      )}

      {isVideo && (!isPlaying || hasEnded) && (
        <button
          type="button"
          onClick={handleVideoAction}
          className="absolute left-1/2 top-1/2 z-10 inline-flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/75 text-white shadow-lg ring-1 ring-white/30 backdrop-blur-sm transition hover:scale-105 hover:bg-slate-950/90 focus:outline-none focus:ring-2 focus:ring-white/70"
          aria-label={hasEnded ? "Replay video evidence" : "Play video evidence"}
        >
          {hasEnded ? (
            <RotateCcw className="h-4 w-4" />
          ) : (
            <Play className="ml-0.5 h-4 w-4 fill-white" />
          )}
        </button>
      )}

      {isVideo && showVideoBadge && (
        <span className={`${badgeClassName} inline-flex items-center gap-1 rounded-full bg-slate-950/80 px-2 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm`}>
          <Play className="h-3 w-3 fill-white" />
          Video
        </span>
      )}
    </>
  );
}
