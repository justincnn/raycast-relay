# Raycast Relay (Docker Edition)

Raycast Relay 是一个 OpenAI 兼容接口代理，将 Raycast AI 能力暴露为标准 `v1` API。

本仓库已改造为 **Docker 优先部署**：
- 本地可直接用 Docker / Docker Compose 运行
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

## 快速开始（推荐：Docker Compose）

### 1) 准备环境变量文件

```bash
cp .env.example .env
```

然后编辑 `.env`，至少设置：

- `API_KEY`
- `RAYCAST_TOKEN`（建议）
- `IMAGE_TOKEN`（如需图像能力）

### 2) 启动服务

```bash
docker compose up -d
```

### 3) 查看日志

```bash
docker compose logs -f
```

### 4) 停止服务

```bash
docker compose down
```

---

## docker-compose.yml 说明

仓库提供：`docker-compose.yml`

默认行为：
- 镜像：`justincnn/raycast-relay:latest`（可用 `DOCKER_IMAGE` 覆盖）
- 映射端口：`3000:3000`（可用 `HOST_PORT` 覆盖）
- 自动读取 `.env` 中的变量
- 启用健康检查（`/health`）

如需改本地监听端口，只改 `.env` 中 `HOST_PORT` 即可，无需改 compose 文件。

---

## 环境变量获取方法（详细）

以下变量模板见：`.env.example`

### 1) API_KEY（强烈建议设置）

用途：
- 保护你的中转服务，避免被未授权调用。

如何生成：
- 使用高强度随机字符串即可。
- 示例命令（macOS/Linux）：

```bash
openssl rand -hex 32
```

把输出填入：

```env
API_KEY=<你的随机字符串>
```

调用 API 时需要带：
`Authorization: Bearer <API_KEY>`。

### 2) RAYCAST_TOKEN（建议设置）

用途：
- 访问 Raycast Advanced AI 模型。

获取方式（常见实践）：
1. 在本机打开 Raycast 并使用 AI 功能。
2. 使用代理抓包工具（如 Charles、Proxyman）或本机 HTTPS 调试方式观察 Raycast 发出的请求。
3. 在请求头中找到 `Authorization: Bearer <token>` 对应 token。
4. 填入 `.env`：

```env
RAYCAST_TOKEN=<你的 token>
```

注意：
- token 属于敏感凭据，不要提交到 Git 仓库，不要公开分享。

### 3) IMAGE_TOKEN（图像能力建议设置）

用途：
- 图像上传链路使用（例如多模态输入、图像相关工具）。

获取方式：
- 与 `RAYCAST_TOKEN` 类似，在 Raycast 图像相关请求中提取对应 Bearer Token。

填写：

```env
IMAGE_TOKEN=<你的 image token>
```

### 4) DEVICE_ID（可选）

用途：
- 固定设备标识；不填则服务自动生成并轮转。

如何生成 64 位十六进制：

```bash
openssl rand -hex 32
```

填写：

```env
DEVICE_ID=<64位hex>
```

### 5) SIG_SECRET（可选）

用途：
- 覆盖默认 Raycast 签名密钥。

一般不需要设置，留空即可：

```env
SIG_SECRET=
```

### 6) DEBUG（可选）

用途：
- 开启调试日志。

填写示例：

```env
DEBUG=true
```

### 7) DOCKER_IMAGE（可选）

用途：
- 指定 Compose 使用的镜像地址。

示例：

```env
DOCKER_IMAGE=justincnn/raycast-relay:latest
```

### 8) HOST_PORT（可选）

用途：
- 指定本机暴露端口。

示例：

```env
HOST_PORT=3000
```

---

## 直接使用 Docker（不通过 Compose）

```bash
docker run -d \
  --name raycast-relay \
  -p 3000:3000 \
  -e API_KEY=your_api_key \
  -e RAYCAST_TOKEN=your_raycast_token \
  -e IMAGE_TOKEN=your_image_token \
  justincnn/raycast-relay:latest
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

### 构建架构

工作流当前仅构建并推送 **Linux ARM64** 镜像：

- `linux/arm64`

### 已配置 Secrets

当前仓库已配置以下 GitHub Actions Secrets：

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

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
- `.env` 文件包含敏感信息，禁止提交到公开仓库。

---

## License

MIT. See `LICENSE`.
