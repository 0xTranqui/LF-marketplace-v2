/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = {
  images: {
    domains: [
      "via.placeholder.com",
      "ipfs.infura.io",
      "ipfs.io",
      "cryptocoven.s3.amazonaws.com", 
    ],
  },
}
//module.exports = nextConfig
