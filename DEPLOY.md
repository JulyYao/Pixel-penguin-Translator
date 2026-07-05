# 部署与同步说明

目标：前端作为静态网页部署，手机浏览器也能使用；同步服务独立部署，用于多端同步翻译项目和对话内容。

## 1. 静态网页部署

可以把项目根目录作为静态站点发布到 Cloudflare Pages、Vercel、Netlify、GitHub Pages 或自己的 Nginx。

需要发布的核心文件：

- `index.html`
- `styles.css`
- `app.js`
- `manifest.webmanifest`
- `service-worker.js`
- `icon.svg`

推荐使用 HTTPS 域名。PWA、Service Worker、移动端主屏幕安装都要求 HTTPS；`localhost` 仅用于本地调试。

## 2. Cloudflare Pages 推荐流程

1. 新建一个 Git 仓库并提交项目文件。
2. 打开 Cloudflare Dashboard -> Workers & Pages -> Create -> Pages。
3. 连接仓库。
4. Build command 留空。
5. Build output directory 填项目根目录，或留空按 Cloudflare 默认静态文件发布。
6. 部署完成后打开 Pages 提供的 HTTPS 地址。

手机上访问这个 HTTPS 地址后：

- Android Chrome/Edge：菜单 -> 添加到主屏幕。
- iPhone Safari：分享 -> 添加到主屏幕。

## 3. 同步服务部署

同步服务在 `sync-worker/worker.js`，适合部署到 Cloudflare Workers + KV。

### 创建 KV

```bash
wrangler kv namespace create DIALOGUE_TRANSLATOR_SYNC
```

把命令返回的 `id` 填入：

```toml
sync-worker/wrangler.toml
```

替换：

```text
REPLACE_WITH_YOUR_KV_NAMESPACE_ID
```

### 设置访问令牌

建议设置一个自己的同步令牌，避免别人读写你的翻译记录：

```bash
cd sync-worker
wrangler secret put SYNC_TOKEN
```

之后在网页设置 -> 同步 -> 访问令牌里填写同一个值。

### 部署 Worker

```bash
cd sync-worker
wrangler deploy
```

部署完成后会得到类似：

```text
https://dialogue-translator-sync.your-name.workers.dev
```

把它填到网页设置 -> 同步 -> 同步服务地址。

## 4. 同步使用方式

- 老设备：设置同步地址和令牌，点“上传全部”。
- 新手机：打开网页，设置同步地址和令牌，点“拉取同步”。
- 日常使用：可以开启“打开项目时同步一次”和“新增翻译后上传一次”。

同步接口：

- `GET /health`
- `GET /projects`
- `POST /projects/sync`
- `POST /projects/sync-all`

## 5. 注意事项

API Key 仍保存在当前浏览器本地，不会被同步服务保存。同步服务只保存项目、语言、翻译原文和译文。

如果发布成公开网页，不要把个人 API Key 写进源码。当前模式是每个设备在本地设置自己的模型 API Key。