const isGithub = process.env.GITHUB_ACTIONS === "true"
const isDevelopment = process.env.NODE_ENV !== "production"
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ""
const isHttpsProduction = !isDevelopment && siteUrl.startsWith("https://")
const firebaseHelperDomain = process.env.NEXT_PUBLIC_FIREBASE_HELPER_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ""

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isDevelopment ? "'unsafe-eval'" : ""} https://www.gstatic.com https://apis.google.com https://accounts.google.com https://*.google.com https://checkout.razorpay.com https://cdn.razorpay.com`.trim(),
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.googleapis.com https://*.gstatic.com https://*.firebaseio.com https://*.supabase.co wss://*.supabase.co https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://api.razorpay.com https://checkout.razorpay.com https://cdn.razorpay.com https://lumberjack.razorpay.com",
  "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com https://checkout.razorpay.com https://api.razorpay.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
].join("; ")

const securityHeaders = [
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), browsing-topics=(), payment=(self)" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
  ...(isHttpsProduction ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }] : []),
]

const nextConfig = {
  ...(isGithub && {
    output: "export",
    basePath: "/Mera-Dukan-Mera-Godam",
  }),
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  images: {
    unoptimized: isGithub,
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [360, 414, 640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|ico|js|css|woff2)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ]
  },
  async rewrites() {
    if (!firebaseHelperDomain) {
      return []
    }

    return [
      {
        source: "/__/auth/:path*",
        destination: `https://${firebaseHelperDomain}/__/auth/:path*`,
      },
      {
        source: "/__/firebase/init.json",
        destination: `https://${firebaseHelperDomain}/__/firebase/init.json`,
      },
    ]
  },
}

export default nextConfig
