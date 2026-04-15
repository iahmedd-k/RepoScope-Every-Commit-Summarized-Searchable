/** @type {import('next').NextConfig} */
const nextConfig = {
  // allow remote images from GitHub avatars (used in dashboard repo metadata)
  images: {
    domains: ["avatars.githubusercontent.com"],
  },
};

export default nextConfig;
