/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['maurodev.it', 'www.maurodev.it', 'app.maurodev.it', 'area.maurodev.it'],
    },
  },
};

module.exports = nextConfig;

