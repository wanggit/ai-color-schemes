import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

// 创建 OpenAI 兼容的提供者
// 使用 createOpenAICompatible 可以自定义 baseURL 和 apiKey
export const aiProvider = createOpenAICompatible({
    name: 'custom-openai',
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_URL || 'https://api.openai.com/v1',
});

// 导出模型配置
export const gpt4oModel = aiProvider('gpt-4o');

export const deepseekAiProvider = createOpenAICompatible({
    name: 'custom-deepseek',
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: process.env.OPENAI_URL || 'https://api.openai.com/v1',
});

export const deepseekr1Model = deepseekAiProvider('claude-sonnet-4-20250514-thinking');
