/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // 如果部署到 GitHub Pages，需要设置 basePath 为仓库名
  // 如果部署到 Vercel 或其他根域名，设置为空字符串 ''
  basePath: process.env.BASE_PATH || '',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // 添加缓存控制，确保浏览器获取最新版本
  generateBuildId: async () => {
    return `build-${Date.now()}`
  }
}

module.exports = nextConfig