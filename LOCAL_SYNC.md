# 本地多端同步方案

最终选择：GitHub Gist 私有同步。

这个方案不要求发布公网网页，也不要求你自己搭服务器。Windows、Mac、iPhone 只要能运行这个前端页面，并能访问 GitHub API，就可以通过同一个私有 Gist 同步项目和翻译记录。

## 为什么不用 OneDrive / 坚果云作为第一版

OneDrive 技术上可行，但浏览器端需要 Microsoft OAuth、应用注册、回调地址配置。对你自己或普通用户来说，第一次配置比想象中麻烦。

坚果云/WebDAV 很适合原生 App 或后端代理，但纯浏览器页面直连 WebDAV 容易被 CORS 限制卡住。要稳定使用通常需要本地代理或云端代理，这又回到了“要搭服务”。

GitHub Gist 的优点是：

- 不需要自建服务器。
- 不需要 OAuth 应用注册。
- 浏览器可以直接请求 GitHub API。
- 一个 token + 一个 Gist ID 就能跨设备同步。
- 同步数据是一个私有 JSON 文件，结构简单，后续可以迁移。

## 使用方式

### 老设备：创建同步文件

1. 打开设置 -> 同步。
2. 勾选“启用项目内容同步”。
3. 同步方式选择“GitHub Gist 私有同步”。
4. GitHub Token 填入一个有 Gist 权限的 token。
5. Gist ID 可以先留空。
6. 点“上传全部”。
7. 上传成功后，Gist ID 会自动填入“Gist ID / 同步服务地址”。
8. 记下这个 Gist ID。

### 新设备：拉取同步

1. 打开同一个本地前端页面。
2. 打开设置 -> 同步。
3. 勾选“启用项目内容同步”。
4. 同步方式选择“GitHub Gist 私有同步”。
5. 填同一个 GitHub Token。
6. 填老设备生成的 Gist ID。
7. 点“拉取同步”。

### 日常使用

推荐打开：

- 打开项目时同步一次
- 新增翻译后上传一次

这样不同设备之间基本能保持最新。

## GitHub Token 权限建议

最省事：创建 classic token，勾选 `gist` 权限。

更安全：创建 fine-grained token，只给 Gists 相关权限。GitHub 权限界面经常变化，如果 fine-grained 配置不顺，先用 classic token 验证功能。

Token 只保存在当前浏览器本地，不会写进同步文件。

## 同步文件内容

程序会在私有 Gist 里保存一个文件：

```text
dialogue-translator-sync.json
```

里面只包含：

- 项目名称
- 语言设置
- 原文
- 译文
- 时间戳
- 置顶/归档状态

不会包含模型 API Key。

## 冲突策略

同步按项目 ID 和消息 ID 合并。

- 本地没有的远端消息会拉下来。
- 同 ID 消息按更新时间保留较新的版本。
- 上传前会先读取远端，再合并，再写回，尽量避免覆盖另一个设备的新内容。

## iPhone 方案

短期：

- iPhone 通过 Safari 打开这个前端页面。
- 设置 GitHub Token + Gist ID。
- 使用“拉取同步 / 上传全部”。

如果不想把网页发布到公网，iPhone 最简单的访问方式是让 Mac/Windows 在局域网运行静态服务：

```bash
python -m http.server 8765 --bind 0.0.0.0
```

然后 iPhone 访问：

```text
http://电脑局域网IP:8765/
```

注意：局域网 HTTP 页面可以用，但 iPhone 上完整 PWA 离线能力通常需要 HTTPS。

中期：

把这个前端封装成 Capacitor iOS App。这样不需要公网网页，iPhone 上就是一个本地 App，仍然通过 GitHub Gist 同步数据。