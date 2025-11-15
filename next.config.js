/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // 如果部署到 GitHub Pages，需要设置 basePath 为仓库名
  // 如果部署到 Vercel 或其他根域名，设置为空字符串 ''
  basePath: process.env.BASE_PATH || (process.env.NODE_ENV === 'production' ? '/autoarchivepro' : ''),
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig