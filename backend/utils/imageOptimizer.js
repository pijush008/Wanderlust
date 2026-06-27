/**
 * ================= IMAGE OPTIMIZATION PIPELINE =================
 * 
 * Leverages Cloudinary's CDN + transformation API for:
 *   1. WebP/AVIF auto-format conversion (30-50% smaller)
 *   2. Responsive image srcset generation
 *   3. Quality-based compression (auto quality)
 *   4. Blur-up placeholder generation (tiny base64 preview)
 *   5. Lazy loading with Intersection Observer
 *   6. CDN delivery with cache headers
 * 
 * Cloudinary URL Transformation Syntax:
 *   https://res.cloudinary.com/{cloud}/image/upload/{transformations}/{path}
 * 
 * Key transformations used:
 *   f_auto    → Auto-format (WebP for Chrome, AVIF for supported, JPEG fallback)
 *   q_auto    → Auto quality (Cloudinary AI picks optimal compression)
 *   w_XXX     → Width resize
 *   c_fill    → Crop to fill (maintains aspect ratio)
 *   e_blur:XX → Blur effect for placeholders
 *   dpr_auto  → Device pixel ratio aware
 */

// ================= RESPONSIVE BREAKPOINTS =================
const BREAKPOINTS = {
  thumbnail: { width: 300, height: 200 },
  card: { width: 600, height: 400 },
  medium: { width: 800, height: 600 },
  large: { width: 1200, height: 800 },
  full: { width: 1600, height: 1067 },
};

// ================= QUALITY PRESETS =================
const QUALITY = {
  placeholder: 10,   // Tiny blur-up preview
  low: 40,           // Fast loading, lower quality
  medium: 60,        // Balanced
  high: 80,          // High quality
  auto: "auto",      // Let Cloudinary decide (recommended)
};

// ================= CORE: Transform Cloudinary URL =================

/**
 * Apply transformations to a Cloudinary image URL
 * 
 * @param {String} originalUrl - Original Cloudinary URL
 * @param {Object} options - Transformation options
 * @returns {String} Transformed URL
 */
function transformUrl(originalUrl, options = {}) {
  if (!originalUrl || !isCloudinaryUrl(originalUrl)) {
    return originalUrl; // Return as-is for non-Cloudinary URLs
  }

  const {
    width,
    height,
    quality = "auto",
    format = "auto",
    crop = "fill",
    gravity = "auto",
    blur,
    dpr,
  } = options;

  // Build transformation string
  const transforms = [];

  if (format) transforms.push(`f_${format}`);
  if (quality) transforms.push(`q_${quality}`);
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (crop) transforms.push(`c_${crop}`);
  if (gravity) transforms.push(`g_${gravity}`);
  if (blur) transforms.push(`e_blur:${blur}`);
  if (dpr) transforms.push(`dpr_${dpr}`);

  const transformStr = transforms.join(",");

  // Insert transformations into URL
  // Cloudinary URL format: .../image/upload/[transforms]/folder/filename
  return originalUrl.replace("/image/upload/", `/image/upload/${transformStr}/`);
}

/**
 * Check if URL is a Cloudinary URL
 */
function isCloudinaryUrl(url) {
  return url && (url.includes("res.cloudinary.com") || url.includes("cloudinary"));
}

// ================= RESPONSIVE IMAGE SET =================

/**
 * Generate srcset for responsive images
 * Returns multiple sizes for browser to choose from
 * 
 * @param {String} url - Original image URL
 * @returns {Object} { srcset, sizes, src, placeholder }
 */
function generateResponsiveSet(url) {
  if (!url) return { src: "", srcset: "", sizes: "", placeholder: "" };

  // For non-Cloudinary URLs, use picsum/external as-is
  if (!isCloudinaryUrl(url)) {
    return {
      src: url,
      srcset: "",
      sizes: "",
      placeholder: url,
    };
  }

  const widths = [300, 600, 800, 1200, 1600];

  const srcset = widths
    .map((w) => {
      const transformed = transformUrl(url, {
        width: w,
        quality: "auto",
        format: "auto",
        crop: "fill",
      });
      return `${transformed} ${w}w`;
    })
    .join(", ");

  const sizes = [
    "(max-width: 576px) 100vw",
    "(max-width: 768px) 50vw",
    "(max-width: 992px) 33vw",
    "25vw",
  ].join(", ");

  // Default src (medium size)
  const src = transformUrl(url, {
    width: 800,
    quality: "auto",
    format: "auto",
    crop: "fill",
  });

  // Blur-up placeholder (tiny, heavily compressed, blurred)
  const placeholder = transformUrl(url, {
    width: 30,
    quality: 10,
    format: "auto",
    blur: 1000,
    crop: "fill",
  });

  return { src, srcset, sizes, placeholder };
}

// ================= SPECIFIC SIZE GENERATORS =================

/**
 * Get optimized card image (for listing cards on index page)
 */
function getCardImage(url) {
  if (!isCloudinaryUrl(url)) return { src: url, placeholder: url };

  return {
    src: transformUrl(url, {
      width: BREAKPOINTS.card.width,
      height: BREAKPOINTS.card.height,
      quality: "auto",
      format: "auto",
      crop: "fill",
      gravity: "auto",
    }),
    placeholder: transformUrl(url, {
      width: 30,
      height: 20,
      quality: 10,
      format: "auto",
      blur: 1000,
      crop: "fill",
    }),
  };
}

/**
 * Get optimized show page image (larger, higher quality)
 */
function getShowImage(url) {
  if (!isCloudinaryUrl(url)) return { src: url, placeholder: url, srcset: "", sizes: "" };

  const src = transformUrl(url, {
    width: BREAKPOINTS.large.width,
    quality: "auto",
    format: "auto",
    crop: "fill",
  });

  const placeholder = transformUrl(url, {
    width: 40,
    quality: 10,
    format: "auto",
    blur: 1000,
    crop: "fill",
  });

  const srcset = [600, 800, 1200, 1600]
    .map((w) => `${transformUrl(url, { width: w, quality: "auto", format: "auto", crop: "fill" })} ${w}w`)
    .join(", ");

  const sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px";

  return { src, placeholder, srcset, sizes };
}

/**
 * Get thumbnail (for booking cards, small previews)
 */
function getThumbnail(url) {
  if (!isCloudinaryUrl(url)) return url;

  return transformUrl(url, {
    width: BREAKPOINTS.thumbnail.width,
    height: BREAKPOINTS.thumbnail.height,
    quality: "auto",
    format: "auto",
    crop: "fill",
    gravity: "auto",
  });
}

// ================= UPLOAD OPTIMIZATION =================

/**
 * Get optimized Cloudinary upload params
 * Applied during multer upload to Cloudinary
 */
function getUploadTransformations() {
  return {
    // Store original but also create eager transformations
    eager: [
      // Card size
      { width: 600, height: 400, crop: "fill", quality: "auto", format: "auto" },
      // Show page size
      { width: 1200, height: 800, crop: "fill", quality: "auto", format: "auto" },
      // Thumbnail
      { width: 300, height: 200, crop: "fill", quality: "auto", format: "auto" },
    ],
    eager_async: true, // Don't block upload for eager transforms
  };
}

// ================= EXPORTS =================
module.exports = {
  transformUrl,
  isCloudinaryUrl,
  generateResponsiveSet,
  getCardImage,
  getShowImage,
  getThumbnail,
  getUploadTransformations,
  BREAKPOINTS,
  QUALITY,
};
