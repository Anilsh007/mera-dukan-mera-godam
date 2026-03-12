const isGithub = process.env.GITHUB_ACTIONS === 'true';

const nextConfig = {
  ...(isGithub && {
    output: "export",
    basePath: "/Mera-Dukan-Mera-Godam",
  }),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;