# UniApp Debug Console 调试控制台组件

<p align="center">
  <strong>一款功能强大、界面精美的 UniApp 调试控制台组件</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/uniapp-vue3-brightgreen" alt="UniApp Vue3">
  <img src="https://img.shields.io/badge/platform-iOS%20%7C%20Android-blue" alt="Platform">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
</p>

## ✨ 特性

- 🎨 **精美UI设计** - 现代化暗色主题，流畅的动画效果
- 📱 **完美适配** - 支持iOS和Android，响应式布局
- 🔍 **强大搜索** - 支持正则表达式和大小写敏感搜索
- 📊 **日志分类** - 自动分类log、info、warn、error、success
- 💾 **本地持久化** - 自动保存日志到本地存储
- 🎯 **全局注册** - 支持全局注册，自动捕获所有日志
- 🔧 **高度可定制** - 支持自定义悬浮按钮样式
- ⚡ **性能优化** - 高效的日志管理和渲染

## 📦 安装

### 方式一：复制文件

将以下文件复制到你的项目中：

```
components/
  └── debug-console/
      ├── debug-console.vue  # 主组件
      ├── index.js          # 全局注册插件
      └── static/           # 静态资源
          └── svg/          # 图标文件
              ├── log-icon.svg
              ├── clear.svg
              ├── copy.svg
              ├── hide.svg
              └── top.svg
```

### 方式二：通过包管理器（待发布）

```bash
npm install @izdax/debug-console
# 或
yarn add @izdax/debug-console
```

## 🚀 快速开始

### 基础用法

在页面中直接使用组件：

```vue
<template>
  <view>
    <!-- 你的页面内容 -->
    
    <!-- 调试控制台组件 -->
    <debug-console 
      :enable="true"
      :max-logs="500"
      :auto-save="true"
    />
  </view>
</template>

<script>
import DebugConsole from '@/components/debug-console/debug-console.vue';
import debugLogger from '@/utils/debugLogger';

export default {
  components: {
    DebugConsole
  },
  
  onLoad() {
    // 使用debugLogger记录日志
    debugLogger.log('页面加载完成');
    debugLogger.info('这是一条信息');
    debugLogger.warn('这是一条警告');
    debugLogger.error('这是一条错误');
    debugLogger.success('操作成功！');
  }
}
</script>
```

### 全局注册（推荐）

在 `main.js` 中全局注册插件：

```javascript
import App from './App'
import DebugConsolePlugin from '@/components/debug-console/index.js'

// 创建Vue应用实例
const app = createApp(App)

// 全局注册调试控制台
app.use(DebugConsolePlugin, {
  enable: true,              // 是否启用（建议根据环境变量控制）
  maxLogs: 500,             // 最大日志数量
  autoSave: true,           // 自动保存到本地
  captureConsole: true,     // 拦截console输出
  captureError: true,       // 捕获全局错误
  captureNetwork: false,    // 捕获网络请求（可选）
  storageKey: 'debug_logs'  // 本地存储键名
})

// 启动应用
app.mount('#app')

export function createApp() {
  return { app }
}
```

全局注册后，在 `App.vue` 中添加组件：

```vue
<template>
  <view>
    <!-- 你的应用内容 -->
    
    <!-- 调试控制台 - 全局只需添加一次 -->
    <debug-console 
      :enable="$debugConsole.isEnabled()"
      :fab-right="40"
      :fab-bottom="200"
    />
  </view>
</template>
```

## 📖 API 文档

### Props 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enable` | Boolean | `false` | 是否启用调试模式 |
| `maxLogs` | Number | `500` | 最大日志数量 |
| `autoSave` | Boolean | `true` | 是否自动保存到本地 |
| `storageKey` | String | `'debug_console_logs'` | 本地存储键名 |
| `fabRight` | Number | `40` | 悬浮按钮右侧距离（rpx） |
| `fabBottom` | Number | `200` | 悬浮按钮底部距离（rpx） |

### 全局注册选项

```javascript
{
  enable: true,              // 是否启用
  maxLogs: 500,             // 最大日志数量
  autoSave: true,           // 自动保存
  captureConsole: true,     // 拦截console
  captureError: true,       // 捕获错误
  captureNetwork: false,    // 捕获网络请求
  storageKey: 'debug_logs', // 存储键名
  fabRight: 40,             // 按钮位置-右
  fabBottom: 200            // 按钮位置-下
}
```

### 全局方法

全局注册后可在任何组件中使用：

```javascript
// Vue 3
this.$log('普通日志')
this.$logInfo('信息日志')
this.$logWarn('警告日志')
this.$logError('错误日志')
this.$logSuccess('成功日志')

// 或使用 debugLogger
import debugLogger from '@/utils/debugLogger'

debugLogger.log('普通日志')
debugLogger.info('信息日志')
debugLogger.warn('警告日志')
debugLogger.error('错误日志')
debugLogger.success('成功日志')
debugLogger.clearLogs() // 清空所有日志
```

### Slots 插槽

#### fab 插槽

自定义悬浮按钮样式：

```vue
<debug-console :enable="true">
  <template #fab="{ logCount, openPanel }">
    <!-- 自定义按钮 -->
    <view class="my-custom-btn" @click="openPanel">
      <text>日志({{ logCount }})</text>
    </view>
  </template>
</debug-console>
```

**插槽参数：**
- `logCount` - 当前日志数量
- `openPanel` - 打开面板的方法

## 💡 使用场景

### 1. 开发环境调试

```javascript
// main.js
const isDev = process.env.NODE_ENV === 'development'

app.use(DebugConsolePlugin, {
  enable: isDev,
  captureConsole: true,
  captureError: true
})
```

### 2. 测试环境开启

```javascript
// config.js
export const DEBUG_MODE = process.env.VUE_APP_ENV === 'test'

// main.js
app.use(DebugConsolePlugin, {
  enable: DEBUG_MODE
})
```

### 3. 生产环境按需开启

```javascript
// 通过特定手势或设置页面开启
export default {
  data() {
    return {
      debugEnabled: false
    }
  },
  
  methods: {
    // 点击10次logo开启调试
    onLogoClick() {
      this.clickCount++
      if (this.clickCount >= 10) {
        this.debugEnabled = true
        uni.showToast({ title: '调试模式已开启' })
      }
    }
  }
}
```

## 🎯 高级功能

### 搜索日志

1. **普通搜索** - 直接输入关键词
2. **正则搜索** - 点击 `.*` 按钮启用正则表达式
3. **大小写敏感** - 点击 `Aa` 按钮启用大小写敏感

### 日志分类过滤

点击顶部Tab切换不同类型的日志：
- All - 显示所有日志
- Log - 普通日志
- Info - 信息日志
- Warn - 警告日志
- Error - 错误日志
- Success - 成功日志

### 面板操作

- **拖拽调整高度** - 拖动顶部手柄调整面板高度
- **复制日志** - 点击单条日志右侧的复制按钮
- **复制所有** - 点击底部复制按钮复制所有日志
- **清空日志** - 点击底部清空按钮
- **滚动控制** - 点击顶部/底部按钮快速滚动

### JSON对象展开

当日志内容为JSON对象时，会自动识别并提供展开功能：

```javascript
debugLogger.log({
  user: { name: '张三', age: 25 },
  items: [1, 2, 3]
})
```

## 🛠 配置 debugLogger

创建 `utils/debugLogger.js`：

```javascript
class DebugLogger {
  constructor() {
    this.logs = []
    this.listeners = []
    this.maxLogs = 500
  }

  addListener(callback) {
    this.listeners.push(callback)
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback)
  }

  notify(log) {
    this.listeners.forEach(cb => cb(log))
  }

  log(message) {
    this.addLog(message, 'log')
  }

  info(message) {
    this.addLog(message, 'info')
  }

  warn(message) {
    this.addLog(message, 'warning')
  }

  error(message) {
    this.addLog(message, 'error')
  }

  success(message) {
    this.addLog(message, 'success')
  }

  addLog(message, type = 'info') {
    const log = {
      message: typeof message === 'object' ? JSON.stringify(message) : String(message),
      type,
      timestamp: Date.now()
    }
    
    this.logs.unshift(log)
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }
    
    this.notify(log)
  }

  getLogs() {
    return this.logs
  }

  clearLogs() {
    this.logs = []
    this.notify({ type: 'clear' })
  }
}

export default new DebugLogger()
```

## 📱 双端适配

组件已完美适配iOS和Android：

- ✅ iOS安全区域适配
- ✅ Android状态栏适配
- ✅ 响应式布局
- ✅ 触摸事件优化
- ✅ 滚动性能优化

## 🎨 自定义样式

### 修改主题颜色

```scss
// 在组件的style中覆盖样式
::v-deep .log-panel {
  background: your-custom-color;
}

::v-deep .log-fab {
  background: your-custom-color;
}
```

### 自定义悬浮按钮

使用 `fab` 插槽完全自定义按钮样式：

```vue
<debug-console :enable="true">
  <template #fab="{ logCount, openPanel }">
    <view 
      class="custom-fab"
      @click="openPanel"
      :style="{ 
        right: '20rpx', 
        bottom: '100rpx' 
      }"
    >
      <image src="/static/my-icon.svg" />
      <text v-if="logCount > 0">{{ logCount }}</text>
    </view>
  </template>
</debug-console>

<style scoped>
.custom-fab {
  position: fixed;
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 16rpx rgba(0,0,0,0.3);
  z-index: 9999;
}
</style>
```

## 📝 完整示例

```vue
<template>
  <view class="page">
    <view class="header">
      <text class="title">我的应用</text>
    </view>
    
    <view class="content">
      <button @click="testLog">测试日志</button>
      <button @click="testError">测试错误</button>
      <button @click="testAPI">测试API</button>
    </view>
    
    <!-- 调试控制台 -->
    <debug-console 
      :enable="isDebugMode"
      :max-logs="500"
      :auto-save="true"
      :fab-right="40"
      :fab-bottom="200"
    >
      <!-- 自定义悬浮按钮（可选） -->
      <template #fab="{ logCount, openPanel }">
        <view class="my-fab" @click="openPanel">
          <text>🐛</text>
          <text v-if="logCount > 0" class="badge">{{ logCount }}</text>
        </view>
      </template>
    </debug-console>
  </view>
</template>

<script>
import DebugConsole from '@/components/debug-console/debug-console.vue'
import debugLogger from '@/utils/debugLogger'

export default {
  components: {
    DebugConsole
  },
  
  data() {
    return {
      isDebugMode: true // 根据环境变量控制
    }
  },
  
  onLoad() {
    debugLogger.info('页面加载完成')
  },
  
  methods: {
    testLog() {
      debugLogger.log('这是一条测试日志')
      debugLogger.info('用户信息', { name: '张三', age: 25 })
    },
    
    testError() {
      try {
        throw new Error('这是一个测试错误')
      } catch (e) {
        debugLogger.error(e.message)
      }
    },
    
    async testAPI() {
      debugLogger.info('开始请求API...')
      try {
        const res = await uni.request({ url: '/api/test' })
        debugLogger.success('API请求成功', res.data)
      } catch (e) {
        debugLogger.error('API请求失败', e)
      }
    }
  }
}
</script>

<style scoped>
.page {
  padding: 40rpx;
}

.my-fab {
  position: relative;
  width: 100rpx;
  height: 100rpx;
  background: #000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
}

.badge {
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  background: red;
  color: white;
  font-size: 20rpx;
  padding: 4rpx 8rpx;
  border-radius: 20rpx;
}
</style>
```

## 🔧 故障排除

### 日志不显示

1. 检查 `enable` 属性是否为 `true`
2. 确认已正确导入 `debugLogger`
3. 检查是否正确调用了日志方法

### 悬浮按钮不显示

1. 确认 `enable` 为 `true` 且 `showPanel` 为 `false`
2. 检查z-index是否被其他元素覆盖
3. 确认图标路径是否正确

### 全局注册不生效

1. 确认在 `main.js` 中正确调用了 `app.use()`
2. 检查 `App.vue` 中是否添加了 `<debug-console>` 组件
3. 确认组件的 `enable` 属性为 `true`

## 📄 License

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题，请通过以下方式联系：
- 提交 Issue
- 发送邮件至：support@izdax.com

---

<p align="center">
  Made with ❤️ by IZDAX Team
</p>
