/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['esbuild'],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/feed',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
