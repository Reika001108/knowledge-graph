<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶部导航栏 -->
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
      <!-- 左侧导航栏 -->
      <aside class="sidebar">
        <nav class="nav-menu">
          <a href="#" class="nav-item active">
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
          <a href="#" class="nav-item" @click.prevent="goToSystemLog">
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

      <!-- 右侧主要内容区域 -->
      <section class="content-section">
        <div class="dashboard">
          <!-- 统计卡片 -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon"><i class="fas fa-users"></i></div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.userCount }}</div>
                <div class="stat-label">注册用户</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon"><i class="fas fa-cubes"></i></div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.nodeCount }}</div>
                <div class="stat-label">知识节点</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon"><i class="fas fa-link"></i></div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.relationCount }}</div>
                <div class="stat-label">关系数量</div>
              </div>
            </div>
          </div>

          <!-- 快捷操作 -->
          <div class="quick-actions">
            <h3><i class="fas fa-rocket"></i> 快捷操作</h3>
            <div class="quick-grid">
              <button class="quick-btn" @click="goToAddNode">
                <i class="fas fa-plus-circle"></i> 新增节点
              </button>
              <button class="quick-btn" @click="goToAddRelation">
                <i class="fas fa-link"></i> 新增关系
              </button>
              <button class="quick-btn" @click="goToImportData">
                <i class="fas fa-users"></i>  用户管理
              </button>
              <button class="quick-btn" @click="goToExportData">
                <i class="fas fa-chart-bar"></i> 数据统计
              </button>
            </div>
          </div>

          <!-- 图表区域 -->
          <div class="charts-container">
            <div class="chart-wrapper">
              <h3><i class="fas fa-chart-pie"></i> 节点类型分布</h3>
              <div v-if="loading" class="chart-loading">
                <i class="fas fa-spinner fa-pulse"></i> 加载中...
              </div>
              <div v-else-if="!hasCategoryData" class="chart-placeholder">
                暂无节点类型数据
              </div>
              <div v-else id="categoryChart" ref="categoryChartRef" style="width: 100%; height: 360px;"></div>
            </div>
            <div class="chart-wrapper">
              <h3><i class="fas fa-chart-pie"></i> 关系类型分布</h3>
              <div v-if="loading" class="chart-loading">
                <i class="fas fa-spinner fa-pulse"></i> 加载中...
              </div>
              <div v-else-if="!hasRelationData" class="chart-placeholder">
                暂无关系类型数据
              </div>
              <div v-else id="relationChart" ref="relationChartRef" style="width: 100%; height: 360px;"></div>
            </div>
          </div>

          <!-- 系统公告 -->
          <div class="announcements">
            <h3><i class="fas fa-bullhorn"></i> 系统公告</h3>
            <div class="announce-list">
              <div v-for="(ann, idx) in announcements" :key="idx" class="announce-item">
                <div class="announce-header">
                  <span class="announce-tag" :class="ann.type">{{ ann.tag }}</span>
                  <span class="announce-time">{{ ann.time }}</span>
                </div>
                <div class="announce-title">{{ ann.title }}</div>
                <div class="announce-content" v-if="ann.content">{{ ann.content }}</div>
              </div>
            </div>
            
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue';
import * as echarts from 'echarts';

// ---------- 状态定义 ----------
const showDropdown = ref(false);
const avatarWrapper = ref(null);
const currentTime = ref(new Date().toLocaleTimeString());
const isDark = ref(false);
const graphMenuExpanded = ref(false);
const adminName = ref('');
const loading = ref(false);

// 统计数据
const stats = ref({
  userCount: 0,
  nodeCount: 0,
  relationCount: 0,
  categoryCounts: [],
  relationTypeCounts: []
});

// 系统公告数据
const announcements = ref([
  { 
    tag: '重要', 
    type: 'important', 
    time: '2024-04-15',
    title: '系统升级维护通知',
    content: '系统将于4月20日 02:00-04:00 进行升级维护，届时可能影响部分功能使用，敬请谅解。'
  },
  // { 
  //   tag: '新功能', 
  //   type: 'new', 
  //   time: '2024-04-14',
  //   title: '知识图谱导出功能上线',
  //   content: '现在支持将知识图谱数据导出为 CSV、JSON 格式，方便数据分析和备份。'
  // },
  // { 
  //   tag: '活动', 
  //   type: 'activity', 
  //   time: '2024-04-13',
  //   title: '邀请好友得额外空间',
  //   content: '邀请新用户注册并创建图谱，双方均可获得 100MB 额外存储空间。'
  // },
  { 
    tag: '公告', 
    type: 'normal', 
    time: '2024-04-12',
    title: '节点管理界面优化',
    content: '节点管理页面已优化搜索和筛选功能，操作更加便捷。'
  },
]);

// 图表实例
let categoryChart = null;
let relationChart = null;
const categoryChartRef = ref(null);
const relationChartRef = ref(null);

// 计算属性
const hasCategoryData = computed(() => stats.value.categoryCounts && stats.value.categoryCounts.length > 0);
const hasRelationData = computed(() => stats.value.relationTypeCounts && stats.value.relationTypeCounts.length > 0);

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

// 根据主题获取图表颜色配置
const getChartColors = () => {
  return isDark.value
    ? {
        backgroundColor: 'transparent',
        textColor: '#e0e0e0',
        axisColor: '#555',
        gridColor: '#333',
        seriesColors: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#E9D5FF', '#F3E8FF', '#D8B4FE', '#7C3AED', '#6D28D9']
      }
    : {
        backgroundColor: 'transparent',
        textColor: '#333',
        axisColor: '#ccc',
        gridColor: '#e9ecef',
        seriesColors: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#E9D5FF', '#F3E8FF', '#D8B4FE', '#7C3AED', '#6D28D9']
      };
};

// 处理数据，超过8个的归为"其他"
const processData = (data) => {
  let sortedData = [...data].sort((a, b) => b.count - a.count);
  let otherCount = 0;
  let mainData = [];
  
  if (sortedData.length > 8) {
    mainData = sortedData.slice(0, 7);
    otherCount = sortedData.slice(7).reduce((sum, item) => sum + item.count, 0);
    if (otherCount > 0) {
      mainData.push({ name: '其他', count: otherCount });
    }
  } else {
    mainData = sortedData;
  }
  
  return mainData;
};

// ---------- 渲染图表 ----------
const renderCharts = () => {
  const colors = getChartColors();

  // 节点类型分布饼图（中间不显示数字）
  if (hasCategoryData.value && stats.value.categoryCounts.length > 0) {
    if (!categoryChartRef.value) return;
    
    if (categoryChart) {
      categoryChart.dispose();
      categoryChart = null;
    }
    
    categoryChart = echarts.init(categoryChartRef.value);
    
    const mainData = processData(stats.value.categoryCounts);
    
    const categoryOption = {
      backgroundColor: colors.backgroundColor,
      tooltip: { 
        trigger: 'item', 
        formatter: '{b}: {c} 个 ({d}%)'
      },
      legend: { 
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        itemGap: 20,
        textStyle: { 
          color: colors.textColor, 
          fontSize: 11,
          fontWeight: 'normal'
        },
        formatter: (name) => `${name}`
      },
      series: [{
        name: '节点类型',
        type: 'pie',
        radius: ['35%', '55%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        label: { 
          show: true,
          position: 'outside',
          color: colors.textColor, 
          formatter: '{b}',
          fontSize: 11,
          lineHeight: 14,
          fontWeight: 'normal'
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 8,
          smooth: true,
          lineStyle: { 
            color: colors.textColor,
            width: 1
          }
        },
        emphasis: {
          scale: true,
          label: {
            show: true,
            fontWeight: 'bold',
            formatter: '{b}: {d}%'
          }
        },
        itemStyle: { 
          borderRadius: 8, 
          borderColor: isDark.value ? '#2c2c3a' : '#fff',
          borderWidth: 2 
        },
        color: colors.seriesColors,
        data: mainData.map(item => ({
          name: item.name || '未知',
          value: item.count || 0
        }))
      }]
    };
    categoryChart.setOption(categoryOption);
  }

  // 关系类型分布饼图（中间不显示数字）
  if (hasRelationData.value && stats.value.relationTypeCounts.length > 0) {
    if (!relationChartRef.value) return;
    
    if (relationChart) {
      relationChart.dispose();
      relationChart = null;
    }
    
    relationChart = echarts.init(relationChartRef.value);
    
    const mainData = processData(stats.value.relationTypeCounts);
    
    const relationOption = {
      backgroundColor: colors.backgroundColor,
      tooltip: { 
        trigger: 'item', 
        formatter: '{b}: {c} 个 ({d}%)'
      },
      legend: { 
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        itemGap: 20,
        textStyle: { 
          color: colors.textColor, 
          fontSize: 11
        },
        formatter: (name) => `${name}`
      },
      series: [{
        name: '关系类型',
        type: 'pie',
        radius: ['35%', '55%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        label: { 
          show: true,
          position: 'outside',
          color: colors.textColor, 
          formatter: '{b}',
          fontSize: 11
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 8,
          smooth: true,
          lineStyle: { color: colors.textColor, width: 1 }
        },
        emphasis: {
          scale: true,
          label: {
            show: true,
            formatter: '{b}: {d}%'
          }
        },
        itemStyle: { 
          borderRadius: 8, 
          borderColor: isDark.value ? '#2c2c3a' : '#fff',
          borderWidth: 2 
        },
        color: colors.seriesColors,
        data: mainData.map(item => ({
          name: item.name || '未知',
          value: item.count || 0
        }))
      }]
    };
    relationChart.setOption(relationOption);
  }
};

// 初始化图表
const initCharts = () => {
  if (!categoryChartRef.value || !relationChartRef.value) {
    console.warn('图表容器未找到');
    return;
  }
  
  nextTick(() => {
    setTimeout(() => {
      renderCharts();
    }, 100);
  });
};

// 监听数据变化
watch([() => stats.value.categoryCounts, () => stats.value.relationTypeCounts, loading], async () => {
  if (!loading.value && (hasCategoryData.value || hasRelationData.value)) {
    await nextTick();
    setTimeout(() => {
      renderCharts();
    }, 100);
  }
}, { deep: true });

// 监听主题变化
watch(isDark, () => {
  if (hasCategoryData.value || hasRelationData.value) {
    renderCharts();
  }
});

// 窗口大小变化处理
let resizeTimer;
const handleResize = () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    categoryChart?.resize();
    relationChart?.resize();
  }, 200);
};

// 时间更新
let timer = null;
const updateTime = () => {
  currentTime.value = new Date().toLocaleTimeString();
};

// 下拉菜单
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

const handleClickOutside = (event) => {
  if (avatarWrapper.value && !avatarWrapper.value.contains(event.target)) {
    showDropdown.value = false;
  }
};

// 图谱菜单切换
const toggleGraphMenu = () => {
  graphMenuExpanded.value = !graphMenuExpanded.value;
};

// 路由跳转
const goToUserManage = () => {
  window.location.href = 'http://localhost:5173/admin/users';
};
const goToGraphDisplay = () => {
  window.location.href = 'http://localhost:5173/admin/graph/display';
};
const goToNodeManage = () => {
  window.location.href = 'http://localhost:5173/admin/graph/nodes';
};
const goToRelationManage = () => {
  window.location.href = 'http://localhost:5173/admin/graph/relations';
};
const goToDataStats = () => {
  window.location.href = 'http://localhost:5173/admin/stats';
};
const goToSystemLog = () => {
  window.location.href = 'http://localhost:5173/admin/logs';
};
const goToAddNode = () => {
  window.location.href = 'http://localhost:5173/admin/graph/nodes';
};
const goToAddRelation = () => {
  window.location.href = 'http://localhost:5173/admin/graph/relations';
};
const goToImportData = () => {
  window.location.href = 'http://localhost:5173/admin/users';
};
const goToExportData = () => {
  window.location.href = 'http://localhost:5173/admin/stats';
};
const goToAllAnnouncements = () => {
  window.location.href = 'http://localhost:5173/admin/announcements';
};

// 退出登录
const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user_info');
  localStorage.removeItem('userRole');
  localStorage.removeItem('adminName');
  window.location.href = 'http://localhost:5173/';
  showDropdown.value = false;
};

// 获取统计数据
const fetchStats = async () => {
  loading.value = true;
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('http://localhost:3001/api/admin/dashboard/stats', {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('获取统计数据失败');
    }
    
    const result = await response.json();
    
    if (result.success && result.data) {
      const data = result.data;
      stats.value = {
        userCount: data.userCount || 0,
        nodeCount: data.nodeCount || 0,
        relationCount: data.edgeCount || 0,
        categoryCounts: data.categoryCounts || [],
        relationTypeCounts: data.relationTypeCounts || []
      };
    } else {
      throw new Error(result.error || '数据格式错误');
    }
    
  } catch (error) {
    console.error('获取统计数据出错:', error);
    // 模拟数据
    stats.value = {
      userCount: 128,
      nodeCount: 486,
      relationCount: 892,
      categoryCounts: [
        { name: 'Base', count: 13 },
        { name: 'Engineer', count: 8 },
        { name: 'CssTool', count: 5 },
        { name: 'Lang', count: 4 },
        { name: 'Module', count: 4 },
        { name: 'Framework', count: 4 },
        { name: 'State', count: 4 },
        { name: 'UI', count: 3 },
        { name: 'Router', count: 2 },
        { name: 'Request', count: 2 },
        { name: 'Project', count: 2 }
      ],
      relationTypeCounts: [
        { name: 'USED_FOR', count: 12 },
        { name: 'IS_BASED_ON', count: 10 },
        { name: 'TOOL_FOR', count: 8 },
        { name: 'ALTERNATIVE_TO', count: 4 },
        { name: 'IS_SUPERSET_OF', count: 3 },
        { name: 'COMPILES_TO', count: 3 },
        { name: 'BELONGS_TO', count: 3 },
        { name: 'EXTENDS', count: 3 },
        { name: 'REPLACE', count: 2 },
        { name: 'SIMILAR_TO', count: 1 }
      ]
    };
  } finally {
    loading.value = false;
  }
};

// 生命周期
onMounted(() => {
  const token = localStorage.getItem('authToken');
  const role = localStorage.getItem('userRole');
  const storedAdminName = localStorage.getItem('adminName');

  if (!token || role !== 'admin') {
    alert('无权限访问，请以管理员身份登录');
    window.location.href = 'http://localhost:5173/';
    return;
  }

  adminName.value = storedAdminName || '';
  fetchStats();

  document.addEventListener('click', handleClickOutside);
  timer = setInterval(updateTime, 1000);
  window.addEventListener('resize', handleResize);
  
  setTimeout(() => {
    initCharts();
  }, 200);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  if (timer) clearInterval(timer);
  window.removeEventListener('resize', handleResize);
  if (categoryChart) {
    categoryChart.dispose();
    categoryChart = null;
  }
  if (relationChart) {
    relationChart.dispose();
    relationChart = null;
  }
});
</script>

<style scoped>
/* ========== 全局样式 ========== */
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
.app-container.dark .dashboard {
  background-color: #2c2c3a;
}
.app-container.dark .stat-card {
  background-color: #3a3a4a;
}
.app-container.dark .stat-card .stat-value {
  color: #fff;
}
.app-container.dark .stat-card .stat-label {
  color: #b0b0b0;
}
.app-container.dark .chart-wrapper,
.app-container.dark .announcements,
.app-container.dark .quick-actions {
  background-color: #3a3a4a;
}
.app-container.dark .announce-item {
  background-color: #4a4a5a;
}
.app-container.dark .quick-btn {
  background-color: #4a4a5a;
  color: #e0e0e0;
}
.app-container.dark .quick-btn:hover {
  background-color: #5a5a6a;
  color: #8B5CF6;
}
.app-container.dark .dropdown-menu {
  background-color: #2c2c3a;
}
.app-container.dark .dropdown-item {
  color: #e0e0e0;
}
.app-container.dark .dropdown-item:hover {
  background-color: #3a3a4a;
  color: #8B5CF6;
}
.app-container.dark .admin-info {
  color: #e0e0e0;
}
.app-container.dark .divider {
  background-color: #4a4a5a;
}
.app-container.dark .more-link {
  color: #A78BFA;
}
.app-container.dark .more-link:hover {
  color: #8B5CF6;
}

/* 顶部导航 */
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
}
.theme-toggle {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
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
  text-decoration: none;
  font-size: 14px;
  transition: background 0.2s;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 主体布局 */
.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 15vw;
  background-color: #ffffff;
  box-shadow: 2px 0 6px rgba(139, 92, 246, 0.05);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.nav-menu {
  flex: 1;
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
  gap: 10px;
}
.admin-info i {
  color: #8B5CF6;
  font-size: 18px;
}

/* 右侧内容区域 */
.content-section {
  flex: 1;
  padding: 2vh 20px;
  overflow-y: auto;
}
.dashboard {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px 0 rgba(139, 92, 246, 0.05);
  padding: 24px;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.stat-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(139, 92, 246, 0.1);
}
.stat-icon {
  width: 60px;
  height: 60px;
  background: #8B5CF6;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 28px;
}
.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}
.stat-label {
  font-size: 14px;
  color: #666;
}

/* 快捷操作 */
.quick-actions {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
}
.quick-actions h3 {
  font-size: 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.quick-btn {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.quick-btn:hover {
  border-color: #8B5CF6;
  color: #8B5CF6;
  background: #faf5ff;
}

/* 图表容器 */
.charts-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.chart-wrapper {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  min-height: 420px;
}
.chart-wrapper h3 {
  font-size: 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.chart-placeholder,
.chart-loading {
  text-align: center;
  color: #999;
  padding: 80px 20px;
}
.chart-loading i {
  margin-right: 8px;
}

/* 系统公告 */
.announcements {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
}
.announcements h3 {
  font-size: 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.announce-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.announce-item {
  background: white;
  border-radius: 10px;
  padding: 14px 16px;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}
.announce-item:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.1);
}
.announce-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.announce-tag {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 20px;
  font-weight: 500;
}
.announce-tag.important {
  background: #fee2e2;
  color: #dc2626;
}
.announce-tag.new {
  background: #dbeafe;
  color: #2563eb;
}
.announce-tag.activity {
  background: #dcfce7;
  color: #16a34a;
}
.announce-tag.normal {
  background: #f3f4f6;
  color: #6b7280;
}
.announce-time {
  font-size: 12px;
  color: #999;
}
.announce-title {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 6px;
}
.announce-content {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}
.announce-footer {
  margin-top: 16px;
  padding-top: 12px;
  text-align: center;
  border-top: 1px solid #eee;
}
.more-link {
  color: #8B5CF6;
  text-decoration: none;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.more-link:hover {
  gap: 10px;
}

/* 暗色模式公告适配 */
.app-container.dark .announce-tag.important {
  background: #7f1a1a;
  color: #fca5a5;
}
.app-container.dark .announce-tag.new {
  background: #1e3a5f;
  color: #93c5fd;
}
.app-container.dark .announce-tag.activity {
  background: #14532d;
  color: #86efac;
}
.app-container.dark .announce-tag.normal {
  background: #374151;
  color: #9ca3af;
}
.app-container.dark .announce-title {
  color: #e0e0e0;
}
.app-container.dark .announce-content {
  color: #b0b0b0;
}
.app-container.dark .announce-footer {
  border-top-color: #4a4a5a;
}
</style>

<style>
@import '../pages/fontawesome-free-6.4.0-web/fontawesome-free-6.4.0-web/css/all.min.css';
</style>