@echo off
echo 🚀 启动文件自动分类系统...
echo 📦 安装依赖包...
call npm install

echo 🔧 启动开发服务器...
echo 🌐 请在浏览器中打开: http://localhost:3000
echo ⏹️  按 Ctrl+C 停止服务器

call npm run dev
pause
