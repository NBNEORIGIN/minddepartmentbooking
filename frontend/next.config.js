/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8001/api';
    // Ensure the destination has a protocol
    const destination = apiBase.startsWith('http') ? apiBase : `https://${apiBase}`;
    return [
      {
        source: '/api/:path*',
        destination: `${destination}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
