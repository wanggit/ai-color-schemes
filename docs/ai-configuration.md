# AI 配置说明

## 环境变量配置

本项目使用 Vercel AI SDK 和 OpenAI 兼容的 API 进行 AI 功能。

### 必需环境变量

```bash
# OpenAI API 密钥
OPENAI_API_KEY=your-openai-api-key
```

### 可选环境变量

```bash
# OpenAI API 基础URL（可选）
# 如果不设置，默认使用 https://api.openai.com/v1
OPENAI_API_BASE=https://api.openai.com/v1

# 兼容性配置（可选）
# 如果设置了 OPENAI_URL，会优先使用此配置
OPENAI_URL=https://api.openai.com/v1
```

## 支持的 API 端点

本项目支持任何与 OpenAI API 兼容的端点，包括但不限于：

- 官方 OpenAI API: `https://api.openai.com/v1`
- Azure OpenAI: `https://your-resource.openai.azure.com/openai/deployments/your-deployment`
- 其他兼容的 API 提供商

## 模型配置

当前使用的模型：`gpt-4o`

## 流式响应

所有 AI 请求都支持流式响应，提供更好的用户体验。

## 配置示例

### 使用官方 OpenAI API

```bash
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_API_BASE=https://api.openai.com/v1
```

### 使用 Azure OpenAI

```bash
OPENAI_API_KEY=your-azure-api-key
OPENAI_API_BASE=https://your-resource.openai.azure.com/openai/deployments/your-deployment
```

### 使用其他兼容提供商

```bash
OPENAI_API_KEY=your-api-key
OPENAI_API_BASE=https://api.your-provider.com/v1
``` 