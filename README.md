# X推文收藏助手 Chrome插件

一个用于收藏X.com（Twitter）推文并使用AI生成日报的Chrome浏览器扩展。

## 功能特性

- 📌 **一键收藏**: 在X.com上直接点击按钮收藏推文
- 📅 **日期分组**: 自动按收藏日期分组显示
- 🤖 **AI日报**: 使用AI生成每日收藏推文的整理日报
- ⚙️ **自定义API**: 支持配置自定义AI API（OpenAI、Anthropic等）
- 📋 **一键复制**: 快速复制生成的日报内容
- 🗑️ **管理便捷**: 随时删除不需要的收藏

## 安装方法

### 方式一：开发者模式安装（推荐用于测试）

1. 下载或克隆此项目到本地
2. 打开Chrome浏览器，访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目根目录
6. 插件安装完成！

### 方式二：打包安装

1. 在 `chrome://extensions/` 页面
2. 点击"打包扩展程序"
3. 选择项目根目录
4. 生成.crx文件后拖拽到浏览器安装

## 使用指南

### 1. 收藏推文

1. 访问 [X.com](https://x.com)
2. 浏览推文时，每条推文下方会显示一个收藏按钮（书签图标）
3. 点击按钮即可收藏，再次点击取消收藏

### 2. 查看收藏列表

1. 点击浏览器工具栏的插件图标
2. 查看所有收藏的推文，按日期分组显示
3. 点击推文可跳转到原链接
4. 点击删除按钮可移除收藏

### 3. 生成AI日报

1. 首先需要配置AI API（见下方配置说明）
2. 在插件弹窗中点击"生成今日日报"按钮
3. 等待AI生成完成
4. 查看生成的日报内容
5. 点击"复制日报"按钮复制到剪贴板

### 4. 配置AI API

1. 点击插件弹窗右上角的设置图标
2. 填写以下信息：
   - **API Endpoint**: API的完整URL地址
     - OpenAI: `https://api.openai.com/v1/chat/completions`
     - Anthropic: `https://api.anthropic.com/v1/messages`
   - **API Key**: 您的API密钥
   - **Model**: 要使用的模型名称
     - OpenAI: `gpt-4`, `gpt-3.5-turbo`
     - Anthropic: `claude-3-sonnet-20240229`, `claude-3-opus-20240229`
   - **System Prompt**: 自定义AI助手的角色（可选）

3. 点击"测试连接"验证配置
4. 点击"保存设置"完成配置

## 数据存储

所有数据都存储在本地浏览器的 `chrome.storage.local` 中，包括：
- 收藏的推文列表
- AI API配置信息

**注意**: API Key存储在本地，不会上传到任何服务器。

## 支持的AI服务

本插件支持任何兼容OpenAI API格式的服务：

- ✅ **智谱AI** (GLM-4) - 推荐使用，国内访问快
- ✅ **OpenAI** (GPT-4, GPT-3.5)
- ✅ **Anthropic** (Claude 3)
- ✅ 其他兼容OpenAI格式的API服务

### 智谱AI配置示例

- **API Endpoint**: `https://open.bigmodel.cn/api/paas/v4/chat/completions`
- **Model**: `glm-4` 或 `glm-4-flash`
- **获取API Key**: 访问 [智谱AI开放平台](https://open.bigmodel.cn/)

## 项目结构

```
ai-x-chajian/
├── manifest.json          # Chrome插件配置文件
├── src/
│   ├── content/
│   │   └── content.js     # 注入X.com的内容脚本
│   ├── popup/
│   │   ├── popup.html     # 弹窗页面
│   │   ├── popup.js       # 弹窗逻辑
│   │   └── popup.css      # 弹窗样式
│   ├── background/
│   │   └── serviceWorker.js  # 后台服务（数据存储、AI调用）
│   ├── options/
│   │   ├── options.html   # 设置页面
│   │   ├── options.js     # 设置逻辑
│   │   └── options.css    # 设置样式
│   └── styles/
│       └── content.css    # 收藏按钮样式
├── icons/                 # 插件图标
└── README.md
```

## 技术栈

- **Manifest V3**: Chrome最新扩展规范
- **Vanilla JavaScript**: 无框架依赖
- **Chrome Storage API**: 本地数据存储
- **MutationObserver**: 动态检测页面推文
- **Fetch API**: AI API调用

## 注意事项

1. **API费用**: 使用AI API可能会产生费用，请注意使用量
2. **API安全**: API Key存储在本地，请勿泄露
3. **网络要求**: 需要能访问AI API服务器
4. **X.com更新**: X.com页面结构变化可能影响插件功能

## 常见问题

### Q: 收藏按钮不显示？
A: 请确保您在x.com或twitter.com域名下，刷新页面后重试。

### Q: 生成日报失败？
A: 请检查：
- API Key是否正确
- API Endpoint是否正确
- 网络连接是否正常
- API账户是否有足够余额

### Q: 数据会同步吗？
A: 目前数据仅存储在本地，不会跨设备同步。如需备份，可以导出数据。

### Q: 支持哪些模型？
A: 支持任何兼容OpenAI API格式的模型，包括GPT-4、Claude等。

## 开发计划

- [ ] 支持数据导出/导入
- [ ] 支持标签分类
- [ ] 支持全文搜索
- [ ] 支持自定义日期范围生成日报
- [ ] 支持多云备选API

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT License

## 免责声明

本插件仅供个人学习使用，请勿用于商业用途。使用AI API产生的费用由用户自行承担。
