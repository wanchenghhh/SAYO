# 初入职场沟通伙伴 · 本地版本 v1.2.0

网页默认使用服务端配置的 `gpt-6-luna`，打开后右上角显示连接状态。用户可以停用默认配置，选择 OpenAI / GPT-6 Luna、DeepSeek 或其他兼容服务并临时填写自己的 Key；Key 只保存在当前浏览器会话，不会写入产品配置。保留原有温暖风格和「任务冲突」「要求不明确」两个场景。

## 本地使用

需要 Node.js 22 或更新版本，无需安装依赖。在此目录运行：

```sh
npm run configure
npm run dev
```

`configure` 在本机终端接收密钥，输入不显示，写入仅当前用户可读写的 `.env`。也可以直接编辑 `.env` 的 `AI_API_KEY=`。不要把密钥发到聊天中。

打开 http://127.0.0.1:8765 。本地服务会在每次请求时读取 `.env`，保存配置后无需重启。启动网站不代表密钥、网络或模型权限已验证；本次按要求没有运行测试或调用真实模型。

## 服务端配置

```dotenv
AI_API_KEY=
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-6-luna
PORT=8765
HOST=127.0.0.1
```

默认使用 OpenAI 兼容接口的 GPT-6 Luna。默认密钥必须在部署平台服务端环境变量中配置，网页不会显示或读取它。用户可以在「连接 AI」中停用默认配置，选择 OpenAI / GPT-6 Luna、DeepSeek 或其他兼容服务，填写自己的 Key、服务地址和模型；测试通过后仅在当前浏览器会话使用。

GPT-6 使用 Chat Completions、JSON 输出及 `max_completion_tokens`；Luna 设为 `reasoning_effort: none`，用于当前简短的沟通准备请求。模型说明：https://api-docs.deepseek.com/api/create-chat-completion/ 。

## 功能与人工验收

1. 打开首页，右上角显示「AI 已连接」和「使用指引」。点击「AI 已连接」可查看默认 GPT-6 Luna，也可停用默认配置并切换为自己的 Key。
2. 选「任务冲突」，填入示例，点击「陪我理清一下」。确认已有任务、新增任务、时间影响和优先级请求，修改一个字段后生成表达。
3. 切换自然/简洁语气，开始与直属领导对练，回应两次，查看反馈引用、再练一次和最终提纲。
4. 复制、下载、保存提纲，从「我的准备」回看和删除。
5. 新建准备，选「要求不明确」，填入示例。确认原话、背景、交付物/范围/时间等问题，取消一个问题后继续生成、对练和反馈。
6. 刷新页面，草稿应恢复。记录保存在当前浏览器，换域名或换设备不会自动迁移。

未配置密钥时，AI 操作提示「AI 服务尚未就绪，请联系产品管理员」，输入会保留。服务故障同样保留输入并支持重试，没有模拟回复替代真实模型。

## 文件与发布

- `public/`：网页与交互，不包含密钥或服务端模型配置。
- `server/ai.js`：双场景提示词、输出校验和服务端模型调用。
- `server/worker.js`：同源 API 路由，按当前会话 Key 或服务端默认配置调用模型。
- `.github/workflows/pages.yml`：将 `public/` 发布到 GitHub Pages，用于静态演示；GitHub Pages 不运行 `/api/ai` 服务端函数。
- `scripts/dev.mjs`：本地服务，只提供 public 中的指定资源，不提供 `.env`。
- `.env`：本机私密配置，已被 Git 忽略，禁止随源码上传。
- `.env.example`：配置示例，不含真实密钥。

Vercel 生产网址：https://workplace-communication-partner.vercel.app 。发布时在目标平台配置服务端 `AI_API_KEY`（Secret）、`AI_BASE_URL` 和 `AI_MODEL`，不上传本机 `.env`。发布进度与验收见 `VERCEL_DEPLOY.md`；原 Sites 网站独立管理。现有 `build` 仍用于生成 Sites Worker 文件，不能把它当作浏览器静态资源公开。

`tests/` 是源码包原有测试材料，本次没有修改或运行。旧版可由本目录上一级的原始压缩包恢复；不要将该压缩包覆盖回当前工作文件。
