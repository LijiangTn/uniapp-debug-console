<template>
  <view class="page">
    <view class="header">
      <text class="title">Debug Console 示例</text>
    </view>
    
    <view class="content">
      <view class="section">
        <text class="section-title">基础日志</text>
        <view class="btn-group">
          <button class="btn" @click="testLog">Log</button>
          <button class="btn" @click="testInfo">Info</button>
          <button class="btn" @click="testWarn">Warn</button>
          <button class="btn" @click="testError">Error</button>
          <button class="btn" @click="testSuccess">Success</button>
        </view>
      </view>
      
      <view class="section">
        <text class="section-title">对象日志</text>
        <view class="btn-group">
          <button class="btn" @click="testObject">对象</button>
          <button class="btn" @click="testArray">数组</button>
        </view>
      </view>
      
      <view class="section">
        <text class="section-title">批量测试</text>
        <view class="btn-group">
          <button class="btn" @click="test10Logs">10条日志</button>
          <button class="btn" @click="test50Logs">50条日志</button>
        </view>
      </view>
    </view>
    
    <!-- 调试控制台 -->
    <debug-console 
      :enable="true"
      :max-logs="500"
      :auto-save="true"
      :fab-right="40"
      :fab-bottom="200"
    />
  </view>
</template>

<script>
import DebugConsole from '../debug-console.vue'
import debugLogger from '@/utils/debugLogger'

export default {
  name: 'DebugConsolePage',
  
  components: {
    DebugConsole
  },
  
  onLoad() {
    debugLogger.info('页面加载完成')
  },
  
  methods: {
    // 基础日志
    testLog() {
      debugLogger.log('这是一条普通日志')
    },
    
    testInfo() {
      debugLogger.info('这是一条信息日志')
    },
    
    testWarn() {
      debugLogger.warn('这是一条警告日志')
    },
    
    testError() {
      debugLogger.error('这是一条错误日志')
    },
    
    testSuccess() {
      debugLogger.success('操作成功！')
    },
    
    // 对象日志
    testObject() {
      const user = {
        id: 1,
        name: '张三',
        age: 25,
        email: 'zhangsan@example.com'
      }
      debugLogger.info(JSON.stringify(user))
    },
    
    testArray() {
      const arr = [1, 2, 3, 4, 5]
      debugLogger.info(JSON.stringify(arr))
    },
    
    // 批量测试
    test10Logs() {
      for (let i = 1; i <= 10; i++) {
        debugLogger.log(`测试日志 ${i}`)
      }
      uni.showToast({ title: '已生成10条日志', icon: 'none' })
    },
    
    test50Logs() {
      for (let i = 1; i <= 50; i++) {
        const types = ['log', 'info', 'warn', 'error', 'success']
        const type = types[Math.floor(Math.random() * types.length)]
        debugLogger[type](`批量日志 ${i}`)
      }
      uni.showToast({ title: '已生成50条日志', icon: 'none' })
    }
  }
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 40rpx;
}

.header {
  margin-bottom: 60rpx;
  text-align: center;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 40rpx;
}

.section {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
  display: block;
}

.btn-group {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.btn {
  flex: 1;
  min-width: 200rpx;
  height: 80rpx;
  line-height: 80rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: bold;
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
}

.btn:active {
  opacity: 0.8;
  transform: scale(0.98);
}
</style>

