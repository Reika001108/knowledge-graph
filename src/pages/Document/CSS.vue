<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（CSS 知识库版本） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">CSS 知识库</h1>
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
      <!-- 左侧导航（锚点链接） -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>🎨 <span class="gradient-text">CSS 样式指南</span></h2>
          <div class="header-decoration"></div>
        </div>

        <div class="nav-sections">
          <div v-for="section in navSections" :key="section.title" class="nav-section">
            <h3 class="section-title">
              {{ section.title }}
              <span class="section-count">{{ section.items.length }}</span>
            </h3>
            <a
              v-for="item in section.items"
              :key="item.id"
              :href="'#content-' + item.id"
              class="nav-item"
              :class="{ active: selectedId === item.id }"
              @click="selectedId = item.id"
            >
              <span class="item-dot"></span>
              {{ item.label }}
              <span v-if="item.hot" class="hot-badge">HOT</span>
            </a>
          </div>
        </div>

        <div class="sidebar-footer">
          <p>🔖 基于 CSS3 / CSS4 草案</p>
          <p>✨ 点击节点可双向联动</p>
        </div>
      </aside>

      <!-- 中间内容区（连续长文档） -->
      <section class="content-area" ref="contentAreaRef">
        <div class="continuous-content">
          <div
            v-for="item in allFlatItems"
            :key="item.id"
            :id="'content-' + item.id"
            class="content-block"
          >
            <div class="content-card" v-if="contentMap[item.id]">
              <div class="content-header">
                <h1 class="content-title">{{ contentMap[item.id].title }}</h1>
              </div>
              <div class="content-body" v-html="contentMap[item.id].body"></div>
              <div class="content-footer">
                <span class="tag-label">🔗 关联知识点</span>
                <div class="tag-list">
                  <span class="tag" v-for="tag in contentMap[item.id].tags" :key="tag">{{ tag }}</span>
                </div>
              </div>
            </div>
            <div v-else class="content-card placeholder">
              <h2>{{ item.label }} 的详细内容正在整理中...</h2>
            </div>
          </div>
        </div>
      </section>

      <!-- 右侧图谱 -->
      <aside class="graph-panel">
        <div class="graph-header">
          <h3>🔗 知识关系图 <span class="graph-badge">ECharts</span></h3>
          <p class="graph-hint">点击节点跳转 · 拖拽缩放</p>
        </div>
        <div ref="chartRef" class="chart-container"></div>
        <div class="graph-footer">
          <span>⚡ 共 {{ graphNodes.length }} 节点 | {{ graphLinks.length }} 关联</span>
          <div class="graph-controls">
            <button class="control-btn" @click="zoomOut" title="缩小">
              <i class="fas fa-search-minus"></i>
            </button>
            <button class="control-btn" @click="fitToView" title="适应页面">
              <i class="fas fa-arrows-alt"></i>
            </button>
            <button class="control-btn" @click="zoomIn" title="放大">
              <i class="fas fa-search-plus"></i>
            </button>
          </div>
        </div>
      </aside>
    </main>
  </div>
</template>

<script setup>
  import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue';
  import * as echarts from 'echarts';

  // ---------- 用户及主题相关 ----------
  const showDropdown = ref(false);
  const avatarWrapper = ref(null);
  const userInfo = ref(null);
  const currentTime = ref(new Date().toLocaleTimeString());
  const isDark = ref(false);

  const displayName = computed(() => {
    if (!userInfo.value) return '';
    return userInfo.value.username || userInfo.value.email?.split('@')[0] || '用户';
  });

  const toggleTheme = () => {
    isDark.value = !isDark.value;
    if (chartInstance.value) {
      chartInstance.value.dispose();
      chartInstance.value = null;
      nextTick(() => initChart());
    }
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

  const goToProfile = () => alert('跳转到个人中心');
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user_info');
    showDropdown.value = false;
    window.location.href = 'http://localhost:5173/';
  };

  // ========== 导航数据（CSS 知识体系）==========
  const navSections = ref([
    { title: '🎯 选择器', items: [
        { id: 'selectors_intro', label: '选择器概述' },
        { id: 'basic_selectors', label: '基础选择器' },
        { id: 'combinators', label: '组合选择器' },
        { id: 'pseudo_classes', label: '伪类选择器' },
        { id: 'pseudo_elements', label: '伪元素选择器' },
        { id: 'attribute_selectors', label: '属性选择器' },
    ]},
    { title: '📦 盒模型与布局', items: [
        { id: 'box_model', label: '盒模型 (Box Model)' },
        { id: 'margin_padding', label: 'margin / padding' },
        { id: 'border', label: 'border 边框' },
        { id: 'display', label: 'display 属性' },
        { id: 'position', label: 'position 定位' },
        { id: 'float_clear', label: 'float & clear' },
        { id: 'flexbox', label: 'Flexbox 布局', hot: true },
        { id: 'grid', label: 'Grid 网格布局', hot: true },
    ]},
    { title: '🎨 样式与视觉效果', items: [
        { id: 'colors', label: '颜色 (color / background)' },
        { id: 'typography', label: '字体与文本' },
        { id: 'gradients', label: '渐变 (gradient)' },
        { id: 'shadows', label: '阴影 (box-shadow / text-shadow)' },
        { id: 'transitions', label: '过渡 (transition)' },
        { id: 'animations', label: '动画 (animation)' },
        { id: 'transforms', label: '变换 (transform)' },
    ]},
    { title: '📐 响应式与自适应', items: [
        { id: 'media_queries', label: '媒体查询' },
        { id: 'viewport', label: '视口设置' },
        { id: 'responsive_units', label: '响应式单位 (vw/vh/rem/em)' },
        { id: 'container_queries', label: '容器查询' },
    ]},
    { title: '🔧 高级特性', items: [
        { id: 'variables', label: 'CSS 变量 (Custom Properties)' },
        { id: 'calc', label: 'calc() 函数' },
        { id: 'clamp_minmax', label: 'clamp() / min() / max()' },
        { id: 'aspect_ratio', label: 'aspect-ratio' },
        { id: 'backdrop_filter', label: 'backdrop-filter' },
    ]},
  ]);

  const selectedId = ref('selectors_intro');

  // 扁平化所有知识点
  const allFlatItems = computed(() => {
    const flat = [];
    navSections.value.forEach(section => {
      section.items.forEach(item => {
        flat.push(item);
      });
    });
    return flat;
  });

  // ========== 内容映射表（CSS 详细文档）==========
  const contentMap = {
    // ----- 选择器 -----
    selectors_intro: {
      title: 'CSS 选择器概述',
      body: `<p class="lead">CSS 选择器用于选择需要添加样式的 HTML 元素。选择器是 CSS 规则的核心组成部分。</p>
      <h3>选择器分类</h3>
      <ul>
        <li><strong>基础选择器</strong>：类型选择器、类选择器、ID 选择器、通配符选择器</li>
        <li><strong>组合选择器</strong>：后代、子代、相邻兄弟、通用兄弟</li>
        <li><strong>伪类选择器</strong>：基于状态的选择（:hover, :first-child 等）</li>
        <li><strong>伪元素选择器</strong>：选择元素的特定部分（::before, ::after 等）</li>
        <li><strong>属性选择器</strong>：基于元素属性及属性值进行选择</li>
      </ul>
      <pre><code>/* 示例 */
  h1 { color: blue; }          /* 类型选择器 */
  .title { font-size: 20px; }  /* 类选择器 */
  #header { background: red; } /* ID 选择器 */</code></pre>`,
      tags: ['选择器', '基础']
    },
    basic_selectors: {
      title: '基础选择器',
      body: `<p class="lead">基础选择器包括元素选择器、类选择器、ID 选择器和通配符选择器。</p>
      <pre><code>/* 元素选择器 */
  p { color: #333; }

  /* 类选择器 - 可多次使用 */
  .card { border: 1px solid #ccc; }

  /* ID 选择器 - 页面唯一 */
  #main-nav { background: #8B5CF6; }

  /* 通配符选择器 */
  * { margin: 0; padding: 0; }</code></pre>
      <div class="note">💡 优先级：ID 选择器 > 类选择器 > 元素选择器 > 通配符</div>`,
      tags: ['元素选择器', '类选择器', 'ID选择器']
    },
    combinators: {
      title: '组合选择器',
      body: `<p class="lead">组合选择器通过特定符号表示元素之间的关系。</p>
      <pre><code>/* 后代选择器 (空格) */
  div p { color: red; }  /* div 内的所有 p */

  /* 子代选择器 (>) */
  div > p { color: blue; } /* 直接子元素 p */

  /* 相邻兄弟选择器 (+) */
  h1 + p { margin-top: 0; } /* 紧接 h1 的 p */

  /* 通用兄弟选择器 (~) */
  h1 ~ p { color: gray; } /* h1 之后的所有兄弟 p */</code></pre>`,
      tags: ['后代', '子代', '兄弟选择器']
    },
    pseudo_classes: {
      title: '伪类选择器',
      body: `<p class="lead">伪类用于定义元素的特殊状态。</p>
      <pre><code>/* 链接状态 */
  a:link { color: blue; }
  a:visited { color: purple; }
  a:hover { color: red; }
  a:active { color: orange; }

  /* 结构性伪类 */
  li:first-child { font-weight: bold; }
  li:last-child { margin-bottom: 0; }
  li:nth-child(even) { background: #f0f0f0; }

  /* 表单伪类 */
  input:focus { outline: 2px solid #8B5CF6; }
  input:disabled { background: #eee; }</code></pre>`,
      tags: ['伪类', '状态', '结构化']
    },
    pseudo_elements: {
      title: '伪元素选择器',
      body: `<p class="lead">伪元素用于选择元素的特定部分，使用双冒号 :: 表示。</p>
      <pre><code>/* ::before - 在内容前插入 */
  .element::before {
    content: "★";
    color: gold;
  }

  /* ::after - 在内容后插入 */
  .element::after {
    content: " →";
  }

  /* ::first-letter - 首字母 */
  p::first-letter {
    font-size: 2em;
    font-weight: bold;
  }

  /* ::first-line - 首行 */
  p::first-line {
    font-weight: bold;
  }</code></pre>`,
      tags: ['伪元素', 'before', 'after']
    },
    attribute_selectors: {
      title: '属性选择器',
      body: `<p class="lead">根据元素的属性及属性值来选择元素。</p>
      <pre><code>/* 存在某属性 */
  [disabled] { opacity: 0.5; }

  /* 属性精确匹配 */
  input[type="text"] { width: 200px; }

  /* 属性值开头匹配 */
  a[href^="https"] { color: green; }

  /* 属性值结尾匹配 */
  img[src$=".svg"] { border: none; }

  /* 属性值包含匹配 */
  [class*="btn"] { cursor: pointer; }</code></pre>`,
      tags: ['属性选择器', '正则匹配']
    },
    // ----- 盒模型与布局 -----
    box_model: {
      title: '盒模型 (Box Model)',
      body: `<p class="lead">每个元素都被视为一个矩形盒子，由 content、padding、border、margin 组成。</p>
      <pre><code>/* 标准盒模型 (box-sizing: content-box) */
  .box {
    width: 200px;
    padding: 20px;
    border: 1px solid black;
    /* 实际宽度 = 200 + 40 + 2 = 242px */
  }

  /* 替代盒模型 (推荐) */
  .box {
    box-sizing: border-box;
    width: 200px;
    padding: 20px;
    /* 实际宽度固定为 200px，padding 和 border 向内挤压 */
  }</code></pre>
      <div class="note">💡 建议全局设置：<code>* { box-sizing: border-box; }</code></div>`,
      tags: ['盒模型', 'border-box']
    },
    margin_padding: {
      title: 'margin / padding',
      body: `<p class="lead">margin 外边距和 padding 内边距是盒模型的关键属性。</p>
      <pre><code>/* 单边设置 */
  margin-top: 10px;
  padding-left: 20px;

  /* 简写 */
  margin: 10px 20px;      /* 上下 10，左右 20 */
  margin: 10px 20px 15px; /* 上 10，左右 20，下 15 */
  margin: 10px 15px 20px 25px; /* 上 右下左 */

  /* 外边距折叠 (相邻垂直 margin 合并) */
  .block + .block { margin-top: 0; }</code></pre>`,
      tags: ['margin', 'padding', '折叠']
    },
    border: {
      title: 'border 边框',
      body: `<p class="lead">border 属性用于设置元素的边框样式。</p>
      <pre><code>/* 完整简写 */
  border: 2px solid #8B5CF6;

  /* 单边设置 */
  border-top: 1px dashed red;
  border-radius: 8px; /* 圆角 */

  /* 边框图片 */
  border-image: url(border.png) 30 round;

  /* 独立属性 */
  border-width: 1px;
  border-style: solid;
  border-color: #333;</code></pre>`,
      tags: ['边框', '圆角']
    },
    display: {
      title: 'display 属性',
      body: `<p class="lead">display 决定元素的显示类型。</p>
      <pre><code>/* 块级元素 */
  display: block;    /* 独占一行，宽高可设 */

  /* 行内元素 */
  display: inline;   /* 不换行，宽高无效 */

  /* 行内块 */
  display: inline-block; /* 不换行但宽高可设 */

  /* 隐藏元素 */
  display: none;     /* 不占位隐藏 */

  /* 弹性布局 */
  display: flex;

  /* 网格布局 */
  display: grid;</code></pre>`,
      tags: ['display', '块级', '行内']
    },
    position: {
      title: 'position 定位',
      body: `<p class="lead">定位控制元素在页面中的位置。</p>
      <pre><code>/* 静态定位 - 默认 */
  position: static;

  /* 相对定位 - 相对于自身原位置偏移 */
  position: relative;
  top: 10px; left: 20px;

  /* 绝对定位 - 相对于最近的非 static 祖先 */
  position: absolute;
  top: 0; right: 0;

  /* 固定定位 - 相对于视口 */
  position: fixed;
  bottom: 20px; right: 20px;

  /* 粘性定位 */
  position: sticky;
  top: 0;</code></pre>`,
      tags: ['定位', 'relative', 'absolute', 'fixed']
    },
    float_clear: {
      title: 'float & clear',
      body: `<p class="lead">浮动用于实现文字环绕效果，现代布局推荐使用 Flexbox 或 Grid。</p>
      <pre><code>/* 左浮动 */
  float: left;
  float: right;

  /* 清除浮动 */
  clear: both;   /* 清除两侧浮动 */
  clear: left;

  /* 清除浮动常用方法 - 伪元素 */
  .clearfix::after {
    content: "";
    display: table;
    clear: both;
  }</code></pre>`,
      tags: ['浮动', '清除浮动']
    },
    flexbox: {
      title: 'Flexbox 弹性布局',
      body: `<p class="lead">Flexbox 是一维布局模型，适合排列和对齐项目。</p>
      <pre><code>/* 容器属性 */
  display: flex;
  flex-direction: row | column;      /* 主轴方向 */
  justify-content: center | space-between; /* 主轴对齐 */
  align-items: center | stretch;     /* 交叉轴对齐 */
  flex-wrap: wrap;                   /* 换行 */

  /* 项目属性 */
  flex: 1;              /* 放大比例 */
  align-self: center;   /* 单独对齐 */</code></pre>
      <div class="note">⭐ Flexbox 特别适合导航栏、卡片列表、垂直居中。</div>`,
      tags: ['Flexbox', '弹性布局']
    },
    grid: {
      title: 'Grid 网格布局',
      body: `<p class="lead">CSS Grid 是二维布局系统，可同时控制行和列。</p>
      <pre><code>.container {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;
    grid-template-rows: auto 200px;
    gap: 20px;
  }

  /* 更复杂的布局 */
  .grid {
    display: grid;
    grid-template-areas: 
      "header header"
      "sidebar main"
      "footer footer";
  }

  .header { grid-area: header; }
  .sidebar { grid-area: sidebar; }</code></pre>`,
      tags: ['Grid', '网格布局', '二维布局']
    },
    // ----- 样式视觉效果 -----
    colors: {
      title: '颜色 (color / background)',
      body: `<p class="lead">CSS 支持多种颜色表示法：关键词、十六进制、RGB/RGBA、HSL/HSLA。</p>
      <pre><code>/* 十六进制 */
  color: #8B5CF6;
  background: #f0f0f0;

  /* RGB / RGBA */
  color: rgb(139, 92, 246);
  background: rgba(0, 0, 0, 0.5);

  /* HSL */
  background: hsl(250, 80%, 66%);
  background: hsla(250, 80%, 66%, 0.5);

  /* 背景图片 */
  background: url('bg.jpg') center/cover no-repeat;</code></pre>`,
      tags: ['颜色', '背景', 'RGB', 'HSL']
    },
    typography: {
      title: '字体与文本',
      body: `<p class="lead">字体和文本样式控制文字的外观。</p>
      <pre><code>/* 字体 */
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;

  /* 文本 */
  text-align: center;
  text-decoration: underline;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  word-spacing: 2px;</code></pre>`,
      tags: ['字体', '文本', '排版']
    },
    gradients: {
      title: '渐变 (gradient)',
      body: `<p class="lead">渐变是一种图像类型，可实现平滑的颜色过渡。</p>
      <pre><code>/* 线性渐变 */
  background: linear-gradient(to right, #8B5CF6, #A78BFA);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  /* 径向渐变 */
  background: radial-gradient(circle, #ff9a9e, #fad0c4);

  /* 锥形渐变 */
  background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red);</code></pre>`,
      tags: ['渐变', 'linear-gradient']
    },
    shadows: {
      title: '阴影 (box-shadow / text-shadow)',
      body: `<p class="lead">阴影为元素添加深度感。</p>
      <pre><code>/* 盒子阴影 */
  box-shadow: 4px 6px 10px rgba(0,0,0,0.1);
  box-shadow: 0 10px 20px -5px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.5);

  /* 文字阴影 */
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);</code></pre>`,
      tags: ['阴影', 'box-shadow']
    },
    transitions: {
      title: '过渡 (transition)',
      body: `<p class="lead">过渡让属性变化更平滑。</p>
      <pre><code>.btn {
    background: #8B5CF6;
    transition: background 0.3s ease, transform 0.2s;
  }
  .btn:hover {
    background: #A78BFA;
    transform: scale(1.05);
  }

  /* 简写 */
  transition: all 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1);</code></pre>`,
      tags: ['过渡', 'transition']
    },
    animations: {
      title: '动画 (animation)',
      body: `<p class="lead">关键帧动画可实现复杂、循环的动画效果。</p>
      <pre><code>@keyframes slideIn {
    from { transform: translateX(-100px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  .element {
    animation: slideIn 0.5s ease forwards;
    animation-iteration-count: infinite;
    animation-delay: 1s;
  }</code></pre>`,
      tags: ['动画', 'keyframes']
    },
    transforms: {
      title: '变换 (transform)',
      body: `<p class="lead">transform 允许旋转、缩放、倾斜或平移元素。</p>
      <pre><code>.box {
    transform: translate(50px, 100px);
    transform: rotate(45deg);
    transform: scale(1.2);
    transform: skew(10deg, 5deg);
    
    /* 组合变换 */
    transform: translateX(20px) rotate(10deg) scale(1.1);
    transform-origin: top left;
  }</code></pre>`,
      tags: ['transform', '变换']
    },
    // 响应式
    media_queries: {
      title: '媒体查询',
      body: `<p class="lead">媒体查询根据设备特征应用不同的 CSS 样式。</p>
      <pre><code>/* 视口宽度 <= 768px 时生效 */
  @media (max-width: 768px) {
    .container {
      flex-direction: column;
    }
  }

  /* 暗色模式偏好 */
  @media (prefers-color-scheme: dark) {
    body { background: #1a1a1a; color: #fff; }
  }

  /* 组合条件 */
  @media (min-width: 768px) and (max-width: 1024px) { }</code></pre>`,
      tags: ['媒体查询', '响应式']
    },
    viewport: {
      title: '视口设置',
      body: `<p class="lead">移动端适配必须设置的 viewport meta 标签。</p>
      <pre><code>&lt;meta name="viewport" content="width=device-width, initial-scale=1.0"&gt;

  /* CSS 中配合 */
  @media (max-width: 480px) {
    html { font-size: 14px; }
  }</code></pre>`,
      tags: ['视口', '移动端']
    },
    responsive_units: {
      title: '响应式单位',
      body: `<p class="lead">相对单位更适合响应式设计。</p>
      <pre><code>/* 视口单位 */
  width: 100vw;   /* 视口宽度百分比 */
  height: 100vh;  /* 视口高度百分比 */

  /* 字体相对单位 */
  font-size: 1rem;    /* 相对于根元素 */
  font-size: 1.2em;   /* 相对于父元素 */

  /* 百分比 */
  width: 50%;         /* 相对于包含块 */</code></pre>`,
      tags: ['vw', 'vh', 'rem', 'em']
    },
    container_queries: {
      title: '容器查询',
      body: `<p class="lead">容器查询根据父容器大小进行样式调整（现代特性）。</p>
      <pre><code>.card-container {
    container-type: inline-size;
  }

  @container (min-width: 400px) {
    .card {
      display: flex;
      gap: 20px;
    }
  }</code></pre>`,
      tags: ['容器查询', '现代CSS']
    },
    // 高级特性
    variables: {
      title: 'CSS 变量',
      body: `<p class="lead">CSS 自定义属性，可在整个文档中复用值。</p>
      <pre><code>:root {
    --primary-color: #8B5CF6;
    --spacing: 16px;
  }

  .button {
    background: var(--primary-color);
    padding: var(--spacing);
  }

  /* 变量回退值 */
  color: var(--invalid-color, #000);</code></pre>`,
      tags: ['CSS变量', '自定义属性']
    },
    calc: {
      title: 'calc() 函数',
      body: `<p class="lead">calc() 允许在 CSS 中进行计算。</p>
      <pre><code>.element {
    width: calc(100% - 40px);
    font-size: calc(16px + 2vw);
    height: calc(100vh - 80px);
    margin: calc(10px + 2%); /* 混合单位 */
  }</code></pre>`,
      tags: ['calc', '计算']
    },
    clamp_minmax: {
      title: 'clamp() / min() / max()',
      body: `<p class="lead">用于设置动态范围的函数。</p>
      <pre><code>/* clamp(min, preferred, max) */
  font-size: clamp(1rem, 2.5vw, 2rem);
  width: clamp(200px, 50%, 600px);

  /* min() / max() */
  width: min(100%, 800px);
  padding: max(20px, 5%);</code></pre>`,
      tags: ['clamp', 'min', 'max']
    },
    aspect_ratio: {
      title: 'aspect-ratio',
      body: `<p class="lead">设置元素的宽高比。</p>
      <pre><code>.video {
    aspect-ratio: 16 / 9;
    width: 100%;
  }

  .card {
    aspect-ratio: 1 / 1; /* 正方形 */
  }</code></pre>`,
      tags: ['宽高比', 'aspect-ratio']
    },
    backdrop_filter: {
      title: 'backdrop-filter',
      body: `<p class="lead">为元素背后的区域应用图形效果。</p>
      <pre><code>.modal {
    backdrop-filter: blur(10px);
    background: rgba(0,0,0,0.3);
  }

  .navbar {
    backdrop-filter: blur(8px) brightness(0.9);
  }</code></pre>`,
      tags: ['backdrop-filter', '毛玻璃']
    }
  };

  // 补全缺失内容
  navSections.value.forEach(section => {
    section.items.forEach(item => {
      if (!contentMap[item.id]) {
        contentMap[item.id] = {
          title: item.label,
          body: `<p class="lead">关于 <strong>${item.label}</strong> 的详细介绍。此属性是 CSS 的重要特性，请参考相关文档。</p>`,
          tags: ['CSS', '样式']
        };
      }
    });
  });

  // ========== 图谱数据 ==========
  const graphNodes = ref(
    navSections.value.flatMap(section =>
      section.items.map(item => ({
        id: item.id,
        name: item.label,
        category: navSections.value.indexOf(section),
      }))
    )
  );

  const graphLinks = ref([]);

  const addLink = (source, target) => {
    if (source && target && graphNodes.value.some(n => n.id === source) && graphNodes.value.some(n => n.id === target)) {
      graphLinks.value.push({ source, target });
    }
  };

  // 构建关系图谱
  addLink('selectors_intro', 'basic_selectors');
  addLink('basic_selectors', 'combinators');
  addLink('basic_selectors', 'pseudo_classes');
  addLink('box_model', 'margin_padding');
  addLink('box_model', 'border');
  addLink('display', 'flexbox');
  addLink('display', 'grid');
  addLink('position', 'flexbox');
  addLink('flexbox', 'grid');
  addLink('colors', 'gradients');
  addLink('gradients', 'shadows');
  addLink('transitions', 'animations');
  addLink('media_queries', 'responsive_units');
  addLink('variables', 'calc');
  addLink('calc', 'clamp_minmax');

  const categories = ref(navSections.value.map(s => ({ name: s.title })));

  // ========== ECharts 初始化 ==========
  const chartRef = ref(null);
  let chartInstance = ref(null);

  const initChart = () => {
    if (!chartRef.value) return;
    if (chartInstance.value) chartInstance.value.dispose();
    chartInstance.value = echarts.init(chartRef.value, isDark.value ? 'dark' : null);
    const option = {
      title: { show: false },
      tooltip: { show: true },
      series: [{
        type: 'graph',
        layout: 'force',
        roam: true,
        draggable: true,
        data: graphNodes.value.map(node => ({
          id: node.id,
          name: node.name,
          category: node.category,
          symbolSize: 26,
          itemStyle: { color: isDark.value ? '#A78BFA' : '#7c3aed' }
        })),
        links: graphLinks.value,
        categories: categories.value,
        lineStyle: { color: 'source', curveness: 0.3, width: 1.8 },
        force: { repulsion: 500, edgeLength: 120 },
        label: { show: true, position: 'bottom', fontSize: 10, color: isDark.value ? '#ddd' : '#333' },
        emphasis: { focus: 'adjacency' }
      }]
    };
    chartInstance.value.setOption(option);
    chartInstance.value.on('click', { seriesIndex: 0 }, (params) => {
      if (params.dataType === 'node') {
        const nodeId = params.data.id;
        if (nodeId && contentMap[nodeId]) {
          selectedId.value = nodeId;
          const targetElement = document.getElementById('content-' + nodeId);
          if (targetElement) targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  };

  const zoomIn = () => { if (chartInstance.value) { const opt = chartInstance.value.getOption(); opt.series[0].zoom = (opt.series[0].zoom || 1) * 1.2; chartInstance.value.setOption(opt); } };
  const zoomOut = () => { if (chartInstance.value) { const opt = chartInstance.value.getOption(); opt.series[0].zoom = (opt.series[0].zoom || 1) * 0.8; chartInstance.value.setOption(opt); } };
  const fitToView = () => { if (chartInstance.value) chartInstance.value.dispatchAction({ type: 'restore' }); };

  // 滚动监听
  const contentAreaRef = ref(null);
  let scrollHandler = null;
  const updateActiveOnScroll = () => {
    if (!contentAreaRef.value) return;
    const blocks = contentAreaRef.value.querySelectorAll('.content-block');
    let bestBlock = null;
    let maxVisible = 0;
    const areaRect = contentAreaRef.value.getBoundingClientRect();
    blocks.forEach(block => {
      const rect = block.getBoundingClientRect();
      const visibleTop = Math.max(rect.top, areaRect.top);
      const visibleBottom = Math.min(rect.bottom, areaRect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      if (visibleHeight > maxVisible) {
        maxVisible = visibleHeight;
        bestBlock = block;
      }
    });
    if (bestBlock) {
      const id = bestBlock.id.replace('content-', '');
      if (id !== selectedId.value) selectedId.value = id;
    }
  };

  onMounted(() => {
    // 模拟用户登录
    const token = localStorage.getItem('authToken');
    if (!token) {
      userInfo.value = { username: '测试用户', email: 'test@example.com' };
    } else {
      try {
        userInfo.value = JSON.parse(localStorage.getItem('user_info'));
      } catch (e) {}
    }

    document.addEventListener('click', handleClickOutside);
    timer = setInterval(updateTime, 1000);
    nextTick(() => {
      initChart();
      // 初始化滚动监听
      if (contentAreaRef.value) {
        scrollHandler = updateActiveOnScroll;
        contentAreaRef.value.addEventListener('scroll', scrollHandler);
        // 初始触发一次
        updateActiveOnScroll();
      }
      // 如果URL有hash，滚动到对应位置（例如从外部链接进入）
      if (window.location.hash) {
        const id = window.location.hash.substring(1); // 去掉 '#'
        const target = document.getElementById(id);
        if (target) {
          setTimeout(() => {
            target.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      } else {
        // 默认滚动到 doctype
        const defaultTarget = document.getElementById('content-doctype');
        if (defaultTarget) {
          defaultTarget.scrollIntoView();
        }
      }
    });

    window.addEventListener('resize', () => chartInstance.value?.resize());
  });

  onBeforeUnmount(() => {
    if (timer) clearInterval(timer);
    document.removeEventListener('click', handleClickOutside);
    if (contentAreaRef.value && scrollHandler) contentAreaRef.value.removeEventListener('scroll', scrollHandler);
    if (chartInstance.value) chartInstance.value.dispose();
  });
</script>



<style scoped>
  /* ===== 全局设计令牌（保留原样式，适配CSS知识库） ===== */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .app-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background-color: #FAF5FF;
    transition: background-color 0.3s, color 0.3s;
  }

  .app-container.dark {
    background-color: #1e1e2f;
    color: #e0e0e0;
  }

  /* 顶栏样式 */
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

  .app-container.dark .header {
    background-color: #2c2c3a;
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

  .app-container.dark .dropdown-menu {
    background-color: #2c2c3a;
    color: #e0e0e0;
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

  .app-container.dark .dropdown-item {
    color: #e0e0e0;
  }
  .app-container.dark .dropdown-item:hover {
    background-color: #3a3a4a;
    color: #8B5CF6;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* 主内容区域（三栏布局） */
  .main-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  /* 左侧导航 */
  .sidebar {
    width: 300px;
    background: rgba(255,255,255,0.7);
    backdrop-filter: blur(12px);
    border-right: 1px solid rgba(0, 40, 80, 0.1);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 4px 0 20px rgba(0,20,40,0.05);
    transition: background-color 0.3s;
  }

  .app-container.dark .sidebar {
    background: rgba(44,44,58,0.7);
    border-right-color: rgba(255,255,255,0.1);
  }

  .sidebar-header {
    padding: 24px 20px 16px;
    position: relative;
  }

  .sidebar-header h2 {
    margin: 0 0 4px;
    font-size: 1.8rem;
    font-weight: 650;
    letter-spacing: -0.01em;
  }

  .gradient-text {
    background: linear-gradient(135deg, #1a3650, #2b6c9e);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .app-container.dark .gradient-text {
    background: linear-gradient(135deg, #a0c4e5, #8B5CF6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .header-decoration {
    height: 4px;
    width: 60px;
    background: linear-gradient(90deg, #007acc, #a0c4e5);
    border-radius: 4px;
    margin-top: 12px;
  }

  .nav-sections {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0 16px;
    scrollbar-width: thin;
  }

  .nav-section {
    margin-bottom: 16px;
  }

  .section-title {
    padding: 0 20px;
    margin: 0 0 6px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #2c5779;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .app-container.dark .section-title {
    color: #b0b0c0;
  }

  .section-count {
    background: rgba(0,122,204,0.1);
    color: #007acc;
    border-radius: 20px;
    padding: 2px 8px;
    font-size: 0.7rem;
    font-weight: 600;
  }

  .app-container.dark .section-count {
    background: rgba(139,92,246,0.2);
    color: #8B5CF6;
  }

  .nav-item {
    display: block;
    padding: 8px 20px 8px 36px;
    font-size: 0.94rem;
    cursor: pointer;
    color: #1e2a3a;
    border-left: 3px solid transparent;
    transition: all 0.2s ease;
    text-decoration: none;
    position: relative;
  }

  .app-container.dark .nav-item {
    color: #e0e0e0;
  }

  .nav-item:hover {
    background: rgba(0,122,204,0.06);
    border-left-color: #80b5dc;
  }

  .app-container.dark .nav-item:hover {
    background: rgba(139,92,246,0.15);
    border-left-color: #8B5CF6;
  }

  .nav-item.active {
    background: linear-gradient(90deg, rgba(0,122,204,0.12) 0%, rgba(255,255,255,0) 90%);
    border-left-color: #007acc;
    font-weight: 550;
    color: #00548b;
  }

  .app-container.dark .nav-item.active {
    background: linear-gradient(90deg, rgba(139,92,246,0.2) 0%, transparent 90%);
    border-left-color: #8B5CF6;
    color: #c0a0ff;
  }

  .item-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    background: #8faec9;
    border-radius: 50%;
    margin-right: 8px;
    transition: all 0.2s;
  }

  .app-container.dark .item-dot {
    background: #a0a0c0;
  }

  .nav-item.active .item-dot {
    background: #007acc;
    transform: scale(1.4);
    box-shadow: 0 0 0 2px rgba(0,122,204,0.2);
  }

  .app-container.dark .nav-item.active .item-dot {
    background: #8B5CF6;
    box-shadow: 0 0 0 2px rgba(139,92,246,0.4);
  }

  .hot-badge {
    background: #ff984f;
    color: white;
    font-size: 0.6rem;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 30px;
    margin-left: auto;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    float: right;
  }

  .sidebar-footer {
    padding: 16px 20px;
    border-top: 1px solid rgba(0,40,80,0.1);
    font-size: 0.75rem;
    color: #556c80;
    display: flex;
    justify-content: space-between;
    background: rgba(255,255,255,0.4);
  }

  .app-container.dark .sidebar-footer {
    border-top-color: rgba(255,255,255,0.1);
    color: #aaa;
    background: rgba(58,58,74,0.4);
  }

  /* 中间内容区（连续文档） */
  .content-area {
    flex: 1;
    overflow-y: auto;
    padding: 28px 36px;
    background: #ffffff;
    scroll-behavior: smooth;
  }

  .continuous-content {
    max-width: 1000px;
    margin: 0 auto;
  }

  .content-block {
    margin-bottom: 40px;
    scroll-margin-top: 20px;
    padding: 0 20px;
  }

  .content-block:not(:last-child) {
    border-bottom: 1px solid rgba(0, 40, 80, 0.1);
    padding-bottom: 40px;
  }

  .app-container.dark .content-block:not(:last-child) {
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }

  .app-container.dark .content-area {
    background: #1e1e2f;
  }

  .content-card {
    background: transparent;
    backdrop-filter: none;
    border-radius: 0;
    box-shadow: none;
    border: none;
    padding: 0;
  }

  .content-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    border-bottom: 2px solid rgba(0, 122, 204, 0.2);
    padding-bottom: 12px;
  }

  .app-container.dark .content-header {
    border-bottom-color: rgba(139, 92, 246, 0.3);
  }

  .content-title {
    margin: 0;
    font-size: 2.2rem;
    font-weight: 600;
    background: linear-gradient(145deg, #162b3a, #1f4970);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.02em;
  }

  .app-container.dark .content-title {
    background: linear-gradient(145deg, #e0e0e0, #b0b0ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .content-body {
    line-height: 1.7;
    font-size: 1.02rem;
    color: #1e2f3c;
  }

  .app-container.dark .content-body {
    color: #d0d0e0;
  }

  .content-body h3 {
    margin: 32px 0 16px;
    font-size: 1.5rem;
    font-weight: 550;
    color: #1e3a5f;
  }

  .app-container.dark .content-body h3 {
    color: #b0b0ff;
  }

  .content-body code {
    background: #e7edf4;
    padding: 2px 8px;
    border-radius: 20px;
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 0.9em;
    color: #c4125e;
    border: 1px solid #d5dee7;
  }

  .app-container.dark .content-body code {
    background: #3a3a4a;
    color: #ffa0a0;
    border-color: #5a5a6a;
  }

  .content-body pre {
    background: #1e2a3a;
    color: #e3eaf0;
    border-radius: 18px;
    padding: 20px;
    overflow-x: auto;
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 0.9rem;
    line-height: 1.6;
    margin: 28px 0;
    box-shadow: inset 0 0 0 1px #33475b, 0 8px 16px -8px #00000030;
  }

  .content-body pre code {
    background: transparent;
    padding: 0;
    color: #c9dff2;
    border: none;
  }

  .lead {
    font-size: 1.25rem;
    font-weight: 380;
    color: #2a4359;
    border-left: 5px solid #007acc;
    padding-left: 24px;
    margin: 0 0 28px;
    background: linear-gradient(90deg, #e3f0fc, transparent);
  }

  .app-container.dark .lead {
    color: #c0d0e0;
    border-left-color: #8B5CF6;
    background: linear-gradient(90deg, rgba(139,92,246,0.2), transparent);
  }

  .note {
    background: #eef6ff;
    border-left: 5px solid #007acc;
    padding: 18px 24px;
    margin: 30px 0;
    border-radius: 0 24px 24px 0;
    box-shadow: 0 4px 10px -6px #a0b8d0;
  }

  .app-container.dark .note {
    background: #3a3a4a;
    border-left-color: #8B5CF6;
  }

  .content-footer {
    margin-top: 32px;
    padding-top: 20px;
    border-top: 1px dashed #cbd6e3;
  }

  .app-container.dark .content-footer {
    border-top-color: #5a5a6a;
  }

  .tag-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #2b4f6e;
    margin-right: 12px;
  }

  .app-container.dark .tag-label {
    color: #b0b0ff;
  }

  .tag-list {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 8px;
  }

  .tag {
    background: #eef3f9;
    padding: 4px 14px;
    border-radius: 30px;
    font-size: 0.8rem;
    color: #1c4970;
    border: 1px solid #d0e0f0;
  }

  .app-container.dark .tag {
    background: #3a3a4a;
    color: #d0d0e0;
    border-color: #5a5a6a;
  }

  .content-card.placeholder {
    text-align: center;
    color: #7f8fa4;
    padding: 60px;
  }

  /* 右侧图谱 */
  .graph-panel {
    width: 340px;
    background: rgba(255,255,255,0.5);
    backdrop-filter: blur(8px);
    border-left: 1px solid rgba(0,40,80,0.15);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: -4px 0 20px rgba(0,20,40,0.03);
    transition: background-color 0.3s;
  }

  .app-container.dark .graph-panel {
    background: rgba(44,44,58,0.5);
    border-left-color: rgba(255,255,255,0.1);
  }

  .graph-header {
    padding: 24px 18px 12px;
    border-bottom: 1px solid rgba(0,40,80,0.1);
  }

  .app-container.dark .graph-header {
    border-bottom-color: rgba(255,255,255,0.1);
  }

  .graph-header h3 {
    margin: 0 0 4px;
    font-size: 1.2rem;
    font-weight: 650;
    color: #1a3b55;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .app-container.dark .graph-header h3 {
    color: #e0e0e0;
  }

  .graph-badge {
    background: #1f4a74;
    color: white;
    font-size: 0.6rem;
    padding: 2px 8px;
    border-radius: 40px;
    font-weight: 500;
  }

  .app-container.dark .graph-badge {
    background: #8B5CF6;
  }

  .graph-hint {
    margin: 0;
    font-size: 0.75rem;
    color: #4b6a88;
  }

  .app-container.dark .graph-hint {
    color: #aaa;
  }

  .chart-container {
    flex: 1;
    width: 100%;
    min-height: 240px;
    background: #fafdff;
    border-radius: 0;
  }

  .app-container.dark .chart-container {
    background: #2c2c3a;
  }

  .graph-footer {
    padding: 14px 16px;
    border-top: 1px solid rgba(0,40,80,0.1);
    font-size: 0.75rem;
    color: #3b5a78;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(255,255,255,0.5);
  }

  .app-container.dark .graph-footer {
    border-top-color: rgba(255,255,255,0.1);
    color: #aaa;
    background: rgba(58,58,74,0.5);
  }

  .graph-controls {
    display: flex;
    gap: 4px;
  }

  .control-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    background: #8B5CF6;
    color: white;
    font-size: 12px;
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
  </style>

  <style>
  @import '../fontawesome-free-6.4.0-web/fontawesome-free-6.4.0-web/css/all.min.css';
  .mdn-table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    border: 1px solid rgba(0,40,80,0.1);
  }
  .mdn-table th {
    background: rgba(139, 92, 246, 0.1);
    font-weight: 600;
    text-align: left;
    padding: 10px 12px;
  }
  .mdn-table td {
    padding: 10px 12px;
    border-top: 1px solid rgba(0,40,80,0.05);
  }
  .deprecated {
    color: #d32f2f;
    background: rgba(211, 47, 47, 0.05);
    border-radius: 4px;
    padding: 2px 6px;
  }
</style>