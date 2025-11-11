// utils/debugLogger.js
// 全局日志工具类，用于在js文件中记录日志并与debug-console组件通信

// 存储日志的数组
let logBuffer = [];
// 日志监听器
let logListeners = [];

/**
 * 全局日志工具类
 */
const debugLogger = {
  /**
   * 添加日志
   * @param {string} message - 日志消息
   * @param {string} type - 日志类型，可选值：log, info, warning, error
   */
  addLog(message, type = 'log') {
    // 格式化日志消息
    const formattedMessage = typeof message === 'object' 
      ? JSON.stringify(message) 
      : String(message);
    
    // 创建日志对象
    const logItem = {
      message: formattedMessage,
      type: type,
      time: new Date().toLocaleTimeString(),
      id: Date.now()
    };
    
    // 添加到日志缓冲区
    logBuffer.push(logItem);
    
    // 如果缓冲区过大，移除最早的日志
    if (logBuffer.length > 100) {
      logBuffer.shift();
    }
    
    // 通知所有监听器
    logListeners.forEach(listener => {
      try {
        listener(logItem);
      } catch (e) {
        console.error('日志监听器调用失败:', e);
      }
    });
    
    // 同时使用原生console输出，便于开发调试
    switch(type) {
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warning':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  },
  
  /**
   * 添加日志监听器
   * @param {Function} listener - 监听函数，接收日志对象作为参数
   */
  addListener(listener) {
    if (typeof listener === 'function' && !logListeners.includes(listener)) {
      logListeners.push(listener);
    }
  },
  
  /**
   * 移除日志监听器
   * @param {Function} listener - 要移除的监听函数
   */
  removeListener(listener) {
    const index = logListeners.indexOf(listener);
    if (index !== -1) {
      logListeners.splice(index, 1);
    }
  },
  
  /**
   * 获取所有缓存的日志
   * @returns {Array} 日志数组
   */
  getLogs() {
    return [...logBuffer];
  },
  
  /**
   * 清空日志缓冲区
   */
  clearLogs() {
    logBuffer = [];
    // 通知所有监听器日志已清空
    logListeners.forEach(listener => {
      try {
        listener({ type: 'clear' });
      } catch (e) {
        console.error('日志清空通知失败:', e);
      }
    });
  }
};

// 添加便捷方法
debugLogger.log = (message) => debugLogger.addLog(message, 'log');
debugLogger.info = (message) => debugLogger.addLog(message, 'info');
debugLogger.warn = (message) => debugLogger.addLog(message, 'warning');
debugLogger.error = (message) => debugLogger.addLog(message, 'error');

export default debugLogger; 