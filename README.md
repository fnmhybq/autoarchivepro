# 文件自动分类系统

一个基于Next.js和Ant Design构建的智能文件分类归档工具，支持根据文件名中的关键信息自动创建多级文件夹结构。

## 功能特点

- 🚀 **拖拽上传**: 支持批量文件拖拽上传
- 🔍 **智能校验**: 自动校验文件名分隔符格式
- 📁 **多级分类**: 支持一级和二级文件夹自动分类
- 📦 **一键打包**: 自动生成ZIP压缩包下载
- 🎨 **现代UI**: 基于Ant Design的美观界面
- 💻 **跨平台**: 支持Mac和Windows系统
- 📊 **数据分析**: 集成Google Analytics 4，跟踪用户行为

## 使用说明

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 使用步骤

1. **上传文件**: 在浏览器中打开 `http://localhost:3000`，输入文件名分隔符（如 `_`），然后拖拽或选择文件上传

2. **校验格式**: 系统会自动检查所有文件的分隔符数量是否一致

3. **一级分类**: 选择用于一级分类的字段索引（从0开始计数）

4. **二级分类**: 选择用于二级分类的字段索引

5. **预览下载**: 查看分类结果并下载ZIP压缩包

### 4. 文件命名示例

假设您有以下文件：
```
1_code1_信息1_a科技有限公司.pdf
2_code1_信息2_b科技有限公司.pdf
3_code2_信息3_c科技有限公司.pdf
4_code3_信息4_d科技有限公司.pdf
```

- 分隔符: `_`
- 一级分类选择索引1: 将按 `code1`, `code2`, `code3` 分类
- 二级分类选择索引3: 将在每个一级文件夹下按公司名称分类

最终结构：
```
code1/
  ├── a科技有限公司/
  │   └── 1_code1_信息1_a科技有限公司.pdf
  └── b科技有限公司/
      └── 2_code1_信息2_b科技有限公司.pdf
code2/
  └── c科技有限公司/
      └── 3_code2_信息3_c科技有限公司.pdf
code3/
  └── d科技有限公司/
      └── 4_code3_信息4_d科技有限公司.pdf
```

## 技术栈

- **前端框架**: Next.js 14
- **UI组件库**: Ant Design 5
- **文件处理**: JSZip, File-saver
- **开发语言**: TypeScript
- **样式**: CSS Modules
- **数据分析**: Google Analytics 4 (G-PV02XVCEF1)

## 项目结构

```
autoarchive/
├── app/
│   ├── globals.css          # 全局样式
│   ├── layout.tsx          # 根布局组件（含GA4代码）
│   └── page.tsx            # 主页面组件
├── lib/
│   ├── analytics.ts        # Google Analytics事件跟踪
│   └── gtag.js            # GA4配置
├── 示例文件/               # 测试用示例文件
├── package.json            # 项目依赖配置
├── next.config.js          # Next.js配置
├── tsconfig.json           # TypeScript配置
└── README.md              # 项目说明文档
```

## 构建生产版本

```bash
npm run build
npm start
```

## 浏览器兼容性

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Google Analytics 集成

本系统已集成Google Analytics 4 (GA4)，跟踪ID: `G-PV02XVCEF1`

### 跟踪的事件

- **文件上传**: 记录用户上传的文件数量
- **文件分类**: 记录分类字段选择和分类结果
- **文件下载**: 记录下载的文件数量
- **错误跟踪**: 记录系统错误和用户操作错误

### 隐私说明

- 系统仅收集匿名使用数据
- 不收集个人身份信息
- 数据用于改进产品功能

## 注意事项

1. 确保所有文件使用相同的分隔符格式
2. 文件大小建议控制在100MB以内
3. 分类字段索引从0开始计数
4. 系统会自动处理文件名中的特殊字符
5. 系统已集成Google Analytics进行使用数据分析

## 许可证

MIT License
