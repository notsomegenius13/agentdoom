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
      {
        source: '/marketplace',
        destination: '/feed',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
