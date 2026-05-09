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
        <!-- 搜索卡片 -->
        <div class="search-card">
          <h3>高级检索</h3>
          <!-- 搜索框 -->
          <div class="search-box">
            <input
              type="text"
              v-model="searchQuery"
              class="query-input"
              placeholder="输入技术/框架/工具名称..."
              @keyup.enter="handleSearch"
            />
            <button class="search-btn" @click="handleSearch" :disabled="loading">
              <i class="fas fa-search"></i> 检索
            </button>
          </div>

          <!-- 高级搜索切换 -->
          <div class="advanced-toggle" @click="showAdvanced = !showAdvanced">
            <i :class="showAdvanced ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
            {{ showAdvanced ? '收起高级选项' : '展开高级选项' }}
          </div>

          <!-- 高级搜索选项面板（单选且互斥） -->
          <div v-if="showAdvanced" class="advanced-options">
            <div class="filter-group">
              <label>实体类型</label>
              <div class="radio-group">
                <label v-for="type in entityTypes" :key="type.value">
                  <input
                    type="radio"
                    name="entityType"
                    :value="type.value"
                    v-model="selectedType"
                    @change="handleTypeChange('entity')"
                  />
                  {{ type.label }}
                </label>
              </div>
            </div>

            <div class="filter-group">
              <label>关系类型</label>
              <div class="radio-group">
                <label v-for="rel in relationTypes" :key="rel.value">
                  <input
                    type="radio"
                    name="relationType"
                    :value="rel.value"
                    v-model="selectedRelation"
                    @change="handleTypeChange('relation')"
                  />
                  {{ rel.label }}
                </label>
              </div>
            </div>

            <div class="filter-actions">
              <button class="reset-btn" @click="resetFilters">重置</button>
              <button class="apply-btn" @click="handleApplyFilter">应用筛选</button>
            </div>
          </div>

          <!-- 加载状态 -->
          <div v-if="loading" class="loading">
            <i class="fas fa-spinner fa-spin"></i> 检索中...
          </div>

          <!-- 未找到结果提示 -->
          <div v-if="!loading && hasSearched && graphData.nodes.length === 0" class="no-result">
            <i class="fas fa-search"></i>
            <h4>未找到相关节点</h4>
            <p>没有找到与 "{{ searchQuery || '筛选条件' }}" 相关的技术节点</p>
            <p class="suggestion">试试其他关键词，或使用高级筛选功能</p>
          </div>

          <!-- 图谱可视化容器 -->
          <div v-if="graphData.nodes.length > 0" id="graph-container" class="graph-container"></div>
        </div>

        <!-- 技术卡片区域 -->
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
                <i :class="tech.icon"></i>
                <h5>{{ tech.name }}</h5>
                <p>{{ tech.desc }}</p>
                <span class="card-link">查看文档 →</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
  import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
  import { Network } from 'vis-network';
  import 'vis-network/styles/vis-network.css';

  // ---------- 防抖函数 ----------
  /**
   * 防抖函数：在连续触发后等待一段时间再执行
   * @param {Function} fn - 要执行的函数
   * @param {number} delay - 延迟时间（毫秒）
   * @returns {Function} 防抖后的函数
   */
  const debounce = (fn, delay) => {
    let timer = null;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        fn.apply(this, args);
      }, delay);
    };
  };

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

  // 登出
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user_info');
    localStorage.removeItem('userRole');
    localStorage.removeItem('adminName');
    window.location.href = 'http://localhost:5173/';
    showDropdown.value = false;
  };

  // ---------- 搜索相关 ----------
  const searchQuery = ref('');
  const results = ref([]);
  const loading = ref(false);
  const hasSearched = ref(false);
  const showAdvanced = ref(false);
  const selectedType = ref('');
  const selectedRelation = ref('');
  const graphData = ref({ nodes: [], edges: [] });

  // 实体类型选项
  const entityTypes = [
    { value: 'Base', label: '语言基础' },
    { value: 'Framework', label: '框架和库' },
    { value: 'Css Tool', label: '样式工具' },
    { value: 'Engineer', label: '构建工具' },
    { value: 'Lang', label: '语言标准' },
    { value: 'Module', label: '模块化规范' },
    { value: 'Project', label: '项目' },
    { value: 'Request', label: '请求API' },
    { value: 'Router', label: '路由工具' },
    { value: 'State', label: '状态管理' },
    { value: 'UI', label: 'UI组件库' }
  ];

  // 关系类型选项
  const relationTypes = [
    { value: 'ALTERNATIVE_TO', label: '替代' },
    { value: 'BELONGS_TO', label: '归属' },
    { value: 'COMPILES_TO', label: '编译' },
    { value: 'EXTENDS', label: '扩展' },
    { value: 'IS_BASED_ON', label: '依赖' },
    { value: 'IS_SUPERSET_OF', label: '包含' },
    { value: 'REPLACE', label: '替代' },
    { value: 'SIMILAR_TO', label: '相似' },
    { value: 'TOOL_FOR', label: '工具' },
    { value: 'USED_FOR', label: '应用' }
  ];

  // 技术卡片数据（11个分类）
  const techCategories = [
    {
      title: '① 前端基础',
      items: [
        { name: 'HTML', icon: 'fab fa-html5', desc: '超文本标记语言，构建网页结构', link: 'https://developer.mozilla.org/zh-CN/docs/Web/HTML' },
        { name: 'CSS', icon: 'fab fa-css3-alt', desc: '层叠样式表，美化网页样式', link: 'https://developer.mozilla.org/zh-CN/docs/Web/CSS' },
        { name: 'JavaScript', icon: 'fab fa-js', desc: '脚本语言，实现网页交互', link: 'https://developer.mozilla.org/zh-CN/docs/Web/JavaScript' }
      ]
    },
    {
      title: '② 开发环境',
      items: [
        { name: 'Git', icon: 'fab fa-git-alt', desc: '分布式版本控制系统', link: 'https://git-scm.com/doc' },
        { name: 'npm', icon: 'fab fa-npm', desc: 'Node.js 包管理器', link: 'https://docs.npmjs.com/' },
        { name: 'VS Code', icon: 'fab fa-vuejs', desc: '轻量级代码编辑器', link: 'https://code.visualstudio.com/docs' }
      ]
    },
    {
      title: '③ 样式进阶',
      items: [
        { name: 'Sass', icon: 'fab fa-sass', desc: 'CSS 预处理器', link: 'https://sass-lang.com/documentation' },
        { name: 'Tailwind', icon: 'fab fa-css3-alt', desc: '实用优先的 CSS 框架', link: 'https://tailwindcss.com/docs' },
        { name: 'Bootstrap', icon: 'fab fa-bootstrap', desc: '流行的 CSS 框架', link: 'https://getbootstrap.com/docs/5.3' }
      ]
    },
    {
      title: '④ JS进阶',
      items: [
        { name: 'ES6+', icon: 'fab fa-js', desc: '现代 JavaScript 特性', link: 'https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Language_Resources' },
        { name: 'TypeScript', icon: 'fab fa-js', desc: 'JavaScript 类型超集', link: 'https://www.typescriptlang.org/docs' },
        { name: '异步编程', icon: 'fab fa-js', desc: 'Promise/async/await', link: 'https://developer.mozilla.org/zh-CN/docs/Learn/JavaScript/Asynchronous' }
      ]
    },
    {
      title: '⑤ 框架入门',
      items: [
        { name: 'Vue', icon: 'fab fa-vuejs', desc: '渐进式 JavaScript 框架', link: 'https://cn.vuejs.org/' },
        { name: 'React', icon: 'fab fa-react', desc: '用于构建用户界面的库', link: 'https://zh-hans.reactjs.org/' },
        { name: 'Angular', icon: 'fab fa-angular', desc: '企业级前端框架', link: 'https://angular.io/docs' }
      ]
    },
    {
      title: '⑥ 构建工具',
      items: [
        { name: 'Webpack', icon: 'fas fa-cube', desc: '模块打包工具', link: 'https://webpack.js.org/concepts/' },
        { name: 'Vite', icon: 'fas fa-bolt', desc: '下一代前端构建工具', link: 'https://vitejs.dev/guide/' },
        { name: '懒加载', icon: 'fas fa-spinner', desc: '代码分割与按需加载', link: 'https://developer.mozilla.org/zh-CN/docs/Web/Performance/Lazy_loading' }
      ]
    },
    {
      title: '⑦ 工程化',
      items: [
        { name: 'ESLint', icon: 'fas fa-code', desc: '代码检查工具', link: 'https://eslint.org/docs/latest/' },
        { name: 'Prettier', icon: 'fas fa-paint-brush', desc: '代码格式化工具', link: 'https://prettier.io/docs/en/' },
        { name: 'Jest', icon: 'fas fa-check-circle', desc: 'JavaScript 测试框架', link: 'https://jestjs.io/docs/getting-started' }
      ]
    },
    {
      title: '⑧ 性能优化',
      items: [
        { name: 'Lighthouse', icon: 'fas fa-tachometer-alt', desc: '网站性能评测工具', link: 'https://developers.google.com/web/tools/lighthouse' },
        { name: '懒加载', icon: 'fas fa-images', desc: '图片懒加载', link: 'https://developer.mozilla.org/zh-CN/docs/Web/Performance/Lazy_loading' },
        { name: '缓存策略', icon: 'fas fa-database', desc: 'HTTP 缓存与 Service Worker', link: 'https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Caching' }
      ]
    },
    {
      title: '⑨ 安全基础',
      items: [
        { name: 'HTTPS', icon: 'fas fa-lock', desc: '加密传输协议', link: 'https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CSP' },
        { name: 'CSP', icon: 'fas fa-shield-alt', desc: '内容安全策略', link: 'https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CSP' },
        { name: 'XSS 防御', icon: 'fas fa-ban', desc: '跨站脚本攻击防护', link: 'https://developer.mozilla.org/zh-CN/docs/Glossary/Cross-site_scripting' }
      ]
    },
    {
      title: '⑩ 部署与运维',
      items: [
        { name: 'Vercel', icon: 'fas fa-cloud-upload-alt', desc: '前端部署平台', link: 'https://vercel.com/docs' },
        { name: 'Netlify', icon: 'fas fa-cloud-upload-alt', desc: '静态网站托管', link: 'https://docs.netlify.com/' },
        { name: 'GitHub Pages', icon: 'fab fa-github', desc: '免费静态站点托管', link: 'https://pages.github.com/' }
      ]
    },
    {
      title: '⑪ 进阶方向',
      items: [
        { name: 'Next.js', icon: 'fab fa-react', desc: 'React 服务端渲染框架', link: 'https://nextjs.org/docs' },
        { name: '微前端', icon: 'fas fa-puzzle-piece', desc: '多团队独立开发', link: 'https://micro-frontends.org/' },
        { name: 'PWA', icon: 'fas fa-mobile-alt', desc: '渐进式 Web 应用', link: 'https://web.dev/progressive-web-apps/' }
      ]
    }
  ];

  // 处理单选互斥
  const handleTypeChange = (type) => {
    if (type === 'entity' && selectedType.value) {
      selectedRelation.value = '';
    } else if (type === 'relation' && selectedRelation.value) {
      selectedType.value = '';
    }
  };

  // 清空图谱并销毁实例
  const clearGraph = () => {
    if (networkInstance) {
      networkInstance.destroy();
      networkInstance = null;
    }
    graphData.value = { nodes: [], edges: [] };
    const container = document.getElementById('graph-container');
    if (container) {
      container.innerHTML = '';
    }
  };

  // 检索按钮：基于关键词 + 当前选中的类型进行搜索
  const handleSearch = async () => {
    const query = searchQuery.value.trim();
    if (!query) {
      alert('请输入搜索关键词');
      return;
    }

    loading.value = true;
    hasSearched.value = true;
    results.value = [];
    
    // 清空之前的图谱
    clearGraph();

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: query,
          entityType: selectedType.value,
          relationType: selectedRelation.value,
          mode: 'keyword'
        }),
      });
      if (!response.ok) throw new Error('请求失败');
      const data = await response.json();

      // 转换图谱数据
      if (data.nodes && data.nodes.length > 0) {
        graphData.value = {
          nodes: data.nodes.map(n => ({
            id: n.id,
            label: n.label,
            title: n.type,
          })),
          edges: data.edges.map(e => ({
            from: e.from,
            to: e.to,
            label: e.label,
            arrows: 'to',
          })),
        };

        // 渲染图谱
        nextTick(() => {
          renderGraph();
        });
      } else {
        // 没有找到结果，图谱已清空
        graphData.value = { nodes: [], edges: [] };
      }
    } catch (error) {
      console.error('检索失败:', error);
      graphData.value = { nodes: [], edges: [] };
    } finally {
      loading.value = false;
    }
  };

  // 应用筛选按钮：根据选中的实体类型或关系类型进行检索（忽略关键词）
  const handleApplyFilter = async () => {
    if (!selectedType.value && !selectedRelation.value) {
      alert('请至少选择一个实体类型或关系类型');
      return;
    }

    loading.value = true;
    hasSearched.value = true;
    results.value = [];
    
    // 清空之前的图谱
    clearGraph();

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: selectedType.value,
          relationType: selectedRelation.value,
          mode: 'filter'
        }),
      });
      if (!response.ok) throw new Error('请求失败');
      const data = await response.json();

      // 转换图谱数据
      if (data.nodes && data.nodes.length > 0) {
        graphData.value = {
          nodes: data.nodes.map(n => ({
            id: n.id,
            label: n.label,
            title: n.type,
          })),
          edges: data.edges.map(e => ({
            from: e.from,
            to: e.to,
            label: e.label,
            arrows: 'to',
          })),
        };

        // 渲染图谱
        nextTick(() => {
          renderGraph();
        });
      } else {
        // 没有找到结果，图谱已清空
        graphData.value = { nodes: [], edges: [] };
      }
    } catch (error) {
      console.error('筛选失败:', error);
      graphData.value = { nodes: [], edges: [] };
    } finally {
      loading.value = false;
    }
  };

  // 重置筛选
  const resetFilters = () => {
    selectedType.value = '';
    selectedRelation.value = '';
  };

  // ---------- 图谱渲染 ----------
  let networkInstance = null;

  const renderGraph = () => {
    const container = document.getElementById('graph-container');
    if (!container) return;

    // 清理旧实例
    if (networkInstance) {
      networkInstance.destroy();
      networkInstance = null;
    }
    container.innerHTML = '';

    // 如果没有节点，不渲染
    if (graphData.value.nodes.length === 0) return;

    const options = {
      layout: {
        improvedLayout: true,
        hierarchical: false,
      },
      edges: {
        smooth: true,
        arrows: { to: { enabled: true, scaleFactor: 0.5 } },
        font: { size: 12 },
      },
      nodes: {
        shape: 'dot',
        size: 20,
        font: { size: 14 },
        borderWidth: 2,
      },
      physics: {
        stabilization: true,
        barnesHut: { gravitationalConstant: -2000 },
      },
    };

    const network = new Network(container, graphData.value, options);
    networkInstance = network;

    // 双击节点跳转，携带 name 属性
    network.on('doubleClick', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = graphData.value.nodes.find(n => n.id === nodeId);
        if (node) {
          const nodeName = node.label;
          window.location.href = `${window.location.origin}/Document/${encodeURIComponent(nodeName)}`;
        }
      }
    });
  };

  // ---------- 窗口 resize 防抖处理 ----------
  // 创建防抖版本的 resize 处理函数（200ms 延迟）
  const handleResize = debounce(() => {
    if (networkInstance) {
      // 重新计算布局并适配新尺寸
      networkInstance.redraw();
      // 可选：重新适配视图
      networkInstance.fit();
    }
  }, 200);

  // 保存引用用于清理
  let resizeHandler = null;

  // ---------- 生命周期 ----------
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

    document.addEventListener('click', handleClickOutside);
    timer = setInterval(updateTime, 1000);
    
    // 添加防抖的 resize 监听器
    resizeHandler = handleResize;
    window.addEventListener('resize', resizeHandler);
  });

  onBeforeUnmount(() => {
    if (networkInstance) {
      networkInstance.destroy();
      networkInstance = null;
    }
    document.removeEventListener('click', handleClickOutside);
    if (timer) clearInterval(timer);
    
    // 清理 resize 监听器
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
    }
  });
</script>

<style scoped>
  
  
  /* 新增未找到结果的样式 */
  .no-result {
    text-align: center;
    padding: 60px 40px;
    background: #f8f9fa;
    border-radius: 12px;
    margin-top: 20px;
  }
  
  .no-result i {
    font-size: 48px;
    color: #8b5cf6;
    margin-bottom: 16px;
    opacity: 0.6;
  }
  
  .no-result h4 {
    font-size: 18px;
    color: #2d3748;
    margin-bottom: 8px;
  }
  
  .no-result p {
    color: #718096;
    font-size: 14px;
    margin-bottom: 4px;
  }
  
  .no-result .suggestion {
    color: #8b5cf6;
    font-size: 13px;
    margin-top: 12px;
  }
  
  /* 暗色模式下的未找到结果样式 */
  .app-container.dark .no-result {
    background-color: #2c2c3a;
  }
  
  .app-container.dark .no-result h4 {
    color: #e0e0e0;
  }
  
  .app-container.dark .no-result p {
    color: #b0b0b0;
  }
  
  .app-container.dark .no-result .suggestion {
    color: #a78bfa;
  }
</style>

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
    color: #8b5cf6;
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
  .app-container.dark .tech-card .card-link {
    color: #a78bfa;
  }
  .app-container.dark .tech-cards h4 {
    color: #e0e0e0;
  }
  .app-container.dark .category-title {
    background-color: #3a3a4a;
    color: #e0e0e0;
    border-left-color: #8b5cf6;
  }
  .app-container.dark .graph-container {
    border-color: #4a4a5a;
    background-color: #2c2c3a;
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
    padding: 2vh 20px;
    overflow-y: auto;
  }
  .search-card {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 12px 0 rgba(139, 92, 246, 0.05);
    padding: 24px;
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    transition: background-color 0.3s, box-shadow 0.3s;
  }
  .search-card h3 {
    margin-bottom: 20px;
    color: #333;
    border-left: 4px solid #8b5cf6;
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
    border-color: #8b5cf6;
  }
  .search-btn {
    padding: 0 24px;
    background-color: #8b5cf6;
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
    background-color: #a78bfa;
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
    color: #8b5cf6;
    font-size: 14px;
    cursor: pointer;
    margin-bottom: 15px;
    user-select: none;
  }
  .advanced-toggle:hover {
    text-decoration: underline;
  }

  /* 高级搜索选项面板 */
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
  .radio-group {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
  }
  .radio-group label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-weight: normal;
    margin-bottom: 0;
    cursor: pointer;
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
    background-color: #8b5cf6;
    color: white;
  }
  .apply-btn:hover {
    background-color: #a78bfa;
  }

  /* 加载 & 无结果 */
  .loading {
    text-align: center;
    padding: 40px 0;
    color: #666;
    font-style: italic;
  }
  .no-result {
    text-align: center;
    padding: 40px 0;
    color: #999;
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
    color: #8b5cf6;
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
    border-left: 3px solid #8b5cf6;
  }

  /* 图谱容器 */
  .graph-container {
    width: 100%;
    height: 400px;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    margin-top: 20px;
    background-color: #fafafa;
    transition: background-color 0.3s, border-color 0.3s;
  }

  /* 技术卡片区域 */
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
    border-color: #8b5cf6;
  }
  .tech-card i {
    font-size: 40px;
    margin-bottom: 12px;
    color: #8b5cf6;
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
    color: #8b5cf6;
    font-weight: 500;
  }
  .tech-card:hover .card-link {
    text-decoration: underline;
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
    border-left: 4px solid #8b5cf6;
    background-color: #f8f9fa;
    padding: 8px 12px;
    border-radius: 4px;
  }
</style>

<style>
  /* 全局引入 Font Awesome (放在非 scoped 样式中确保生效) */
  @import './fontawesome-free-6.4.0-web/fontawesome-free-6.4.0-web/css/all.min.css';
</style>