/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['esbuild'],
  },
};

module.exports = nextConfig;
