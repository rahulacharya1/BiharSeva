/**
 * Client-side image compression utility.
 * Compresses images before upload to reduce bandwidth and storage costs.
 * Uses native Canvas API — no external dependencies.
 */

const DEFAULT_OPTIONS = {
  maxWidthOrHeight: 1920,
  maxSizeMB: 1,
  quality: 0.8,
};

/**
 * Compress an image file before upload.
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @param {number} options.maxWidthOrHeight - Max dimension in pixels (default: 1920)
 * @param {number} options.maxSizeMB - Target max size in MB (default: 1)
 * @param {number} options.quality - JPEG quality 0-1 (default: 0.8)
 * @returns {Promise<File>} - Compressed file
 */
export async function compressImage(file, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Skip non-image files or files already small enough
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= opts.maxSizeMB * 1024 * 1024) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let { width, height } = img;

          // Scale down if exceeds max dimension
          if (width > opts.maxWidthOrHeight || height > opts.maxWidthOrHeight) {
            const ratio = Math.min(
              opts.maxWidthOrHeight / width,
              opts.maxWidthOrHeight / height
            );
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file); // fallback to original
                return;
              }
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            "image/jpeg",
            opts.quality
          );
        } catch {
          resolve(file); // fallback on error
        }
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
