# Raycast Relay (Docker Edition)

Raycast Relay 是一个 OpenAI 兼容接口代理，将 Raycast AI 能力暴露为标准 `v1` API。

本仓库已改造为 **Docker 优先部署**：
- 本地可直接用 Docker 运行
- 推送到 GitHub 后，可由 GitHub Actions 自动构建并推送镜像到 Docker Hub

---

## 功能概览

- OpenAI 兼容接口：`/v1/chat/completions`、`/v1/models`
- 支持流式与非流式响应
- 支持图像输入（通过 Raycast 文件上传链路）
- 支持远程工具转发（如 `web_search`、`nano_banana`）
- 支持 `model:effort` 形式的推理强度简写
- 健康检查：`/health`

---

## 环境变量

运行容器时可用以下变量：

- `RAYCAST_TOKEN`（可选，但建议）
  - 用于访问 Raycast Advanced AI 模型
- `IMAGE_TOKEN`（可选）
  - 图像上传使用，不一定需要高级订阅
- `API_KEY`（可选）
  - 若设置，则访问 `/v1/chat/completions` 必须带：`Authorization: Bearer <API_KEY>`
- `DEVICE_ID`（可选）
  - 64 位十六进制设备 ID；不设置会自动生成并轮转
- `SIG_SECRET`（可选）
  - Raycast 签名密钥覆盖值
- `DEBUG`（可选）
  - `1` 或 `true` 开启调试日志
- `PORT`（可选）
  - 服务监听端口，默认 `3000`

---

## 使用方式

### 1) 直接使用 Docker Hub 镜像

> 将 `justincnn` 替换成你的 Docker Hub 用户名（如果你 fork 后自行发布）

```bash
docker run -d \
  --name raycast-relay \
  -p 3000:3000 \
  -e API_KEY=your_api_key \
  -e RAYCAST_TOKEN=your_raycast_token \
  -e IMAGE_TOKEN=your_image_token \
  justincnn/raycast-relay:latest
```

### 2) 本地构建镜像并运行

```bash
docker build -t raycast-relay:local .

docker run --rm -p 3000:3000 \
  -e API_KEY=your_api_key \
  -e RAYCAST_TOKEN=your_raycast_token \
  -e IMAGE_TOKEN=your_image_token \
  raycast-relay:local
```

---

## API 调用示例

基地址：

```text
http://localhost:3000/v1
```

### Chat Completions

```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_api_key" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello from Raycast Relay"}]
  }'
```

### Models

```bash
curl http://localhost:3000/v1/models
```

### Health

```bash
curl http://localhost:3000/health
```

---

## GitHub Actions 自动发布到 Docker Hub

仓库已包含工作流：

- `.github/workflows/docker-publish.yml`

触发条件：

- push 到 `main`
- 手动触发（`workflow_dispatch`）

### 你需要在 GitHub 仓库中配置 Secrets

进入 GitHub 仓库 -> `Settings` -> `Secrets and variables` -> `Actions`，添加：

- `DOCKERHUB_USERNAME`：Docker Hub 用户名
- `DOCKERHUB_TOKEN`：Docker Hub Access Token（不是密码）

### 发布标签策略

工作流会自动推送以下标签：

- `latest`
- `sha-<short>`（提交短哈希）
- 分支名标签（如 `main`）

---

## 本地开发（非 Docker）

```bash
npm install
npm run start:docker
```

服务默认监听 `0.0.0.0:3000`。

---

## 注意事项

- 本项目仍保留 Cloudflare Worker 相关代码与配置文件，Docker 版本通过 Node HTTP 入口复用同一业务逻辑。
- 若未设置 `API_KEY`，任何人都可访问聊天接口，请务必在公网环境设置。

---

## License

MIT. See `LICENSE`.
