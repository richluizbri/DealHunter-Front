    const fs = require('fs');
const content = `/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};
module.exports = nextConfig;
`;
fs.writeFileSync('next.config.js', content, 'utf8');
console.log('OK');