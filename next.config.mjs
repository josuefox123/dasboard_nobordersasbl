/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "http://localhost:3000/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;
