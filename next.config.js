/** @type {import("next").NextConfig} */
module.exports = {
  reactStrictMode: true,
  webpack: (config) => {
    // Transformers.js: browser only, skip node-only deps
    config.resolve.alias = { ...config.resolve.alias, sharp$: false, "onnxruntime-node$": false };
    return config;
  },
  async headers() {
    const h = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];
    return [{ source: "/essentia/:path*", headers: h }, { source: "/lame/:path*", headers: h }];
  },
};
