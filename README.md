# SAYO·职言 — 最新源码交接包

本包包含当前本地已提交的最新前后端源码，包含蓝色「下一步」及图标、Enter 发送、Shift+Enter 换行、至少 4 字提示、卡片外下一步，以及 AI 演练按钮状态修复。

## 主要文件
- public/index.html：页面结构
- public/style.css：页面样式
- public/app.js：界面和交互、调用现有 AI 接口
- api/：Vercel API 入口
- server/：后端 AI 调用和校验
- scripts/：本地启动和构建脚本

## 本地运行
1. 安装 Node.js 22 或更新版本（推荐 24）。
2. 解压，在本目录打开终端。
3. 将 .env.example 复制为 .env，在 .env 的 AI_API_KEY 中填写自己的 DeepSeek 官方 Key。不要提交或分享这个文件。
4. 运行 npm run dev。
5. 浏览器打开 http://127.0.0.1:8765 。请通过该地址使用，不要直接双击 index.html。

本项目没有第三方 npm 依赖，本地启动无需安装依赖。

默认服务：https://api.deepseek.com
默认模型：deepseek-flash
包内没有真实 API Key、Vercel Token、Git 登录凭据或用户聊天记录。本地不会自动继承 Vercel 的密钥。

## 团队协作
GitHub：https://github.com/wanchenghhh/SAYO
线上：https://workplace-communication-partner.vercel.app/
推荐从 GitHub 拉取代码并新建分支修改，通过 PR 合并。main 与 Vercel 自动发布关联，合并会触发发布。

本包中的后端保持现有版本；仅改界面时，优先修改 public/ 下的文件。
