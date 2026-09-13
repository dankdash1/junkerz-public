/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // The old WordPress site served every page with a trailing slash.
      // Next.js normalises those itself, so these only cover URLs that
      // changed shape or no longer exist on their own.
      { source: "/index.php", destination: "/", permanent: true },
      { source: "/home", destination: "/", permanent: true },
      { source: "/sell-my-car", destination: "/quote", permanent: true },
      { source: "/get-a-quote", destination: "/quote", permanent: true },
      { source: "/quote-request", destination: "/quote", permanent: true },
      { source: "/cash-for-junk-cars", destination: "/", permanent: true },
      { source: "/wrecked-cars", destination: "/junk-cars", permanent: true },
      { source: "/junk-car-removal", destination: "/not-running", permanent: true },
      { source: "/services", destination: "/junk-cars", permanent: true },
      { source: "/contact", destination: "/contact-us", permanent: true },
      { source: "/about", destination: "/about-us", permanent: true },
      { source: "/privacy", destination: "/privacy-policy", permanent: true },
      // Dead WordPress plumbing — send crawlers home instead of a 404.
      { source: "/feed", destination: "/", permanent: true },
      { source: "/comments/feed", destination: "/", permanent: true },
      { source: "/xmlrpc.php", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
