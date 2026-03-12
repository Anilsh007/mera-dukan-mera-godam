/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  output: 'export',
  // Only use the basePath in production (GitHub Pages)
  basePath: isProd ? '/Mera-Dukan-Mera-Godam' : '',
  images: {
    unoptimized: true,
  },
  experimental: {
    turbo: {
      rules: {
        '*.css': {
          loaders: ['postcss-loader'],
          as: 'style',
        },
      },
    },
  },
};

export default nextConfig;
