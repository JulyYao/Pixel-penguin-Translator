# 像素企鹅 Pixel Penguin

像素企鹅是一个由vibe coding生成的轻量级的双语对话翻译前端工具，将翻译内容以对话方式，并保存到本地或者gist同步。

## 功能

- 按项目管理双语对话
- 自动识别输入语言，并翻译到另一侧语言
- 类聊天软件的左右气泡界面
- 项目置顶、归档、删除和语言编辑
- 消息复制、编辑、删除、置顶
- API Provider 配置，支持 OpenAI 兼容接口
- 千问 / Qwen、DeepSeek、自定义兼容接口等模型配置
- 主 API 与备用 API
- Token 使用量统计
- 可选 GitHub Gist / 自定义服务同步
- PWA 支持，可添加到手机主屏幕
- 本地 Markdown 记录导入/导出
- 移动端适配

## 快速开始

这是纯前端项目，不需要安装依赖。

直接用浏览器打开：

```text
index.html
```

也可以启动一个本地静态服务器：

```bash
python -m http.server 8765
```

然后访问：

```text
http://127.0.0.1:8765
```

## API 设置

首次使用需要在设置里填写你自己的 API 信息：

- Provider
- API Key
- Base URL
- Model

本仓库不包含任何 API Key。请不要把自己的 Key 提交到 GitHub。

千问兼容接口示例：

```text
Base URL: https://dashscope.aliyuncs.com/compatible-mode/v1
Model: qwen-mt-plus 或 qwen-mt-turbo
```

## PWA / 手机使用

部署到 HTTPS 静态站点后，可以在手机浏览器中添加到主屏幕。

PWA 文件包括：

- `manifest.webmanifest`
- `service-worker.js`
- `icon.svg`
- `pixel_penguin_export.png`

## 部署

适合部署到任意静态站点服务：

- GitHub Pages
- Tencent EdgeOne Pages
- Cloudflare Pages
- Netlify
- Vercel Static
- 任意 Nginx / 静态文件服务器

部署时请确保以下文件在站点根目录：

```text
index.html
app.js
styles.css
manifest.webmanifest
service-worker.js
icon.svg
pixel_penguin_export.png
_headers
```

## 同步说明

项目支持内容同步，但同步需要你自己配置：

- GitHub Gist Token
- 或自建同步服务地址

## 安全提醒

这是纯前端应用。API Key 如果直接填在浏览器里，会保存在当前浏览器本地。公共多人使用时，建议搭建自己的后端代理，不要把 Key 暴露给用户。
