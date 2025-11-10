/**
 * DebugConsole 插件入口
 * 提供全局注册功能，自动捕获项目所有日志
 * @author izdax
 * @version 1.0.0
 */

import DebugConsole from './debug-console.vue'
import debugLogger from '@/utils/debugLogger'

const DebugConsolePlugin = {
  /**
   * Vue 插件安装方法
   * @param {Object} app - Vue 实例 (Vue3) 或 Vue 构造函数 (Vue2)
   * @param {Object} options - 配置选项
   */
  install(app, options = {}) {
    // 默认配置
    const defaultOptions = {
      enable: true,                    // 是否启用
      maxLogs: 500,                    // 最大日志数
      autoSave: true,                  // 自动保存
      storageKey: 'debug_console_logs', // 存储键名
      fabRight: 40,                    // 按钮右侧距离
      fabBottom: 200,                  // 按钮底部距离
      captureConsole: true,            // 是否拦截 console
      captureError: true,              // 是否捕获错误
      captureNetwork: false,           // 是否捕获网络请求（可选）
    }

    // 合并配置
    const config = { ...defaultOptions, ...options }

    // 判断 Vue 版本
    const isVue3 = app.version && app.version.startsWith('3')

    // 注册全局组件
    if (isVue3) {
      // Vue3
      app.component('DebugConsole', DebugConsole)
      
      // 挂载到全局属性
      app.config.globalProperties.$debugLogger = debugLogger
      app.config.globalProperties.$log = debugLogger.log.bind(debugLogger)
      app.config.globalProperties.$logInfo = debugLogger.info.bind(debugLogger)
      app.config.globalProperties.$logWarn = debugLogger.warn.bind(debugLogger)
      app.config.globalProperties.$logError = debugLogger.error.bind(debugLogger)
      app.config.globalProperties.$logSuccess = debugLogger.success.bind(debugLogger)
    } else {
      // Vue2
      app.component('DebugConsole', DebugConsole)
      
      // 挂载到 Vue 原型
      app.prototype.$debugLogger = debugLogger
      app.prototype.$log = debugLogger.log.bind(debugLogger)
      app.prototype.$logInfo = debugLogger.info.bind(debugLogger)
      app.prototype.$logWarn = debugLogger.warn.bind(debugLogger)
      app.prototype.$logError = debugLogger.error.bind(debugLogger)
      app.prototype.$logSuccess = debugLogger.success.bind(debugLogger)
    }

    // 拦截 console 输出
    if (config.captureConsole) {
      setupConsoleInterceptor()
    }

    // 捕获全局错误
    if (config.captureError) {
      setupErrorHandler(isVue3 ? app : null)
    }

    // 捕获网络请求（可选）
    if (config.captureNetwork) {
      setupNetworkInterceptor()
    }

    // 存储配置供组件使用
    if (isVue3) {
      app.provide('debugConsoleConfig', config)
    } else {
      app.prototype.$debugConsoleConfig = config
    }

    console.log('[DebugConsole] 插件已全局注册', config)
  }
}

/**
 * 设置 console 拦截器
 */
function setupConsoleInterceptor() {
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error
  }

  console.log = function(...args) {
    debugLogger.log(formatArgs(args))
    originalConsole.log.apply(console, args)
  }

  console.info = function(...args) {
    debugLogger.info(formatArgs(args))
    originalConsole.info.apply(console, args)
  }

  console.warn = function(...args) {
    debugLogger.warn(formatArgs(args))
    originalConsole.warn.apply(console, args)
  }

  console.error = function(...args) {
    debugLogger.error(formatArgs(args))
    originalConsole.error.apply(console, args)
  }
}

/**
 * 设置错误处理器
 */
function setupErrorHandler(app) {
  // 浏览器全局错误
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      debugLogger.error(`[全局错误] ${event.message} @${event.filename}:${event.lineno}:${event.colno}`)
    })

    window.addEventListener('unhandledrejection', (event) => {
      debugLogger.error(`[Promise错误] ${event.reason}`)
    })
  }

  // Vue3 错误处理
  if (app && app.config) {
    const originalErrorHandler = app.config.errorHandler
    app.config.errorHandler = (err, instance, info) => {
      debugLogger.error(`[Vue错误] ${err.message} - ${info}`)
      if (originalErrorHandler) {
        originalErrorHandler(err, instance, info)
      }
    }
  }

  // uni-app 错误处理
  if (typeof uni !== 'undefined') {
    const originalOnError = uni.onError
    uni.onError = function(error) {
      debugLogger.error(`[uni-app错误] ${error}`)
      if (originalOnError) {
        originalOnError(error)
      }
    }
  }
}

/**
 * 设置网络请求拦截器
 */
function setupNetworkInterceptor() {
  // uni.request 拦截
  if (typeof uni !== 'undefined' && uni.addInterceptor) {
    uni.addInterceptor('request', {
      invoke(args) {
        debugLogger.info(`[网络请求] ${args.method || 'GET'} ${args.url}`)
        if (args.data) {
          debugLogger.log(`[请求参数] ${JSON.stringify(args.data)}`)
        }
      },
      success(res) {
        debugLogger.success(`[响应成功] ${res.statusCode}`)
        if (res.data) {
          debugLogger.log(`[响应数据] ${JSON.stringify(res.data)}`)
        }
      },
      fail(err) {
        debugLogger.error(`[请求失败] ${err.errMsg}`)
      }
    })
  }

  // 原生 XMLHttpRequest 拦截（H5）
  if (typeof window !== 'undefined' && window.XMLHttpRequest) {
    const originalOpen = XMLHttpRequest.prototype.open
    const originalSend = XMLHttpRequest.prototype.send

    XMLHttpRequest.prototype.open = function(method, url) {
      this._debugUrl = url
      this._debugMethod = method
      originalOpen.apply(this, arguments)
    }

    XMLHttpRequest.prototype.send = function(data) {
      debugLogger.info(`[XHR] ${this._debugMethod} ${this._debugUrl}`)
      
      this.addEventListener('load', function() {
        if (this.status >= 200 && this.status < 300) {
          debugLogger.success(`[XHR响应] ${this.status}`)
        } else {
          debugLogger.error(`[XHR错误] ${this.status}`)
        }
      })

      this.addEventListener('error', function() {
        debugLogger.error(`[XHR失败] 网络错误`)
      })

      originalSend.apply(this, arguments)
    }
  }
}

/**
 * 格式化参数
 */
function formatArgs(args) {
  return args.map(arg => {
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg)
      } catch (e) {
        return String(arg)
      }
    }
    return String(arg)
  }).join(' ')
}

/**
 * 导出插件和组件
 */
export default DebugConsolePlugin
export { DebugConsole, debugLogger }

