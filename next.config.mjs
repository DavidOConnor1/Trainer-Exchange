// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["images.pokemontcg.io"], // Image Domains
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.tcgdex.net",
        port: "",
        pathname: "/**",
      },
    ],
    // Image optimization settings
    deviceSizes: [640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // Redirects if needed
  async redirects() {
    return [];
  },
};

export default nextConfig;
