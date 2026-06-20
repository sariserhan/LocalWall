import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  allowedDevOrigins: ["127.0.0.1"],
  serverExternalPackages: ["onnxruntime-node", "sharp", "tesseract.js"],
  outputFileTracingIncludes: {
    "/api/moderate": ["./models/image-safety.onnx", "./models/eng.traineddata.gz"],
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
