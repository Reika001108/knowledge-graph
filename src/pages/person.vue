<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 头部（完全复用，略） -->
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
            <span class="username" v-if="userInfo">{{ displayName }}</span>
          </div>
          <div v-if="showDropdown" class="dropdown-menu">
            <a href="#" class="dropdown-item" @click.prevent="goToProfile">个人中心</a>
            <a href="#" class="dropdown-item" @click.prevent="logout">退出</a>
          </div>
        </div>
      </div>
    </header>

    <main class="main-content">
      <!-- 侧边栏（略） -->
      <aside class="sidebar">
        <nav class="nav-menu">
          <a href="#" class="nav-item" @click.prevent="goToHome"
            ><i class="fas fa-atom icon"></i><span class="nav-text">知识图谱</span></a
          >
          <a href="#" class="nav-item" @click.prevent="goToAdvancedSearch"
            ><i class="fas fa-book-atlas icon"></i><span class="nav-text">高级检索</span></a
          >
          <a href="#" class="nav-item" @click.prevent="goToAIResponse"
            ><i class="fas fa-robot icon"></i><span class="nav-text">智能问答</span></a
          >
          <a href="#" class="nav-item active" @click.prevent="goToProfile"
            ><i class="fas fa-user icon"></i><span class="nav-text">个人中心</span></a
          >
        </nav>
      </aside>

      <!-- 主体区域 -->
      <section class="profile-section">
        <div class="profile-card">
          <!-- 选项卡 -->
          <div class="tabs">
            <button class="tab-btn" :class="{ active: activeTab === 'profile' }" @click="activeTab = 'profile'">
              <i class="fas fa-id-card"></i> 个人资料
            </button>
            <button class="tab-btn" :class="{ active: activeTab === 'security' }" @click="activeTab = 'security'">
              <i class="fas fa-shield-alt"></i> 安全设置
            </button>
            <button class="tab-btn" :class="{ active: activeTab === 'feedback' }" @click="activeTab = 'feedback'">
              <i class="fas fa-comment"></i> 用户反馈
            </button>
          </div>

          <!-- 个人资料 -->
          <div v-if="activeTab === 'profile'" class="tab-pane">
            <div class="avatar-large">
              <i class="fas fa-user-circle"></i>
            </div>
            <div class="info-item">
              <label>用户名：</label>
              <span>{{ userInfo?.username || '未设置' }}</span>
              <button class="edit-btn" @click="editUsername">
                <i class="fas fa-pen"></i>
              </button>
            </div>
            <div class="info-item">
              <label>邮箱：</label>
              <span>{{ userInfo?.email || '未绑定' }}</span>
              <!-- 邮箱不设置修改按钮 -->
            </div>
            <div class="info-item">
              <label>注册时间：</label>
              <span>{{ formatDate(userInfo?.createdAt) || '未知' }}</span>
            </div>
            <div v-if="loading" class="loading-indicator">
              <i class="fas fa-spinner fa-spin"></i> 加载中...
            </div>
          </div>

          <!-- 安全设置 -->
          <div v-if="activeTab === 'security'" class="tab-pane">
            <form @submit.prevent="changePassword" class="security-form">
              <div class="form-group">
                <label>原密码：</label>
                <div class="password-input-wrapper">
                  <input 
                    :type="showOldPassword ? 'text' : 'password'" 
                    v-model="passwordForm.oldPassword" 
                    required 
                    placeholder="请输入原密码"
                  />
                  <span class="password-toggle" @click="showOldPassword = !showOldPassword">
                    <i :class="showOldPassword ? 'fas fa-eye' : 'fas fa-eye-slash'"></i>
                  </span>
                </div>
              </div>
              <div class="form-group">
                <label>新密码：</label>
                <div class="password-input-wrapper">
                  <input 
                    :type="showNewPassword ? 'text' : 'password'" 
                    v-model="passwordForm.newPassword" 
                    required 
                    placeholder="请输入新密码（至少6位）"
                  />
                  <span class="password-toggle" @click="showNewPassword = !showNewPassword">
                    <i :class="showNewPassword ? 'fas fa-eye' : 'fas fa-eye-slash'"></i>
                  </span>
                </div>
              </div>
              <div class="form-group">
                <label>确认新密码：</label>
                <div class="password-input-wrapper">
                  <input 
                    :type="showConfirmPassword ? 'text' : 'password'" 
                    v-model="passwordForm.confirmPassword" 
                    required 
                    placeholder="请再次输入新密码"
                  />
                  <span class="password-toggle" @click="showConfirmPassword = !showConfirmPassword">
                    <i :class="showConfirmPassword ? 'fas fa-eye' : 'fas fa-eye-slash'"></i>
                  </span>
                </div>
              </div>
              <button type="submit" class="submit-btn" :disabled="passwordLoading">
                {{ passwordLoading ? '提交中...' : '修改密码' }}
              </button>
            </form>
            <p v-if="passwordMessage" class="message" :class="{ error: passwordError }">{{ passwordMessage }}</p>
          </div>

          <!-- 用户反馈 -->
          <div v-if="activeTab === 'feedback'" class="tab-pane">
            <form @submit.prevent="submitFeedback" class="feedback-form">
              <div class="form-group">
                <label>反馈内容：</label>
                <textarea 
                  v-model="feedbackForm.content" 
                  rows="5" 
                  required
                  placeholder="请详细描述您的建议或问题..."
                ></textarea>
              </div>
              <button type="submit" class="submit-btn" :disabled="feedbackLoading">
                {{ feedbackLoading ? '提交中...' : '提交反馈' }}
              </button>
            </form>
            
            <!-- 历史反馈列表 -->
            <div class="feedback-history" v-if="feedbackList.length > 0">
              <h3><i class="fas fa-history"></i> 我的反馈历史</h3>
              <ul class="feedback-list">
                <li v-for="(item, idx) in feedbackList" :key="idx" class="feedback-item">
                  <div class="feedback-header">
                    <span class="feedback-status" :class="item.status">
                      {{ getFeedbackStatusText(item.status) }}
                    </span>
                    <span class="feedback-time">{{ formatDate(item.createdAt) }}</span>
                  </div>
                  <div class="feedback-content">{{ item.content }}</div>
                  <div v-if="item.reply" class="feedback-reply">
                    <i class="fas fa-reply"></i> 回复：{{ item.reply }}
                  </div>
                </li>
              </ul>
              <div v-if="feedbackLoadingMore" class="loading-indicator">
                <i class="fas fa-spinner fa-spin"></i> 加载中...
              </div>
            </div>
            <div v-else-if="!feedbackLoading" class="empty-feedback">
              <i class="fas fa-comment-dots"></i>
              <p>暂无反馈记录</p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 编辑用户名对话框 -->
    <div v-if="showEditDialog" class="modal-overlay" @click.self="closeEditDialog">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-user-edit"></i> 编辑用户名</h3>
          <button class="close-btn" @click="closeEditDialog">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>新用户名：</label>
            <input 
              type="text" 
              v-model="newUsername" 
              placeholder="请输入新用户名（3-20个字符）"
              maxlength="20"
              @keyup.enter="saveUsername"
            />
            <p class="input-hint">用户名只能包含字母、数字、下划线和中文字符</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeEditDialog">取消</button>
          <button class="btn-primary" @click="saveUsername" :disabled="usernameSaving">
            {{ usernameSaving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watchEffect } from 'vue';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api'; // 根据实际后端地址修改

// 用户相关
const showDropdown = ref(false);
const avatarWrapper = ref(null);
const userInfo = ref(null);
const currentTime = ref(new Date().toLocaleTimeString());
const isDark = ref(false);
const loading = ref(false);

// 选项卡
const activeTab = ref('profile');

// 密码可见性控制
const showOldPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

// 修改密码表单
const passwordForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' });
const passwordMessage = ref('');
const passwordError = ref(false);
const passwordLoading = ref(false);

// 编辑用户名对话框
const showEditDialog = ref(false);
const newUsername = ref('');
const usernameSaving = ref(false);

// 反馈相关
const feedbackForm = ref({
  content: '',
  contact: ''
});
const feedbackList = ref([]);
const feedbackLoading = ref(false);
const feedbackLoadingMore = ref(false);

// 计算显示的用户名
const displayName = computed(() => {
  if (!userInfo.value) return '';
  return userInfo.value.username || (userInfo.value.email ? userInfo.value.email.split('@')[0] : '用户');
});

// 主题切换
const toggleTheme = () => { isDark.value = !isDark.value; };

// 更新时间
let timer = null;
const updateTime = () => { currentTime.value = new Date().toLocaleTimeString(); };

// 下拉菜单
const toggleDropdown = () => { showDropdown.value = !showDropdown.value; };
const handleClickOutside = (event) => {
  if (avatarWrapper.value && !avatarWrapper.value.contains(event.target)) showDropdown.value = false;
};

// 导航方法
const goToHome = () => { window.location.href = 'http://localhost:5173/knowledge'; };
const goToAdvancedSearch = () => { window.location.href = 'http://localhost:5173/reseach'; };
const goToAIResponse = () => { window.location.href = 'http://localhost:5173/AI-response'; };
const goToProfile = () => { fetchUserInfo(); };

// 退出登录
const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user_info');
  localStorage.removeItem('userRole');
  localStorage.removeItem('adminName');
  window.location.href = 'http://localhost:5173/';
  showDropdown.value = false;
};

// 获取用户信息
const fetchUserInfo = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) return;
  loading.value = true;
  try {
    const response = await axios.get(`${API_BASE_URL}/user/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.data.code === 200) {
      userInfo.value = response.data.data;
      localStorage.setItem('user_info', JSON.stringify(userInfo.value));
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
    if (error.response?.status === 401) logout();
  } finally {
    loading.value = false;
  }
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

// 编辑用户名
const editUsername = () => {
  newUsername.value = userInfo.value?.username || '';
  showEditDialog.value = true;
};

// 关闭编辑对话框
const closeEditDialog = () => {
  showEditDialog.value = false;
  newUsername.value = '';
};

// 保存用户名
const saveUsername = async () => {
  const username = newUsername.value.trim();
  
  // 验证用户名
  if (!username) {
    alert('用户名不能为空');
    return;
  }
  
  if (username.length < 3 || username.length > 20) {
    alert('用户名长度应为3-20个字符');
    return;
  }
  
  if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
    alert('用户名只能包含字母、数字、下划线和中文字符');
    return;
  }
  
  const token = localStorage.getItem('authToken');
  if (!token) {
    alert('请先登录');
    return;
  }
  
  usernameSaving.value = true;
  try {
    const response = await axios.put(
      `${API_BASE_URL}/user/profile`,
      { username: username },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (response.data.code === 200) {
      alert('用户名修改成功');
      userInfo.value.username = username;
      localStorage.setItem('user_info', JSON.stringify(userInfo.value));
      closeEditDialog();
    } else {
      alert(response.data.message || '修改失败，请重试');
    }
  } catch (error) {
    console.error('修改用户名失败:', error);
    const errorMsg = error.response?.data?.message || '修改失败，请重试';
    alert(errorMsg);
  } finally {
    usernameSaving.value = false;
  }
};

// 修改密码
const changePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordMessage.value = '两次输入的新密码不一致';
    passwordError.value = true;
    return;
  }
  if (passwordForm.value.newPassword.length < 6) {
    passwordMessage.value = '新密码长度不能少于6位';
    passwordError.value = true;
    return;
  }
  const token = localStorage.getItem('authToken');
  if (!token) {
    passwordMessage.value = '请先登录';
    passwordError.value = true;
    return;
  }
  passwordLoading.value = true;
  passwordMessage.value = '';
  try {
    const response = await axios.post(
      `${API_BASE_URL}/user/change-password`,
      { oldPassword: passwordForm.value.oldPassword, newPassword: passwordForm.value.newPassword },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.data.code === 200) {
      passwordMessage.value = '密码修改成功';
      passwordError.value = false;
      passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
      showOldPassword.value = false;
      showNewPassword.value = false;
      showConfirmPassword.value = false;
    } else {
      passwordMessage.value = response.data.message || '修改失败';
      passwordError.value = true;
    }
  } catch (error) {
    console.error('修改密码失败:', error);
    passwordMessage.value = error.response?.data?.message || '修改失败，请重试';
    passwordError.value = true;
  } finally {
    passwordLoading.value = false;
  }
};

// 获取反馈列表
const fetchFeedbackList = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) return;
  feedbackLoading.value = true;
  try {
    const response = await axios.get(`${API_BASE_URL}/feedback/user`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.data.code === 200) {
      feedbackList.value = response.data.data;
    }
  } catch (error) {
    console.error('获取反馈列表失败:', error);
  } finally {
    feedbackLoading.value = false;
  }
};

// 提交反馈
const submitFeedback = async () => {
  if (!feedbackForm.value.content.trim()) {
    alert('请填写反馈内容');
    return;
  }
  const token = localStorage.getItem('authToken');
  if (!token) {
    alert('请先登录');
    return;
  }
  feedbackLoading.value = true;
  try {
    const response = await axios.post(
      `${API_BASE_URL}/feedback`,
      {
        type: 'suggestion',
        content: feedbackForm.value.content,
        contact: feedbackForm.value.contact
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.data.code === 200) {
      alert('反馈提交成功，感谢您的支持！');
      feedbackForm.value = { content: '', contact: '' };
      await fetchFeedbackList();
    } else {
      alert(response.data.message || '提交失败，请重试');
    }
  } catch (error) {
    console.error('提交反馈失败:', error);
    alert(error.response?.data?.message || '提交失败，请重试');
  } finally {
    feedbackLoading.value = false;
  }
};

// 获取反馈状态文本
const getFeedbackStatusText = (status) => {
  const statuses = {
    pending: '待处理',
    processing: '处理中',
    completed: '已回复',
    rejected: '已驳回'
  };
  return statuses[status] || status;
};

// 生命周期
onMounted(() => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    alert('请先登录后再访问');
    window.location.href = 'http://localhost:5173/';
    return;
  }
  const userInfoStr = localStorage.getItem('user_info');
  if (userInfoStr) {
    try {
      userInfo.value = JSON.parse(userInfoStr);
    } catch (e) {
      console.error('解析用户信息失败:', e);
    }
  }
  fetchUserInfo();
  watchEffect(() => {
    if (activeTab.value === 'feedback') {
      fetchFeedbackList();
    }
  });
  document.addEventListener('click', handleClickOutside);
  timer = setInterval(updateTime, 1000);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
/* 密码输入框容器样式 */
.password-input-wrapper {
  position: relative;
  width: 100%;
}

.password-input-wrapper input {
  width: 100%;
  padding: 12px 15px;
  padding-right: 40px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 15px;
  transition: border-color 0.2s;
  font-family: inherit;
}

.password-input-wrapper input:focus {
  outline: none;
  border-color: #8B5CF6;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  transition: color 0.2s ease;
  z-index: 1;
}

.password-toggle:hover {
  color: #8B5CF6;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.2s ease;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 24px;
}

.modal-body .form-group {
  margin-bottom: 0;
}

.modal-body .form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

.modal-body .form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.modal-body .form-group input:focus {
  outline: none;
  border-color: #8B5CF6;
}

.input-hint {
  font-size: 12px;
  color: #999;
  margin-top: 6px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e9ecef;
}

.btn-primary {
  background-color: #8B5CF6;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background-color: #A78BFA;
}

.btn-primary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #e9ecef;
  color: #333;
  border: none;
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background-color: #dde2e6;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 暗色模式下的模态框样式 */
.app-container.dark .modal-content {
  background-color: #2c2c3a;
}

.app-container.dark .modal-header {
  border-bottom-color: #4a4a5a;
}

.app-container.dark .modal-header h3 {
  color: #e0e0e0;
}

.app-container.dark .close-btn {
  color: #aaa;
}

.app-container.dark .close-btn:hover {
  color: #e0e0e0;
}

.app-container.dark .modal-body .form-group label {
  color: #aaa;
}

.app-container.dark .modal-body .form-group input {
  background-color: #2c2c3a;
  border-color: #4a4a5a;
  color: #e0e0e0;
}

.app-container.dark .modal-footer {
  border-top-color: #4a4a5a;
}

.app-container.dark .btn-secondary {
  background-color: #4a4a5a;
  color: #e0e0e0;
}

.app-container.dark .btn-secondary:hover {
  background-color: #5a5a6a;
}

/* 其他样式保持不变 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  background-color: #FAF5FF;
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
  color: #A78BFA;
}
.app-container.dark .nav-item.active {
  background-color: #3a3a4a;
  color: #8B5CF6;
}
.app-container.dark .profile-card {
  background-color: #2c2c3a;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.app-container.dark .tab-btn {
  color: #aaa;
}
.app-container.dark .tab-btn.active {
  color: #8B5CF6;
  border-bottom-color: #8B5CF6;
}
.app-container.dark .info-item,
.app-container.dark .form-group label,
.app-container.dark .feedback-item {
  color: #e0e0e0;
}
.app-container.dark .edit-btn {
  color: #8B5CF6;
}
.app-container.dark .submit-btn {
  background-color: #8B5CF6;
  color: white;
}
.app-container.dark .submit-btn:disabled {
  background-color: #666;
  cursor: not-allowed;
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
  color: #8B5CF6;
}
.app-container.dark .feedback-item {
  background-color: #3a3a4a;
}
.app-container.dark .feedback-reply {
  background-color: #2c2c3a;
  color: #aaa;
}
.app-container.dark .password-input-wrapper input {
  background-color: #2c2c3a;
  border-color: #4a4a5a;
  color: #e0e0e0;
}
.app-container.dark .password-toggle {
  color: #aaa;
}
.app-container.dark .password-toggle:hover {
  color: #8B5CF6;
}

/* 头部样式 */
.header {
  width: 100%;
  height: 10vh;
  background-color: #8B5CF6;
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
.user-section {
  display: flex;
  align-items: center;
  gap: 20px;
}
.current-time {
  color: white;
  font-size: 16px;
  background-color: rgba(255,255,255,0.2);
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
  background-color: rgba(255,255,255,0.2);
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
  background: rgba(255,255,255,0.2);
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
  color: #8B5CF6;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 主布局 */
.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 侧边栏 */
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
  color: #8B5CF6;
}
.nav-item.active {
  background-color: #FAF5FF;
  color: #8B5CF6;
  font-weight: bold;
  border-left-color: #8B5CF6;
}
.icon {
  margin-right: 12px;
  width: 20px;
  text-align: center;
}
.nav-text {
  flex: 1;
}

/* 个人中心主体 */
.profile-section {
  flex: 1;
  padding: 2vh;
  overflow-y: auto;
}
.profile-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px 0 rgba(139, 92, 246, 0.05);
  padding: 30px 40px;
  transition: background-color 0.3s, box-shadow 0.3s;
  min-height: 100%;
}

/* 选项卡 */
.tabs {
  display: flex;
  border-bottom: 2px solid #eee;
  margin-bottom: 30px;
}
.tab-btn {
  background: none;
  border: none;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
  margin-right: 20px;
}
.tab-btn i {
  margin-right: 8px;
}
.tab-btn.active {
  color: #8B5CF6;
  border-bottom-color: #8B5CF6;
  font-weight: 500;
}
.tab-btn:hover {
  color: #8B5CF6;
}

/* 标签页内容 */
.tab-pane {
  padding: 20px 0;
}

/* 个人资料 */
.avatar-large {
  font-size: 100px;
  color: #8B5CF6;
  text-align: center;
  margin-bottom: 30px;
}
.info-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 16px;
}
.info-item label {
  width: 100px;
  color: #888;
}
.info-item span {
  flex: 1;
  color: #333;
}
.edit-btn {
  background: none;
  border: none;
  color: #8B5CF6;
  cursor: pointer;
  font-size: 14px;
  padding: 5px 10px;
  border-radius: 4px;
}
.edit-btn:hover {
  background-color: rgba(139, 92, 246, 0.1);
}
.loading-indicator {
  text-align: center;
  padding: 20px;
  color: #8B5CF6;
}

/* 安全设置 */
.security-form {
  max-width: 500px;
  margin: 0 auto;
}
.form-group {
  margin-bottom: 20px;
}
.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #555;
}
.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 15px;
  transition: border-color 0.2s;
  font-family: inherit;
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #8B5CF6;
}
.form-group textarea {
  resize: vertical;
  min-height: 120px;
}
.submit-btn {
  background-color: #8B5CF6;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 30px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
}
.submit-btn:hover:not(:disabled) {
  background-color: #A78BFA;
}
.submit-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
.message {
  margin-top: 20px;
  text-align: center;
  font-weight: 500;
}
.message.error {
  color: #e53e3e;
}

/* 反馈区域 */
.feedback-form {
  max-width: 600px;
  margin: 0 auto 40px;
  padding-bottom: 30px;
  border-bottom: 1px solid #eee;
}

.feedback-history {
  max-width: 800px;
  margin: 0 auto;
}

.feedback-history h3 {
  margin-bottom: 20px;
  color: #8B5CF6;
  display: flex;
  align-items: center;
  gap: 10px;
}

.feedback-list {
  list-style: none;
}

.feedback-item {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 15px;
  transition: transform 0.2s;
}

.feedback-item:hover {
  transform: translateX(5px);
}

.feedback-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.feedback-status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.feedback-status.pending {
  background: #fff3e0;
  color: #f57c00;
}
.feedback-status.processing {
  background: #e3f2fd;
  color: #1976d2;
}
.feedback-status.completed {
  background: #e8f5e8;
  color: #2e7d32;
}
.feedback-status.rejected {
  background: #ffebee;
  color: #c62828;
}

.feedback-time {
  color: #999;
  font-size: 12px;
  margin-left: auto;
}

.feedback-content {
  color: #333;
  line-height: 1.6;
  margin-bottom: 10px;
  padding: 10px;
  background: white;
  border-radius: 6px;
}

.feedback-reply {
  background: #f0f0f0;
  padding: 12px 15px;
  border-radius: 6px;
  color: #666;
  font-size: 14px;
  margin-top: 10px;
}

.feedback-reply i {
  color: #8B5CF6;
  margin-right: 8px;
}

.empty-feedback {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-feedback i {
  font-size: 48px;
  margin-bottom: 15px;
  color: #8B5CF6;
  opacity: 0.5;
}

/* 暗色模式适配 */
.app-container.dark .feedback-item {
  background: #3a3a4a;
}
.app-container.dark .feedback-content {
  background: #2c2c3a;
  color: #e0e0e0;
}
.app-container.dark .feedback-reply {
  background: #2c2c3a;
  color: #aaa;
}
.app-container.dark .empty-feedback {
  color: #666;
}
</style>

<style>
@import './fontawesome-free-6.4.0-web/fontawesome-free-6.4.0-web/css/all.min.css';
</style>