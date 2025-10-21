# 部署说明

## 静态部署

本项目已配置为静态导出，可以直接部署到任何静态文件托管服务。

### 构建命令

```bash
npm run build
```

构建完成后，静态文件将生成在 `out/` 目录中。

### 部署平台

#### 1. Vercel (推荐)
- 连接GitHub仓库
- 自动检测Next.js项目
- 零配置部署

#### 2. Netlify
- 连接GitHub仓库
- 构建命令: `npm run build`
- 发布目录: `out`

#### 3. GitHub Pages
- 将 `out/` 目录内容推送到 `gh-pages` 分支
- 在仓库设置中启用GitHub Pages

#### 4. 其他静态托管
- 将 `out/` 目录内容上传到任何静态文件服务器
- 确保服务器支持SPA路由

### 本地预览

```bash
# 构建静态文件
npm run build

# 使用任意静态服务器预览
npx serve out
# 或
python -m http.server 3000 -d out
```

### 注意事项

1. 项目使用静态导出，不支持服务端功能
2. 所有路由都是客户端路由
3. 文件上传和下载功能在浏览器中运行
4. Google Analytics正常工作
