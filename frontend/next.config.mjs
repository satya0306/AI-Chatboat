/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/chatbot',
        destination: 'http://127.0.0.1:8000/api/chatbot', // Proxy to Backend
      },
    ];
  },
};

export default nextConfig;
