# 手机独立使用部署方案

目标：没有电脑在身边时，iPhone 也能直接使用像素企鹅。

推荐方案：把这个项目作为静态网页部署到 Cloudflare Pages，然后在 iPhone Safari 中添加到主屏幕。对话内容继续使用 GitHub Gist 私有同步。

这个方案不需要你自己的服务器，也不需要电脑一直开着。

## 为什么不用局域网方案

局域网方案需要电脑开着，并且手机和电脑在同一个 Wi-Fi。它只能用于开发预览，不适合你真正出门使用。

## 推荐架构

```text
 iPhone Safari / 主屏幕 Web App
          |
          | HTTPS
          v
 Cloudflare Pages 静态网页
          |
          | GitHub API
          v
 GitHub Gist 私有同步
          |
          | 模型 API
          v
 Qwen / DeepSeek / Gemini / OpenAI
```

## 第一次部署到 Cloudflare Pages

1. 打开 Cloudflare：
   https://dash.cloudflare.com/

2. 注册或登录账号。

3. 进入左侧 `Workers & Pages`。

4. 点击 `Create application`。

5. 选择 `Pages`。

6. 最简单的方式：选择 `Upload assets` / `Direct Upload`。

7. 上传项目文件夹里的这些文件：

```text
index.html
styles.css
app.js
manifest.webmanifest
service-worker.js
icon.svg
_headers
```

不要上传 `对话记录` 文件夹，不要上传你的 API Key，不要上传任何私人测试记录。

8. 项目名可以填：

```text
dialogue-translator
```

9. 部署完成后，Cloudflare 会给你一个地址，类似：

```text
https://dialogue-translator.pages.dev
```

这个地址就是 iPhone 没电脑时使用的正式入口。

## 后续更新网页

每次我修改完代码后，你重新进入这个 Cloudflare Pages 项目，上传同一批静态文件即可。

后面如果你愿意接 GitHub 仓库，可以改成自动部署：代码推到 GitHub 后 Cloudflare 自动更新网页。但第一版不需要折腾这个。

## iPhone 添加到主屏幕

1. 用 iPhone Safari 打开 Cloudflare Pages 给你的 HTTPS 地址。
2. 点 Safari 底部分享按钮。
3. 选择 `添加到主屏幕`。
4. 如果有 `Open as Web App`，打开它。
5. 名称填 `像素企鹅`。
6. 点添加。

以后你就可以像打开 App 一样打开它。

## 在 iPhone 上恢复同步

1. 打开主屏幕上的 `像素企鹅`。
2. 进入 `设置`。
3. 进入 `同步`。
4. 同步方式选择 `GitHub Gist 私有同步`。
5. 填入 GitHub Token。
6. 填入 Gist ID。
7. 点击 `拉取同步`。

## API Key 怎么处理

API Key 会保存在当前设备浏览器本地。也就是说：

- Windows Edge 里保存的 Key 不会自动出现在 iPhone。
- iPhone 第一次使用时，需要在设置里重新填一次 API Key。
- 对话内容可以通过 Gist 同步。
- API Key 不建议同步进 Gist，因为那会增加泄漏风险。

## 注意事项

1. Cloudflare Pages 必须是 HTTPS，iPhone 主屏幕体验才比较完整。
2. 如果页面更新后 iPhone 还看到旧版本，先关闭主屏幕 App，再用 Safari 打开网页刷新一次。
3. 如果仍然旧，Safari 设置里清理该站点数据，或等 service worker 缓存自动更新。
4. 本项目是前端直连模型 API，方便但安全性不如后端代理。你自己使用没问题；如果给别人公开使用，不要把你的 API Key 写进代码。

## 以后真正封装成 iOS App

如果你要上架或完全像原生 App：

1. 使用 Capacitor 把当前网页封装成 iOS App。
2. 需要一台 Mac。
3. 需要 Xcode。
4. 真机安装需要 Apple ID，长期分发需要 Apple Developer Program。

这条路更像正式产品，但比 Cloudflare Pages 麻烦。现在最适合先用 Cloudflare Pages 跑起来。