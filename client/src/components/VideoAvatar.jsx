import { useState, useRef } from "react";
import { User } from "lucide-react";

/**
 * VideoAvatar — Animated profile picture component.
 *
 * Renders an auto-playing, muted, looping <video> as a "living portrait"
 * if video_url is provided. Falls back to avatar_url image, then to
 * an initials placeholder.
 *
 * @param {string} videoUrl - URL to looping profile video (mp4)
 * @param {string} avatarUrl - Fallback static image URL
 * @param {string} name - Full name for initials fallback
 * @param {string} themeColor - Accent color for the border ring
 * @param {number} size - Size in pixels (default: 160)
 */
export default function VideoAvatar({
  videoUrl,
  avatarUrl,
  name = "",
  themeColor = "#6d5cff",
  size = 160,
}) {
  const [videoError, setVideoError] = useState(false);
  const [imgError, setImgError] = useState(false);
  const videoRef = useRef(null);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: "50%",
    background: `linear-gradient(135deg, ${themeColor}, #00e5a0)`,
    padding: "3px",
    flexShrink: 0,
  };

  const innerStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    overflow: "hidden",
    background: "#161a27",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  // Priority: video → image → initials
  const showVideo = videoUrl && !videoError;
  const showImage = !showVideo && avatarUrl && !imgError;
  const showInitials = !showVideo && !showImage;

  return (
    <div style={containerStyle} className="mx-auto shadow-2xl">
      <div style={innerStyle}>
        {showVideo && (
          <video
            ref={videoRef}
            src={videoUrl}
            autoPlay
            muted
            loop
            playsInline
            onError={() => setVideoError(true)}
            className="w-full h-full object-cover"
            style={{ borderRadius: "50%" }}
          />
        )}

        {showImage && (
          <img
            src={avatarUrl}
            alt={name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
            style={{ borderRadius: "50%" }}
          />
        )}

        {showInitials && (
          <div className="flex items-center justify-center w-full h-full bg-surface-light">
            {initials ? (
              <span
                className="font-bold gradient-text"
                style={{ fontSize: size * 0.35 }}
              >
                {initials}
              </span>
            ) : (
              <User size={size * 0.4} className="text-gray-500" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
