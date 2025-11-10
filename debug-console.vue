<template>
  <!-- 悬浮日志按钮 -->
  <view 
    v-if="!showPanel && isDebugMode" 
    class="log-fab-wrapper"
    :style="{ right: fabRight + 'rpx', bottom: fabBottom + 'rpx' }"
    @click="showPanel = true"
  >
    <!-- 自定义按钮插槽 -->
    <slot name="fab" :log-count="totalLogCount" :open-panel="openPanel">
      <!-- 默认按钮样式 -->
      <view class="log-fab">
        <image src="./static/svg/log-icon.svg" class="log-fab-icon" mode="aspectFit" />
        <text class="log-fab-text">日志</text>
      </view>
    </slot>
  </view>

  <!-- 日志面板 -->
  <view
    v-if="panelVisible && isDebugMode"
    class="log-panel"
    :class="{ 'show': showPanel, 'hide': !showPanel }"
    @transitionend="onPanelTransitionEnd"
    :style="{ height: panelHeight + 'vh' }"
  >
    <!-- 拖拽调整高度的手柄 -->
    <view 
      class="log-panel-handle" 
      @touchstart="onDragStart"
      @touchmove="onDragMove"
      @touchend="onDragEnd"
    >
      <view class="handle-bar"></view>
    </view>

    <!-- 顶部Tab栏 -->
    <view class="log-panel-tabs">
      <view
        v-for="tab in logTypeTabs"
        :key="tab.value"
        :class="['log-tab', {active: activeTab === tab.value}]"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
        <text v-if="tab.count > 0" class="tab-count">({{ tab.count }})</text>
      </view>
    </view>

    <!-- 搜索工具栏 -->
    <view class="log-toolbar">
      <view class="toolbar-search">
        <input
          class="log-filter-input"
          v-model="filterText"
          placeholder="搜索日志（支持正则）..."
          @input="onFilterInput"
          @confirm="onSearchConfirm"
          maxlength="100"
        />
        <view v-if="filterText" class="search-clear" @click="clearSearch">
          <image src="./static/svg/clear.svg" class="search-clear-icon" />
        </view>
      </view>
      <view class="toolbar-options">
        <view class="option-item" @click="toggleRegex">
          <text :class="['option-text', { active: useRegex }]">.*</text>
        </view>
        <view class="option-item" @click="toggleCaseSensitive">
          <text :class="['option-text', { active: caseSensitive }]">Aa</text>
        </view>
      </view>
    </view>

    <!-- 日志内容区 -->
    <scroll-view 
      scroll-y 
      class="log-panel-body" 
      ref="logScrollView" 
      :scroll-into-view="scrollIntoViewId" 
      scroll-with-animation
      :enable-flex="true"
    >
      <view id="log-top-anchor"></view>
      
      <!-- 空状态提示 -->
      <view v-if="filteredLogs.length === 0" class="log-empty">
        <text class="empty-text">{{ logs.length === 0 ? '暂无日志' : '无匹配日志' }}</text>
      </view>

      <!-- 日志列表 -->
      <view 
        v-for="(log, index) in filteredLogs" 
        :key="log.id" 
        class="log-item"
        :class="[log.type, { 'expanded': expandedLogs[log.id] }]"
      >
        <view class="log-header" @click="toggleLogExpand(log)">
          <text class="log-time">{{ log.time }}</text>
        </view>
        
        <view class="log-content">
          <!-- 普通文本消息 -->
          <view v-if="!log.isObject" class="log-message" :class="log.type">
            <!-- 有搜索时使用高亮 -->
            <rich-text v-if="filterText" :nodes="highlightText(log.message)"></rich-text>
            <!-- 无搜索时直接显示 -->
            <text v-else>{{ log.message }}</text>
          </view>
          
          <!-- JSON对象消息 -->
          <view v-else class="log-object">
            <view class="object-preview" v-if="!expandedLogs[log.id]">
              <text>{{ log.preview }}</text>
            </view>
            <view class="object-full" v-else>
              <text class="json-text">{{ log.formatted }}</text>
            </view>
          </view>
        </view>

        <!-- 日志操作按钮 -->
        <view class="log-actions">
          <view class="log-action-btn" @click="copyLog(log.message)">
            <image src="./static/svg/copy.svg" class="action-icon-sm" />
          </view>
          <view v-if="log.isObject" class="log-action-btn" @click="toggleLogExpand(log)">
            <text class="expand-icon">{{ expandedLogs[log.id] ? '−' : '+' }}</text>
          </view>
        </view>
      </view>
      
      <view id="log-bottom-anchor"></view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="log-panel-actions">
      <view class="log-action-btns">
        <button class="action-btn" @click="copyAllLogs">
          <image src="./static/svg/copy.svg" class="action-icon" />
        </button>
        <button class="action-btn" @click="clearLogs">
          <image src="./static/svg/clear.svg" class="action-icon" />
        </button>
        <button class="action-btn" @click="scrollToTop">
          <image src="./static/svg/top.svg" class="action-icon" />
        </button>
        <button class="action-btn" @click="scrollToBottom">
          <image src="./static/svg/top.svg" class="action-icon" style="transform: rotate(180deg)"/>
        </button>
        <button class="action-btn" @click="showPanel = false">
          <image src="./static/svg/hide.svg" class="action-icon" />
        </button>
      </view>
    </view>
  </view>
</template>

<script>
// 导入全局日志工具
import debugLogger from '@/utils/debugLogger';

export default {
  name: 'DebugConsole',
  
  /**************************************** Props配置 ****************************************/
  props: {
    // 是否启用调试模式
    enable: {
      type: Boolean,
      default: false
    },
    // 最大日志数量
    maxLogs: {
      type: Number,
      default: 500
    },
    // 是否自动保存到本地
    autoSave: {
      type: Boolean,
      default: true
    },
    // 本地存储键名
    storageKey: {
      type: String,
      default: 'debug_console_logs'
    },
    // 悬浮按钮位置 - 右侧距离（rpx）
    fabRight: {
      type: Number,
      default: 40
    },
    // 悬浮按钮位置 - 底部距离（rpx）
    fabBottom: {
      type: Number,
      default: 200
    }
  },

  /**************************************** 数据属性 ****************************************/
  data() {
    return {
      // 日志数据
      logs: [],
      logId: 0,
      
      // UI状态
      isDebugMode: false,
      showPanel: false,
      panelVisible: false,
      panelHeight: 50, // 面板高度（vh）
      
      // 拖拽相关
      isDragging: false,
      dragStartY: 0,
      dragStartHeight: 0,
      
      // Tab配置
      logTypeTabs: [
        { label: 'All', value: 'all', count: 0 },
        { label: 'Log', value: 'log', count: 0 },
        { label: 'Info', value: 'info', count: 0 },
        { label: 'Warn', value: 'warning', count: 0 },
        { label: 'Error', value: 'error', count: 0 },
        { label: 'Success', value: 'success', count: 0 }
      ],
      activeTab: 'all',
      
      // 搜索过滤
      filterText: '',
      useRegex: false,
      caseSensitive: false,
      
      // 日志展开状态
      expandedLogs: {},
      
      // 滚动控制
      scrollIntoViewId: '',
      
      // 性能监控
      performanceData: {
        fps: 0,
        memory: 0
      }
    }
  },

  /**************************************** 计算属性 ****************************************/
  computed: {
    /**
     * 过滤后的日志列表
     */
    filteredLogs() {
      let logs = this.logs;
      
      // 按类型过滤
      if (this.activeTab !== 'all') {
        logs = logs.filter(log => log.type === this.activeTab);
      }
      
      // 按搜索文本过滤
      if (this.filterText) {
        try {
          if (this.useRegex) {
            // 正则表达式搜索
            const flags = this.caseSensitive ? '' : 'i';
            const regex = new RegExp(this.filterText, flags);
            logs = logs.filter(log => regex.test(log.message));
          } else {
            // 普通文本搜索
            const searchText = this.caseSensitive ? this.filterText : this.filterText.toLowerCase();
            logs = logs.filter(log => {
              const logMessage = this.caseSensitive ? log.message : log.message.toLowerCase();
              return logMessage.includes(searchText);
            });
          }
        } catch (e) {
          // 正则表达式错误时回退到普通搜索
          console.warn('正则表达式错误:', e);
        }
      }
      
      return logs;
    },

    /**
     * 总日志计数
     */
    totalLogCount() {
      return this.logs.length;
    }
  },
  /**************************************** 监听属性 ****************************************/
  watch: {
    showPanel(val) {
      if (val) {
        this.panelVisible = true;
      }
    },
    
    logs: {
      handler() {
        // 更新Tab计数
        this.updateTabCounts();
        // 自动保存到本地
        if (this.autoSave) {
          this.saveToLocal();
        }
      },
      deep: true
    },

    enable: {
      handler(val) {
        this.isDebugMode = val;
      },
      immediate: true
    }
  },

  /**************************************** 生命周期 ****************************************/
  mounted() {
    // 从本地加载历史日志
    if (this.autoSave) {
      this.loadFromLocal();
    }

    // 注册为debugLogger的监听器
    debugLogger.addListener(this.handleGlobalLog);
    
    // 导入debugLogger中已有的日志
    const existingLogs = debugLogger.getLogs();
    existingLogs.forEach(log => {
      this.addLog(log.message, log.type);
    });

    // 捕获全局JS错误
    if (typeof window !== 'undefined') {
      this.setupErrorHandlers();
      this.setupConsoleInterception();
    }

    // 监听全局日志事件
    if (this.$root.$logBus) {
      this.$root.$logBus.$on('log', this.handleGlobalLog);
    }

    // 初始化Tab计数
    this.updateTabCounts();
  },

  beforeDestroy() {
    // 移除debugLogger监听器
    debugLogger.removeListener(this.handleGlobalLog);
    
    // 移除全局日志事件监听
    if (this.$root.$logBus) {
      this.$root.$logBus.$off('log', this.handleGlobalLog);
    }

    // 最后一次保存
    if (this.autoSave) {
      this.saveToLocal();
    }
  },
  /**************************************** 方法 ****************************************/
  methods: {
    /**************************************** 初始化：设置错误处理器 ****************************************/
    setupErrorHandlers() {
      window.onerror = (msg, url, line, col, error) => {
        this.addLog(`[JS错误] ${msg} @${url}:${line}:${col}`, 'error');
        return false; // 继续传播错误
      };

      window.onunhandledrejection = (event) => {
        this.addLog(`[Promise错误] ${event.reason}`, 'error');
      };
    },

    /**************************************** 初始化：拦截console ****************************************/
    setupConsoleInterception() {
      const originalConsole = {
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error
      };

      console.log = (...args) => {
        this.addLog('[console.log] ' + this.formatArgs(args), 'log');
        originalConsole.log.apply(console, args);
      };

      console.info = (...args) => {
        this.addLog('[console.info] ' + this.formatArgs(args), 'info');
        originalConsole.info.apply(console, args);
      };

      console.warn = (...args) => {
        this.addLog('[console.warn] ' + this.formatArgs(args), 'warning');
        originalConsole.warn.apply(console, args);
      };

      console.error = (...args) => {
        this.addLog('[console.error] ' + this.formatArgs(args), 'error');
        originalConsole.error.apply(console, args);
      };
    },

    /**************************************** 格式化参数 ****************************************/
    formatArgs(args) {
      return args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');
    },

    /**************************************** 添加日志（核心方法） ****************************************/
    addLog(message, type = 'info') {
      const time = this.formatTime(new Date());
      const messageStr = typeof message === 'string' ? message : this.formatArgs([message]);
      
      // 判断是否为对象
      const isObject = this.isObjectMessage(messageStr);
      
      const log = {
        id: this.logId++,
        time,
        message: messageStr,
        type,
        isObject,
        preview: isObject ? this.getObjectPreview(messageStr) : '',
        formatted: isObject ? this.formatJSON(messageStr) : ''
      };

      this.logs.unshift(log);
      
      // 限制最大日志数量
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(0, this.maxLogs);
      }
    },

    /**************************************** 判断是否为对象消息 ****************************************/
    isObjectMessage(message) {
      return message.startsWith('{') || message.startsWith('[');
    },

    /**************************************** 获取对象预览 ****************************************/
    getObjectPreview(message) {
      try {
        const obj = JSON.parse(message);
        const preview = JSON.stringify(obj);
        return preview.length > 100 ? preview.substring(0, 100) + '...' : preview;
      } catch (e) {
        return message.substring(0, 100);
      }
    },

    /**************************************** 格式化JSON ****************************************/
    formatJSON(message) {
      try {
        const obj = JSON.parse(message);
        return JSON.stringify(obj, null, 2);
      } catch (e) {
        return message;
      }
    },

    /**************************************** 格式化时间 ****************************************/
    formatTime(date) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const ms = String(date.getMilliseconds()).padStart(3, '0');
      return `${hours}:${minutes}:${seconds}.${ms}`;
    },

    /**************************************** 获取类型标签 ****************************************/
    getTypeLabel(type) {
      const labels = {
        log: 'LOG',
        info: 'INFO',
        warning: 'WARN',
        error: 'ERR',
        success: 'OK'
      };
      return labels[type] || type.toUpperCase();
    },

    /**************************************** 高亮搜索文本 ****************************************/
    highlightText(text) {
      if (!this.filterText || !text) return text;
      
      try {
        if (this.useRegex) {
          const flags = this.caseSensitive ? 'g' : 'gi';
          const regex = new RegExp(this.filterText, flags);
          return text.replace(regex, match => `<span style="background: #ffeb3b; color: #000;">${match}</span>`);
        } else {
          const searchText = this.caseSensitive ? this.filterText : this.filterText.toLowerCase();
          const textToSearch = this.caseSensitive ? text : text.toLowerCase();
          
          let result = '';
          let lastIndex = 0;
          let index = textToSearch.indexOf(searchText);
          
          while (index !== -1) {
            result += text.substring(lastIndex, index);
            result += `<span style="background: #ffeb3b; color: #000;">${text.substring(index, index + searchText.length)}</span>`;
            lastIndex = index + searchText.length;
            index = textToSearch.indexOf(searchText, lastIndex);
          }
          result += text.substring(lastIndex);
          
          return result;
        }
      } catch (e) {
        return text;
      }
    },

    /**************************************** 切换日志展开 ****************************************/
    toggleLogExpand(log) {
      if (!log.isObject) return;
      this.$set(this.expandedLogs, log.id, !this.expandedLogs[log.id]);
    },

    /**************************************** 清空日志 ****************************************/
    clearLogs() {
      this.logs = [];
      this.expandedLogs = {};
      this.logId = 0;
      debugLogger.clearLogs();
      uni.showToast({ title: '已清空', icon: 'none' });
    },

    /**************************************** 复制单条日志 ****************************************/
    copyLog(text) {
      uni.setClipboardData({
        data: text,
        success: () => {
          uni.showToast({ title: '已复制', icon: 'none', duration: 1500 });
        }
      });
    },

    /**************************************** 复制所有日志 ****************************************/
    copyAllLogs() {
      if (this.filteredLogs.length === 0) {
        uni.showToast({ title: '没有日志可复制', icon: 'none' });
        return;
      }
      
      const logsText = this.filteredLogs.map(log => {
        return `[${log.time}] [${this.getTypeLabel(log.type)}] ${log.message}`;
      }).join('\n');
      
      uni.setClipboardData({
        data: logsText,
        success: () => {
          uni.showToast({ 
            title: `已复制 ${this.filteredLogs.length} 条日志`, 
            icon: 'none',
            duration: 2000
          });
        },
        fail: () => {
          uni.showToast({ title: '复制失败', icon: 'none' });
        }
      });
    },

    /**************************************** 搜索相关 ****************************************/
    onFilterInput(e) {
      this.filterText = e.detail.value || e.target.value || '';
    },

    onSearchConfirm() {
      // 搜索确认（可以添加搜索历史等功能）
    },

    clearSearch() {
      this.filterText = '';
    },

    toggleRegex() {
      this.useRegex = !this.useRegex;
      uni.showToast({ 
        title: this.useRegex ? '正则模式' : '普通搜索', 
        icon: 'none',
        duration: 1000
      });
    },

    toggleCaseSensitive() {
      this.caseSensitive = !this.caseSensitive;
      uni.showToast({ 
        title: this.caseSensitive ? '区分大小写' : '不区分大小写', 
        icon: 'none',
        duration: 1000
      });
    },

    /**************************************** 滚动控制 ****************************************/
    scrollToTop() {
      this.scrollIntoViewId = 'log-top-anchor';
      setTimeout(() => { this.scrollIntoViewId = ''; }, 100);
    },

    scrollToBottom() {
      this.scrollIntoViewId = 'log-bottom-anchor';
      setTimeout(() => { this.scrollIntoViewId = ''; }, 100);
    },

    /**************************************** 拖拽调整高度 ****************************************/
    onDragStart(e) {
      this.isDragging = true;
      this.dragStartY = e.touches[0].clientY;
      this.dragStartHeight = this.panelHeight;
    },

    onDragMove(e) {
      if (!this.isDragging) return;
      
      const currentY = e.touches[0].clientY;
      const deltaY = this.dragStartY - currentY;
      const viewportHeight = uni.getSystemInfoSync().windowHeight;
      const deltaVh = (deltaY / viewportHeight) * 100;
      
      let newHeight = this.dragStartHeight + deltaVh;
      // 限制高度范围 20vh ~ 80vh
      newHeight = Math.max(20, Math.min(80, newHeight));
      
      this.panelHeight = newHeight;
    },

    onDragEnd() {
      this.isDragging = false;
    },

    /**************************************** 面板动画结束 ****************************************/
    onPanelTransitionEnd() {
      if (!this.showPanel) {
        this.panelVisible = false;
      }
    },

    /**************************************** 更新Tab计数 ****************************************/
    updateTabCounts() {
      this.logTypeTabs.forEach(tab => {
        if (tab.value === 'all') {
          tab.count = this.logs.length;
        } else {
          tab.count = this.logs.filter(log => log.type === tab.value).length;
        }
      });
    },

    /**************************************** 本地存储：保存 ****************************************/
    saveToLocal() {
      try {
        const data = {
          logs: this.logs.slice(0, 100), // 只保存最近100条
          timestamp: Date.now()
        };
        uni.setStorageSync(this.storageKey, JSON.stringify(data));
      } catch (e) {
        console.error('保存日志失败:', e);
      }
    },

    /**************************************** 本地存储：加载 ****************************************/
    loadFromLocal() {
      try {
        const dataStr = uni.getStorageSync(this.storageKey);
        if (dataStr) {
          const data = JSON.parse(dataStr);
          // 只加载1小时内的日志
          if (Date.now() - data.timestamp < 3600000) {
            this.logs = data.logs || [];
            this.logId = this.logs.length > 0 ? Math.max(...this.logs.map(l => l.id)) + 1 : 0;
          }
        }
      } catch (e) {
        console.error('加载日志失败:', e);
      }
    },

    /**************************************** 处理全局日志 ****************************************/
    handleGlobalLog(log) {
      if (log.type === 'clear') {
        this.logs = [];
        this.logId = 0;
      } else {
        this.addLog(log.message, log.type);
      }
    },

    /**************************************** 打开面板（供插槽使用） ****************************************/
    openPanel() {
      this.showPanel = true;
    }
  }
}
</script>

<style scoped lang="scss">
/**************************************** 悬浮按钮样式 ****************************************/
.log-fab-wrapper {
  position: fixed;
  z-index: 9999;
}

.log-fab {
  width: 100rpx;
  height: 100rpx;
  background: rgba(0, 0, 0, 0.85);
  border-radius: 50%;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0.85;
  transition: all 0.2s;
}

.log-fab:hover {
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.3);
  opacity: 1;
}

.log-fab:active {
  transform: scale(0.95);
}

.log-fab-icon {
  width: 48rpx;
  height: 48rpx;
  margin-bottom: 4rpx;
  filter: brightness(0) invert(1);
}

.log-fab-text {
  color: #fff;
  font-size: 24rpx;
  font-weight: bold;
}

/**************************************** 面板样式 ****************************************/
.log-panel {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  background: linear-gradient(180deg, rgba(20, 20, 25, 0.98) 0%, rgba(15, 15, 20, 0.99) 100%);
  border-radius: 32rpx 32rpx 0 0;
  z-index: 9998;
  box-shadow: 0 -8rpx 40rpx rgba(0, 0, 0, 0.3), 0 -2rpx 16rpx rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(20rpx);
  opacity: 0;
  transform: translateY(40rpx) scale(0.98);
  pointer-events: none;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.log-panel.show {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

.log-panel.hide {
  opacity: 0;
  transform: translateY(40rpx) scale(0.98);
  pointer-events: none;
}

/**************************************** 拖拽手柄 ****************************************/
.log-panel-handle {
  width: 100%;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  position: relative;
}

.log-panel-handle:active {
  cursor: grabbing;
}

.handle-bar {
  width: 80rpx;
  height: 8rpx;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4rpx;
  transition: all 0.2s;
}

.log-panel-handle:active .handle-bar {
  width: 120rpx;
  background: rgba(255, 255, 255, 0.5);
}
/**************************************** Tab栏样式 ****************************************/
.log-panel-tabs {
  display: flex;
  border-bottom: 2px solid rgba(255, 255, 255, 0.08);
  background: rgba(30, 30, 35, 0.6);
  backdrop-filter: blur(10rpx);
}

.log-tab {
  flex: 1;
  text-align: center;
  padding: 24rpx 12rpx;
  color: rgba(255, 255, 255, 0.6);
  font-size: 26rpx;
  cursor: pointer;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
}

.log-tab:active {
  background: rgba(255, 255, 255, 0.05);
}

.log-tab.active {
  color: #fff;
  font-weight: 600;
}

.log-tab.active::after {
  content: '';
  display: block;
  position: absolute;
  left: 20%;
  right: 20%;
  bottom: 0;
  height: 4rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 2rpx;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: scaleX(0);
    opacity: 0;
  }
  to {
    transform: scaleX(1);
    opacity: 1;
  }
}

.tab-count {
  margin-left: 4rpx;
  font-size: 22rpx;
  opacity: 0.8;
}

/**************************************** 工具栏样式 ****************************************/
.log-toolbar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 24rpx;
  background: rgba(25, 25, 30, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.toolbar-search {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.log-filter-input {
  flex: 1;
  height: 64rpx;
  border-radius: 32rpx;
  border: none;
  background: rgba(50, 50, 60, 0.8);
  color: #fff;
  font-size: 26rpx;
  padding: 0 100rpx 0 32rpx;
  outline: none;
  box-sizing: border-box;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.log-filter-input:focus {
  background: rgba(60, 60, 70, 1);
  border-color: rgba(102, 126, 234, 0.5);
}

.search-clear {
  position: absolute;
  right: 16rpx;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.2s;
  border-radius: 50%;
}

.search-clear:active {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
}

.search-clear-icon {
  width: 28rpx;
  height: 28rpx;
  filter: brightness(0) invert(1);
}

.toolbar-options {
  display: flex;
  gap: 12rpx;
}

.option-item {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(50, 50, 60, 0.8);
  border-radius: 28rpx;
  cursor: pointer;
  transition: all 0.2s;
}

.option-item:active {
  transform: scale(0.95);
  background: rgba(60, 60, 70, 1);
}

.option-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
  font-weight: bold;
  transition: all 0.2s;
}

.option-text.active {
  color: #667eea;
}

/**************************************** 日志内容区样式 ****************************************/
.log-panel-body {
  flex: 1;
  padding: 12rpx;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.log-panel-body::-webkit-scrollbar {
  width: 8rpx;
}

.log-panel-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4rpx;
}

.log-panel-body::-webkit-scrollbar-track {
  background: transparent;
}

.log-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
  opacity: 0.5;
}

.empty-text {
  color: #999;
  font-size: 28rpx;
}

.log-item {
  position: relative;
  padding: 20rpx;
  margin-bottom: 12rpx;
  background: rgba(30, 30, 40, 0.5);
  border-radius: 16rpx;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s;
}

.log-item:active {
  background: rgba(40, 40, 50, 0.7);
}

.log-item.expanded {
  background: rgba(40, 40, 50, 0.8);
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.log-time {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.4);
  font-family: 'Monaco', 'Courier New', monospace;
}


.log-content {
  position: relative;
}

.log-message {
  color: rgba(255, 255, 255, 0.9);
  font-size: 26rpx;
  line-height: 1.6;
  word-break: break-word;
}

.log-message text {
  color: inherit;
  font-size: inherit;
  line-height: inherit;
}

.log-message.warning,
.log-message.warning text {
  color: #fbbf24;
}

.log-message.error,
.log-message.error text {
  color: #ef4444;
  font-weight: 500;
}

.log-object {
  margin-top: 8rpx;
}

.object-preview {
  color: rgba(255, 255, 255, 0.7);
  font-size: 24rpx;
  font-family: 'Monaco', 'Courier New', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.object-full {
  background: rgba(20, 20, 30, 0.8);
  padding: 16rpx;
  border-radius: 12rpx;
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-height: 600rpx;
  overflow-y: auto;
}

.json-text {
  color: #a5d6ff;
  font-size: 24rpx;
  font-family: 'Monaco', 'Courier New', monospace;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-all;
}

.log-actions {
  position: absolute;
  right: 16rpx;
  top: 16rpx;
  display: flex;
  gap: 12rpx;
}

.log-action-btn {
  width: 52rpx;
  height: 52rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(50, 50, 60, 0.8);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.log-action-btn:active {
  transform: scale(0.9);
  background: rgba(70, 70, 80, 1);
}

.action-icon-sm {
  width: 28rpx;
  height: 28rpx;
  filter: brightness(0) invert(1);
  opacity: 0.7;
}

.expand-icon {
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.7);
  font-weight: bold;
}
/**************************************** 底部操作栏样式 ****************************************/
.log-panel-actions {
  padding: 16rpx 32rpx 24rpx 32rpx;
  border-top: 1px solid #444;
  background: transparent;
}

.log-action-btns {
  display: flex;
  justify-content: flex-end;
  gap: 18rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 10rpx;
  font-size: 26rpx;
  padding: 12rpx 32rpx;
  background: #232323;
  border: none;
  color: #fff;
  border-radius: 24rpx;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.10);
  outline: none;
}

.action-btn:active,
.action-btn:focus {
  background: #393939 !important;
  color: #ffd700 !important;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.18);
}

.action-icon {
  width: 32rpx;
  height: 32rpx;
  vertical-align: middle;
}

/**************************************** 响应式和兼容性 ****************************************/
/* iOS安全区域适配 */
@supports (bottom: env(safe-area-inset-bottom)) {
  .log-panel-actions {
    padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  }
}

/* Android 适配 */
@supports (bottom: constant(safe-area-inset-bottom)) {
  .log-panel-actions {
    padding-bottom: calc(32rpx + constant(safe-area-inset-bottom));
  }
}

/* 小屏幕适配 */
@media screen and (max-width: 750rpx) {
  .log-fab {
    width: 100rpx;
    height: 100rpx;
    right: 30rpx;
    bottom: 150rpx;
  }

  .log-fab-icon {
    width: 48rpx;
    height: 48rpx;
  }

  .log-fab-text {
    font-size: 20rpx;
  }
}

/* 大屏幕适配 */
@media screen and (min-width: 1200rpx) {
  .log-panel {
    max-width: 1200rpx;
    left: 50%;
    transform: translateX(-50%);
  }

  .log-panel.show {
    transform: translateX(-50%) translateY(0);
  }
}

/**************************************** 动画优化 ****************************************/
/* 启用硬件加速 */
.log-fab,
.log-panel,
.log-tab,
.log-item,
.action-btn {
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  will-change: transform, opacity;
}

/* 滚动优化 */
.log-panel-body {
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}
</style>
