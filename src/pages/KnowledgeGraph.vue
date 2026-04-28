<template>
  <div class="app-container" :class="{ dark: isDark }">
    <header class="header">
      <div class="logo-section">
        <img src="./img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">知识图谱管理系统</h1>
      </div>
      <!-- 用户区域：时间、主题切换、头像（显示用户名） -->
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
      <aside class="sidebar">
        <nav class="nav-menu">
          <a href="#" class="nav-item active"
            ><i class="fas fa-atom icon"></i
            ><span class="nav-text">知识图谱</span></a
          >
          <a href="#" class="nav-item" @click.prevent="goToAdvancedSearch"
            ><i class="fas fa-book-atlas icon"></i
            ><span class="nav-text">高级检索</span></a
          >
          <a href="#" class="nav-item" @click.prevent="goToAIResponse">
            <i class="fas fa-robot icon"></i><span class="nav-text">智能问答</span></a
          >
          <a href="#" class="nav-item" @click.prevent="goToProfile"
            ><i class="fas fa-user icon"></i
            ><span class="nav-text">个人中心</span></a
          >
        </nav>
      </aside>

      <section class="graph-section">
        <div class="graph-card">
          <div ref="chartRef" class="chart-container"></div>
          <!-- 自定义右下角控件：放大、缩小、适应页面 -->
          <div class="graph-controls">
            <button class="control-btn" @click="zoomOut" title="缩小">
              <i class="fas fa-search-plus"></i>
            </button>
            <button class="control-btn" @click="fitToView" title="适应页面">
              <i class="fas fa-arrows-alt"></i>
            </button>
            <button class="control-btn" @click="zoomIn" title="放大">
            <i class="fas fa-search-minus"></i>
            </button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
  import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
  import * as echarts from 'echarts';

  const chartRef = ref(null);
  let chartInstance = null;

  // 用户相关
  const showDropdown = ref(false);
  const avatarWrapper = ref(null);
  const userInfo = ref(null);

  const currentTime = ref(new Date().toLocaleTimeString());
  const isDark = ref(false);

  // 计算显示的用户名
  const displayName = computed(() => {
    if (!userInfo.value) return '';
    return userInfo.value.username || (userInfo.value.email ? userInfo.value.email.split('@')[0] : '用户');
  });

  let shouldFitAfterRender = false;

  // 切换主题
  const toggleTheme = () => {
    isDark.value = !isDark.value;
  };

  // 更新时间
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

  // 路由跳转
  const goToProfile = () => {
    window.location.href = 'http://localhost:5173/person';
  };
  const goToAdvancedSearch = () => {
    window.location.href = 'http://localhost:5173/reseach';
  };
  const goToAIResponse = () => {
    window.location.href = 'http://localhost:5173/AI-response';
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

  // 默认力引导参数
  const defaultForce = {
    repulsion: 400,
    edgeLength: 150,
    gravity: 0.2,
    friction: 0.2,
    initIterations: 300,
    layoutAnimation: true
  };

  // 获取图谱数据（携带token）
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3001/api/query', {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      const graphData = await response.json();

      if (graphData.success) {
        // 转换节点，保留原始属性以便 tooltip 使用
        const nodes = graphData.data.nodes.map(node => ({
          id: node.id,
          name: node.properties?.name || node.name || '未知节点',
          symbolSize: 50,
          category: node.label || '默认',
          linkUrl: `/Document/${node.name}`,
          properties: node.properties   // 保留原始属性（可能包含 description）
        }));

        // 转换关系 —— 修改点：保留完整的 properties 对象
        const links = graphData.data.links?.map(link => ({
          source: link.source,
          target: link.target,
          properties: link.properties || { type: link.type || '关联' } // 保留完整属性
        })) || [];

        // 多条边自动弯曲
        const pairMap = new Map();
        links.forEach((link, idx) => {
          const source = link.source;
          const target = link.target;
          const key = [source, target].sort().join('|');
          if (!pairMap.has(key)) {
            pairMap.set(key, { count: 0, edges: [] });
          }
          const pair = pairMap.get(key);
          pair.count++;
          pair.edges.push({ link, idx });
        });

        pairMap.forEach(pair => {
          const count = pair.count;
          const edges = pair.edges;
          if (count === 1) {
            edges[0].link.lineStyle = { curveness: 0 };
          } else {
            edges.forEach((item, index) => {
              const curveness = (index / (count - 1) - 0.5) * 0.8;
              item.link.lineStyle = { curveness };
            });
          }
        });

        const categories = [...new Set(nodes.map(node => node.category))].map(name => ({ name }));

        const option = {
          tooltip: {
            show: true,
            trigger: 'item',
            extraCssText: 'max-width:400px; white-space:pre-wrap; word-wrap:break-word;',
            formatter: (params) => {
              if (params.dataType === 'node') {
                let html = `<div><strong>${params.data.name}</strong><br/>类型: ${params.data.category}`;
                const desc = params.data.properties?.description;
                if (desc) {html += `<br/>描述: ${desc}`;}
                html += '</div>';
                return html;
              } else {
                // 边 tooltip —— 添加描述显示
                let html = `<div>关系: ${params.data.properties?.type || params.data.properties?.relation || '关联'}`;
                const desc = params.data.properties?.description;
                if (desc) {html += `<br/>描述: ${desc}`;}
                html += '</div>';
                return html;
              }
            }
          },
          legend: {
            data: categories.map(cat => cat.name),
            top: 20
          },
          series: [{
              type: 'graph',
              layout: 'force',
              data: nodes,
              links: links,
              categories: categories,
              roam: true,
              draggable: true,
              force: { ...defaultForce },
              label: {
                show: true,
                position: 'inside',
                color: '#fff',
                fontSize: 12
              },
              edgeSymbol: ['none', 'arrow'],
              edgeSymbolSize: [0, 10],
              edgeLabel: {
                show: true,
                position: 'middle',
                distance: 0,
                offset: [0, 0],
                // 边标签只显示类型，不显示描述
                formatter: (params) => params.data.properties?.type || params.data.properties?.relation ||'',
                fontSize: 11,
                color: '#333',
                backgroundColor: 'transparent',
                padding: 0,
                borderRadius: 0
              },
              lineStyle: {
                color: '#999',
                width: 1.5,
                curveness: 0
              },
              animation: true,
              animationDuration: 1000,
              animationDurationUpdate: 500,
              emphasis: {
                focus: 'adjacency',
                lineStyle: {
                  width: 3,
                  color: '#8B5CF6',
                  curveness: 0.3
                },
                label: {
                  fontWeight: 'bold',
                  fontSize: 13,
                  backgroundColor: 'transparent',
                  padding: [2, 4],
                  borderRadius: 4
                },
                itemStyle: {
                  borderColor: '#8B5CF6',
                  borderWidth: 2,
                  shadowBlur: 10,
                  shadowColor: 'rgba(139, 92, 246, 0.5)'
                }
              }
            }
          ]
        };

        chartInstance.setOption(option);

        // 节点点击跳转
        chartInstance.on('click', (params) => {
          if (params.componentType === 'series' && params.dataType === 'node') {
            window.open(params.data.linkUrl, '_blank');
          }
        });

        chartInstance.on('mouseover', () => {
          chartInstance.getZr().setCursorStyle('pointer');
        });
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    }
  };

  // 缩放控制
  const zoomIn = () => {
    if (!chartInstance) return;
    const option = chartInstance.getOption();
    const series = option.series[0];
    if (series && series.force) {
      series.force.repulsion = Math.max(200, series.force.repulsion * 0.8);
      series.force.edgeLength = Math.max(50, series.force.edgeLength * 0.8);
      chartInstance.setOption(option, { notMerge: false });
    }
  };

  const zoomOut = () => {
    if (!chartInstance) return;
    const option = chartInstance.getOption();
    const series = option.series[0];
    if (series && series.force) {
      series.force.repulsion = Math.min(2000, series.force.repulsion * 1.2);
      series.force.edgeLength = Math.min(500, series.force.edgeLength * 1.2);
      chartInstance.setOption(option, { notMerge: false });
    }
  };

  const fitToView = () => {
    if (!chartInstance) return;
    const option = chartInstance.getOption();
    const series = option.series[0];
    if (series) {
      series.force = { ...defaultForce };
      chartInstance.setOption(option, { notMerge: false });
      shouldFitAfterRender = true;
    }
  };

  const fitView = () => {
    if (!chartInstance) return;
    const seriesModel = chartInstance.getModel().getSeries()[0];
    if (!seriesModel) return;
    const data = seriesModel.getData();
    const nodesCount = data.count();
    if (nodesCount === 0) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < nodesCount; i++) {
      const x = data.getLayout('x', i);
      const y = data.getLayout('y', i);
      if (x != null && y != null) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
    if (minX === Infinity) return;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const width = maxX - minX;
    const height = maxY - minY;
    const containerWidth = chartInstance.getWidth();
    const containerHeight = chartInstance.getHeight();

    const scaleX = containerWidth / width;
    const scaleY = containerHeight / height;
    let zoom = Math.min(scaleX, scaleY) * 0.9;
    zoom = Math.min(5, Math.max(0.5, zoom));

    const option = chartInstance.getOption();
    option.series[0].center = [centerX, centerY];
    option.series[0].zoom = zoom;
    chartInstance.setOption(option, { notMerge: false });
  };

  // 生命周期
  onMounted(() => {
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

    chartInstance = echarts.init(chartRef.value);
    
    chartInstance.on('rendered', () => {
      if (shouldFitAfterRender) {
        fitView();
        shouldFitAfterRender = false;
      }
    });

    fetchData();
    window.addEventListener('resize', () => chartInstance.resize());
    document.addEventListener('click', handleClickOutside);
    timer = setInterval(updateTime, 1000);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', () => chartInstance.resize());
    document.removeEventListener('click', handleClickOutside);
    if (timer) clearInterval(timer);
    if (chartInstance) {
      chartInstance.off('rendered');
      chartInstance.dispose();
    }
  });
</script>

<style scoped>
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
  .app-container.dark .graph-card {
    background-color: #2c2c3a;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  .app-container.dark .control-btn {
    background-color: #4a4a5a;
  }
  .app-container.dark .control-btn:hover {
    background-color: #5a5a6a;
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
  .graph-section {
    flex: 1;
    padding: 2vh;
    overflow: hidden;
  }
  .graph-card {
    height: 100%;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 12px 0 rgba(139, 92, 246, 0.05);
    display: flex;
    flex-direction: column;
    position: relative;
    transition: background-color 0.3s, box-shadow 0.3s;
  }
  .chart-container {
    flex: 1;
    width: 100%;
    height: 100%;
    border-radius: 0 0 12px 12px;
  }
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
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.3);
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
    box-shadow: 0 2px 5px rgba(139, 92, 246, 0.3);
  }
  .control-btn:hover {
    background: #A78BFA;
    transform: scale(1.05);
  }
  .control-btn:active {
    transform: scale(0.95);
  }
  .control-btn i {
    pointer-events: none;
  }
</style>

<style>
  @import './fontawesome-free-6.4.0-web/fontawesome-free-6.4.0-web/css/all.min.css';
</style>