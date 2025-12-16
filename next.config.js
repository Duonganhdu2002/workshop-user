/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Allow all HTTPS images from any domain
      {
        protocol: 'https',
        hostname: '**',
      },
      // Allow all HTTP images from any domain (if needed)
      {
        protocol: 'http',
        hostname: '**',
      }
    ],
    // Specific domains for optimization (optional)
    domains: [
      'images.unsplash.com', 
      'source.unsplash.com', 
      'commondatastorage.googleapis.com',
      // TikTok domains
      'p16-oec-va.ibyteing.com',
      'p16-oec-va.ibyteimg.com',
      'p16-sign-va.ibyteing.com',
      'p16-sign-va.ibyteimg.com',
      'p16-va.ibyteing.com',
      'p16-va.ibyteimg.com',
      // Vietnamese e-commerce
      'cf.shopee.vn',
      'down-vn.img.susercontent.com',
      'salt.tikicdn.com',
      'media3.scdn.vn',
      // Global domains
      'cdn.shopify.com',
      'images.pexels.com',
      'pixabay.com',
      'burst.shopifycdn.com'
    ],
    // Disable image optimization for external images to avoid errors
    unoptimized: false,
    // Allow dangerous protocols if needed
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

module.exports = nextConfig; 