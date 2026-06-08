import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // Disables it while you are coding so it doesn't cache your mistakes
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // any other Next.js config you already had goes here
};

export default withPWA(nextConfig);