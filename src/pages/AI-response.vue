<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶部导航栏 (与知识图谱页面一致) -->
    <header class="header">
      <div class="logo-section">
        <img src="./img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">知识图谱管理系统</h1>
      </div>
      <div class="user-section">
        <div class="current-time">{{ currentTime }}</div>
        <button class="theme-toggle" @click="toggleTheme" :title="isDark ? '切换到亮色模式' : '切换到暗色模式'">
          <i :class="isDark ? 'fas fa-sun' : 'fas fa-moon'"></i>
        </button>
        <div class="avatar-wrapper" ref="avatarWrapper">
          <div class="avatar" @click.stop="toggleDropdown">
            <i class="fas fa-user-circle"></i>
            <span class="username" v-if="userInfo">{{ userInfo.username || userInfo.email?.split('@')[0] }}</span>
          </div>
          <div v-if="showDropdown" class="dropdown-menu">
            <a href="#" class="dropdown-item" @click.prevent="goToProfile">个人中心</a>
            <a href="#" class="dropdown-item" @click.prevent="logout">退出</a>
          </div>
        </div>
      </div>
    </header>

    <main class="main-content">
      <!-- 左侧导航栏 (与知识图谱页面一致，智能问答高亮) -->
      <aside class="sidebar">
        <nav class="nav-menu">
          <a href="#" class="nav-item" @click.prevent="goToGraph">
            <i class="fas fa-atom icon"></i>
            <span class="nav-text">知识图谱</span>
          </a>
          <a href="#" class="nav-item" @click.prevent="goToAdvancedSearch">
            <i class="fas fa-book-atlas icon"></i>
            <span class="nav-text">高级检索</span>
          </a>
          <a href="#" class="nav-item active">
            <i class="fas fa-robot icon"></i>
            <span class="nav-text">智能问答</span>
          </a>
          <a href="#" class="nav-item" @click.prevent="goToProfile">
            <i class="fas fa-user icon"></i>
            <span class="nav-text">个人中心</span>
          </a>
        </nav>
      </aside>

      <!-- 右侧内容区域 - 智能问答界面 -->
      <section class="content-section">
        <div class="chat-card">
          <!-- 聊天标题 -->
          <div class="chat-header">
            <h3>
              <i class="fas fa-robot" style="margin-right: 8px"></i>
              AI 知识助手
            </h3>
            <span class="model-badge">知识图谱增强 v1.0</span>
          </div>

          <!-- 聊天记录区域 -->
          <div
            class="chat-messages"
            ref="messagesContainer"
            @scroll="handleScroll"
          >
            <div v-if="messages.length === 0" class="welcome-message">
              <i class="fas fa-comment-dots"></i>
              <p>
                你好！我是你的知识图谱智能助手。
              </p>
            </div>

            <div
              v-for="(msg, index) in messages"
              :key="index"
              class="message-row"
              :class="msg.role"
            >
              <div class="avatars">
                <i :class="msg.role === 'user' ? 'fas fa-user' : 'fas fa-robot'"></i>
              </div>
              <div class="message-content">
                <div
                  class="message-bubble"
                  :class="{ 'streaming-message': msg.isStreaming }"
                  v-html="formatMessage(msg.content)"
                ></div>
                <!-- 添加打字机光标（仅当消息正在流式输出时显示） -->
                <!-- <span v-if="msg.isStreaming" class="typing-cursor">···</span> -->
                <div
                  v-if="msg.sources && msg.sources.length"
                  class="message-sources"
                >
                  <span>来源: </span>
                  <span
                    v-for="(src, i) in msg.sources"
                    :key="i"
                    class="source-tag"
                  >
                    {{ src }}
                  </span>
                </div>
                <div class="message-time">{{ msg.time }}</div>
              </div>
            </div>

            <!-- AI 正在输入指示器（仅在非流式模式下备用） -->
            <div v-if="isLoading && currentStreamingIndex === -1" class="message-row assistant">
              <div class="avatars">
                <i class="fas fa-robot"></i>
              </div>
              <div class="message-content">
                <div class="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          </div>

          <!-- 输入区域 -->
          <div class="chat-input-area">
            <input
              v-model="userInput"
              type="text"
              placeholder="输入你的问题..."
              class="chat-input"
              @keyup.enter="sendMessage"
              :disabled="isLoading"
            />
            <button
              @click="sendMessage"
              class="send-btn"
              :disabled="!userInput.trim() || isLoading"
            >
              <i class="fas fa-paper-plane"></i>
              <span>发送</span>
            </button>
          </div>

          <!-- 快捷操作提示 -->
          <div class="chat-footer">
            <button class="clear-btn" @click="clearHistory" v-if="messages.length">
              <i class="fas fa-trash-alt"></i> 清空对话
            </button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onMounted, onBeforeUnmount } from "vue";
import { marked } from "marked";

// ---------- 用户及主题相关 ----------
const showDropdown = ref(false);
const avatarWrapper = ref(null);
const userInfo = ref(null);
const currentTime = ref(new Date().toLocaleTimeString());
const isDark = ref(false);

// 计算显示的用户名
// const displayName = computed(() => {
//   if (!userInfo.value) return '';
//   return userInfo.value.username || (userInfo.value.email ? userInfo.value.email.split('@')[0] : '用户');
// });

const toggleTheme = () => {
  isDark.value = !isDark.value;
};

let timer = null;
const updateTime = () => {
  currentTime.value = new Date().toLocaleTimeString();
};

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

const handleClickOutside = (event) => {
  if (avatarWrapper.value && !avatarWrapper.value.contains(event.target)) {
    showDropdown.value = false;
  }
};

// 路由跳转
const goToGraph = () => {
  window.location.href = "http://localhost:5173/knowledge";
};
const goToAdvancedSearch = () => {
  window.location.href = "http://localhost:5173/reseach";
};
const goToProfile = () => {
  window.location.href = "http://localhost:5173/person";
};

const logout = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("user_info");
  window.location.href = "http://localhost:5173/";
  showDropdown.value = false;
};

// ---------- 智能问答相关 ----------
const userInput = ref("");
const messages = ref([]);
const isLoading = ref(false);
const messagesContainer = ref(null);
const currentStreamingIndex = ref(-1); // 当前正在流式输出的消息索引

// 示例问题（可取消注释使用）
// const exampleQuestions = [
//   "乔布斯和苹果公司的关系",
//   "Vue.js 的作者是谁",
//   "人工智能有哪些应用领域",
//   "介绍一下深度学习",
//   "React 和 Vue 的区别",
// ];

/**
 * 流式调用 AI API - 支持打字机效果
 */
const callStreamAI = async (question) => {
  const token = localStorage.getItem('authToken');
  
  // 创建一条空的AI消息，用于流式填充
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
  
  const aiMessage = {
    role: "assistant",
    content: "", // 初始为空，逐步填充
    sources: [],
    time: timeStr,
    isStreaming: true // 标记为流式消息
  };
  
  messages.value.push(aiMessage);
  currentStreamingIndex.value = messages.value.length - 1;
  await scrollToBottom();

  try {
    const response = await fetch("http://localhost:3001/api/chat/stream", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error(`API 请求失败 (${response.status})`);
    }

    // 获取响应的reader来读取流式数据
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // 解码二进制数据
      buffer += decoder.decode(value, { stream: true });
      
      // 解析SSE格式的数据 (格式: data: {...}\n\n)
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // 保留不完整的最后一个chunk

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'chunk') {
              // 更新当前流式消息的内容
              const currentMsg = messages.value[currentStreamingIndex.value];
              if (currentMsg && currentMsg.isStreaming) {
                currentMsg.content += data.content;
                // 触发视图更新并滚动
                await nextTick();
                scrollToBottom();
              }
            } else if (data.type === 'done') {
              // 流式传输完成，移除流式标记
              const currentMsg = messages.value[currentStreamingIndex.value];
              if (currentMsg) {
                currentMsg.isStreaming = false;
              }
              currentStreamingIndex.value = -1;
              await scrollToBottom();
            } else if (data.type === 'error') {
              throw new Error(data.content);
            }
          } catch (e) {
            console.error('解析流数据失败:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error("流式AI响应错误:", error);
    
    // 如果出错，更新当前流式消息为错误信息
    if (currentStreamingIndex.value !== -1) {
      const errorMsg = messages.value[currentStreamingIndex.value];
      if (errorMsg) {
        errorMsg.content = "抱歉，我遇到了一些技术问题，请稍后再试。";
        errorMsg.isStreaming = false;
      }
    } else {
      // 如果没有流式消息，添加一条错误消息
      addMessage("assistant", "抱歉，我遇到了一些技术问题，请稍后再试。", []);
    }
    currentStreamingIndex.value = -1;
  }
};

/**
 * 备用：非流式调用（兼容旧接口）
 */
const callRealAI = async (question) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch("http://localhost:3001/api/chat", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${token}` : ''
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    throw new Error(`API 请求失败 (${response.status})`);
  }

  const data = await response.json();
  return {
    content: data.answer,
    sources: data.sources || [],
  };
};

// 发送消息
const sendMessage = async () => {
  const text = userInput.value.trim();
  if (!text || isLoading.value) return;

  // 添加用户消息
  addMessage("user", text);
  userInput.value = "";
  await scrollToBottom();

  isLoading.value = true;

  try {
    // 使用流式接口
    await callStreamAI(text);
  } catch (error) {
    console.error("AI响应错误:", error);
    addMessage("assistant", "抱歉，我遇到了一些技术问题，请稍后再试。", []);
  } finally {
    isLoading.value = false;
  }
};

// 添加消息（普通消息）
const addMessage = (role, content, sources = []) => {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
  messages.value.push({
    role,
    content,
    sources,
    time: timeStr,
    isStreaming: false
  });
};

// 发送示例问题
const sendExample = (question) => {
  userInput.value = question;
  sendMessage();
};

// 清空对话
const clearHistory = () => {
  if (confirm("确定清空所有对话记录吗？")) {
    messages.value = [];
    currentStreamingIndex.value = -1;
  }
};

// 格式化消息 (Markdown)
const formatMessage = (content) => {
  if (!content) return '';
  
  marked.setOptions({
    breaks: true,
    gfm: true,
  });
  
  return marked.parse(content);
};

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

// 监听消息变化自动滚动
watch(messages, async () => {
  await scrollToBottom();
}, { deep: true });

const handleScroll = () => {
  // 预留
};

// ---------- 生命周期 ----------
onMounted(() => {
  const token = localStorage.getItem("authToken");
  const userInfoStr = localStorage.getItem("user_info");

  if (!token) {
    alert("请先登录后再访问");
    window.location.href = "http://localhost:5173/";
    return;
  }

  if (userInfoStr) {
    try {
      userInfo.value = JSON.parse(userInfoStr);
    } catch (e) {
      console.error("解析用户信息失败:", e);
      localStorage.removeItem("user_info");
    }
  }

  document.addEventListener("click", handleClickOutside);
  timer = setInterval(updateTime, 1000);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
/* ========== 全局样式 & 变量 ========== */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB",
    "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
  background-color: #faf5ff;
  transition: background-color 0.3s, color 0.3s;
}

/* 暗色模式 */
.app-container.dark {
  background-color: #1e1e2f;
  color: #e0e0e0;
}
.app-container.dark .header {
  background-color: #2c2c3a;
}
.app-container.dark .sidebar {
  background-color: #2c2c3a;
  color: #e0e0e0;
}
.app-container.dark .nav-item {
  color: #e0e0e0;
}
.app-container.dark .nav-item:hover {
  background-color: #3a3a4a;
  color: #a78bfa;
}
.app-container.dark .nav-item.active {
  background-color: #3a3a4a;
  color: #8b5cf6;
}
.app-container.dark .chat-card {
  background-color: #2c2c3a;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}
.app-container.dark .dropdown-menu {
  background-color: #2c2c3a;
  color: #e0e0e0;
}
.app-container.dark .dropdown-item {
  color: #e0e0e0;
}
.app-container.dark .dropdown-item:hover {
  background-color: #3a3a4a;
  color: #8b5cf6;
}
.app-container.dark .chat-header h3 {
  color: #e0e0e0;
}
.app-container.dark .model-badge {
  background-color: #3a3a4a;
  color: #8b5cf6;
}
.app-container.dark .message-bubble {
  background-color: #3a3a4a;
  color: #e0e0e0;
}
.app-container.dark .message-row.user .message-bubble {
  background-color: #8b5cf6;
  color: white;
}
.app-container.dark .avatars {
  background-color: #4a4a5a;
  color: #e0e0e0;
}
.app-container.dark .message-row.user .avatars {
  background-color: #8b5cf6;
  color: white;
}
.app-container.dark .source-tag {
  background-color: #4a4a5a;
  color: #e0e0e0;
}
.app-container.dark .chat-input {
  background-color: #3a3a4a;
  border-color: #4a4a5a;
  color: #e0e0e0;
}
.app-container.dark .chat-input:focus {
  border-color: #8b5cf6;
}
.app-container.dark .send-btn {
  background-color: #8b5cf6;
}
.app-container.dark .send-btn:hover:not(:disabled) {
  background-color: #a78bfa;
}
.app-container.dark .send-btn:disabled {
  background-color: #4a4a5a;
}
.app-container.dark .example-btn {
  background-color: #3a3a4a;
  border-color: #4a4a5a;
  color: #e0e0e0;
}
.app-container.dark .example-btn:hover {
  background-color: #8b5cf6;
  color: white;
  border-color: #8b5cf6;
}
.app-container.dark .welcome-message {
  background-color: #3a3a4a;
  color: #e0e0e0;
}
.app-container.dark .clear-btn {
  color: #f87171;
}
.app-container.dark .typing-indicator span {
  background-color: #a0aec0;
}
.app-container.dark .message-bubble pre {
  background-color: #1e1e2f;
  color: #abb2bf;
}
.app-container.dark .message-bubble code {
  background-color: #4a4a5a;
}

/* 确保暗色模式下右上角图标颜色为纯白 */
.app-container.dark .theme-toggle,
.app-container.dark .avatars {
  color: #ffffff;
}

/* ========== 顶部导航 ========== */
.header {
  width: 100%;
  height: 10vh;
  background-color: #8b5cf6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 20px;
  padding-right: 20px;
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.1);
  z-index: 1000;
  transition: background-color 0.3s;
}

.logo-section {
  display: flex;
  align-items: center;
}
.logo-img {
  height: 50px;
  margin-right: 15px;
  border-radius: 8px;
}
.app-title {
  color: white;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 1px;
}

/* 用户区域 */
.user-section {
  display: flex;
  align-items: center;
  gap: 20px;
}
.current-time {
  color: white;
  font-size: 16px;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 6px 12px;
  border-radius: 20px;
  backdrop-filter: blur(4px);
}
.theme-toggle {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.theme-toggle:hover {
  background-color: rgba(255, 255, 255, 0.2);
}
.avatar-wrapper {
  position: relative;
}
.avatar {
  font-size: 40px;
  color: white;
  transition: color 0.2s;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}
.avatar .username {
  font-size: 14px;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 12px;
  backdrop-filter: blur(4px);
}
.avatar:hover {
  color: #f0f0f0;
}
.dropdown-menu {
  position: absolute;
  right: 0;
  top: 50px;
  width: 150px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
  overflow: hidden;
  z-index: 1001;
  animation: fadeIn 0.2s ease;
}
.dropdown-item {
  display: block;
  padding: 12px 20px;
  color: #333;
  text-decoration: none;
  font-size: 14px;
  transition: background 0.2s;
}
.dropdown-item:hover {
  background-color: #f5f5f5;
  color: #8b5cf6;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========== 主体布局 ========== */
.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 左侧导航 */
.sidebar {
  width: 15vw;
  background-color: #ffffff;
  box-shadow: 2px 0 6px rgba(139, 92, 246, 0.05);
  overflow-y: auto;
  transition: background-color 0.3s;
}
.nav-menu {
  padding-top: 0px;
}
.nav-item {
  display: flex;
  align-items: center;
  padding: 20px 50px;
  color: #333;
  text-decoration: none;
  font-size: 16px;
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
  cursor: pointer;
}
.nav-item:hover {
  background-color: #f1f1f1;
  color: #8b5cf6;
}
.nav-item.active {
  background-color: #faf5ff;
  color: #8b5cf6;
  font-weight: bold;
  border-left-color: #8b5cf6;
}
.icon {
  margin-right: 12px;
  width: 20px;
  text-align: center;
}
.nav-text {
  flex: 1;
}

/* 右侧内容区域 */
.content-section {
  flex: 1;
  padding: 1vh 20px;
  overflow-y: auto;
}

/* 智能问答卡片 */
.chat-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.08);
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: background-color 0.3s, box-shadow 0.3s;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #edf2f7;
}

.chat-header h3 {
  font-size: 18px;
  color: #2d3748;
  margin: 0;
}

.model-badge {
  background: #faf5ff;
  color: #8b5cf6;
  padding: 4px 12px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 500;
}

/* 聊天消息区域 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px 5px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: calc(100vh - 260px);
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}
.chat-messages::-webkit-scrollbar-thumb {
  background-color: #cbd5e0;
  border-radius: 3px;
}

.message-row {
  display: flex;
  gap: 12px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-row.user {
  flex-direction: row-reverse;
}

.avatars {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #edf2f7;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4a5568;
  flex-shrink: 0;
}

.message-row.user .avatars {
  background-color: #8b5cf6;
  color: white;
}

.message-content {
  max-width: 70%;
  position: relative;
}

.message-bubble {
  background-color: #f7fafc;
  padding: 12px 16px;
  border-radius: 18px;
  border-top-left-radius: 4px;
  font-size: 14px;
  line-height: 1.5;
  color: #2d3748;
  word-wrap: break-word;
}

.message-row.user .message-bubble {
  background-color: #8b5cf6;
  color: white;
  border-top-left-radius: 18px;
  border-top-right-radius: 4px;
}

.message-sources {
  margin-top: 6px;
  font-size: 12px;
  color: #718096;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.source-tag {
  background: #edf2f7;
  padding: 2px 8px;
  border-radius: 14px;
  color: #4a5568;
}

.message-time {
  font-size: 11px;
  color: #a0aec0;
  margin-top: 4px;
  text-align: right;
}

.message-row.user .message-time {
  text-align: left;
}

/* 欢迎区域 */
.welcome-message {
  text-align: center;
  color: #718096;
  padding: 40px 20px;
  background: #f9fafc;
  border-radius: 16px;
  margin-bottom: 10px;
}

.welcome-message i {
  font-size: 48px;
  color: #cbd5e0;
  margin-bottom: 16px;
}

.welcome-message p {
  margin: 8px 0;
  font-size: 15px;
}

/* 输入区域 */
.chat-input-area {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #edf2f7;
}

.chat-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 30px;
  font-size: 15px;
  outline: none;
  transition: border 0.2s;
}

.chat-input:focus {
  border-color: #8b5cf6;
}

.chat-input:disabled {
  background-color: #f7fafc;
  color: #a0aec0;
}

.send-btn {
  background-color: #8b5cf6;
  color: white;
  border: none;
  border-radius: 30px;
  padding: 0 24px;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.send-btn:hover:not(:disabled) {
  background-color: #a78bfa;
}

.send-btn:disabled {
  background-color: #cbd5e0;
  cursor: not-allowed;
}

/* 聊天底部 */
.chat-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  font-size: 12px;
  color: #a0aec0;
}

.clear-btn {
  background: none;
  border: none;
  color: #e53e3e;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.clear-btn:hover {
  opacity: 1;
  text-decoration: underline;
}

/* 正在输入指示器 */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background-color: #f7fafc;
  border-radius: 18px;
  border-top-left-radius: 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background-color: #a0aec0;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) {
  animation-delay: 0s;
}
.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}
.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%,
  80%,
  100% {
    transform: scale(0.6);
    opacity: 0.6;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 打字机光标动画 */
.typing-cursor {
  display: inline-block;
  width: 2px;
  height: 1.2em;
  background-color: #8B5CF6;
  margin-left: 2px;
  animation: blink 1s infinite;
  vertical-align: middle;
  position: absolute;
  bottom: 12px;
  right: -6px;
}

.message-row.user .typing-cursor {
  background-color: white;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* 流式消息样式 */
.streaming-message {
  min-height: 1.5em;
}

/* Markdown 内容美化 */
.message-bubble h1,
.message-bubble h2,
.message-bubble h3,
.message-bubble h4,
.message-bubble h5,
.message-bubble h6 {
  margin-top: 0.5em;
  margin-bottom: 0.3em;
  font-weight: 600;
  color: #2c3e50;
}
.message-bubble h1 {
  font-size: 1.6em;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.3em;
}
.message-bubble h2 {
  font-size: 1.4em;
}
.message-bubble h3 {
  font-size: 1.2em;
  color: #8b5cf6;
}
.message-bubble h4 {
  font-size: 1.1em;
}
.message-bubble ul,
.message-bubble ol {
  padding-left: 1.5em;
  margin: 0.5em 0;
}
.message-bubble li {
  margin: 0.2em 0;
}
.message-bubble p {
  margin: 0.5em 0;
}
.message-bubble strong {
  color: #e67e22;
}
.message-bubble code {
  background-color: #f0f0f0;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: "Monaco", "Menlo", monospace;
  font-size: 0.9em;
}
.message-bubble pre {
  background-color: #282c34;
  color: #abb2bf;
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0.5em 0;
}
.message-bubble pre code {
  background-color: transparent;
  padding: 0;
  color: inherit;
}
.message-bubble blockquote {
  border-left: 4px solid #8b5cf6;
  margin: 0.5em 0;
  padding: 0.5em 1em;
  background-color: #f9f9f9;
  color: #555;
}
.message-bubble table {
  border-collapse: collapse;
  width: 100%;
  margin: 0.5em 0;
}
.message-bubble th,
.message-bubble td {
  border: 1px solid #ddd;
  padding: 6px 12px;
  text-align: left;
}
.message-bubble th {
  background-color: #f2f2f2;
}
</style>

<style>
@import "./fontawesome-free-6.4.0-web/fontawesome-free-6.4.0-web/css/all.min.css";
</style>