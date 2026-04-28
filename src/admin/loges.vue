<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶部导航栏（完全复用原模板） -->
    <header class="header">
      <div class="logo-section">
        <img src="../pages/img/logo-w.png" alt="Logo" class="logo-img" />
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
          </div>
          <div v-if="showDropdown" class="dropdown-menu">
            <a href="#" class="dropdown-item" @click.prevent="logout" style="text-align: center;">退出登录</a>
          </div>
        </div>
      </div>
    </header>

    <main class="main-content">
      <!-- 左侧导航栏（与节点管理一致，高亮反馈中心） -->
      <aside class="sidebar">
        <nav class="nav-menu">
          <a href="#" class="nav-item" @click.prevent="goToDashboard">
            <i class="fas fa-tachometer-alt icon"></i>
            <span class="nav-text">主页</span>
          </a>
          <a href="#" class="nav-item" @click.prevent="goToUserManage">
            <i class="fas fa-users icon"></i>
            <span class="nav-text">用户管理</span>
          </a>
          <div class="nav-item" @click="toggleGraphMenu">
            <i class="fas fa-project-diagram icon"></i>
            <span class="nav-text">图谱管理</span>
            <i class="fas" :class="graphMenuExpanded ? 'fa-chevron-down' : 'fa-chevron-right'" style="margin-left: auto;"></i>
          </div>
          <div v-if="graphMenuExpanded" class="sub-nav">
            <a href="#" class="nav-item sub-nav-item" @click.prevent="goToGraphDisplay">
              <i class="fas fa-eye icon" style="margin-left: 28px;"></i>
              <span class="nav-text">图谱展示</span>
            </a>
            <a href="#" class="nav-item sub-nav-item" @click.prevent="goToNodeManage">
              <i class="fas fa-cube icon" style="margin-left: 28px;"></i>
              <span class="nav-text">节点管理</span>
            </a>
            <a href="#" class="nav-item sub-nav-item" @click.prevent="goToRelationManage">
              <i class="fas fa-link icon" style="margin-left: 28px;"></i>
              <span class="nav-text">关系管理</span>
            </a>
          </div>
          <a href="#" class="nav-item" @click.prevent="goToDataStats">
            <i class="fas fa-chart-bar icon"></i>
            <span class="nav-text">数据统计</span>
          </a>
          <a href="#" class="nav-item active" @click.prevent="goToSystemLog">
            <i class="fas fa-history icon"></i>
            <span class="nav-text">反馈中心</span>
          </a>
        </nav>

        <div class="admin-footer">
          <div class="divider"></div>
          <div class="admin-info">
            <i class="fas fa-user-shield"></i>
            <span>{{ adminDisplayName }}</span>
          </div>
        </div>
      </aside>

      <!-- 右侧主要内容区域：反馈管理 -->
      <section class="content-section">
        <div class="feedback-management">
          <!-- 头部标题和刷新按钮（新增按钮改为刷新） -->
          <div class="management-header">
            <h2><i class="fas fa-comment-dots"></i> 用户反馈管理</h2>
            <button class="btn-primary" @click="loadFeedbacks">
              <i class="fas fa-sync-alt"></i> 刷新
            </button>
          </div>

          <!-- 搜索与筛选区域 -->
          <div class="search-section">
            <div class="search-wrapper">
              <i class="fas fa-search search-icon"></i>
              <input 
                type="text" 
                v-model="searchQuery" 
                placeholder="搜索用户名、反馈内容..." 
                class="search-input"
                @input="handleSearch"
              />
            </div>
            <div class="filter-group">
              <select v-model="statusFilter" @change="handleFilterChange" class="filter-select">
                <option value="">全部状态</option>
                <option value="pending">待处理</option>
                <option value="processing">处理中</option>
                <option value="completed">已回复</option>
                <option value="rejected">已驳回</option>
              </select>
              <select v-model="typeFilter" @change="handleFilterChange" class="filter-select">
                <option value="">全部类型</option>
                <option value="suggestion">功能建议</option>
                <option value="bug">问题反馈</option>
                <option value="question">使用疑问</option>
                <option value="other">其他</option>
              </select>
            </div>
            <button v-if="searchQuery || statusFilter || typeFilter" class="btn-clear" @click="clearFilters">
              <i class="fas fa-times"></i> 清除筛选
            </button>
            <div class="total-count">
              共 <span class="count-number">{{ filteredFeedbacks.length }}</span> 条反馈
            </div>
          </div>

          <!-- 反馈列表表格 -->
          <div class="feedback-table-wrapper">
            <table class="feedback-table">
              <thead>
                <tr>
                  <th>序号</th>
                  <th>用户名</th>
                  <th>类型</th>
                  <th>反馈内容</th>
                  <th>状态</th>
                  <th>提交时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="paginatedFeedbacks.length === 0 && !loading">
                  <td colspan="8" class="text-center">暂无反馈数据</td>
                </tr>
                <tr v-for="(fb, index) in paginatedFeedbacks" :key="fb.id">
                  <td>{{ getSerialNumber(index) }}</td>
                  <td>{{ fb.username || '未知用户' }}</td>
                  <td>
                    <span class="feedback-type-badge" :class="fb.type">
                      {{ getFeedbackTypeText(fb.type) }}
                    </span>
                  </td>
                  <td>
                    <div class="feedback-content-preview">{{ truncateContent(fb.content) }}</div>
                  </td>
                  <td>
                    <span class="feedback-status-badge" :class="fb.status">
                      {{ getFeedbackStatusText(fb.status) }}
                    </span>
                  </td>
                  <td>{{ formatDate(fb.createdAt) }}</td>
                  <td>
                    <button class="btn-icon" @click="viewFeedback(fb)" title="查看详情/回复">
                      <i class="fas fa-reply"></i>
                    </button>
                    <button class="btn-icon" @click="editStatus(fb)" title="修改状态">
                      <i class="fas fa-edit"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 分页组件（与节点管理完全相同） -->
          <div v-if="filteredFeedbacks.length > 0" class="pagination-container">
            <div class="pagination-info">
              显示 {{ (currentPage - 1) * pageSize + 1 }} 
              到 {{ Math.min(currentPage * pageSize, filteredFeedbacks.length) }} 
              条，共 {{ filteredFeedbacks.length }} 条记录
            </div>
            <div class="pagination">
              <button 
                class="pagination-btn" 
                @click="goToFirstPage" 
                :disabled="currentPage === 1"
                title="第一页"
              >
                <i class="fas fa-angle-double-left"></i>
              </button>
              <button 
                class="pagination-btn" 
                @click="prevPage" 
                :disabled="currentPage === 1"
                title="上一页"
              >
                <i class="fas fa-angle-left"></i>
              </button>
              
              <button 
                v-for="page in displayedPages" 
                :key="page"
                class="pagination-btn" 
                :class="{ 
                  active: page === currentPage,
                  dots: page === '...'
                }"
                @click="page !== '...' && changePage(page)"
                :disabled="page === '...'"
              >
                {{ page }}
              </button>
              
              <button 
                class="pagination-btn" 
                @click="nextPage" 
                :disabled="currentPage === totalPages"
                title="下一页"
              >
                <i class="fas fa-angle-right"></i>
              </button>
              <button 
                class="pagination-btn" 
                @click="goToLastPage" 
                :disabled="currentPage === totalPages"
                title="最后一页"
              >
                <i class="fas fa-angle-double-right"></i>
              </button>
            </div>
            <div class="page-size-selector">
              <select v-model="pageSize" @change="handlePageSizeChange">
                <option :value="5">5条/页</option>
                <option :value="10">10条/页</option>
                <option :value="20">20条/页</option>
                <option :value="50">50条/页</option>
                <option :value="100">100条/页</option>
              </select>
            </div>
          </div>

          <!-- 反馈详情/回复面板（浮动面板，类似节点表单） -->
          <div v-if="showDetailPanel" class="feedback-detail-panel">
            <h3><i class="fas fa-comment"></i> 反馈详情</h3>
            <div class="detail-content">
              <div class="info-row">
                <span class="label">序号：</span>
                <span>{{ getCurrentFeedbackSerial() }}</span>
              </div>
              <div class="info-row">
                <span class="label">ID：</span>
                <span>{{ currentFeedback?.id }}</span>
              </div>
              <div class="info-row">
                <span class="label">用户：</span>
                <span>{{ currentFeedback?.username || '未知' }}</span>
              </div>
              <div class="info-row">
                <span class="label">类型：</span>
                <span class="feedback-type-badge" :class="currentFeedback?.type">
                  {{ getFeedbackTypeText(currentFeedback?.type) }}
                </span>
              </div>
              <div class="info-row">
                <span class="label">状态：</span>
                <span class="feedback-status-badge" :class="currentFeedback?.status">
                  {{ getFeedbackStatusText(currentFeedback?.status) }}
                </span>
              </div>
              <div class="info-row">
                <span class="label">提交时间：</span>
                <span>{{ formatDate(currentFeedback?.createdAt) }}</span>
              </div>
              <div class="info-row">
                <span class="label">联系方式：</span>
                <span>{{ currentFeedback?.contact || '未提供' }}</span>
              </div>
              <div class="info-row content-box">
                <span class="label">反馈内容：</span>
                <div class="content-text">{{ currentFeedback?.content }}</div>
              </div>
              <div v-if="currentFeedback?.reply" class="info-row reply-box">
                <span class="label">已有回复：</span>
                <div class="reply-text">{{ currentFeedback.reply }}</div>
              </div>

              <!-- 回复表单 -->
              <div class="reply-form">
                <div class="form-group">
                  <label>回复内容</label>
                  <textarea v-model="replyContent" rows="4" placeholder="请输入回复内容..."></textarea>
                </div>
                <div class="form-group">
                  <label>修改状态</label>
                  <select v-model="newStatus" class="filter-select">
                    <option value="pending">待处理</option>
                    <option value="processing">处理中</option>
                    <option value="completed">已回复</option>
                    <option value="rejected">已驳回</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="form-actions">
              <button class="btn-secondary" @click="closeDetailPanel">取消</button>
              <button class="btn-primary" @click="submitReply" :disabled="replyLoading">
                <i v-if="replyLoading" class="fas fa-spinner fa-pulse"></i>
                保存回复
              </button>
            </div>
          </div>

          <!-- 加载与错误提示 -->
          <div v-if="loading" class="loading-overlay">
            <i class="fas fa-spinner fa-pulse"></i> 加载中...
          </div>
          <div v-if="error" class="error-message">
            {{ error }}
            <button @click="loadFeedbacks" class="retry-btn">重试</button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// ---------- 状态（复用原模板的部分状态） ----------
const showDropdown = ref(false);
const avatarWrapper = ref(null);
const currentTime = ref(new Date().toLocaleTimeString());
const isDark = ref(false);
const graphMenuExpanded = ref(true);
const adminName = ref('');

// 反馈数据
const feedbacks = ref([]);
const loading = ref(false);
const error = ref('');

// 搜索与筛选
const searchQuery = ref('');
const statusFilter = ref('');
const typeFilter = ref('');
const searchTimeout = ref(null);

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);

// 详情面板
const showDetailPanel = ref(false);
const currentFeedback = ref(null);
const replyContent = ref('');
const newStatus = ref('');
const replyLoading = ref(false);

// 计算管理员显示名称
const adminDisplayName = computed(() => {
  if (adminName.value) return adminName.value;
  const userInfoStr = localStorage.getItem('user_info');
  if (userInfoStr) {
    try {
      const userInfo = JSON.parse(userInfoStr);
      return userInfo.username || userInfo.email?.split('@')[0] || '管理员';
    } catch {
      return '管理员';
    }
  }
  return '管理员';
});

// 过滤后的反馈（根据搜索条件和筛选）
const filteredFeedbacks = computed(() => {
  let result = feedbacks.value;
  
  // 关键词搜索（用户名、内容）
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter(fb => 
      (fb.username && fb.username.toLowerCase().includes(q)) ||
      (fb.content && fb.content.toLowerCase().includes(q))
    );
  }
  
  // 状态筛选
  if (statusFilter.value) {
    result = result.filter(fb => fb.status === statusFilter.value);
  }
  
  // 类型筛选
  if (typeFilter.value) {
    result = result.filter(fb => fb.type === typeFilter.value);
  }
  
  return result;
});

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(filteredFeedbacks.value.length / pageSize.value);
});

// 当前页显示的反馈
const paginatedFeedbacks = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredFeedbacks.value.slice(start, end);
});

// 计算显示的页码（带省略号，与节点管理相同）
const displayedPages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const delta = 2; // 当前页前后显示的页数
  const range = [];
  const rangeWithDots = [];
  let l;

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i);
    }
  }

  range.forEach((i) => {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l !== 1) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(i);
    l = i;
  });

  return rangeWithDots;
});

// 计算当前页的序号（基于过滤后的列表和分页）
const getSerialNumber = (indexInPage) => {
  return (currentPage.value - 1) * pageSize.value + indexInPage + 1;
};

// 获取当前选中的反馈在过滤后列表中的序号（用于详情面板）
const getCurrentFeedbackSerial = () => {
  if (!currentFeedback.value) return '-';
  const index = filteredFeedbacks.value.findIndex(fb => fb.id === currentFeedback.value.id);
  if (index === -1) return '-';
  return index + 1;
};

// ---------- 主题切换 ----------
const toggleTheme = () => {
  isDark.value = !isDark.value;
};

// ---------- 时间更新 ----------
let timer = null;
const updateTime = () => {
  currentTime.value = new Date().toLocaleTimeString();
};

// ---------- 下拉菜单 ----------
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

const handleClickOutside = (event) => {
  if (avatarWrapper.value && !avatarWrapper.value.contains(event.target)) {
    showDropdown.value = false;
  }
};

// ---------- 图谱菜单展开/折叠 ----------
const toggleGraphMenu = () => {
  graphMenuExpanded.value = !graphMenuExpanded.value;
};

// ---------- 路由导航 ----------
const goToDashboard = () => router.push('/admin/home');
const goToUserManage = () => router.push('/admin/users');
const goToGraphDisplay = () => router.push('/admin/graph/display');
const goToNodeManage = () => router.push('/admin/graph/nodes');
const goToRelationManage = () => router.push('/admin/graph/relations');
const goToDataStats = () => router.push('/admin/stats');
const goToSystemLog = () => {}; // 当前页面
const goToProfile = () => router.push('/person');

// ---------- 退出登录 ----------
const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user_info');
  localStorage.removeItem('userRole');
  localStorage.removeItem('adminName');
  router.push('/');
  showDropdown.value = false;
};

// ---------- API 基础路径 ----------
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

// ---------- 加载所有反馈（管理员接口） ----------
const loadFeedbacks = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE}/api/admin/feedbacks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('获取反馈列表失败');
    const result = await response.json();
    if (!result.success) throw new Error(result.error || '未知错误');
    
    // 假设返回的数据结构为 { success: true, data: [...] }
    // 每条反馈包含 id, username, type, content, contact, status, reply, createdAt
    feedbacks.value = result.data || [];
    
    // 重置到第一页
    currentPage.value = 1;
  } catch (err) {
    console.error('加载反馈失败:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

// ---------- 搜索/筛选处理（防抖） ----------
const handleSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  searchTimeout.value = setTimeout(() => {
    currentPage.value = 1; // 搜索时重置到第一页
  }, 300);
};

const handleFilterChange = () => {
  currentPage.value = 1; // 筛选变化重置到第一页
};

// ---------- 清除所有筛选 ----------
const clearFilters = () => {
  searchQuery.value = '';
  statusFilter.value = '';
  typeFilter.value = '';
  currentPage.value = 1;
};

// ---------- 分页方法 ----------
const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const goToFirstPage = () => {
  currentPage.value = 1;
};

const goToLastPage = () => {
  currentPage.value = totalPages.value;
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const handlePageSizeChange = () => {
  currentPage.value = 1; // 改变每页条数时重置到第一页
};

// ---------- 辅助函数 ----------
const getFeedbackTypeText = (type) => {
  const types = {
    suggestion: '功能建议',
    bug: '问题反馈',
    question: '使用疑问',
    other: '其他'
  };
  return types[type] || type;
};

const getFeedbackStatusText = (status) => {
  const statuses = {
    pending: '待处理',
    processing: '处理中',
    completed: '已回复',
    rejected: '已驳回'
  };
  return statuses[status] || status;
};

const formatDate = (dateString) => {
  if (!dateString) return '未知';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const truncateContent = (content, maxLength = 50) => {
  if (!content) return '';
  return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
};

// ---------- 查看反馈详情 ----------
const viewFeedback = (fb) => {
  currentFeedback.value = fb;
  replyContent.value = fb.reply || '';
  newStatus.value = fb.status;
  showDetailPanel.value = true;
};

// ---------- 关闭详情面板 ----------
const closeDetailPanel = () => {
  showDetailPanel.value = false;
  currentFeedback.value = null;
  replyContent.value = '';
  newStatus.value = '';
};

// ---------- 提交回复（更新反馈） ----------
const submitReply = async () => {
  if (!currentFeedback.value) return;
  
  replyLoading.value = true;
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE}/api/admin/feedbacks/${currentFeedback.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        reply: replyContent.value,
        status: newStatus.value
      })
    });
    
    if (!response.ok) throw new Error('保存失败');
    const result = await response.json();
    if (!result.success) throw new Error(result.error || '保存失败');
    
    // 更新本地数据
    const index = feedbacks.value.findIndex(f => f.id === currentFeedback.value.id);
    if (index !== -1) {
      feedbacks.value[index] = { ...feedbacks.value[index], reply: replyContent.value, status: newStatus.value };
    }
    
    closeDetailPanel();
  } catch (err) {
    console.error('提交回复失败:', err);
    alert(err.message);
  } finally {
    replyLoading.value = false;
  }
};

// 为了兼容原模板中的editStatus，我们将其指向详情面板（也可单独实现，这里统一使用详情面板）
const editStatus = (fb) => {
  viewFeedback(fb); // 直接打开详情面板，可以在那里修改状态
};

// ---------- 监听搜索和分页变化（与节点管理相同） ----------
watch([searchQuery, pageSize], () => {
  currentPage.value = 1;
});

// ---------- 生命周期 ----------
onMounted(() => {
  const token = localStorage.getItem('authToken');
  const role = localStorage.getItem('userRole');

  if (!token || role !== 'admin') {
    alert('无权限访问，请以管理员身份登录');
    router.push('/');
    return;
  }

  loadFeedbacks();

  document.addEventListener('click', handleClickOutside);
  timer = setInterval(updateTime, 1000);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  if (timer) clearInterval(timer);
  if (searchTimeout.value) clearTimeout(searchTimeout.value);
});
</script>

<style scoped>
  /* ========== 全局样式（完全复用 NodeManage 的样式，仅调整部分类名） ========== */
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
  .app-container.dark .feedback-management {
    background-color: #2c2c3a;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  .app-container.dark .feedback-table {
    background-color: #2c2c3a;
    color: #e0e0e0;
  }
  .app-container.dark .feedback-table th {
    background-color: #3a3a4a;
    color: #e0e0e0;
  }
  .app-container.dark .feedback-table td {
    border-bottom-color: #4a4a5a;
  }
  .app-container.dark .feedback-detail-panel {
    background-color: #3a3a4a;
    border-color: #4a4a5a;
    color: #e0e0e0;
  }
  .app-container.dark .feedback-detail-panel input,
  .app-container.dark .feedback-detail-panel textarea,
  .app-container.dark .feedback-detail-panel select {
    background-color: #2c2c3a;
    border-color: #4a4a5a;
    color: #e0e0e0;
  }
  .app-container.dark .btn-primary {
    background-color: #6d4c9e;
  }
  .app-container.dark .btn-primary:hover {
    background-color: #8B5CF6;
  }
  .app-container.dark .btn-secondary {
    background-color: #4a4a5a;
    color: #e0e0e0;
  }
  .app-container.dark .btn-secondary:hover {
    background-color: #5a5a6a;
  }
  .app-container.dark .search-input,
  .app-container.dark .filter-select {
    background-color: #2c2c3a;
    border-color: #4a4a5a;
    color: #e0e0e0;
  }
  .app-container.dark .pagination-btn {
    background-color: #2c2c3a;
    border-color: #4a4a5a;
    color: #e0e0e0;
  }
  .app-container.dark .pagination-btn:hover:not(:disabled):not(.dots) {
    background-color: #3a3a4a;
  }
  .app-container.dark .pagination-btn.active {
    background-color: #8B5CF6;
    color: white;
  }
  .app-container.dark .page-size-selector select {
    background-color: #2c2c3a;
    border-color: #4a4a5a;
    color: #e0e0e0;
  }
  .app-container.dark .total-count {
    color: #e0e0e0;
  }

  /* ========== 顶部导航（完全复制原模板） ========== */
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
    cursor: pointer;
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

  /* ========== 主体布局（与原模板相同） ========== */
  .main-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  /* 左侧导航（复制原模板） */
  .sidebar {
    width: 15vw;
    background-color: #ffffff;
    box-shadow: 2px 0 6px rgba(139, 92, 246, 0.05);
    overflow-y: auto;
    transition: background-color 0.3s;
    display: flex;
    flex-direction: column;
  }
  .nav-menu {
    flex: 1;
    padding-top: 0px;
  }
  .nav-item {
    display: flex;
    align-items: center;
    padding: 20px 30px;
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
  .sub-nav-item {
    padding-left: 30px !important;
  }
  .admin-footer {
    padding: 20px 0;
  }
  .divider {
    height: 1px;
    background-color: #e0e0e0;
    margin: 0 20px 15px 20px;
  }
  .admin-info {
    display: flex;
    align-items: center;
    padding: 0 30px;
    color: #333;
    font-size: 14px;
    gap: 10px;
  }
  .admin-info i {
    color: #8B5CF6;
    font-size: 18px;
  }

  /* ========== 右侧内容区域：反馈管理 ========== */
  .content-section {
    flex: 1;
    padding: 2vh 20px;
    overflow-y: auto;
  }
  .feedback-management {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 12px 0 rgba(139, 92, 246, 0.05);
    padding: 24px;
    min-height: 100%;
    position: relative;
    transition: background-color 0.3s;
  }

  .management-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  .management-header h2 {
    font-size: 22px;
    color: #333;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .btn-primary {
    background-color: #8B5CF6;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 10px 20px;
    font-size: 14px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: background-color 0.2s;
  }
  .btn-primary:hover {
    background-color: #7A4BDE;
  }
  .btn-secondary {
    background-color: #e9ecef;
    color: #333;
    border: none;
    border-radius: 6px;
    padding: 10px 20px;
    font-size: 14px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: background-color 0.2s;
  }
  .btn-secondary:hover {
    background-color: #dde2e6;
  }
  .btn-icon {
    background: none;
    border: none;
    color: #8B5CF6;
    font-size: 16px;
    cursor: pointer;
    padding: 4px 8px;
    margin: 0 4px;
    transition: color 0.2s;
  }
  .btn-icon:hover {
    color: #6d4c9e;
  }

  /* 搜索与筛选区域 */
  .search-section {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    padding: 16px;
    background-color: #f8f9fa;
    border-radius: 8px;
    flex-wrap: wrap;
  }
  .search-wrapper {
    flex: 2;
    min-width: 250px;
    position: relative;
  }
  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #999;
    font-size: 14px;
  }
  .search-input {
    width: 100%;
    padding: 10px 10px 10px 35px;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.2s;
  }
  .search-input:focus {
    outline: none;
    border-color: #8B5CF6;
  }
  .filter-group {
    display: flex;
    gap: 8px;
    flex: 1;
  }
  .filter-select {
    padding: 10px 12px;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    font-size: 14px;
    background-color: white;
    cursor: pointer;
    outline: none;
    min-width: 120px;
  }
  .filter-select:hover {
    border-color: #8B5CF6;
  }
  .btn-clear {
    background-color: #e9ecef;
    color: #333;
    border: none;
    border-radius: 6px;
    padding: 10px 20px;
    font-size: 14px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: background-color 0.2s;
    white-space: nowrap;
  }
  .btn-clear:hover {
    background-color: #dde2e6;
  }
  .total-count {
    color: #666;
    font-size: 14px;
    padding: 0 10px;
    white-space: nowrap;
  }
  .count-number {
    font-weight: 600;
    color: #8B5CF6;
    font-size: 16px;
  }

  /* 反馈表格 */
  .feedback-table-wrapper {
    overflow-x: auto;
  }
  .feedback-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  .feedback-table th {
    text-align: left;
    padding: 16px 12px;
    background-color: #f8f9fa;
    color: #333;
    font-weight: 600;
    border-bottom: 2px solid #e9ecef;
  }
  .feedback-table td {
    padding: 12px;
    border-bottom: 1px solid #e9ecef;
    color: #555;
    vertical-align: middle;
  }
  .text-center {
    text-align: center;
  }
  .feedback-content-preview {
    max-width: 250px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* 状态徽章 */
  .feedback-status-badge,
  .feedback-type-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    text-align: center;
  }
  .feedback-status-badge.pending {
    background: #fff3e0;
    color: #f57c00;
  }
  .feedback-status-badge.processing {
    background: #e3f2fd;
    color: #1976d2;
  }
  .feedback-status-badge.completed {
    background: #e8f5e8;
    color: #2e7d32;
  }
  .feedback-status-badge.rejected {
    background: #ffebee;
    color: #c62828;
  }
  .feedback-type-badge.suggestion {
    background: #e3f2fd;
    color: #1976d2;
  }
  .feedback-type-badge.bug {
    background: #ffebee;
    color: #c62828;
  }
  .feedback-type-badge.question {
    background: #fff3e0;
    color: #f57c00;
  }
  .feedback-type-badge.other {
    background: #e8eaf6;
    color: #3949ab;
  }

  /* 暗色模式下的徽章适配 */
  .app-container.dark .feedback-status-badge.pending {
    background: #5a3e1a;
    color: #ffb74d;
  }
  .app-container.dark .feedback-status-badge.processing {
    background: #1a3a5a;
    color: #64b5f6;
  }
  .app-container.dark .feedback-status-badge.completed {
    background: #1a3a1a;
    color: #81c784;
  }
  .app-container.dark .feedback-status-badge.rejected {
    background: #5a1a1a;
    color: #e57373;
  }
  .app-container.dark .feedback-type-badge.suggestion {
    background: #1a3a5a;
    color: #64b5f6;
  }
  .app-container.dark .feedback-type-badge.bug {
    background: #5a1a1a;
    color: #e57373;
  }
  .app-container.dark .feedback-type-badge.question {
    background: #5a3e1a;
    color: #ffb74d;
  }
  .app-container.dark .feedback-type-badge.other {
    background: #2a2a4a;
    color: #9fa8da;
  }

  /* 分页组件（完全复用 NodeManage 的样式） */
  .pagination-container {
    margin-top: 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
  }
  .pagination-info {
    color: #666;
    font-size: 14px;
  }
  .pagination {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .pagination-btn {
    min-width: 36px;
    height: 36px;
    padding: 0 6px;
    border: 1px solid #e9ecef;
    background-color: #fff;
    color: #333;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .pagination-btn:hover:not(:disabled):not(.dots) {
    background-color: #f1f1f1;
    border-color: #8B5CF6;
    color: #8B5CF6;
  }
  .pagination-btn.active {
    background-color: #8B5CF6;
    border-color: #8B5CF6;
    color: white;
  }
  .pagination-btn.dots {
    cursor: default;
    background-color: transparent;
    border-color: transparent;
  }
  .pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .page-size-selector select {
    padding: 8px 12px;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    font-size: 14px;
    color: #333;
    background-color: #fff;
    cursor: pointer;
    outline: none;
  }
  .page-size-selector select:hover {
    border-color: #8B5CF6;
  }

  /* 反馈详情面板（类似节点表单） */
  .feedback-detail-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 500px;
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    z-index: 2000;
  }
  .feedback-detail-panel h3 {
    margin-bottom: 20px;
    color: #333;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .detail-content {
    margin-bottom: 20px;
  }
  .info-row {
    margin-bottom: 12px;
    display: flex;
    align-items: flex-start;
  }
  .info-row .label {
    width: 80px;
    font-weight: 500;
    color: #666;
    flex-shrink: 0;
  }
  .info-row .content-text,
  .info-row .reply-text {
    flex: 1;
    background: #f8f9fa;
    padding: 8px 12px;
    border-radius: 6px;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .reply-box {
    margin-top: 16px;
    border-top: 1px dashed #e9ecef;
    padding-top: 12px;
  }
  .reply-form {
    margin-top: 20px;
    border-top: 1px solid #e9ecef;
    padding-top: 16px;
  }
  .form-group {
    margin-bottom: 16px;
  }
  .form-group label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: #555;
    font-size: 14px;
  }
  .form-group textarea,
  .form-group select {
    width: 100%;
    padding: 10px;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.2s;
    font-family: inherit;
  }
  .form-group textarea:focus,
  .form-group select:focus {
    outline: none;
    border-color: #8B5CF6;
  }
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
  }

  /* 加载与错误提示（与节点管理相同） */
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255,255,255,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    color: #8B5CF6;
    z-index: 100;
  }
  .error-message {
    padding: 20px;
    text-align: center;
    color: #dc3545;
  }
  .retry-btn {
    margin-left: 10px;
    padding: 4px 8px;
    background-color: #8B5CF6;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  /* 暗色模式面板适配 */
  .app-container.dark .info-row .label {
    color: #aaa;
  }
  .app-container.dark .info-row .content-text,
  .app-container.dark .info-row .reply-text {
    background-color: #2c2c3a;
    color: #e0e0e0;
  }
  .app-container.dark .reply-form {
    border-top-color: #4a4a5a;
  }
</style>

<style>
/* 全局字体图标引入（与原模板一致） */
@import '../pages/fontawesome-free-6.4.0-web/fontawesome-free-6.4.0-web/css/all.min.css';
</style>