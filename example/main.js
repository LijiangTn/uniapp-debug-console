import App from './App'
import { createSSRApp } from 'vue'
import DebugConsolePlugin from '../index.js'

export function createApp() {
  const app = createSSRApp(App)
  
  // 全局注册调试控制台
  app.use(DebugConsolePlugin, {
    enable: true,              // 是否启用
    maxLogs: 500,             // 最大日志数量
    autoSave: true,           // 自动保存
    captureConsole: true,     // 拦截console
    captureError: true,       // 捕获错误
    captureNetwork: false,    // 捕获网络请求（可选）
    storageKey: 'debug_logs', // 存储键名
    fabRight: 40,             // 按钮位置-右
    fabBottom: 200            // 按钮位置-下
  })
  
  return {
    app
  }
}
