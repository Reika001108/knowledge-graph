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
            <a href="#" class="nav-item sub-nav-item active" @click.prevent="goToGraphDisplay">
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
            <span class="nav-text">系统日志</span>
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

      <!-- 右侧主要内容区域（ECharts 图谱） -->
      <section class="content-section">
        <div class="graph-display">
          <div class="graph-header">
            <h2><i class="fas fa-project-diagram"></i> 知识图谱可视化</h2>
            <div class="search-box">
              <i class="fas fa-search"></i>
              <input 
                type="text" 
                v-model="searchKeyword" 
                placeholder="按节点名称搜索"
                @keyup.enter="handleSearch"
              />
              <button v-if="searchKeyword" class="search-clear" @click="clearSearch">✕</button>
            </div>
            <button class="btn-refresh" @click="loadGraphData" title="刷新图谱">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>

          <!-- ECharts 容器 -->
          <div class="graph-container">
            <div id="graph-echarts" ref="chartContainer" style="width: 100%; height: 100%;"></div>
            
            <!-- 缩放控制按钮 -->
            <div class="graph-controls">
              <button class="control-btn" @click="zoomIn" title="放大">
                <i class="fas fa-search-plus"></i>
              </button>
              <button class="control-btn" @click="fitToView" title="适应页面">
                <i class="fas fa-arrows-alt"></i>
              </button>
              <button class="control-btn" @click="zoomOut" title="缩小">
                <i class="fas fa-search-minus"></i>
              </button>
            </div>

            <div v-if="loading" class="graph-loading">
              <i class="fas fa-spinner fa-pulse"></i> 加载中...
            </div>
            <div v-if="error" class="graph-error">
              {{ error }}
              <button @click="loadGraphData" class="retry-btn">重试</button>
            </div>
          </div>

          <!-- 节点详情面板 -->
          <div v-if="selectedNode" class="node-info-panel">
            <h3>节点详情</h3>
            <div class="info-row"><span>名称:</span> {{ selectedNode.name }}</div>
            <div class="info-row"><span>类型:</span> {{ selectedNode.label }}</div>
            <div class="info-row" v-if="selectedNode.description">
              <div class="description-text"><span>描述:</span>{{ selectedNode.description }}</div>
            </div>
            
            <button @click="selectedNode = null">关闭</button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import * as echarts from 'echarts';

const router = useRouter();

// ========== 状态管理 ==========
const showDropdown = ref(false);
const avatarWrapper = ref(null);
const currentTime = ref(new Date().toLocaleTimeString());
const isDark = ref(false);
const graphMenuExpanded = ref(true);
const adminName = ref('');

// 图谱数据
const nodes = ref([]);
const edges = ref([]);
let chart = null;
const chartContainer = ref(null);
const loading = ref(false);
const error = ref('');
const searchKeyword = ref('');
const selectedNode = ref(null);

// ========== 节点图标映射 ==========
const getNodeIcon = (category) => {
  const iconMap = {
    'Base': '🔧',
    'Lang': '💻',
    'Module': '🧩',
    'CssTool': '✨',
    'UI': '🎨',
    'Framework': '📦',
    'State': '🗄️',
    'Engineer': '🛠️',
    'Router': '🔄',
    'Request': '📡',
    'Project': '📁'
  };
  return iconMap[category] || '●';
};

// ========== 计算属性 ==========
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

// ========== 主题配置 ==========
const getChartColors = () => {
  return isDark.value
    ? {
        backgroundColor: '#1e1e2f',
        textColor: '#e0e0e0',
        nodeBorder: '#555',
        edgeColor: '#aaa',
        categoryColors: ['#5470c6', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#FF6B6B', '#4ECDC4', '#96CEB4']
      }
    : {
        backgroundColor: '#f8f9fa',
        textColor: '#333',
        nodeBorder: '#fff',
        edgeColor: '#999',
        categoryColors: ['#5470c6', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#FF6B6B', '#4ECDC4', '#96CEB4']
      };
};

// ========== 时间更新 ==========
let timer = null;
const updateTime = () => {
  currentTime.value = new Date().toLocaleTimeString();
};

// ========== 下拉菜单 ==========
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

const handleClickOutside = (event) => {
  if (avatarWrapper.value && !avatarWrapper.value.contains(event.target)) {
    showDropdown.value = false;
  }
};

// ========== 图谱菜单 ==========
const toggleGraphMenu = () => {
  graphMenuExpanded.value = !graphMenuExpanded.value;
};

// ========== 路由导航 ==========
const goToDashboard = () => router.push('/admin/home');
const goToUserManage = () => router.push('/admin/users');
const goToGraphDisplay = () => {};
const goToNodeManage = () => router.push('/admin/graph/nodes');
const goToRelationManage = () => router.push('/admin/graph/relations');
const goToDataStats = () => router.push('/admin/stats');
const goToSystemLog = () => router.push('/admin/logs');

// ========== 退出登录 ==========
const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user_info');
  localStorage.removeItem('userRole');
  localStorage.removeItem('adminName');
  router.push('/');
  showDropdown.value = false;
};

// ========== 图谱缩放控制 ==========
const zoomIn = () => {
  if (!chart) return;
  const option = chart.getOption();
  const currentZoom = option.series[0].zoom || 1;
  option.series[0].zoom = Math.min(5, currentZoom * 1.2);
  chart.setOption(option);
};

const zoomOut = () => {
  if (!chart) return;
  const option = chart.getOption();
  const currentZoom = option.series[0].zoom || 1;
  option.series[0].zoom = Math.max(0.3, currentZoom / 1.2);
  chart.setOption(option);
};

const fitToView = () => {
  if (!chart) return;
  const option = chart.getOption();
  option.series[0].zoom = 1;
  option.series[0].center = null;
  chart.setOption(option);
};

// ========== 获取类别颜色映射 ==========
const getCategoryColorMap = (colors) => {
  const categories = [...new Set(nodes.value.map(n => n.category))];
  const map = {};
  categories.forEach((cat, idx) => {
    map[cat] = colors.categoryColors[idx % colors.categoryColors.length];
  });
  return map;
};

// ========== 刷新图谱颜色 ==========
const refreshGraphColors = () => {
  if (!chart) return;
  const colors = getChartColors();
  const categoryColorMap = getCategoryColorMap(colors);
  
  const newData = nodes.value.map(n => ({
    id: n.id,
    name: n.name,
    category: n.category,
    properties: n.properties,
    description: n.description,
    originalName: n.originalName,
    label: {
      show: true,
      position: 'bottom',
      fontSize: 12,
      color: colors.textColor,
      formatter: '{b}'
    },
    itemStyle: {
      color: categoryColorMap[n.category] || colors.categoryColors[0],
      borderColor: colors.nodeBorder,
      borderWidth: 1
    }
  }));
  
  chart.setOption({ series: [{ data: newData }] });
};

// ========== 搜索节点 ==========
const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    refreshGraphColors();
    return;
  }
  
  const keyword = searchKeyword.value.toLowerCase();
  const matchedNodeIds = new Set();
  
  nodes.value.forEach(n => {
    const searchName = (n.originalName || n.name.replace(/^[🔧💻🧩✨🎨📦🗄️🛠️🔄📡📁●]\s*/, '')).toLowerCase();
    if (searchName.includes(keyword)) {
      matchedNodeIds.add(n.id);
    }
  });
  
  if (matchedNodeIds.size > 0 && chart) {
    const colors = getChartColors();
    const categoryColorMap = getCategoryColorMap(colors);
    
    const newData = nodes.value.map(n => ({
      id: n.id,
      name: n.name,
      category: n.category,
      properties: n.properties,
      description: n.description,
      originalName: n.originalName,
      label: {
        show: true,
        position: 'bottom',
        fontSize: 12,
        color: colors.textColor,
        formatter: '{b}'
      },
      itemStyle: matchedNodeIds.has(n.id) ? {
        color: '#ff9900',
        borderColor: '#ff5500',
        borderWidth: 3,
        shadowBlur: 10,
        shadowColor: 'rgba(255, 85, 0, 0.5)'
      } : {
        color: categoryColorMap[n.category] || colors.categoryColors[0],
        borderColor: colors.nodeBorder,
        borderWidth: 1
      }
    }));
    
    chart.setOption({ series: [{ data: newData }] });
    
    // 聚焦第一个匹配节点
    const firstNode = nodes.value.find(n => matchedNodeIds.has(n.id));
    if (firstNode) {
      const dataIndex = nodes.value.findIndex(n => n.id === firstNode.id);
      chart.dispatchAction({
        type: 'showTip',
        seriesIndex: 0,
        dataIndex
      });
    }
  } else if (searchKeyword.value.trim()) {
    alert('未找到匹配的节点');
  }
};

const clearSearch = () => {
  searchKeyword.value = '';
  refreshGraphColors();
};

// ========== 加载图谱数据 ==========
const loadGraphData = async () => {
  loading.value = true;
  error.value = '';
  try {
    const token = localStorage.getItem('authToken');
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
    const response = await fetch(`${API_BASE}/api/query`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('获取图谱数据失败');
    const result = await response.json();
    if (!result.success) throw new Error(result.error || '未知错误');

    // 转换为 ECharts graph 数据格式（添加图标）
    const visNodes = result.data.nodes.map(node => {
      const icon = getNodeIcon(node.label);
      const nodeName = node.properties?.name || node.name || node.id;
      const description = node.properties?.description || '';
      return {
        id: node.id,
        name: `${icon} ${nodeName}`,
        originalName: nodeName,
        label: nodeName,
        category: node.label,
        properties: node.properties,
        description: description,
        symbolSize: 35,
      };
    });
    
    const visEdges = result.data.links.map(link => ({
      source: link.source,
      target: link.target,
      label: link.properties?.description || link.properties?.type || link.type || '关系',
      type: link.properties?.type || link.type,
      description: link.properties?.description,
      properties: link.properties,
      lineStyle: { curveness: 0.2 }
    }));

    nodes.value = visNodes;
    edges.value = visEdges;

    await nextTick();
    initChart();
  } catch (err) {
    console.error('加载图谱失败:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

// ========== 初始化 ECharts ==========
const initChart = () => {
  if (!chartContainer.value) return;

  if (chart) {selectedNode.properties
    chart.dispose();
    chart = null;
  }

  const colors = getChartColors();
  chart = echarts.init(chartContainer.value);
  renderChart(colors);

  // 监听节点点击事件
  chart.on('click', { seriesIndex: 0 }, (params) => {
    if (params.dataType === 'node') {
      const nodeData = params.data;
      selectedNode.value = {
        id: nodeData.id,
        name: nodeData.originalName || nodeData.name.replace(/^[🔧💻🧩✨🎨📦🗄️🛠️🔄📡📁●]\s*/, ''),
        label: nodeData.category,
        description: nodeData.description,
        properties: nodeData.properties || {}
      };
    } else {
      selectedNode.value = null;
    }
  });

  window.addEventListener('resize', handleResize);
};

// ========== 渲染图表 ==========
const renderChart = (colors = getChartColors()) => {
  if (!chart) return;

  const categories = [...new Set(nodes.value.map(n => n.category))].map(name => ({ name }));
  const categoryColorMap = getCategoryColorMap(colors);

  const option = {
    backgroundColor: colors.backgroundColor,
    title: { show: false },
    tooltip: {
      trigger: 'item',
      // ========== 关键修改：节点只显示 description ==========
      formatter: (params) => {
        if (params.dataType === 'node') {
          // 节点：只显示 description
          const description = params.data.description;
          if (description && description.trim()) {
            return description;
          }
          // 如果没有 description，显示节点名称
          const nodeName = params.data.originalName || params.name.replace(/^[🔧💻🧩✨🎨📦🗄️🛠️🔄📡📁●]\s*/, '');
          return nodeName;
        } else if (params.dataType === 'edge') {
          // 边：只显示关系描述
          return params.data.label || params.data.type || '关系';
        }
        return '';
      },
      textStyle: { color: colors.textColor },
      backgroundColor: isDark.value ? 'rgba(50, 50, 70, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderColor: colors.edgeColor,
      borderWidth: 1,
      extraCssText: 'max-width: 300px; white-space: pre-wrap; word-wrap: break-word;'
    },
    series: [{
      type: 'graph',
      layout: 'force',
      force: {
        repulsion: 400,
        edgeLength: 120,
        gravity: 0.1,
        friction: 0.1,
        layoutAnimation: true,
        initIterations: 300
      },
      roam: true,
      draggable: true,
      zoom: 1,
      center: null,
      data: nodes.value.map(n => ({
        id: n.id,
        name: n.name,
        category: n.category,
        properties: n.properties,
        description: n.description,
        originalName: n.originalName,
        label: {
          show: true,
          position: 'bottom',
          fontSize: 12,
          color: colors.textColor,
          formatter: '{b}'
        },
        itemStyle: {
          color: categoryColorMap[n.category] || colors.categoryColors[0],
          borderColor: colors.nodeBorder,
          borderWidth: 1
        },
        symbolSize: n.symbolSize || 35
      })),
      links: edges.value.map(e => ({
        source: e.source,
        target: e.target,
        label: e.label,
        type: e.type,
        description: e.description,
        properties: e.properties,
        lineStyle: {
          color: colors.edgeColor,
          curveness: e.lineStyle?.curveness || 0.2,
          width: 2,
          opacity: 0.6
        }
      })),
      categories: categories,
      lineStyle: {
        color: 'source',
        curveness: 0.2,
        width: 2,
        opacity: 0.6
      },
      edgeLabel: {
        show: false
      },
      emphasis: {
        focus: 'adjacency',
        lineStyle: { 
          width: 3,
          color: '#8B5CF6'
        },
        label: {
          show: true,
          fontWeight: 'bold',
          fontSize: 13
        }
      },
      itemStyle: {
        borderColor: colors.nodeBorder,
        borderWidth: 1,
        shadowBlur: 5,
        shadowColor: 'rgba(0, 0, 0, 0.3)'
      }
    }]
  };

  chart.setOption(option);
};

// ========== 窗口大小变化处理 ==========
let resizeTimer;
const handleResize = () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => chart?.resize(), 200);
};

// ========== 监听主题变化 ==========
watch(isDark, () => {
  if (chart) {
    const colors = getChartColors();
    renderChart(colors);
  }
});

// ========== 生命周期 ==========
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
  loadGraphData();

  document.addEventListener('click', handleClickOutside);
  timer = setInterval(updateTime, 1000);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  if (timer) clearInterval(timer);
  if (chart) {
    chart.dispose();
    chart = null;
  }
  window.removeEventListener('resize', handleResize);
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
.app-container.dark .graph-display {
  background-color: #2c2c3a;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.app-container.dark .graph-container {
  background-color: #1e1e2f;
}
.app-container.dark .node-info-panel {
  background-color: #3a3a4a;
  border-color: #4a4a5a;
  color: #e0e0e0;
}
.app-container.dark .node-info-panel pre {
  background-color: #2c2c3a;
  color: #ccc;
}
.app-container.dark .search-box {
  background-color: #2c2c3a;
  border-color: #4a4a5a;
}
.app-container.dark .search-box input {
  color: #e0e0e0;
}
.app-container.dark .search-box input::placeholder {
  color: #888;
}
.app-container.dark .btn-refresh {
  background-color: #6d4c9e;
}
.app-container.dark .btn-refresh:hover {
  background-color: #8B5CF6;
}
.app-container.dark .graph-controls {
  background: rgba(44, 44, 58, 0.9);
}

/* ========== 顶部导航 ========== */
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

/* ========== 右侧内容区域：图谱展示 ========== */
.content-section {
  flex: 1;
  padding: 2vh 20px;
  overflow-y: auto;
}
.graph-display {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px 0 rgba(139, 92, 246, 0.05);
  padding: 24px;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  transition: background-color 0.3s;
}

/* 头部 */
.graph-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}
.graph-header h2 {
  font-size: 22px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
}
.graph-header .search-box {
  display: flex;
  align-items: center;
  background-color: white;
  border: 1px solid #e9ecef;
  border-radius: 20px;
  padding: 0 15px;
  width: 280px;
  position: relative;
}
.graph-header .search-box i {
  color: #999;
  margin-right: 8px;
}
.graph-header .search-box input {
  border: none;
  outline: none;
  padding: 8px 0;
  width: 100%;
  font-size: 14px;
  background: transparent;
}
.search-clear {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 14px;
  padding: 0 5px;
}
.search-clear:hover {
  color: #666;
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

/* 图谱容器 */
.graph-container {
  position: relative;
  height: 550px;
  background-color: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e9ecef;
}

/* 缩放控制按钮 */
.graph-controls {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  border-radius: 30px;
  padding: 8px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.control-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #8B5CF6;
  color: white;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: #A78BFA;
  transform: scale(1.05);
}

.control-btn:active {
  transform: scale(0.95);
}

/* 加载和错误提示 */
.graph-loading,
.graph-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  color: #666;
  background: rgba(255, 255, 255, 0.9);
  padding: 15px 25px;
  border-radius: 8px;
  z-index: 20;
}
.graph-error {
  color: #dc3545;
}
.retry-btn {
  margin-left: 10px;
  padding: 4px 12px;
  background-color: #8B5CF6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.retry-btn:hover {
  background-color: #7A4BDE;
}

/* 节点信息面板 */
.node-info-panel {
  position: fixed;
  right: 30px;
  bottom: 30px;
  width: 320px;
  max-height: 450px;
  overflow-y: auto;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
}
.node-info-panel h3 {
  margin-bottom: 12px;
  color: #333;
  font-size: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}
.info-row {
  margin-bottom: 12px;
  font-size: 13px;
}
.info-row span {
  font-weight: 600;
  color: #555;
  margin-right: 8px;
  display: inline-block;
  min-width: 50px;
}
.description-text {
  margin-top: 4px;
  line-height: 1.5;
  color: #666;
}
.info-row pre {
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
  margin-top: 4px;
  font-size: 11px;
}
.node-info-panel button {
  background-color: #8B5CF6;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  margin-top: 12px;
  width: 100%;
}
.node-info-panel button:hover {
  background-color: #7A4BDE;
}

/* 暗色模式下的节点面板 */
.app-container.dark .node-info-panel h3 {
  color: #e0e0e0;
  border-bottom-color: #4a4a5a;
}
.app-container.dark .node-info-panel .info-row span {
  color: #aaa;
}
.app-container.dark .description-text {
  color: #ccc;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
.app-container.dark ::-webkit-scrollbar-track {
  background: #2c2c3a;
}
.app-container.dark ::-webkit-scrollbar-thumb {
  background: #5a5a6a;
}
</style>

<style>
/* 全局字体图标引入 */
@import '../pages/fontawesome-free-6.4.0-web/fontawesome-free-6.4.0-web/css/all.min.css';

/* ECharts 工具提示样式增强 */
.echarts-tooltip {
  max-width: 350px !important;
  word-wrap: break-word !important;
  white-space: normal !important;
  line-height: 1.5 !important;
}
</style>