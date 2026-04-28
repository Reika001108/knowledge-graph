<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（保持不变） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">HTML知识库</h1>
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
      <!-- 左侧导航（改为锚点链接） -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>📘 <span class="gradient-text">HTML 文档</span></h2>
          <div class="header-decoration"></div>
        </div>
 
        <!-- <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" placeholder="快速过滤..." disabled />
        </div> -->

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
          <p>🔖 基于 MDN 2025-02 归档</p>
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

      <!-- 右侧图谱（保持不变） -->
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

// ---------- 用户及主题相关（保持不变）----------
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

// ========== 导航数据（同原代码）==========
const navSections = ref([
  { title: '📄 文档基础', items: [
      { id: 'doctype', label: 'HTML文档结构' },
      { id: 'html', label: 'html 根标签' },
      { id: 'head', label: 'head 文档头' },
      { id: 'meta', label: 'meta 元数据' },
      { id: 'title', label: 'title 标题' },
      { id: 'link', label: 'link 资源链接' },
      { id: 'script', label: 'script 脚本' },
      { id: 'body', label: 'body 主体' },
    ]},
  { title: '📝 核心概念', items: [
      { id: 'basicConcepts', label: '注释、标签、元素与属性' },
    ]},
  { title: '🔤 文本标签', items: [
      { id: 'h1', label: 'h1~h6 标题' },
      { id: 'p', label: 'p 段落' },
      { id: 'entities', label: '实体字符' },
    ]},
  { title: '🖼️ 多媒体与链接', items: [
      { id: 'img', label: 'img 图片' },
      { id: 'path', label: '相对/绝对路径' },
      { id: 'a', label: 'a 超链接' },
    ]},
  { title: '📋 列表', items: [
      { id: 'ul', label: 'ul 无序列表' },
      { id: 'ol', label: 'ol 有序列表' },
      { id: 'dl', label: 'dl 自定义列表' },
    ]},
  { title: '📊 表格', items: [
      { id: 'table', label: 'table 表格' },
    ]},
  { title: '📝 表单', items: [
      { id: 'form', label: 'form 表单' },
      { id: 'input', label: 'input 控件' },
    ]},
]);

const selectedId = ref('doctype'); // 当前激活的知识点

// 扁平化所有知识点，用于循环渲染连续文档
const allFlatItems = computed(() => {
  const flat = [];
  navSections.value.forEach(section => {
    section.items.forEach(item => {
      flat.push(item);
    });
  });
  return flat;
});

// ========== 内容映射表（包含详细文档，与原代码相同，已补全默认内容）==========
// 根据知乎文章重构的 contentMap
// ========== 增强版 contentMap（覆盖所有导航项）==========
const contentMap = {
  // ----- 文档基础 -----
  doctype: {
    title: '<!DOCTYPE>: 文档类型声明',
    body: `
      <p class="lead"><strong>&lt;!DOCTYPE&gt;</strong> 声明不是HTML标签；它是一条指令，告诉浏览器使用哪种HTML版本渲染页面。它必须位于文档的第一行。</p>
      <h3>HTML5声明</h3>
      <pre><code>&lt;!DOCTYPE html&gt;</code></pre>
      <h3>为什么重要？</h3>
      <p>DOCTYPE决定了浏览器的渲染模式：</p>
      <ul>
        <li><strong>标准模式</strong>：使用<code>&lt;!DOCTYPE html&gt;</code>，浏览器按照现代标准渲染，布局正确。</li>
        <li><strong>怪异模式</strong>：缺少DOCTYPE或使用过时的DOCTYPE，浏览器模拟旧式行为，可能导致布局错乱。</li>
      </ul>
      <div class="note">💡 最佳实践：所有HTML文档第一行都使用 <code>&lt;!DOCTYPE html&gt;</code>。</div>
    `,
    tags: ['文档', '声明', '标准模式']
  },
  html: {
    title: '<html>: HTML文档根元素',
    body: `
      <p class="lead">&lt;html&gt; 元素代表一个HTML文档的根（顶级元素），所有其他元素必须是它的后代。</p>
      <h3>基本结构</h3>
      <pre><code>&lt;!DOCTYPE html&gt;
&lt;html lang="zh-CN"&gt;
  &lt;head&gt;
    &lt;meta charset="UTF-8"&gt;
    &lt;title&gt;页面标题&lt;/title&gt;
  &lt;/head&gt;
  &lt;body&gt;
    ...
  &lt;/body&gt;
&lt;/html&gt;</code></pre>
      <h3>重要属性</h3>
      <ul>
        <li><code>lang</code>：指定文档语言，如 <code>lang="zh-CN"</code>。对屏幕阅读器和搜索引擎很重要。</li>
        <li><code>manifest</code>（已弃用）：指定应用缓存，现在用Service Workers替代。</li>
      </ul>
    `,
    tags: ['根元素', '文档结构']
  },
  head: {
    title: '<head>: 文档元数据容器',
    body: `
      <p class="lead">&lt;head&gt; 元素包含机器可读的文档元数据（如标题、脚本、样式表），这些内容不会直接显示在页面上。</p>
      <h3>可以包含的元素</h3>
      <ul>
        <li><code>&lt;title&gt;</code>：必需的标题</li>
        <li><code>&lt;base&gt;</code>：基准URL</li>
        <li><code>&lt;link&gt;</code>：外部资源链接（CSS、图标等）</li>
        <li><code>&lt;style&gt;</code>：内嵌样式</li>
        <li><code>&lt;meta&gt;</code>：元数据（字符集、视口、描述等）</li>
        <li><code>&lt;script&gt;</code>：脚本</li>
        <li><code>&lt;noscript&gt;</code>：无脚本时的替代内容</li>
      </ul>
      <pre><code>&lt;head&gt;
  &lt;meta charset="UTF-8"&gt;
  &lt;title&gt;我的网站&lt;/title&gt;
  &lt;link rel="stylesheet" href="style.css"&gt;
&lt;/head&gt;</code></pre>
    `,
    tags: ['元数据', '头部']
  },
  body: {
    title: '<body>: 文档主体',
    body: `
      <p class="lead">&lt;body&gt; 元素包含所有用户可见的页面内容（文本、图像、视频、音频等）。一个文档只能有一个&lt;body&gt;。</p>
      <h3>事件处理属性</h3>
      <p>body元素支持许多事件，如 <code>onload</code>（页面加载完成时触发）。</p>
      <pre><code>&lt;body onload="console.log('页面已加载')"&gt;</code></pre>
      <h3>已弃用的属性</h3>
      <p>以下属性在HTML5中已弃用，应使用CSS替代：<code>bgcolor</code>、<code>background</code>、<code>text</code>、<code>link</code> 等。</p>
    `,
    tags: ['主体', '内容']
  },
  title: {
    title: '<title>: 文档标题',
    body: `
      <p class="lead">&lt;title&gt; 元素定义浏览器工具栏中的标题、页面收藏时的标题以及搜索引擎结果中的标题。</p>
      <pre><code>&lt;title&gt;我的网站 - 首页&lt;/title&gt;</code></pre>
      <h3>SEO 重要性</h3>
      <p>标题是SEO的重要部分，应简洁、准确且包含关键词，一般不超过60个字符。</p>
    `,
    tags: ['标题', 'SEO']
  },
  meta: {
    title: '<meta>: 元数据',
    body: `
      <p class="lead">&lt;meta&gt; 元素表示那些不能由其他HTML元相关元素表示的元数据，如字符集、描述、关键词、作者等。</p>
      <h3>常用属性</h3>
      <ul>
        <li><code>charset</code>：声明字符编码，如 <code>&lt;meta charset="UTF-8"&gt;</code></li>
        <li><code>name</code>：元数据名称，如 <code>description</code>、<code>keywords</code>、<code>author</code>、<code>viewport</code></li>
        <li><code>content</code>：元数据的值</li>
        <li><code>http-equiv</code>：编译指令，如刷新、缓存控制等</li>
      </ul>
      <h3>示例</h3>
      <pre><code>&lt;meta name="description" content="免费Web开发教程"&gt;
&lt;meta name="viewport" content="width=device-width, initial-scale=1.0"&gt;</code></pre>
    `,
    tags: ['元数据', 'SEO', '视口']
  },
  link: {
    title: '<link>: 外部资源链接',
    body: `
      <p class="lead">&lt;link&gt; 元素指定当前文档与外部资源的关系，最常用于链接样式表。</p>
      <h3>常用属性</h3>
      <ul>
        <li><code>rel</code>：关系，如 <code>stylesheet</code>、<code>icon</code>、<code>preconnect</code>、<code>preload</code></li>
        <li><code>href</code>：资源URL</li>
        <li><code>type</code>：资源MIME类型，如 <code>text/css</code></li>
        <li><code>media</code>：媒体查询，指定资源适用的设备</li>
      </ul>
      <pre><code>&lt;link rel="stylesheet" href="style.css"&gt;
&lt;link rel="icon" href="favicon.ico"&gt;</code></pre>
    `,
    tags: ['资源', '样式', '预加载']
  },
  base: {
    title: '<base>: 基准URL',
    body: `
      <p class="lead">&lt;base&gt; 元素指定文档中所有相对URL的基准URL。一个文档中只能有一个&lt;base&gt;元素。</p>
      <pre><code>&lt;head&gt;
  &lt;base href="https://example.com/" target="_blank"&gt;
&lt;/head&gt;</code></pre>
      <p>此后所有相对链接（如 <code>&lt;a href="page.html"&gt;</code>）都会解析为 <code>https://example.com/page.html</code>。</p>
    `,
    tags: ['URL', '基准']
  },

  // ----- 文本语义 -----
  h1: {
    title: '&lt;h1&gt;~&lt;h6&gt;: 标题元素',
    body: `
      <p class="lead">标题元素用于定义章节标题，<code>&lt;h1&gt;</code> 级别最高，<code>&lt;h6&gt;</code> 最低。</p>
      <h3>语义</h3>
      <p>标题不仅仅是大号加粗的文本，它们为文档提供结构大纲，对SEO和屏幕阅读器非常重要。建议按层级使用，不要跳级。</p>
      <pre><code>&lt;h1&gt;主标题&lt;/h1&gt;
&lt;h2&gt;副标题&lt;/h2&gt;
&lt;h3&gt;子章节&lt;/h3&gt;</code></pre>
    `,
    tags: ['标题', '结构']
  },
  p: {
    title: '<p>: 段落',
    body: `
      <p class="lead">&lt;p&gt; 元素表示文本的一个段落。段落之间默认有外边距。</p>
      <pre><code>&lt;p&gt;这是一个段落。段落标签会自动在其前后创建一些空白。&lt;/p&gt;</code></pre>
    `,
    tags: ['文本', '段落']
  },
  br: {
    title: '<br>: 换行',
    body: `
      <p class="lead">&lt;br&gt; 元素在文本中产生一个换行（回车）。它是一个空元素。</p>
      <pre><code>&lt;p&gt;第一行&lt;br&gt;第二行&lt;/p&gt;</code></pre>
      <p>注意：不要用 <code>&lt;br&gt;</code> 创建段落间距，应使用CSS的 <code>margin</code> 或 <code>&lt;p&gt;</code> 元素。</p>
    `,
    tags: ['换行', '文本']
  },
  hr: {
    title: '<hr>: 水平分割线',
    body: `
      <p class="lead">&lt;hr&gt; 元素表示段落级主题的分割，通常显示为一条水平线。</p>
      <pre><code>&lt;p&gt;第一节内容&lt;/p&gt;
&lt;hr&gt;
&lt;p&gt;第二节内容&lt;/p&gt;</code></pre>
    `,
    tags: ['分割线', '主题分割']
  },
  strong: {
    title: '<strong>: 重要文本',
    body: `
      <p class="lead">&lt;strong&gt; 元素表示内容的重要性，通常显示为粗体。它比 <code>&lt;b&gt;</code> 更具语义。</p>
      <pre><code>&lt;p&gt;请 &lt;strong&gt;务必&lt;/strong&gt;在截止日期前提交。&lt;/p&gt;</code></pre>
    `,
    tags: ['强调', '重要']
  },
  em: {
    title: '<em>: 强调文本',
    body: `
      <p class="lead">&lt;em&gt; 元素表示强调的文本，通常显示为斜体。它比 <code>&lt;i&gt;</code> 更具语义。</p>
      <pre><code>&lt;p&gt;我们 &lt;em&gt;必须&lt;/em&gt;完成这个任务。&lt;/p&gt;</code></pre>
    `,
    tags: ['强调', '斜体']
  },
  mark: {
    title: '<mark>: 标记文本',
    body: `
      <p class="lead">&lt;mark&gt; 元素表示因与上下文相关而高亮显示的文本，比如搜索结果中的关键词。</p>
      <pre><code>&lt;p&gt;找到 &lt;mark&gt;HTML&lt;/mark&gt; 相关结果。&lt;/p&gt;</code></pre>
    `,
    tags: ['高亮', '标记']
  },
  small: {
    title: '<small>: 旁注',
    body: `
      <p class="lead">&lt;small&gt; 元素表示旁注小字，例如版权声明、法律文本等。</p>
      <pre><code>&lt;p&gt;&lt;small&gt;© 2025 公司名称&lt;/small&gt;&lt;/p&gt;</code></pre>
    `,
    tags: ['小字', '版权']
  },
  del: {
    title: '<del>: 删除文本',
    body: `
      <p class="lead">&lt;del&gt; 元素表示被删除的文本，通常显示为删除线。</p>
      <pre><code>&lt;p&gt;原价 &lt;del&gt;￥100&lt;/del&gt; 现价 ￥80&lt;/p&gt;</code></pre>
    `,
    tags: ['删除', '修订']
  },
  ins: {
    title: '<ins>: 插入文本',
    body: `
      <p class="lead">&lt;ins&gt; 元素表示被插入的文本，通常显示为下划线。</p>
      <pre><code>&lt;p&gt;本次活动 &lt;ins&gt;新增&lt;/ins&gt;抽奖环节。&lt;/p&gt;</code></pre>
    `,
    tags: ['插入', '修订']
  },
  sup: {
    title: '<sup>: 上标',
    body: `
      <p class="lead">&lt;sup&gt; 元素表示上标，例如数学指数、脚注标记。</p>
      <pre><code>&lt;p&gt;E = mc&lt;sup&gt;2&lt;/sup&gt;&lt;/p&gt;</code></pre>
    `,
    tags: ['上标', '指数']
  },
  sub: {
    title: '<sub>: 下标',
    body: `
      <p class="lead">&lt;sub&gt; 元素表示下标，例如化学分子式。</p>
      <pre><code>&lt;p&gt;H&lt;sub&gt;2&lt;/sub&gt;O&lt;/p&gt;</code></pre>
    `,
    tags: ['下标', '化学式']
  },
  span: {
    title: '<span>: 通用行内容器',
    body: `
      <p class="lead">&lt;span&gt; 是一个通用的行内容器，本身没有语义。通常与CSS结合用于对行内元素进行样式化。</p>
      <pre><code>&lt;p&gt;这是一段 &lt;span style="color: red;"&gt;红色文字&lt;/span&gt;。&lt;/p&gt;</code></pre>
    `,
    tags: ['行内', '样式']
  },

  // ----- 链接与导航 -----
  a: {
    title: '<a>: 超链接',
    body: `
      <p class="lead">&lt;a&gt; 元素通过 href 属性创建指向其他网页、文件、同一页面位置等的超链接。</p>
      <h3>常用属性</h3>
      <ul>
        <li><code>href</code>：链接目标URL。</li>
        <li><code>target</code>：指定在何处显示链接资源，如 <code>_blank</code>（新窗口）。</li>
        <li><code>rel</code>：指定当前文档与链接资源的关系，如 <code>nofollow</code>、<code>noopener</code>。</li>
        <li><code>download</code>：指示浏览器下载URL而不是导航到它。</li>
      </ul>
      <pre><code>&lt;a href="https://example.com" target="_blank" rel="noopener"&gt;访问示例&lt;/a&gt;
&lt;a href="#section2"&gt;跳转到第二节&lt;/a&gt;
&lt;a href="mailto:someone@example.com"&gt;发送邮件&lt;/a&gt;</code></pre>
    `,
    tags: ['链接', '导航']
  },
  nav: {
    title: '<nav>: 导航区',
    body: `
      <p class="lead">&lt;nav&gt; 元素表示页面中提供导航链接的区域，例如菜单、目录。</p>
      <pre><code>&lt;nav&gt;
  &lt;ul&gt;
    &lt;li&gt;&lt;a href="/"&gt;首页&lt;/a&gt;&lt;/li&gt;
    &lt;li&gt;&lt;a href="/about"&gt;关于&lt;/a&gt;&lt;/li&gt;
  &lt;/ul&gt;
&lt;/nav&gt;</code></pre>
    `,
    tags: ['导航', '菜单']
  },
  menu: {
    title: '<menu>: 菜单',
    body: `
      <p class="lead">&lt;menu&gt; 元素表示一组命令，通常用于工具栏或上下文菜单。它与 <code>&lt;ul&gt;</code> 类似，但更具语义。</p>
      <pre><code>&lt;menu&gt;
  &lt;li&gt;&lt;button onclick="copy()"&gt;复制&lt;/button&gt;&lt;/li&gt;
  &lt;li&gt;&lt;button onclick="paste()"&gt;粘贴&lt;/button&gt;&lt;/li&gt;
&lt;/menu&gt;</code></pre>
    `,
    tags: ['菜单', '工具栏']
  },

  // ----- 列表 -----
  ul: {
    title: '<ul>: 无序列表',
    body: `
      <p class="lead">&lt;ul&gt; 元素表示无序列表，通常呈现为项目符号列表。列表项使用 <code>&lt;li&gt;</code> 定义。</p>
      <pre><code>&lt;ul&gt;
  &lt;li&gt;苹果&lt;/li&gt;
  &lt;li&gt;香蕉&lt;/li&gt;
&lt;/ul&gt;</code></pre>
    `,
    tags: ['列表', '无序']
  },
  ol: {
    title: '<ol>: 有序列表',
    body: `
      <p class="lead">&lt;ol&gt; 元素表示有序列表，通常呈现为编号列表。列表项使用 <code>&lt;li&gt;</code> 定义。</p>
      <h3>常用属性</h3>
      <ul>
        <li><code>reversed</code>：倒序编号。</li>
        <li><code>start</code>：起始编号，如 <code>start="5"</code>。</li>
        <li><code>type</code>：编号类型，如 <code>1</code>（数字）、<code>A</code>（大写字母）、<code>i</code>（罗马数字）。</li>
      </ul>
      <pre><code>&lt;ol start="3" reversed&gt;
  &lt;li&gt;第三项&lt;/li&gt;
  &lt;li&gt;第二项&lt;/li&gt;
&lt;/ol&gt;</code></pre>
    `,
    tags: ['列表', '有序']
  },
  li: {
    title: '<li>: 列表项',
    body: `
      <p class="lead">&lt;li&gt; 元素表示列表中的项目，它必须包含在 <code>&lt;ul&gt;</code>、<code>&lt;ol&gt;</code> 或 <code>&lt;menu&gt;</code> 中。</p>
      <pre><code>&lt;ul&gt;
  &lt;li&gt;列表项&lt;/li&gt;
&lt;/ul&gt;</code></pre>
    `,
    tags: ['列表项']
  },
  dl: {
    title: '<dl>: 定义列表',
    body: `
      <p class="lead">&lt;dl&gt; 元素表示一个定义列表，包含术语（<code>&lt;dt&gt;</code>）和描述（<code>&lt;dd&gt;</code>）对。</p>
      <pre><code>&lt;dl&gt;
  &lt;dt&gt;HTML&lt;/dt&gt;
  &lt;dd&gt;超文本标记语言&lt;/dd&gt;
  &lt;dt&gt;CSS&lt;/dt&gt;
  &lt;dd&gt;层叠样式表&lt;/dd&gt;
&lt;/dl&gt;</code></pre>
    `,
    tags: ['定义列表', '术语']
  },
  dt: {
    title: '<dt>: 定义术语',
    body: `
      <p class="lead">&lt;dt&gt; 元素在定义列表（<code>&lt;dl&gt;</code>）中表示一个术语或名词。</p>
    `,
    tags: ['术语']
  },
  dd: {
    title: '<dd>: 定义描述',
    body: `
      <p class="lead">&lt;dd&gt; 元素在定义列表（<code>&lt;dl&gt;</code>）中提供术语的描述或解释。</p>
    `,
    tags: ['描述']
  },

  // ----- 表格 -----
  table: {
    title: '<table>: 表格',
    body: `
      <p class="lead">&lt;table&gt; 元素表示表格数据，即按行和列组织的信息。</p>
      <h3>表格结构</h3>
      <ul>
        <li><code>&lt;caption&gt;</code>：表格标题</li>
        <li><code>&lt;thead&gt;</code>：表头</li>
        <li><code>&lt;tbody&gt;</code>：表体</li>
        <li><code>&lt;tfoot&gt;</code>：表尾</li>
        <li><code>&lt;tr&gt;</code>：行</li>
        <li><code>&lt;th&gt;</code>：表头单元格</li>
        <li><code>&lt;td&gt;</code>：数据单元格</li>
      </ul>
      <pre><code>&lt;table border="1"&gt;
  &lt;caption&gt;月度销售&lt;/caption&gt;
  &lt;thead&gt;
    &lt;tr&gt;&lt;th&gt;产品&lt;/th&gt;&lt;th&gt;一月&lt;/th&gt;&lt;th&gt;二月&lt;/th&gt;&lt;/tr&gt;
  &lt;/thead&gt;
  &lt;tbody&gt;
    &lt;tr&gt;&lt;td&gt;A&lt;/td&gt;&lt;td&gt;100&lt;/td&gt;&lt;td&gt;120&lt;/td&gt;&lt;/tr&gt;
  &lt;/tbody&gt;
&lt;/table&gt;</code></pre>
    `,
    tags: ['表格', '数据']
  },
  caption: {
    title: '<caption>: 表格标题',
    body: `
      <p class="lead">&lt;caption&gt; 元素指定表格的标题，它必须作为 <code>&lt;table&gt;</code> 的第一个子元素。</p>
    `,
    tags: ['表格标题']
  },
  thead: {
    title: '<thead>: 表格表头',
    body: `
      <p class="lead">&lt;thead&gt; 元素用于组合表格的列标题行。</p>
    `,
    tags: ['表头']
  },
  tbody: {
    title: '<tbody>: 表格主体',
    body: `
      <p class="lead">&lt;tbody&gt; 元素包含表格的主要数据行。</p>
    `,
    tags: ['表体']
  },
  tfoot: {
    title: '<tfoot>: 表格页脚',
    body: `
      <p class="lead">&lt;tfoot&gt; 元素包含表格的汇总行（如总计）。</p>
    `,
    tags: ['表尾']
  },
  tr: {
    title: '<tr>: 表格行',
    body: `
      <p class="lead">&lt;tr&gt; 元素定义表格中的一行，包含一个或多个 <code>&lt;th&gt;</code> 或 <code>&lt;td&gt;</code> 单元格。</p>
    `,
    tags: ['行']
  },
  th: {
    title: '<th>: 表头单元格',
    body: `
      <p class="lead">&lt;th&gt; 元素定义表头单元格，内容通常加粗居中。可以使用 <code>scope</code> 属性指定关联方向（<code>col</code>、<code>row</code>）。</p>
    `,
    tags: ['表头单元格']
  },
  td: {
    title: '<td>: 数据单元格',
    body: `
      <p class="lead">&lt;td&gt; 元素定义标准数据单元格。</p>
    `,
    tags: ['单元格']
  },
  colgroup: {
    title: '<colgroup>: 列组',
    body: `
      <p class="lead">&lt;colgroup&gt; 元素用于对表格中的列进行分组，以便统一设置样式或属性。</p>
      <pre><code>&lt;colgroup&gt;
  &lt;col style="background-color: #f0f0f0;"&gt;
  &lt;col span="2" style="background-color: #fff0f0;"&gt;
&lt;/colgroup&gt;</code></pre>
    `,
    tags: ['列组']
  },
  col: {
    title: '<col>: 列',
    body: `
      <p class="lead">&lt;col&gt; 元素定义 <code>&lt;colgroup&gt;</code> 中的列，可用于设置列的属性（如样式、宽度）。</p>
    `,
    tags: ['列']
  },

  // ----- 表单 -----
  form: {
    title: '<form>: 表单',
    body: `
      <p class="lead">&lt;form&gt; 元素表示文档中的一个区域，包含交互控件，用于向服务器提交信息。</p>
      <h3>常用属性</h3>
      <ul>
        <li><code>action</code>：提交数据的URL。</li>
        <li><code>method</code>：HTTP方法，<code>get</code> 或 <code>post</code>。</li>
        <li><code>enctype</code>：当 <code>method="post"</code> 时，指定MIME类型，如 <code>multipart/form-data</code>（用于文件上传）。</li>
        <li><code>target</code>：指定在何处显示响应。</li>
      </ul>
      <pre><code>&lt;form action="/login" method="post"&gt;
  &lt;!-- 表单控件 --&gt;
&lt;/form&gt;</code></pre>
    `,
    tags: ['表单', '提交']
  },
  input: {
    title: '<input>: 输入控件',
    body: `
      <p class="lead">&lt;input&gt; 元素是表单中最常用的控件，通过 <code>type</code> 属性呈现多种形态。</p>
      <h3>常用type类型</h3>
      <table class="mdn-table">
        <tr><th>类型</th><th>描述</th></tr>
        <tr><td>text</td><td>普通文本</td></tr>
        <tr><td>password</td><td>密码（掩码）</td></tr>
        <tr><td>radio</td><td>单选按钮</td></tr>
        <tr><td>checkbox</td><td>复选框</td></tr>
        <tr><td>file</td><td>文件上传</td></tr>
        <tr><td>submit</td><td>提交按钮</td></tr>
        <tr><td>reset</td><td>重置按钮</td></tr>
        <tr><td>button</td><td>普通按钮</td></tr>
        <tr><td>email</td><td>电子邮件（移动端优化）</td></tr>
        <tr><td>number</td><td>数字</td></tr>
        <tr><td>date</td><td>日期选择器</td></tr>
      </table>
      <pre><code>&lt;input type="text" name="username" placeholder="请输入用户名"&gt;
&lt;input type="password" name="pwd"&gt;
&lt;input type="radio" name="gender" value="male"&gt; 男</code></pre>
    `,
    tags: ['输入', '表单控件']
  },
  button: {
    title: '<button>: 按钮',
    body: `
      <p class="lead">&lt;button&gt; 元素表示一个可点击的按钮，可以包含富内容（如图片、HTML结构）。</p>
      <h3>类型</h3>
      <ul>
        <li><code>type="submit"</code>：提交表单（默认）。</li>
        <li><code>type="reset"</code>：重置表单。</li>
        <li><code>type="button"</code>：普通按钮，需配合JavaScript。</li>
      </ul>
      <pre><code>&lt;button type="submit"&gt;提交&lt;/button&gt;
&lt;button type="button" onclick="alert('点击')"&gt;点我&lt;/button&gt;</code></pre>
    `,
    tags: ['按钮', '交互']
  },
  select: {
    title: '<select>: 下拉列表',
    body: `
      <p class="lead">&lt;select&gt; 元素创建下拉菜单，配合 <code>&lt;option&gt;</code> 定义选项。</p>
      <pre><code>&lt;select name="city"&gt;
  &lt;option value="beijing"&gt;北京&lt;/option&gt;
  &lt;option value="shanghai"&gt;上海&lt;/option&gt;
&lt;/select&gt;</code></pre>
    `,
    tags: ['下拉', '选择']
  },
  option: {
    title: '<option>: 选项',
    body: `
      <p class="lead">&lt;option&gt; 元素定义 <code>&lt;select&gt;</code> 或 <code>&lt;datalist&gt;</code> 中的一个选项。</p>
      <pre><code>&lt;option value="cn" selected&gt;中国&lt;/option&gt;</code></pre>
    `,
    tags: ['选项']
  },
  optgroup: {
    title: '<optgroup>: 选项组',
    body: `
      <p class="lead">&lt;optgroup&gt; 元素用于对 <code>&lt;select&gt;</code> 中的选项进行分组。</p>
      <pre><code>&lt;select&gt;
  &lt;optgroup label="欧洲"&gt;
    &lt;option&gt;法国&lt;/option&gt;
    &lt;option&gt;德国&lt;/option&gt;
  &lt;/optgroup&gt;
&lt;/select&gt;</code></pre>
    `,
    tags: ['选项组']
  },
  textarea: {
    title: '<textarea>: 多行文本域',
    body: `
      <p class="lead">&lt;textarea&gt; 元素创建一个多行文本输入区域。</p>
      <pre><code>&lt;textarea name="bio" rows="4" cols="50"&gt;默认内容&lt;/textarea&gt;</code></pre>
    `,
    tags: ['多行', '文本域']
  },
  label: {
    title: '<label>: 标签',
    body: `
      <p class="lead">&lt;label&gt; 元素为表单控件定义标签，提升可用性和可访问性（点击标签聚焦关联控件）。</p>
      <pre><code>&lt;label for="username"&gt;用户名：&lt;/label&gt;
&lt;input type="text" id="username" name="username"&gt;</code></pre>
    `,
    tags: ['标签', '可访问性']
  },
  fieldset: {
    title: '<fieldset>: 字段集',
    body: `
      <p class="lead">&lt;fieldset&gt; 元素用于对表单中的相关控件进行分组，通常与 <code>&lt;legend&gt;</code> 一起使用。</p>
      <pre><code>&lt;fieldset&gt;
  &lt;legend&gt;个人信息&lt;/legend&gt;
  &lt;!-- 表单控件 --&gt;
&lt;/fieldset&gt;</code></pre>
    `,
    tags: ['分组', '字段集']
  },
  legend: {
    title: '<legend>: 字段集标题',
    body: `
      <p class="lead">&lt;legend&gt; 元素为 <code>&lt;fieldset&gt;</code> 定义标题。</p>
    `,
    tags: ['标题']
  },
  datalist: {
    title: '<datalist>: 数据列表',
    body: `
      <p class="lead">&lt;datalist&gt; 元素包含一组 <code>&lt;option&gt;</code>，用于为 <code>&lt;input&gt;</code> 提供自动补全建议。</p>
      <pre><code>&lt;input list="browsers" name="browser"&gt;
&lt;datalist id="browsers"&gt;
  &lt;option value="Chrome"&gt;
  &lt;option value="Firefox"&gt;
&lt;/datalist&gt;</code></pre>
    `,
    tags: ['数据列表', '自动补全']
  },
  output: {
    title: '<output>: 输出',
    body: `
      <p class="lead">&lt;output&gt; 元素表示计算或用户操作的结果，例如表单计算器。</p>
      <pre><code>&lt;form oninput="result.value=parseInt(a.value)+parseInt(b.value)"&gt;
  &lt;input type="number" id="a" name="a" value="0"&gt; +
  &lt;input type="number" id="b" name="b" value="0"&gt; =
  &lt;output name="result" for="a b"&gt;0&lt;/output&gt;
&lt;/form&gt;</code></pre>
    `,
    tags: ['输出', '结果']
  },
  progress: {
    title: '<progress>: 进度条',
    body: `
      <p class="lead">&lt;progress&gt; 元素显示任务的完成进度，通常用于文件上传、下载等。</p>
      <pre><code>&lt;progress value="70" max="100"&gt;70%&lt;/progress&gt;</code></pre>
    `,
    tags: ['进度条']
  },
  meter: {
    title: '<meter>: 度量',
    body: `
      <p class="lead">&lt;meter&gt; 元素表示已知范围内的标量测量值，如磁盘使用量、投票比例等。</p>
      <pre><code>&lt;meter value="0.6" min="0" max="1" low="0.2" high="0.8" optimum="0.5"&gt;60%&lt;/meter&gt;</code></pre>
    `,
    tags: ['度量', '比例']
  },

  // ----- 多媒体与嵌入 -----
  img: {
    title: '<img>: 图像',
    body: `
      <p class="lead">&lt;img&gt; 元素在文档中嵌入图像。它是一个空元素。</p>
      <h3>必需属性</h3>
      <ul>
        <li><code>src</code>：图像路径。</li>
        <li><code>alt</code>：替代文本（图像无法显示时显示，也对无障碍重要）。</li>
      </ul>
      <pre><code>&lt;img src="logo.png" alt="公司Logo" width="200" height="100"&gt;</code></pre>
    `,
    tags: ['图像', '多媒体']
  },
  audio: {
    title: '<audio>: 音频',
    body: `
      <p class="lead">&lt;audio&gt; 元素用于在文档中嵌入音频内容。</p>
      <pre><code>&lt;audio controls&gt;
  &lt;source src="music.mp3" type="audio/mpeg"&gt;
  您的浏览器不支持 audio 元素。
&lt;/audio&gt;</code></pre>
    `,
    tags: ['音频', '多媒体']
  },
  video: {
    title: '<video>: 视频',
    body: `
      <p class="lead">&lt;video&gt; 元素用于在文档中嵌入视频内容。</p>
      <pre><code>&lt;video width="320" height="240" controls&gt;
  &lt;source src="movie.mp4" type="video/mp4"&gt;
  您的浏览器不支持 video 元素。
&lt;/video&gt;</code></pre>
    `,
    tags: ['视频', '多媒体']
  },
  source: {
    title: '<source>: 媒体源',
    body: `
      <p class="lead">&lt;source&gt; 元素为 <code>&lt;picture&gt;</code>、<code>&lt;audio&gt;</code> 或 <code>&lt;video&gt;</code> 指定多个媒体资源，浏览器会选择第一个支持的格式。</p>
    `,
    tags: ['媒体源']
  },
  track: {
    title: '<track>: 文本轨道',
    body: `
      <p class="lead">&lt;track&gt; 元素为 <code>&lt;audio&gt;</code> 或 <code>&lt;video&gt;</code> 指定字幕、标题等文本轨道。</p>
    `,
    tags: ['字幕']
  },
  picture: {
    title: '<picture>: 响应式图片',
    body: `
      <p class="lead">&lt;picture&gt; 元素包含多个 <code>&lt;source&gt;</code> 和一个 <code>&lt;img&gt;</code>，用于根据屏幕条件提供不同版本的图片（如艺术指导、WebP回退）。</p>
      <pre><code>&lt;picture&gt;
  &lt;source srcset="image.webp" type="image/webp"&gt;
  &lt;img src="image.jpg" alt="示例"&gt;
&lt;/picture&gt;</code></pre>
    `,
    tags: ['响应式', '图片']
  },
  iframe: {
    title: '<iframe>: 内联框架',
    body: `
      <p class="lead">&lt;iframe&gt; 元素在当前页面中嵌入另一个HTML页面。</p>
      <pre><code>&lt;iframe src="https://example.com" width="600" height="400" title="示例"&gt;&lt;/iframe&gt;</code></pre>
    `,
    tags: ['内联框架', '嵌入']
  },
  embed: {
    title: '<embed>: 嵌入外部内容',
    body: `
      <p class="lead">&lt;embed&gt; 元素在文档的指定位置嵌入外部内容（如插件、PDF）。</p>
      <pre><code>&lt;embed src="file.pdf" type="application/pdf" width="600" height="500"&gt;</code></pre>
    `,
    tags: ['嵌入']
  },
  object: {
    title: '<object>: 外部对象',
    body: `
      <p class="lead">&lt;object&gt; 元素表示一个外部资源，可以视为图像、嵌套浏览上下文或插件。</p>
    `,
    tags: ['对象']
  },
  param: {
    title: '<param>: 对象参数',
    body: `
      <p class="lead">&lt;param&gt; 元素为 <code>&lt;object&gt;</code> 定义参数。</p>
    `,
    tags: ['参数']
  },
  canvas: {
    title: '<canvas>: 画布',
    body: `
      <p class="lead">&lt;canvas&gt; 元素通过JavaScript绘制图形（如游戏、图表）。</p>
      <pre><code>&lt;canvas id="myCanvas" width="200" height="200"&gt;&lt;/canvas&gt;</code></pre>
    `,
    tags: ['画布', '图形']
  },
  svg: {
    title: 'SVG（内联）',
    body: `
      <p class="lead">可以直接在HTML中内联SVG代码，绘制矢量图形。</p>
      <pre><code>&lt;svg width="100" height="100"&gt;
  &lt;circle cx="50" cy="50" r="40" fill="red" /&gt;
&lt;/svg&gt;</code></pre>
    `,
    tags: ['SVG', '矢量']
  },

  // ----- 高级/过时元素（简略示例）-----
  details: {
    title: '<details>: 详情展开',
    body: `
      <p class="lead">&lt;details&gt; 元素创建一个可展开/折叠的部件，通常与 <code>&lt;summary&gt;</code> 一起使用。</p>
      <pre><code>&lt;details&gt;
  &lt;summary&gt;点击展开&lt;/summary&gt;
  &lt;p&gt;这里是隐藏的内容。&lt;/p&gt;
&lt;/details&gt;</code></pre>
    `,
    tags: ['展开', '折叠']
  },
  summary: {
    title: '<summary>: 详情概要',
    body: `
      <p class="lead">&lt;summary&gt; 元素为 <code>&lt;details&gt;</code> 定义可见的标题。</p>
    `,
    tags: ['概要']
  },
  dialog: {
    title: '<dialog>: 对话框',
    body: `
      <p class="lead">&lt;dialog&gt; 元素表示一个对话框或其他交互式组件。</p>
    `,
    tags: ['对话框']
  },
  slot: {
    title: '<slot>: Web组件插槽',
    body: `
      <p class="lead">&lt;slot&gt; 是Web组件的一部分，用于在Shadow DOM中放置内容。</p>
    `,
    tags: ['Web组件']
  },
  template: {
    title: '<template>: 模板',
    body: `
      <p class="lead">&lt;template&gt; 元素用于保存客户端内容，该内容在页面加载时不渲染，但可以在运行时通过JavaScript克隆使用。</p>
    `,
    tags: ['模板']
  },
  acronym: {
    title: '<acronym> (过时)',
    body: `
      <p class="lead">&lt;acronym&gt; 元素用于标记缩写词，但在HTML5中已弃用，应使用 <code>&lt;abbr&gt;</code> 代替。</p>
    `,
    tags: ['过时', '缩写']
  },
  font: {
    title: '<font> (过时)',
    body: `
      <p class="lead">&lt;font&gt; 元素用于设置字体、大小、颜色，但在HTML5中已弃用，应使用CSS替代。</p>
    `,
    tags: ['过时', '字体']
  },
  center: {
    title: '<center> (过时)',
    body: `
      <p class="lead">&lt;center&gt; 元素用于水平居中内容，但在HTML5中已弃用，应使用CSS <code>text-align: center</code> 或 <code>margin: auto</code>。</p>
    `,
    tags: ['过时', '居中']
  },
  big: {
    title: '<big> (过时)',
    body: `
      <p class="lead">&lt;big&gt; 元素用于使文本变大，但在HTML5中已弃用，应使用CSS <code>font-size</code>。</p>
    `,
    tags: ['过时', '字号']
  }
};

// 为所有 navSections 中的项补充默认文档（保证每个 id 都有内容）
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: `<p class="lead">这是关于 <strong>${item.label}</strong> 的详细介绍。请参考 MDN 文档。</p><pre><code>&lt;${item.id}&gt;示例内容&lt;/${item.id}&gt;</code></pre>`,
        tags: ['HTML', '元素']
      };
    }
  });
});

// ========== 图谱数据（与原代码相同）=========
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

// 构建关系（与原代码相同，省略部分重复添加，保持原样）
addLink('html', 'head');
addLink('html', 'body');
addLink('head', 'title');
addLink('head', 'meta');
addLink('head', 'link');
addLink('head', 'base');
const bodyChildren = ['h1', 'p', 'a', 'ul', 'ol', 'table', 'form', 'img', 'video', 'canvas', 'details', 'dialog', 'nav', 'menu', 'hr', 'br'];
bodyChildren.forEach(child => addLink('body', child));
addLink('ul', 'li');
addLink('ol', 'li');
addLink('dl', 'dt');
addLink('dl', 'dd');
addLink('table', 'caption');
addLink('table', 'thead');
addLink('table', 'tbody');
addLink('table', 'tfoot');
addLink('thead', 'tr');
addLink('tbody', 'tr');
addLink('tfoot', 'tr');
addLink('tr', 'th');
addLink('tr', 'td');
addLink('colgroup', 'col');
addLink('form', 'input');
addLink('form', 'button');
addLink('form', 'select');
addLink('form', 'textarea');
addLink('form', 'label');
addLink('form', 'fieldset');
addLink('fieldset', 'legend');
addLink('select', 'option');
addLink('select', 'optgroup');
addLink('optgroup', 'option');
addLink('datalist', 'option');
addLink('picture', 'source');
addLink('picture', 'img');
addLink('video', 'source');
addLink('video', 'track');
addLink('audio', 'source');
addLink('audio', 'track');
addLink('object', 'param');
addLink('details', 'summary');
addLink('dialog', 'form');
addLink('template', 'slot');
addLink('p', 'strong');
addLink('p', 'em');
addLink('p', 'mark');
addLink('p', 'span');

// 去重
graphLinks.value = graphLinks.value.filter((link, index, self) =>
  index === self.findIndex(l => l.source === link.source && l.target === link.target)
);

const categories = ref(navSections.value.map(s => ({ name: s.title })));

// ========== ECharts 初始化与控制 ==========
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
        symbolSize: 28,
        itemStyle: { color: isDark.value ? '#8B5CF6' : '#007acc' }
      })),
      links: graphLinks.value,
      categories: categories.value,
      lineStyle: { color: 'source', curveness: 0.3, width: 2 },
      force: { repulsion: 400, edgeLength: 120 },
      label: { show: true, position: 'bottom', fontSize: 10, color: isDark.value ? '#e0e0e0' : '#333' },
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
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  });
};

const zoomIn = () => {
  if (!chartInstance.value) return;
  const option = chartInstance.value.getOption();
  option.series[0].zoom = (option.series[0].zoom || 1) * 1.2;
  chartInstance.value.setOption(option);
};

const zoomOut = () => {
  if (!chartInstance.value) return;
  const option = chartInstance.value.getOption();
  option.series[0].zoom = (option.series[0].zoom || 1) * 0.8;
  chartInstance.value.setOption(option);
};

const fitToView = () => {
  if (!chartInstance.value) return;
  chartInstance.value.dispatchAction({ type: 'restore' });
};

// ========== 滚动监听，更新左侧导航高亮 ==========
const contentAreaRef = ref(null);
let scrollHandler = null;

const updateActiveOnScroll = () => {
  if (!contentAreaRef.value) return;
  const contentArea = contentAreaRef.value;
  const blocks = contentArea.querySelectorAll('.content-block');
  const scrollTop = contentArea.scrollTop;
  const areaHeight = contentArea.clientHeight;

  // 找到当前在视口中占据面积最大的区块
  let bestBlock = null;
  let maxVisibleHeight = 0;

  blocks.forEach(block => {
    const rect = block.getBoundingClientRect();
    const areaRect = contentArea.getBoundingClientRect();
    // 计算区块在内容区域可视部分的高度
    const visibleTop = Math.max(rect.top, areaRect.top);
    const visibleBottom = Math.min(rect.bottom, areaRect.bottom);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);

    if (visibleHeight > maxVisibleHeight) {
      maxVisibleHeight = visibleHeight;
      bestBlock = block;
    }
  });

  if (bestBlock) {
    const id = bestBlock.id.replace('content-', '');
    if (id !== selectedId.value) {
      selectedId.value = id;
    }
  }
};

// ========== 生命周期 ==========
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
  if (contentAreaRef.value && scrollHandler) {
    contentAreaRef.value.removeEventListener('scroll', scrollHandler);
  }
  window.removeEventListener('resize', () => {});
  if (chartInstance.value) {
    chartInstance.value.dispose();
    chartInstance.value = null;
  }
});
</script>

<style scoped>
/* ===== 全局设计令牌（基本保留原样式，针对连续文档微调） ===== */
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

.subtitle {
  margin: 0;
  font-size: 0.8rem;
  color: #4b5e71;
  font-weight: 400;
}

.app-container.dark .subtitle {
  color: #aaa;
}

.header-decoration {
  height: 4px;
  width: 60px;
  background: linear-gradient(90deg, #007acc, #a0c4e5);
  border-radius: 4px;
  margin-top: 12px;
}

.search-box {
  margin: 12px 16px 8px;
  background: rgba(255,255,255,0.7);
  border: 1px solid rgba(0,40,80,0.15);
  border-radius: 40px;
  padding: 6px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(4px);
}

.app-container.dark .search-box {
  background: rgba(58,58,74,0.7);
  border-color: rgba(255,255,255,0.1);
}

.search-box input {
  border: none;
  background: transparent;
  width: 100%;
  font-size: 0.9rem;
  outline: none;
  color: #1f2d3d;
}

.app-container.dark .search-box input {
  color: #e0e0e0;
}

.search-box input::placeholder {
  color: #7f8fa4;
  font-style: italic;
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

/* 中间内容区（连续文档无框样式） */
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
  background: #1e1e2f;  /* 暗色模式深色背景 */
}

.content-card {
  background: transparent;
  backdrop-filter: none;
  border-radius: 0;
  box-shadow: none;
  border: none;
  padding: 0;
  transition: none;
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

.mdn-badge {
  background: #1e2f40;
  color: white;
  padding: 4px 12px;
  border-radius: 30px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid rgba(255,255,255,0.2);
}

.app-container.dark .mdn-badge {
  background: #3a3a4a;
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
/* 可添加全局表格样式等 */
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