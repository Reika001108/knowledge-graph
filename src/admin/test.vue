<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶部导航栏 -->
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
      <!-- 左侧导航栏 -->
      <aside class="sidebar">
        <nav class="nav-menu">
          <a href="#" class="nav-item" @click.prevent="goToGraph">
            <i class="fas fa-atom icon"></i>
            <span class="nav-text">知识图谱</span>
          </a>
          <a href="#" class="nav-item active">
            <i class="fas fa-book-atlas icon"></i>
            <span class="nav-text">高级检索</span>
          </a>
          <a href="#" class="nav-item" @click.prevent="goToAIResponse">
            <i class="fas fa-robot icon"></i>
            <span class="nav-text">智能问答</span>
          </a>
          <a href="#" class="nav-item" @click.prevent="goToProfile">
            <i class="fas fa-user icon"></i>
            <span class="nav-text">个人中心</span>
          </a>
        </nav>
      </aside>

      <!-- 右侧内容区域 -->
      <section class="content-section">
        <div class="search-card">
          <h3>高级检索</h3>

          <!-- 搜索框 -->
          <div class="search-box">
            <input
              type="text"
              v-model="searchQuery"
              class="query-input"
              placeholder="输入技术/框架/工具名称..."
              @keyup.enter="performSearch"
            />
            <button class="search-btn" @click="performSearch" :disabled="loading">
              <i class="fas fa-search"></i> 检索
            </button>
          </div>

          <!-- 高级搜索切换 -->
          <div class="advanced-toggle" @click="showAdvanced = !showAdvanced">
            <i :class="showAdvanced ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
            {{ showAdvanced ? '收起高级选项' : '展开高级选项' }}
          </div>

          <!-- 高级搜索选项面板 (使用您提供的类型) -->
          <div v-if="showAdvanced" class="advanced-options">
            <div class="filter-group">
              <label>实体类型</label>
              <div class="checkbox-group">
                <label v-for="type in entityTypes" :key="type.value">
                  <input type="checkbox" :value="type.value" v-model="selectedTypes" />
                  {{ type.label }}
                </label>
              </div>
            </div>

            <div class="filter-group">
              <label>关系类型</label>
              <div class="checkbox-group">
                <label v-for="rel in relationTypes" :key="rel.value">
                  <input type="checkbox" :value="rel.value" v-model="selectedRelations" />
                  {{ rel.label }}
                </label>
              </div>
            </div>

            <div class="filter-actions">
              <button class="reset-btn" @click="resetFilters">重置</button>
              <button class="apply-btn" @click="performSearch">应用筛选</button>
            </div>
          </div>

          <!-- 加载状态 -->
          <div v-if="loading" class="loading">
            <i class="fas fa-spinner fa-spin"></i> 检索中...
          </div>

          <!-- 搜索结果 (示例数据) -->
          <div v-else-if="hasSearched && results.length === 0" class="no-result">
            <i class="fas fa-exclamation-circle"></i> 未找到相关结果
          </div>

          <ul v-else-if="results.length > 0" class="result-list">
            <li v-for="(item, index) in results" :key="index" class="result-item">
              <div class="item-header">
                <span class="item-name">{{ item.source }}</span>
                <span class="item-type">{{ item.type }}</span>
              </div>
              <div class="item-relation">
                <i class="fas fa-arrow-right"></i> {{ item.relation }}
              </div>
              <div class="item-header" style="margin-top: 8px;">
                <span class="item-name">{{ item.target }}</span>
                <span class="item-type">{{ item.type }}</span>
              </div>
              <div class="item-path" v-if="item.path">
                路径: {{ item.path }}
              </div>
            </li>
          </ul>

          <!-- 技术文档卡片 (完整数据) -->
          <div class="tech-cards">
            <h4><i class="fas fa-book-open"></i> 前端技术文档</h4>
            <div
              v-for="(category, catIndex) in techCategories"
              :key="catIndex"
              class="category-section"
            >
              <div class="category-title">{{ category.title }}</div>
              <div class="cards-container" v-if="category.items.length > 0">
                <a
                  v-for="tech in category.items"
                  :key="tech.name"
                  :href="tech.link"
                  target="_blank"
                  class="tech-card"
                >
                  <i :class="['fab', tech.icon]"></i>
                  <h5>{{ tech.name }}</h5>
                  <p>{{ tech.desc }}</p>
                  <span class="card-link">查看文档 →</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

// ---------- 用户及主题相关 ----------
const showDropdown = ref(false);
const avatarWrapper = ref(null);
const userInfo = ref(null);
const currentTime = ref(new Date().toLocaleTimeString());
const isDark = ref(false);

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
  window.location.href = 'http://localhost:5173/knowledge';
};
const goToProfile = () => {
  window.location.href = 'http://localhost:5173/person';
};
const goToAIResponse = () => {
  window.location.href = 'http://localhost:5173/AI-response';
};

// ========== 修改点：统一 token 键名为 authToken，并清除相关项 ==========
const logout = () => {
  localStorage.removeItem('authToken');      // 统一 token 键名
  localStorage.removeItem('user_info');      // 用户信息
  localStorage.removeItem('userRole');       // 角色（如有）
  localStorage.removeItem('adminName');      // 管理员名（如有）
  window.location.href = 'http://localhost:5173/';
  showDropdown.value = false;
};

// ---------- 高级检索相关 ----------
const searchQuery = ref('');
const results = ref([]);
const loading = ref(false);
const hasSearched = ref(false);
const showAdvanced = ref(false);
const selectedTypes = ref([]);
const selectedRelations = ref([]);
const searchDepth = ref(2);

// 实体类型
const entityTypes = [
  { value: 'API相关', label: 'API相关' },
  { value: 'Manager', label: 'Manager' },
  { value: 'User', label: 'User' },
  { value: '包管理器', label: '包管理器' },
  { value: '构建工具', label: '构建工具' },
  { value: '样式工具', label: '样式工具' },
  { value: '框架和库', label: '框架和库' },
  { value: '测试工具', label: '测试工具' },
  { value: '语言基础', label: '语言基础' },
  { value: '运行时环境', label: '运行时环境' }
];

// 关系类型
const relationTypes = [
  { value: '互补', label: '互补' },
  { value: '依赖于', label: '依赖于' },
  { value: '修改', label: '修改' },
  { value: '协代', label: '协代' },
  { value: '可用于', label: '可用于' },
  { value: '基于', label: '基于' },
  { value: '处理', label: '处理' },
  { value: '安装', label: '安装' },
  { value: '官方推荐用于', label: '官方推荐用于' },
  { value: '常用于', label: '常用于' },
  { value: '常用于构建', label: '常用于构建' },
  { value: '引入', label: '引入' },
  { value: '引入于', label: '引入于' },
  { value: '打包', label: '打包' },
  { value: '操作', label: '操作' },
  { value: '支持', label: '支持' },
  { value: '改进于', label: '改进于' },
  { value: '替代', label: '替代' },
  { value: '样式化', label: '样式化' },
  { value: '测试', label: '测试' },
  { value: '生成', label: '生成' },
  { value: '用于实现', label: '用于实现' },
  { value: '用于构建', label: '用于构建' },
  { value: '管理', label: '管理' },
  { value: '类似于', label: '类似于' },
  { value: '结合', label: '结合' },
  { value: '编译为', label: '编译为' },
  { value: '自动化任务', label: '自动化任务' },
  { value: '超集', label: '超集' },
  { value: '运行', label: '运行' },
  { value: '运行于', label: '运行于' },
  { value: '集成', label: '集成' }
];

// 技术卡片数据（略，与原来相同，完整代码见原文件）
const techCategories = [ /* 完整数据请参考原文件，此处省略 */ ];

// 模拟搜索结果
const performSearch = async () => {
  const query = searchQuery.value.trim();
  if (!query) return;

  loading.value = true;
  hasSearched.value = true;
  results.value = [];

  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const mockData = [
      { source: 'Vue', target: 'React', relation: '竞争对手', type: '框架和库' },
      { source: 'Webpack', target: 'Vite', relation: '替代', type: '构建工具' },
      { source: 'TypeScript', target: 'JavaScript', relation: '超集', type: '语言基础' },
      { source: 'Babel', target: 'ES6', relation: '编译为', type: '构建工具' },
      { source: 'npm', target: 'yarn', relation: '替代', type: '包管理器' },
      { source: 'Sass', target: 'CSS', relation: '编译为', type: '样式工具' }
    ];
    if (query) {
      results.value = mockData.filter(item => 
        item.source.includes(query) || item.target.includes(query)
      );
    } else {
      results.value = mockData;
    }
  } catch (error) {
    console.error('检索失败:', error);
    results.value = [];
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  selectedTypes.value = [];
  selectedRelations.value = [];
  searchDepth.value = 2;
};

// ---------- 生命周期 ----------
onMounted(() => {
  // ========== 修改点：使用统一 token 键名 authToken ==========
  const token = localStorage.getItem('authToken');
  const userInfoStr = localStorage.getItem('user_info');

  if (!token) {
    alert('请先登录后再访问');
    window.location.href = 'http://localhost:5173/';
    return;
  }

  if (userInfoStr) {
    try {
      userInfo.value = JSON.parse(userInfoStr);
    } catch (e) {
      console.error('解析用户信息失败:', e);
      localStorage.removeItem('user_info');
    }
  }

  document.addEventListener('click', handleClickOutside);
  timer = setInterval(updateTime, 1000);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
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
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  background-color: #FAF5FF; /* 统一浅紫背景 */
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
.app-container.dark .search-card {
  background-color: #2c2c3a;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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
.app-container.dark .tech-card {
  background-color: #3a3a4a;
  border-color: #4a4a5a;
}
.app-container.dark .tech-card h5 {
  color: #e0e0e0;
}
.app-container.dark .tech-card p {
  color: #b0b0b0;
}
.app-container.dark .category-title {
  background-color: #3a3a4a;
  color: #e0e0e0;
  border-left-color: #8B5CF6;
}

/* ========== 顶部导航 ========== */
.header {
  width: 100%;
  height: 10vh;
  background-color: #8B5CF6; /* 纯紫主色 */
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

/* 右侧内容区域 */
.content-section {
  flex: 1;
  padding: 2vh 20px;
  overflow-y: auto;
}
.search-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px 0 rgba(139, 92, 246, 0.05);
  padding: 24px;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  transition: background-color 0.3s, box-shadow 0.3s;
}
.search-card h3 {
  margin-bottom: 20px;
  color: #333;
  border-left: 4px solid #8B5CF6;
  padding-left: 10px;
}

/* 搜索框 */
.search-box {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.query-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  outline: none;
  transition: border 0.3s;
}
.query-input:focus {
  border-color: #8B5CF6;
}
.search-btn {
  padding: 0 24px;
  background-color: #8B5CF6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 5px;
}
.search-btn:hover {
  background-color: #A78BFA;
}
.search-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 高级搜索切换 */
.advanced-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #8B5CF6;
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 15px;
  user-select: none;
}
.advanced-toggle:hover {
  text-decoration: underline;
}

/* 高级选项面板 */
.advanced-options {
  background-color: #f9fafc;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid #e9ecef;
}
.filter-group {
  margin-bottom: 15px;
}
.filter-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #495057;
  font-size: 14px;
}
.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}
.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: normal;
  margin-bottom: 0;
  cursor: pointer;
}
.depth-select {
  padding: 6px 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  width: 100px;
}
.filter-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
.reset-btn,
.apply-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}
.reset-btn {
  background-color: #e9ecef;
  color: #495057;
}
.reset-btn:hover {
  background-color: #dee2e6;
}
.apply-btn {
  background-color: #8B5CF6;
  color: white;
}
.apply-btn:hover {
  background-color: #A78BFA;
}

/* 加载 & 无结果 */
.loading, .no-result {
  text-align: center;
  padding: 40px 0;
  color: #666;
  font-style: italic;
}
.no-result i {
  margin-right: 5px;
}

/* 结果列表 */
.result-list {
  list-style: none;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 10px;
  margin-bottom: 30px;
}
.result-list::-webkit-scrollbar {
  width: 6px;
}
.result-list::-webkit-scrollbar-thumb {
  background-color: #ddd;
  border-radius: 3px;
}
.result-item {
  border-bottom: 1px solid #eee;
  padding: 16px 0;
  transition: background 0.2s;
}
.result-item:hover {
  background-color: #f9f9ff;
}
.item-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.item-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}
.item-type {
  font-size: 12px;
  color: #8B5CF6;
  background-color: #f0f0ff;
  padding: 2px 6px;
  border-radius: 4px;
}
.item-relation {
  color: #e74c3c;
  font-size: 14px;
  margin-bottom: 4px;
}
.item-path {
  font-size: 13px;
  color: #666;
  background-color: #f8f9fa;
  padding: 8px;
  border-radius: 4px;
  border-left: 3px solid #8B5CF6;
}

/* 技术卡片区域 (保留原有网格布局) */
.tech-cards {
  margin-top: 20px;
  border-top: 1px solid #edf2f7;
  padding-top: 20px;
}
.tech-cards h4 {
  font-size: 16px;
  color: #2d3748;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.category-section {
  margin-top: 24px;
}
.category-section:first-of-type {
  margin-top: 0;
}
.category-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 16px;
  padding-left: 10px;
  border-left: 4px solid #8B5CF6;
  background-color: #f8f9fa;
  padding: 8px 12px;
  border-radius: 4px;
}
.cards-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.tech-card {
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 20px 16px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.tech-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(139, 92, 246, 0.08);
  border-color: #8B5CF6;
}
.tech-card i {
  font-size: 40px;
  margin-bottom: 12px;
  color: #8B5CF6;
}
.tech-card h5 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #2d3748;
}
.tech-card p {
  font-size: 13px;
  color: #718096;
  margin-bottom: 12px;
  line-height: 1.4;
}
.card-link {
  font-size: 13px;
  color: #8B5CF6;
  font-weight: 500;
}
.tech-card:hover .card-link {
  text-decoration: underline;
}
</style>

<style>
@import './fontawesome-free-6.4.0-web/fontawesome-free-6.4.0-web/css/all.min.css';
</style> 