<div align="center">

<img src="icons/icon128.png" alt="X推文收藏助手" width="128" height="128">

# X推文收藏助手 Chrome插件

一个用于收藏X.com（Twitter）推文并使用AI生成日报的Chrome浏览器扩展。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://github.com/Clay408/x-tweet-collector)

</div>

## 功能特性

| 功能 | 说明 |
|------|------|
| 📌 **一键收藏** | 在X.com上直接点击按钮收藏推文 |
| 📅 **日期分组** | 自动按收藏日期分组显示（今天/昨天/具体日期） |
| 🏷️ **标签管理** | 为推文添加标签，支持按标签筛选 |
| 🤖 **AI日报** | 使用AI生成每日收藏推文的整理日报 |
| 📤 **数据导出** | 导出收藏数据为JSON文件，方便备份 |
| ⌨️ **快捷键** | 快速收藏推文和打开收藏列表 |
| 🌙 **深色模式** | 自动适配系统深色模式 |
| 🔒 **本地存储** | 所有数据存储在本地，保护隐私 |

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Alt+Shift+X` (Mac: `Command+Shift+X`) | 打开收藏列表 |
| `Alt+S` (Mac: `Command+S`) | 收藏/取消收藏当前可见推文 |

## 安装方法

### 开发者模式安装

1. 下载或克隆此项目到本地
2. 打开Chrome浏览器，访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目根目录
6. 安装完成！

## 使用指南

### 1. 收藏推文

访问 [X.com](https://x.com)，浏览推文时每条推文下方会显示一个收藏按钮（书签图标），点击即可收藏。也可使用快捷键 `Alt+S` 快速收藏当前页面的主推文。

### 2. 查看收藏

点击浏览器工具栏的插件图标，或按 `Alt+Shift+X` 打开收藏列表。推文按日期分组显示，点击可跳转到原链接。

### 3. 标签管理

在推文卡片上点击"添加标签"，输入标签名称后按回车确认。可以为同一推文添加多个标签，使用顶部的标签过滤器快速筛选。

### 4. 生成AI日报

1. 先配置AI API（见下方）
2. 在收藏列表中点击"生成今日日报"
3. 等待AI生成完成
4. 查看并复制日报内容

### 5. 导出数据

点击收藏列表中的"导出"按钮，将收藏数据导出为JSON文件，可用于备份或数据迁移。

## 配置AI API

点击插件弹窗右上角的设置图标进入配置页面。

### 快速配置（预设）

| 服务商 | 推荐模型 | 说明 |
|--------|----------|------|
| 智谱AI | glm-4-flash | 国内访问快，价格优惠 |
| OpenAI | gpt-4o-mini | 综合能力强 |
| Anthropic | claude-3-5-sonnet | 理解能力出色 |

点击对应预设按钮，只需填写 API Key 即可。

### 手动配置

| 配置项 | 说明 |
|--------|------|
| API Endpoint | API的完整URL地址 |
| API Key | 您的API密钥 |
| Model | 模型名称 |
| System Prompt | 自定义AI助手的角色（可选） |

配置完成后点击"测试连接"验证，然后"保存设置"。

### 获取API Key

- **智谱AI**: [open.bigmodel.cn](https://open.bigmodel.cn/) - 推荐国内用户使用
- **OpenAI**: [platform.openai.com](https://platform.openai.com/)
- **Anthropic**: [console.anthropic.com](https://console.anthropic.com/)

## 常见问题

**Q: 收藏按钮不显示？**

A: 请确保您在 x.com 或 twitter.com 域名下，刷新页面后重试。

**Q: 生成日报失败？**

A: 请检查 API Key、Endpoint 是否正确，网络连接是否正常，以及 API 账户是否有足够余额。

**Q: 数据会同步吗？**

A: 目前数据仅存储在本地，不会跨设备同步。建议使用导出功能定期备份。

**Q: 快捷键不生效？**

A: 请确保扩展已正确安装，没有与其他软件的快捷键冲突。

**Q: 支持哪些模型？**

A: 支持任何兼容OpenAI API格式的模型，包括GPT-4、Claude、GLM-4等。

## 注意事项

1. **API费用**: 使用AI API可能会产生费用，请注意使用量
2. **API安全**: API Key存储在本地，请勿泄露
3. **数据备份**: 建议定期导出数据进行备份
4. **网络要求**: 需要能访问AI API服务器

## 更新日志

### v1.2.0 (最新)
- 新增深色模式支持
- 新增快捷键功能
- 新增标签管理和筛选功能
- 新增数据导出功能

### v1.1.0
- 新增AI日报生成功能
- 支持多种AI API配置

### v1.0.0
- 初始版本发布
- 基础收藏功能

## 许可证

MIT License

## 免责声明

本插件仅供个人学习使用，请勿用于商业用途。使用AI API产生的费用由用户自行承担。
