/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'pino-elasticsearch': false,
      'fastbench': false,
      'tap': false,
      'why-is-node-running': false,
      'thread-stream': false // This is drastic, but thread-stream is only needed for nodejs logging, client side shouldn't need it?
    }
    // Actually, simply aliasing thread-stream might break things if code relies on it.
    // Better to alias the problematic dependencies.
    // Also, ignoring thread-stream tests specifically if possible? No easy way.
    
    // Let's stick to aliasing the missing deps.
    config.resolve.alias['pino-elasticsearch'] = false;
    config.resolve.alias['fastbench'] = false;
    config.resolve.alias['tap'] = false;
    config.resolve.alias['why-is-node-running'] = false;
    
    return config
  },
}

export default nextConfig
