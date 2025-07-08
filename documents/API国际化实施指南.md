# API 国际化实施指南

## 概述

本指南介绍了如何为 `/api` 目录下的API路由实现国际化，确保API返回的错误消息、日志内容等能够根据用户的语言偏好进行本地化。

## 方案架构

### 1. 核心组件

- **翻译文件扩展**: 在现有的 `messages/` 目录下的各语言文件中添加 `api` 部分
- **API国际化工具库**: `lib/api-i18n.ts` 提供语言检测和翻译功能
- **API处理器类**: `ApiI18nHandler` 提供便捷的国际化接口

### 2. 支持的语言

- 中文 (zh)
- 英文 (en) 
- 德语 (de)
- 日语 (ja)
- 韩语 (ko)

## 使用方法

### 1. 基础使用

```typescript
import { ApiI18nHandler } from '@/lib/api-i18n';

export async function POST(request: NextRequest) {
  try {
    // 创建国际化处理器
    const i18n = await ApiI18nHandler.create(request);
    
    // 返回错误消息
    return NextResponse.json(
      { error: i18n.error("unauthorized") }, 
      { status: 401 }
    );
  } catch (error) {
    // 处理错误情况
    const fallbackI18n = new ApiI18nHandler('zh');
    return NextResponse.json(
      { error: fallbackI18n.error("internalServerError") },
      { status: 500 }
    );
  }
}
```

### 2. 带变量的消息

```typescript
// 记录包含变量的日志
console.log(i18n.log("startGenerating", { 
  hex: "#ff0000", 
  regenerate: regenerate ? i18n.log("forceRegenerate") : ""
}));

// 输出: "正在为 hex: #ff0000 生成配色方案 (强制重新生成)"
```

### 3. 语言检测优先级

1. **URL参数**: `?locale=en` 或 `?lang=en`
2. **Accept-Language 请求头**: 浏览器发送的语言偏好
3. **用户会话**: 如果用户已登录且设置了语言偏好
4. **默认语言**: 中文 (zh)

## 翻译文件结构

### messages/zh.json
```json
{
  "api": {
    "errors": {
      "unauthorized": "未登录",
      "invalidUser": "无效的用户身份",
      "userNotFound": "用户不存在",
      "accountDisabled": "账号已被禁用",
      "insufficientCredits": "您的积分不足，请充值后使用"
    },
    "logs": {
      "startGenerating": "正在为 hex: {hex} 生成配色方案{regenerate}",
      "forceRegenerate": " (强制重新生成)",
      "startAiRequest": "开始请求AI颜色分析..."
    },
    "success": {
      "schemeGenerated": "配色方案生成成功"
    }
  }
}
```

## API国际化工具库

### 主要功能

1. **语言检测**: 从请求中自动检测用户语言偏好
2. **消息翻译**: 根据键路径获取对应语言的翻译文本
3. **变量替换**: 支持在翻译文本中替换动态变量
4. **回退机制**: 找不到翻译时自动回退到英文或键名

### 核心方法

```typescript
// 获取错误消息
i18n.error("unauthorized")

// 获取日志消息
i18n.log("startGenerating", { hex: "#ff0000" })

// 获取成功消息
i18n.success("schemeGenerated")

// 获取任意路径的消息
i18n.message("generate.progress.analyzing")

// 获取当前语言
i18n.getLocale()
```

## 实施步骤

### 步骤1: 安装依赖
确保项目已安装相关依赖，国际化工具库基于现有的项目结构构建。

### 步骤2: 翻译文件更新
已为所有支持的语言文件添加了 `api` 部分的翻译内容。

### 步骤3: 修改现有API路由

1. 导入 `ApiI18nHandler`
2. 在路由函数开始时创建国际化处理器
3. 替换硬编码的文本为国际化调用

#### 修改前:
```typescript
if (!session?.user) {
  return NextResponse.json({ error: "未登录" }, { status: 401 });
}
```

#### 修改后:
```typescript
const i18n = await ApiI18nHandler.create(request);
if (!session?.user) {
  return NextResponse.json({ error: i18n.error("unauthorized") }, { status: 401 });
}
```

### 步骤4: 更新日志记录

#### 修改前:
```typescript
console.log(`正在为 hex: ${hex} 生成配色方案${regenerate ? ' (强制重新生成)' : ''}`);
```

#### 修改后:
```typescript
console.log(i18n.log("startGenerating", { 
  hex, 
  regenerate: regenerate ? i18n.log("forceRegenerate") : ""
}));
```

## 需要修改的API文件列表

以下API文件包含需要国际化的文本内容：

1. `app/api/colors/route.ts` - 主要的配色生成API
2. `app/api/colors/example/route.ts` - HTML示例生成API
3. `app/api/user/colors/route.ts` - 用户配色方案查询API
4. `app/api/admin/users/route.ts` - 管理员用户管理API
5. `app/api/admin/users/[id]/route.ts` - 用户详情管理API

## 错误消息映射表

| 错误键 | 中文 | 英文 | 状态码 |
|--------|------|------|--------|
| unauthorized | 未登录 | Unauthorized | 401 |
| invalidUser | 无效的用户身份 | Invalid user identity | 400 |
| userNotFound | 用户不存在 | User not found | 404 |
| accountDisabled | 账号已被禁用 | Account has been disabled | 403 |
| insufficientCredits | 您的积分不足，请充值后使用 | Insufficient credits, please recharge | 403 |
| invalidColorValue | 无效的颜色值 | Invalid color value | 400 |
| invalidColorFormat | 颜色值格式不正确 | Invalid color format | 400 |
| cannotDetermineUser | 无法确定用户身份 | Cannot determine user identity | 400 |
| missingParameters | 缺少必要参数 | Missing required parameters | 400 |
| invalidPageNumber | 页码无效 | Invalid page number | 400 |
| internalServerError | 服务器内部错误 | Internal server error | 500 |

## 测试建议

### 1. 语言检测测试
```bash
# 测试不同语言
curl -H "Accept-Language: en-US" /api/colors
curl -H "Accept-Language: zh-CN" /api/colors
curl -H "Accept-Language: de-DE" /api/colors
```

### 2. URL参数测试
```bash
# 通过URL参数指定语言
curl /api/colors?locale=en
curl /api/colors?lang=ja
```

### 3. 错误消息测试
发送无效请求确保错误消息以正确语言返回。

## 性能考虑

1. **缓存优化**: 翻译文件在导入时加载，避免重复读取
2. **回退机制**: 找不到翻译时快速回退，避免性能损失
3. **内存占用**: 所有语言文件同时加载，但文件较小，影响可忽略

## 扩展性

### 添加新语言
1. 在 `messages/` 目录添加新的语言文件
2. 在 `lib/api-i18n.ts` 的 `SUPPORTED_LOCALES` 中添加语言代码
3. 在 `messages` 对象中导入新语言文件

### 添加新消息类型
在翻译文件的 `api` 部分添加新的消息分类，如 `warnings`、`notifications` 等。

## 最佳实践

1. **一致性**: 确保所有API路由都使用统一的国际化方法
2. **错误处理**: 在无法创建国际化处理器时提供回退机制
3. **变量命名**: 使用描述性的变量名，如 `{username}` 而不是 `{user}`
4. **消息分类**: 合理组织消息结构，便于维护和查找
5. **测试覆盖**: 确保所有语言的消息都经过测试

## 注意事项

1. **服务器端渲染**: 确保国际化工具在服务器端正常工作
2. **错误处理**: 考虑翻译文件缺失或损坏的情况
3. **性能监控**: 监控国际化功能对API响应时间的影响
4. **日志记录**: 国际化的日志消息应该便于开发人员理解和调试

通过遵循本指南，可以确保API的国际化实施既完整又高效，为全球用户提供更好的体验。 