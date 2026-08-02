# 泊书 · 私人电子书架

把仓库里的 PDF、EPUB、TXT 和 Markdown 自动整理成可在浏览器阅读的私人数字书架。项目是纯静态 React 应用，不需要后端、数据库或付费服务，适合部署到 GitHub Pages。

## 功能

- 构建时递归扫描书库，自动生成分类树和 `public/catalog.json`
- 即时搜索书名、文件名、分类、格式和标签，并支持格式/最近阅读筛选
- PDF：分页、页码跳转、缩放、适应宽度、全屏、全文搜索
- EPUB：章节目录、前后翻章、字号与主题、全书搜索、CFI 位置恢复
- TXT：UTF-8、UTF-16、GB18030 解码、排版设置、文本搜索、滚动恢复
- Markdown：标题目录、表格、引用、列表、代码、图片、搜索和滚动恢复
- 最近阅读、继续阅读、单书/全部进度清理
- 浅色、深色、跟随系统，以及纸白、护眼、夜读阅读背景
- 响应式书架、移动端分类抽屉和触摸友好的阅读工具栏
- 可选前端访问密码，支持登录有效期与退出
- Hash Router 和统一资源 URL，兼容中文、空格与 GitHub Pages 子路径

## 本地运行

要求 Node.js 22 或更高版本。推荐使用仓库锁定的 pnpm：

```bash
corepack enable
pnpm install
pnpm dev
```

也可以使用：

```bash
npm install
npm run dev
```

开发服务器会直接从现有根级分类目录读取书籍，不会移动或复制原文件。

## 构建

```bash
pnpm build
```

构建会依次读取 Pages 排除配置、生成目录、打包前端，并把保留的电子书与封面复制到 `dist/books/`。静态产物位于 `dist/`；若最终站点仍超过 1 GB，构建会失败并提示继续调整配置。

如果需要模拟仓库子路径：

```bash
VITE_BASE_PATH=/ebooks-library/ pnpm build
```

Windows PowerShell：

```powershell
$env:VITE_BASE_PATH='/ebooks-library/'
pnpm build
```

### Pages 排除配置

[`pages-exclude.json`](pages-exclude.json) 是相对于逻辑书库根目录的字符串数组，支持目录和单个文件：

```json
[
  "轻小说/Re0",
  "轻小说/SAO",
  "轻小说/Fate/Fate-Prototype 苍银的碎片 04 Dear My Hero.epub"
]
```

- 目录会连同全部后代一起排除。
- 文件规则只排除完全匹配的文件。
- 可使用 `/` 或 `\\`，但不能使用绝对路径或 `..`。
- 规则同时作用于 Pages 书目、封面生成和静态文件复制，不会产生无法打开的书籍卡片。
- `pnpm dev` 不应用该配置，仍展示完整本地书库；`pnpm build` 和 GitHub Actions 才应用。

当前默认规则排除 66 本书，使生产书目保留 365 本。修改数组后重新运行 `pnpm build` 即可看到实际站点大小。

## 添加和整理书籍

项目优先扫描标准的 `books/` 目录；为了兼容本仓库，若 `books/` 不存在，也会把根目录下非应用文件夹视作一级分类。

```text
科幻/
└── 银河帝国/
    └── 基地.epub
```

支持 `.pdf`、`.epub`、`.txt`、`.md`、`.markdown`。新增、删除或移动文件后，运行 `pnpm generate:catalog`；开发和构建命令也会自动执行扫描。

隐藏文件、应用目录、封面图片和元数据文件不会被当作书籍。

## 封面与元数据

封面查找顺序为同名图片、目录中的 `cover` 图片、EPUB 内置封面、PDF 首页缩略图、格式默认书脊。支持 JPG、JPEG、PNG、WebP：

```text
基地.epub
基地.jpg
```

可选元数据文件与书籍同名：

```json
{
  "title": "基地",
  "author": "艾萨克·阿西莫夫",
  "description": "银河帝国系列",
  "tags": ["科幻", "太空歌剧"],
  "cover": "基地.jpg"
}
```

文件名为 `基地.meta.json`。损坏的元数据会被忽略并在构建日志中提示。

`pnpm build` 会增量生成内置封面与 PDF 缩略图到被忽略的 `public/generated-covers/`。损坏或无法识别的文件会记录警告并回退到按格式生成的书脊封面。也可单独运行 `pnpm generate:covers`。

## 访问密码

复制 `.env.example` 为 `.env.local`，设置：

```dotenv
ACCESS_PASSWORD=your-password
ACCESS_SESSION_HOURS=168
```

构建配置只把密码的 SHA-256 摘要注入前端。也可以省略明文，直接设置 `ACCESS_PASSWORD_HASH`。GitHub Actions 部署时，在仓库 `Settings → Secrets and variables → Actions` 中添加同名 Secret；有效期可通过变量 `ACCESS_SESSION_HOURS` 设置。

不配置密码或摘要时，访问页自动停用。

> 该密码功能仅用于简单访问限制，无法阻止懂技术的用户获取静态资源地址，也无法真正保护仓库中的电子书。GitHub Pages 发布的网站可被公网访问，即使源仓库是私有仓库也不应把它当作安全存储。

## GitHub Pages 部署

1. 推送到 `main` 分支。
2. 在仓库 `Settings → Pages → Build and deployment` 中选择 `GitHub Actions`。
3. 可选：配置上面的访问密码 Secret。
4. 工作流会自动识别项目 Pages 的 `/<repository>/` 基础路径；用户/组织主页仓库则使用 `/`。
5. 也可以在 Actions 页面手动运行 `Deploy ebook shelf to Pages`。

工作流位于 `.github/workflows/pages.yml`，包含 Git LFS 拉取、目录生成、构建、Pages artifact 上传和部署。

## 阅读记录与设置

所有数据保存在浏览器 `localStorage` 中。更换设备/浏览器、无痕模式结束或清理站点数据后记录会丢失，不支持跨设备同步。

- 单本记录：阅读页右上角菜单 → `清除阅读记录`
- 全部记录：首页右上角设置 → `清除全部记录`
- 退出访问：首页右上角设置 → `退出访问`

## 容量、带宽与已知限制

GitHub 官方说明：已发布的 Pages 站点最大为 1 GB，软带宽限制为每月 100 GB；Pages artifact 的压缩包上限另为 10 GB。请以 [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) 和 [Custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) 的最新说明为准。

本仓库完整书库超过 Pages 限制，因此生产构建默认通过 `pages-exclude.json` 排除部分大目录/文件，并在复制完成后执行 1 GB 硬门禁。若希望发布其他组合，可调整该数组；如果无法通过删减满足限制，应把大文件迁移到允许跨域访问的外部静态存储。Git LFS 本身不等于 Pages 文件托管方案。

其他限制：

- 前端密码、文件地址和内容都无法防下载、防抓取或提供 DRM。
- 阅读进度无法云同步。
- 大型 EPUB 全书搜索与 PDF 全文搜索会按需读取全书，首次搜索可能较慢。
- 大型 TXT 仍需在当前页面加载完整文本；浏览器内存有限时建议拆分文件。
- EPUB/PDF 的复杂排版、损坏文件或浏览器兼容问题可能导致渲染差异，可从阅读页查看或下载原文件。

## 项目结构

```text
scripts/                 目录生成与构建资源复制
pages-exclude.json       Pages 构建排除规则
public/catalog.json      自动生成的书目
src/components/          通用界面组件
src/pages/               书架、阅读器入口、设置页
src/readers/             PDF、EPUB、TXT、Markdown 阅读器
src/services/            目录、认证、设置与进度存储
.github/workflows/       GitHub Pages 自动部署
```

## 验证

```bash
pnpm test
pnpm build
```
