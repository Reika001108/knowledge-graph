<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶部导航栏（与模板一致） -->
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
      <!-- 左侧导航栏（与模板一致，但根据当前路由设置 active 项） -->
      <aside class="sidebar">
        <nav class="nav-menu">
          <a href="#" class="nav-item" :class="{ active: route.path === '/admin/home' }" @click.prevent="goToDashboard">
            <i class="fas fa-tachometer-alt icon"></i>
            <span class="nav-text">主页</span>
          </a>
          <a href="#" class="nav-item" :class="{ active: route.path === '/admin/users' }" @click.prevent="goToUserManage">
            <i class="fas fa-users icon"></i>
            <span class="nav-text">用户管理</span>
          </a>
          <div class="nav-item" @click="toggleGraphMenu">
            <i class="fas fa-project-diagram icon"></i>
            <span class="nav-text">图谱管理</span>
            <i class="fas" :class="graphMenuExpanded ? 'fa-chevron-down' : 'fa-chevron-right'" style="margin-left: auto;"></i>
          </div>
          <div v-if="graphMenuExpanded" class="sub-nav">
            <a href="#" class="nav-item sub-nav-item" :class="{ active: route.path === '/admin/graph/display' }" @click.prevent="goToGraphDisplay">
              <i class="fas fa-eye icon" style="margin-left: 28px;"></i>
              <span class="nav-text">图谱展示</span>
            </a>
            <a href="#" class="nav-item sub-nav-item" :class="{ active: route.path === '/admin/graph/nodes' }" @click.prevent="goToNodeManage">
              <i class="fas fa-cube icon" style="margin-left: 28px;"></i>
              <span class="nav-text">节点管理</span>
            </a>
            <a href="#" class="nav-item sub-nav-item" :class="{ active: route.path === '/admin/graph/relations' }" @click.prevent="goToRelationManage">
              <i class="fas fa-link icon" style="margin-left: 28px;"></i>
              <span class="nav-text">关系管理</span>
            </a>
          </div>
          <a href="#" class="nav-item active" @click.prevent="goToDataStats">
            <i class="fas fa-chart-bar icon"></i>
            <span class="nav-text">数据统计</span>
          </a>
          <a href="#" class="nav-item" :class="{ active: route.path === '/admin/logs' }" @click.prevent="goToSystemLog">
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

      <!-- 右侧主要内容区域：数据统计仪表盘 -->
      <section class="content-section">
        <div class="stats-dashboard">
          <div class="stats-header">
            <h2><i class="fas fa-chart-bar"></i> 数据统计</h2>
            <button class="btn-refresh" @click="loadStats" title="刷新数据">
              <i class="fas fa-sync-alt"></i> 刷新
            </button>
          </div>

          <!-- 统计卡片 -->
          <div class="stats-cards" v-if="!loading && !error">
            <div class="stat-card">
              <div class="stat-icon"><i class="fas fa-cubes"></i></div>
              <div class="stat-content">
                <div class="stat-label">总节点数</div>
                <div class="stat-value">{{ stats.nodeCount }}</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon"><i class="fas fa-link"></i></div>
              <div class="stat-content">
                <div class="stat-label">总关系数</div>
                <div class="stat-value">{{ stats.edgeCount }}</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon"><i class="fas fa-tags"></i></div>
              <div class="stat-content">
                <div class="stat-label">节点类型数</div>
                <div class="stat-value">{{ stats.categoryCounts?.length || 0 }}</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon"><i class="fas fa-sitemap"></i></div>
              <div class="stat-content">
                <div class="stat-label">关系类型数</div>
                <div class="stat-value">{{ stats.relationTypeCounts?.length || 0 }}</div>
              </div>
            </div>
          </div>

          <!-- 图表区域 -->
          <div class="charts-container" v-if="!loading && !error">
            <div class="chart-wrapper">
              <h3>节点类型分布</h3>
              <div id="categoryChart" ref="categoryChartRef" style="width: 100%; height: 300px;"></div>
              <!-- 新增：无数据时占位提示 -->
              <div v-if="!hasCategoryData" class="chart-placeholder">暂无节点类型数据</div>
            </div>
            <div class="chart-wrapper">
              <h3>关系类型分布</h3>
              <div id="relationChart" ref="relationChartRef" style="width: 100%; height: 300px;"></div>
              <!-- 新增：无数据时占位提示 -->
              <div v-if="!hasRelationData" class="chart-placeholder">暂无关系类型数据</div>
            </div>
          </div>

          <!-- 加载和错误提示 -->
          <div v-if="loading" class="stats-loading">
            <i class="fas fa-spinner fa-pulse"></i> 加载统计中...
          </div>
          <div v-if="error" class="stats-error">
            {{ error }}
            <button @click="loadStats" class="retry-btn">重试</button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import * as echarts from 'echarts';

const router = useRouter();
const route = useRoute();

// ---------- 状态 ----------
const showDropdown = ref(false);
const avatarWrapper = ref(null);
const currentTime = ref(new Date().toLocaleTimeString());
const isDark = ref(false);
const graphMenuExpanded = ref(true);
const adminName = ref('');

// 统计相关
const loading = ref(false);
const error = ref('');
const stats = ref({
  nodeCount: 0,
  edgeCount: 0,
  categoryCounts: [],
  relationTypeCounts: []
});

// 图表实例和容器引用
let categoryChart = null;
let relationChart = null;
const categoryChartRef = ref(null);
const relationChartRef = ref(null);

// 新增：计算属性判断是否有数据
const hasCategoryData = computed(() => stats.value.categoryCounts?.length > 0);
const hasRelationData = computed(() => stats.value.relationTypeCounts?.length > 0);

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

// ---------- 主题切换 ----------
const toggleTheme = () => {
  isDark.value = !isDark.value;
};

// 根据主题获取图表颜色
const getChartColors = () => {
  return isDark.value
    ? {
        backgroundColor: '#1e1e2f',
        textColor: '#e0e0e0',
        axisColor: '#555',
        gridColor: '#333',
        seriesColors: ['#5470c6', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc']
      }
    : {
        backgroundColor: '#f8f9fa',
        textColor: '#333',
        axisColor: '#ccc',
        gridColor: '#e9ecef',
        seriesColors: ['#5470c6', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc']
      };
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
const goToDataStats = () => {}; // 当前页面
const goToSystemLog = () => router.push('/admin/logs');
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

// ---------- 加载统计数据 ----------
const loadStats = async () => {
  loading.value = true;
  error.value = '';
  try {
    const token = localStorage.getItem('authToken');
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
    const response = await fetch(`${API_BASE}/api/admin/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('获取统计数据失败');
    const result = await response.json();
    if (!result.success) throw new Error(result.error || '未知错误');

    // 新增：确保数据结构正确
    const data = result.data || {};
    stats.value = {
      nodeCount: data.nodeCount || 0,
      edgeCount: data.edgeCount || 0,
      categoryCounts: Array.isArray(data.categoryCounts) ? data.categoryCounts : [],
      relationTypeCounts: Array.isArray(data.relationTypeCounts) ? data.relationTypeCounts : []
    };
  } catch (err) {
    console.error('加载统计失败:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

// ---------- 初始化图表 ----------
const initCharts = () => {
  // 销毁旧实例
  if (categoryChart) categoryChart.dispose();
  if (relationChart) relationChart.dispose();

  // 确保容器存在
  if (!categoryChartRef.value || !relationChartRef.value) {
    console.warn('图表容器未找到');
    return;
  }

  const colors = getChartColors();

  // 节点类型分布饼图（仅在有数据时渲染）
  if (hasCategoryData.value) {
    categoryChart = echarts.init(categoryChartRef.value);
    const categoryOption = {
      backgroundColor: colors.backgroundColor,
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      series: [{
        name: '节点类型',
        type: 'pie',
        radius: '50%',
        data: stats.value.categoryCounts.map(item => ({
          name: item.name || '未知',
          value: item.count || 0
        })),
        label: { color: colors.textColor, formatter: '{b}: {d}%' },
        itemStyle: { borderRadius: 8, borderColor: colors.backgroundColor, borderWidth: 2 },
        color: colors.seriesColors
      }],
      legend: { orient: 'horizontal', bottom: 0, textStyle: { color: colors.textColor } }
    };
    categoryChart.setOption(categoryOption);
  } else {
    // 无数据时，可以清空图表区域（但模板中已有占位提示）
    if (categoryChartRef.value) {
      // 可选：显示一个空状态，但我们已经用占位文字处理
    }
  }

  // 关系类型分布柱状图（仅在有数据时渲染）
  if (hasRelationData.value) {
    relationChart = echarts.init(relationChartRef.value);
    const relationOption = {
      backgroundColor: colors.backgroundColor,
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: stats.value.relationTypeCounts.map(item => item.name || '未知'),
        axisLabel: { color: colors.textColor },
        axisLine: { lineStyle: { color: colors.axisColor } }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: colors.textColor },
        splitLine: { lineStyle: { color: colors.gridColor } }
      },
      series: [{
        name: '关系数量',
        type: 'bar',
        data: stats.value.relationTypeCounts.map(item => item.count || 0),
        itemStyle: { color: colors.seriesColors[1], borderRadius: [4, 4, 0, 0] },
        barWidth: '40%'
      }],
      legend: { show: false }
    };
    relationChart.setOption(relationOption);
  }
};

// 新增：监听数据变化，确保图表在数据加载后渲染
watch([() => stats.value.categoryCounts, () => stats.value.relationTypeCounts, loading], async ([newCat, newRel, isLoading]) => {
  if (!isLoading && (newCat?.length || newRel?.length)) {
    await nextTick(); // 等待DOM更新
    initCharts();
  }
}, { deep: true });

// 监听主题变化重新渲染图表
watch(isDark, () => {
  if (hasCategoryData.value || hasRelationData.value) {
    initCharts();
  }
});

// 窗口大小变化处理（防抖）
let resizeTimer;
const handleResize = () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    categoryChart?.resize();
    relationChart?.resize();
  }, 200);
};

// ---------- 生命周期 ----------
onMounted(() => {
  const token = localStorage.getItem('authToken');
  const role = localStorage.getItem('userRole');
  const storedAdminName = localStorage.getItem('adminName');

  if (!token || role !== 'admin') {
    alert('无权限访问，请以管理员身份登录');
    router.push('/');
    return;
  }

  adminName.value = storedAdminName || '';
  loadStats(); // 加载数据，watch 会触发图表初始化

  document.addEventListener('click', handleClickOutside);
  timer = setInterval(updateTime, 1000);
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  if (timer) clearInterval(timer);
  window.removeEventListener('resize', handleResize);
  if (categoryChart) categoryChart.dispose();
  if (relationChart) relationChart.dispose();
});
</script>

<style scoped>
/* ========== 复用原模板的全局样式 ========== */
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
.app-container.dark .stats-dashboard {
  background-color: #2c2c3a;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.app-container.dark .stat-card {
  background-color: #3a3a4a;
  border-color: #4a4a5a;
  color: #e0e0e0;
}
.app-container.dark .chart-wrapper {
  background-color: #3a3a4a;
  border-color: #4a4a5a;
}
.app-container.dark .chart-wrapper h3 {
  color: #e0e0e0;
}
.app-container.dark .btn-refresh {
  background-color: #6d4c9e;
}
.app-container.dark .btn-refresh:hover {
  background-color: #8B5CF6;
}

/* ========== 顶部导航（与模板一致） ========== */
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

/* ========== 主体布局（与模板一致） ========== */
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

/* 底部管理员信息 */
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

/* ========== 右侧内容区域：数据统计 ========== */
.content-section {
  flex: 1;
  padding: 2vh 20px;
  overflow-y: auto;
}
.stats-dashboard {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px 0 rgba(139, 92, 246, 0.05);
  padding: 24px;
  min-height: 100%;
  transition: background-color 0.3s;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.stats-header h2 {
  font-size: 22px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
}
.btn-refresh {
  background-color: #8B5CF6;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background-color 0.2s;
}
.btn-refresh:hover {
  background-color: #7A4BDE;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}
.stat-card {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
}
.stat-icon {
  width: 50px;
  height: 50px;
  background-color: rgba(139, 92, 246, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #8B5CF6;
}
.stat-content {
  flex: 1;
}
.stat-label {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 5px;
}
.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #333;
}

/* 图表区域 */
.charts-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.chart-wrapper {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  padding: 16px;
  position: relative;
}
.chart-wrapper h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
  font-weight: 500;
}

/* 新增：图表占位提示 */
.chart-placeholder {
  text-align: center;
  color: #999;
  padding: 20px;
  font-size: 14px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
}
.app-container.dark .chart-placeholder {
  color: #666;
}

/* 加载和错误提示 */
.stats-loading,
.stats-error {
  text-align: center;
  padding: 40px;
  font-size: 16px;
  color: #666;
}
.stats-error {
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

/* 暗色模式卡片内文字调整 */
.app-container.dark .stat-card .stat-label {
  color: #aaa;
}
.app-container.dark .stat-card .stat-value {
  color: #e0e0e0;
}
.app-container.dark .chart-wrapper h3 {
  color: #e0e0e0;
}
</style>

<style>
/* 全局字体图标引入（假设已存在） */
@import '../pages/fontawesome-free-6.4.0-web/fontawesome-free-6.4.0-web/css/all.min.css';
</style>