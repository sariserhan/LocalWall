export async function createPreviewUrl(file: File, maxDimension = 640, quality = 0.78) {
  if (typeof createImageBitmap !== "function") return URL.createObjectURL(file);
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return URL.createObjectURL(file);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    return blob ? URL.createObjectURL(blob) : URL.createObjectURL(file);
  } finally {
    bitmap.close();
  }
}
