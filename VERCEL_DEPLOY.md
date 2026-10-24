# Vercel 发布 · v1.1.0

生产网址：https://workplace-communication-partner.vercel.app

空间：wan-cheng
项目：workplace-communication-partner
项目 ID：prj_Mt5a7HDw8dqZfK8GtraXsDIVfnlL

## 当前变更

- 浏览器不再填写密钥或指定模型。API 只读取服务端配置。
- 默认模型 gpt-6-luna，默认服务 https://api.openai.com/v1。
- api/ai.js 和 api/status.js 将 Vercel 请求交给共用后端，不依赖本机 .env 文件。
- AI_API_KEY 作为生产环境 Secret 单独设置。源码上传忽略 .env、.vercel、本地构建产物和测试材料。
- 生产函数最多执行 90 秒，模型请求 65 秒超时并保留用户输入。
- 保持现有站点访问权限；若出现 Vercel 登录，使用有该项目访问权限的账号。

## 人工验收

1. 打开生产网址并刷新，首页没有「连接 AI」入口。
2. 任务冲突：填入示例、梳理、核对并修改事实、生成表达。
3. 切换语气、与领导对练两轮、看反馈和真实引文，整理提纲。
4. 复制、下载、保存并从「我的准备」回看。
5. 新建要求不明确场景，确认交付物/范围/时间，取消一个问题后完成表达和对练。
6. 刷新恢复草稿；密钥不需要用户重新填写。

本次按要求不运行测试、不调用付费模型作验证；Vercel READY 代表构建和发布完成，真实 AI 效果由用户按上述步骤验收。

发布状态：READY（生产环境）。

版本：v1.1.0
部署 ID：dpl_GDyraAMZWPBsoCdxSQEoDSPUomF9
部署详情：https://vercel.com/wan-cheng/workplace-communication-partner/GDyraAMZWPBsoCdxSQEoDSPUomF9

AI_API_KEY 已写入生产环境 Secret；AI_BASE_URL 和 AI_MODEL 已写入生产环境配置。保留 Vercel Authentication 访问保护。未运行功能测试或真实模型验收。
