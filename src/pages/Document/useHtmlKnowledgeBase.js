import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';

// 导航数据（基于MDN）
const navSections = [
  {
    title: '📖 主要资源',
    items: [
      { id: 'intro', label: 'HTML 介绍', hot: true },
      { id: 'tutorial', label: 'HTML 教程' },
      { id: 'reference-guide', label: 'HTML 参考', hot: true }
    ]
  },
  {
    title: '🎓 初学者教程',
    items: [
      { id: 'getting-started', label: 'HTML 入门', hot: true },
      { id: 'multimedia', label: '多媒体与嵌入' },
      { id: 'tables', label: 'HTML 表格' },
      { id: 'forms', label: 'HTML 表单', hot: true },
      { id: 'faq', label: '常见问题' }
    ]
  },
  // ... 其他分组（略，可参考原数据，此处节省篇幅）
];

// 内容数据
const contentMap = {
  'intro': {
    title: 'HTML 介绍',
    body: `<p class="lead">HTML（超文本标记语言）是构成 Web 世界的一砖一瓦...</p>`
  },
  // ... 其他内容
};

// 图谱节点和边（静态）
const graphNodes = [
  { id: 'intro', name: 'HTML 介绍' },
  { id: 'tutorial', name: '教程' },
  // ... 其余节点
];
const graphLinks = [
  { source: 'intro', target: 'getting-started' },
  // ... 其余边
];

// 标签映射
const tagMap = {
  'intro': ['语义化', '基础', '历史'],
  // ...
};

export function useHtmlKnowledgeBase() {
  // DOM 引用
  const chartRef = ref(null);
  const avatarWrapper = ref(null);

  // 响应式数据
  const showDropdown = ref(false);
  const userInfo = ref(null);
  const currentTime = ref(new Date().toLocaleTimeString());
  const isDark = ref(false);
  const selectedId = ref(null);
  const currentContent = ref(null);

  let chartInstance = null;
  let timer = null;

  const displayName = computed(() => {
    if (!userInfo.value) return '';
    return userInfo.value.username || (userInfo.value.email ? userInfo.value.email.split('@')[0] : '用户');
  });

  const currentTags = computed(() => {
    return selectedId.value ? tagMap[selectedId.value] || [] : [];
  });

  // 切换主题
  const toggleTheme = () => {
    isDark.value = !isDark.value;
  };

  // 更新时间
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

  // 路由跳转（保持与第一个组件一致）
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

  // 选择知识点
  const handleSelect = (id) => {
    selectedId.value = id;
    currentContent.value = contentMap[id] || {
      title: '内容建设中',
      body: '<p>该知识点内容暂未完善，请参考 MDN 官方文档。</p>'
    };
  };

  // 初始化 ECharts 图谱
  const initChart = () => {
    if (!chartRef.value) return;

    chartInstance = echarts.init(chartRef.value);

    const categories = [...new Set(graphNodes.map(n => n.name))].map(name => ({ name }));

    const option = {
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          if (params.dataType === 'node') {
            return `<div><strong>${params.data.name}</strong></div>`;
          } else {
            return `<div>关联</div>`;
          }
        }
      },
      series: [{
        type: 'graph',
        layout: 'force',
        data: graphNodes.map(node => ({
          id: node.id,
          name: node.name,
          category: node.name,
          symbolSize: 30,
          label: { show: true, fontSize: 10 }
        })),
        links: graphLinks.map(link => ({
          source: link.source,
          target: link.target,
          lineStyle: { color: '#999', width: 1.5, curveness: 0.2 }
        })),
        categories,
        roam: true,
        draggable: true,
        force: { repulsion: 500, edgeLength: 150 },
        label: { show: true, position: 'inside', color: '#fff' },
        emphasis: { focus: 'adjacency' }
      }]
    };

    chartInstance.setOption(option);

    // 点击节点跳转
    chartInstance.on('click', (params) => {
      if (params.componentType === 'series' && params.dataType === 'node') {
        handleSelect(params.data.id);
      }
    });

    chartInstance.on('mouseover', () => {
      chartInstance.getZr().setCursorStyle('pointer');
    });
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
      series.force = { repulsion: 500, edgeLength: 150 };
      chartInstance.setOption(option, { notMerge: false });
    }
  };

  // 生命周期
  onMounted(() => {
    // 验证登录
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

    // 默认选中第一个
    if (navSections.length > 0 && navSections[0].items.length > 0) {
      handleSelect(navSections[0].items[0].id);
    }

    initChart();
    window.addEventListener('resize', () => chartInstance?.resize());
    document.addEventListener('click', handleClickOutside);
    timer = setInterval(updateTime, 1000);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', () => chartInstance?.resize());
    document.removeEventListener('click', handleClickOutside);
    if (timer) clearInterval(timer);
    if (chartInstance) {
      chartInstance.dispose();
    }
  });

  return {
    chartRef,
    avatarWrapper,
    navSections,
    showDropdown,
    userInfo,
    currentTime,
    isDark,
    displayName,
    selectedId,
    currentContent,
    currentTags,
    handleSelect,
    toggleTheme,
    toggleDropdown,
    goToProfile,
    goToAdvancedSearch,
    goToAIResponse,
    logout,
    zoomIn,
    zoomOut,
    fitToView
  };
}