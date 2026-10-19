/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@inclu/shared', '@inclu/content'],
  reactStrictMode: true,
};

module.exports = nextConfig;
