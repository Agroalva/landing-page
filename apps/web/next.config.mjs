import path from "node:path"
import { fileURLToPath } from "node:url"

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true,
  },
  turbopack: {
    root: path.resolve(currentDirectory, "../.."),
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
