# 文件说明

## 📁 目录结构

```
debug-console/
├── debug-console.vue       # 主组件文件
├── index.js               # 全局注册插件
├── package.json           # 包配置文件
├── README.md              # 完整使用文档
├── FILES.md               # 本文件
├── static/                # 静态资源目录
│   └── svg/              # SVG 图标
│       ├── log-icon.svg  # 日志图标
│       ├── clear.svg     # 清空图标
│       ├── copy.svg      # 复制图标
│       ├── hide.svg      # 隐藏图标
│       └── top.svg       # 返回顶部图标
└── example/              # 使用示例
    ├── page.vue          # 示例页面
    ├── main.js           # 全局注册示例
    └── App.vue           # 
    应用入口示例
```

## 📋 核心文件说明

### debug-console.vue
主组件文件，包含调试控制台的完整功能实现。

**功能特性：**
- 日志捕获与展示
- 搜索与过滤
- 日志分类（log/info/warn/error/success）
- 拖拽调整面板高度
- 本地持久化存储
- 自定义悬浮按钮插槽

### index.js
全局注册插件文件，提供 Vue 插件接口。

**功能特性：**
- 自动拦截 console 输出
- 捕获全局错误
- 捕获 Promise 错误
- 可选的网络请求拦截
- 全局日志方法注入

### static/svg/
包含组件使用的所有 SVG 图标文件，可根据需要替换为自己的图标。

## 🚀 快速使用

### 最小化集成
如果只需要基础功能，最少需要以下文件：
```
├── debug-console.vue
└── static/
    └── svg/
        ├── log-icon.svg
        ├── clear.svg
        ├── copy.svg
        ├── hide.svg
        └── top.svg
```

### 完整功能集成
如果需要全局注册和完整功能，需要：
```
├── debug-console.vue
├── index.js
└── static/
    └── svg/
        └── *.svg (所有图标文件)
```

## 📝 注意事项

1. **图标路径**：组件中的图标使用相对路径 `./static/svg/`，确保静态资源目录与组件在同一目录下。

2. **debugLogger 依赖**：组件依赖 `@/utils/debugLogger`，需要在项目中创建此文件。参考 README.md 中的示例代码。

3. **Vue 版本**：支持 Vue 3，如需 Vue 2 支持，请修改 `index.js` 中的相关代码。

4. **UniApp 版本**：建议使用 UniApp 3.x 版本以获得最佳兼容性。

## 🔄 更新日志

### v1.0.0 (2025-11-10)
- ✨ 初始版本发布
- 🎨 精美的暗色主题 UI
- 🔍 支持正则表达式搜索
- 💾 本地持久化存储
- 🎯 全局注册功能
- 📱 完美双端适配（iOS/Android）
- 🔧 支持自定义悬浮按钮

## 📄 许可证

MIT License

