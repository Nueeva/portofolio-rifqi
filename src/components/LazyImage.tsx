import { useState, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";

interface ImageSource {
  src: string;
  width: number;
}

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  placeholderClassName?: string;
  /** Define responsive image sizes for srcset */
  sizes?: string;
  /** Priority loading - skip lazy loading for above-fold images */
  priority?: boolean;
}

// Check if browser supports WebP
const supportsWebP = (() => {
  if (typeof window === "undefined") return false;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
})();

// Generate responsive srcset from a base URL
function generateSrcSet(src: string, widths: number[] = [320, 640, 768, 1024, 1280]): string {
  // If it's a data URL or blob, return empty (no srcset)
  if (src.startsWith("data:") || src.startsWith("blob:")) {
    return "";
  }

  // Check if URL supports transformation (Supabase Storage, Cloudinary, etc.)
  const isSupabaseStorage = src.includes("supabase") && src.includes("/storage/");
  const isCloudinary = src.includes("cloudinary.com");
  const isUnsplash = src.includes("unsplash.com");

  if (isSupabaseStorage) {
    // Supabase Storage transform API
    return widths
      .map((w) => {
        const url = new URL(src);
        url.searchParams.set("width", w.toString());
        url.searchParams.set("quality", "80");
        return `${url.toString()} ${w}w`;
      })
      .join(", ");
  }

  if (isCloudinary) {
    // Cloudinary transformation
    return widths
      .map((w) => {
        const transformed = src.replace("/upload/", `/upload/w_${w},q_auto,f_auto/`);
        return `${transformed} ${w}w`;
      })
      .join(", ");
  }

  if (isUnsplash) {
    // Unsplash image API
    return widths
      .map((w) => {
        const url = new URL(src);
        url.searchParams.set("w", w.toString());
        url.searchParams.set("q", "80");
        url.searchParams.set("fm", "webp");
        return `${url.toString()} ${w}w`;
      })
      .join(", ");
  }

  // For other URLs, return empty srcset (use original)
  return "";
}

// Generate WebP version of URL if supported by CDN
function getWebPUrl(src: string): string | null {
  if (src.startsWith("data:") || src.startsWith("blob:")) {
    return null;
  }

  const isSupabaseStorage = src.includes("supabase") && src.includes("/storage/");
  const isCloudinary = src.includes("cloudinary.com");

  if (isSupabaseStorage) {
    const url = new URL(src);
    url.searchParams.set("format", "webp");
    return url.toString();
  }

  if (isCloudinary) {
    return src.replace("/upload/", "/upload/f_webp/");
  }

  return null;
}

export function LazyImage({
  src,
  alt,
  className,
  wrapperClassName,
  placeholderClassName,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  priority = false,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority); // Skip intersection check for priority images
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Generate srcset and WebP URLs
  const srcSet = useMemo(() => generateSrcSet(src), [src]);
  const webpSrc = useMemo(() => (supportsWebP ? getWebPUrl(src) : null), [src]);
  const webpSrcSet = useMemo(
    () => (webpSrc ? generateSrcSet(webpSrc) : ""),
    [webpSrc]
  );

  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "200px", // Start loading 200px before entering viewport
        threshold: 0,
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true); // Hide skeleton on error too
  };

  const imageClasses = cn(
    "transition-opacity duration-300",
    isLoaded && !hasError ? "opacity-100" : "opacity-0",
    className
  );

  return (
    <div ref={imgRef} className={cn("relative overflow-hidden", wrapperClassName)}>
      {/* Placeholder skeleton */}
      {!isLoaded && (
        <div
          className={cn(
            "absolute inset-0 bg-muted animate-pulse",
            placeholderClassName
          )}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Failed to load</span>
        </div>
      )}

      {/* Actual image with picture element for WebP support */}
      {isInView && !hasError && (
        <picture>
          {/* WebP source if available */}
          {webpSrcSet && (
            <source
              type="image/webp"
              srcSet={webpSrcSet}
              sizes={sizes}
            />
          )}
          {webpSrc && !webpSrcSet && (
            <source type="image/webp" srcSet={webpSrc} />
          )}

          {/* Regular srcset if available */}
          {srcSet && (
            <source srcSet={srcSet} sizes={sizes} />
          )}

          {/* Fallback img */}
          <img
            src={src}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
            onLoad={handleLoad}
            onError={handleError}
            className={imageClasses}
            sizes={sizes}
          />
        </picture>
      )}
    </div>
  );
}

// Export a simpler version for inline use
export function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}) {
  const srcSet = useMemo(() => generateSrcSet(src), [src]);
  const webpSrc = useMemo(() => (supportsWebP ? getWebPUrl(src) : null), [src]);

  return (
    <picture>
      {webpSrc && <source type="image/webp" srcSet={webpSrc} />}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        srcSet={srcSet || undefined}
        className={className}
      />
    </picture>
  );
}
