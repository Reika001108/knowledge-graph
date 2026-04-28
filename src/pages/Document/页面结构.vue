<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">页面结构知识库</h1>
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
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>🏗️ <span class="gradient-text">页面结构完全指南</span></h2>
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
              <span v-if="item.hot" class="hot-badge">核心</span>
            </a>
          </div>
        </div>

        <div class="sidebar-footer">
          <p>🏗️ 构建语义化、可访问的网页结构</p>
          <p>✨ 点击节点双向联动 | 从基础到高级</p>
        </div>
      </aside>

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
                <span class="tag-label">🏷️ 相关概念</span>
                <div class="tag-list">
                  <span class="tag" v-for="tag in contentMap[item.id].tags" :key="tag">{{ tag }}</span>
                </div>
              </div>
            </div>
            <div v-else class="content-card placeholder">
              <h2>📖 {{ item.label }} 的详细文档正在同步中...</h2>
            </div>
          </div>
        </div>
      </section>

      <aside class="graph-panel">
        <div class="graph-header">
          <h3>🔗 页面结构知识图谱 <span class="graph-badge">ECharts</span></h3>
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
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import * as echarts from 'echarts'

// ---------- 用户及主题相关 ----------
const showDropdown = ref(false)
const avatarWrapper = ref(null)
const userInfo = ref(null)
const currentTime = ref(new Date().toLocaleTimeString())
const isDark = ref(false)

const displayName = computed(() => {
  if (!userInfo.value) return ''
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || '前端开发者'
})

const toggleTheme = () => {
  isDark.value = !isDark.value
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
    nextTick(() => initChart())
  }
}

let timer = null
const updateTime = () => {
  currentTime.value = new Date().toLocaleTimeString()
}

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const handleClickOutside = (event) => {
  if (avatarWrapper.value && !avatarWrapper.value.contains(event.target)) {
    showDropdown.value = false
  }
}

const goToProfile = () => {
  window.location.href = 'http://localhost:5173/person'
}

const logout = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('user_info')
  showDropdown.value = false
  window.location.href = 'http://localhost:5173/'
}

// ========== 页面结构导航数据 ==========
const navSections = ref([
  { title: '📄 文档基础', items: [
      { id: 'doctype', label: '文档类型声明', hot: true },
      { id: 'html-tag', label: 'html 根元素', hot: true },
      { id: 'head-tag', label: 'head 头部', hot: true },
      { id: 'body-tag', label: 'body 主体', hot: true }
    ]},
  { title: '📋 元信息', items: [
      { id: 'meta-charset', label: '字符集 meta', hot: true },
      { id: 'meta-viewport', label: '视口 meta', hot: true },
      { id: 'meta-seo', label: 'SEO meta', hot: true },
      { id: 'title-tag', label: '标题 title', hot: true }
    ]},
  { title: '🏷️ 语义化标签', items: [
      { id: 'header-tag', label: 'header 页眉', hot: true },
      { id: 'nav-tag', label: 'nav 导航', hot: true },
      { id: 'main-tag', label: 'main 主体', hot: true },
      { id: 'article-tag', label: 'article 文章', hot: true },
      { id: 'section-tag', label: 'section 区块', hot: true },
      { id: 'aside-tag', label: 'aside 侧边栏', hot: true },
      { id: 'footer-tag', label: 'footer 页脚', hot: true }
    ]},
  { title: '📦 内容分组', items: [
      { id: 'div-span', label: 'div 与 span', hot: true },
      { id: 'heading', label: '标题 h1-h6', hot: true },
      { id: 'paragraph', label: '段落 p', hot: true },
      { id: 'lists', label: '列表 ul/ol/dl', hot: true },
      { id: 'figures', label: '图文 figure', hot: true }
    ]},
  { title: '🔗 链接与媒体', items: [
      { id: 'links', label: '链接 a', hot: true },
      { id: 'images', label: '图像 img', hot: true },
      { id: 'video-audio', label: '视频与音频', hot: true },
      { id: 'iframes', label: '内联框架 iframe', hot: true }
    ]},
  { title: '📊 表格与表单', items: [
      { id: 'tables', label: '表格 table', hot: true },
      { id: 'forms', label: '表单 form', hot: true },
      { id: 'inputs', label: '输入控件', hot: true },
      { id: 'buttons', label: '按钮 button', hot: true }
    ]}
])

const selectedId = ref('doctype')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== 页面结构内容映射表 ==========
const contentMap = {
  doctype: {
    title: '文档类型声明',
    body: '<p class="lead">&lt;!DOCTYPE&gt; 声明不是 HTML 标签，它是一条指令，告诉浏览器使用哪种 HTML 版本渲染页面。</p><pre><code>&lt;!DOCTYPE html&gt;\n&lt;html lang="zh-CN"&gt;\n&lt;head&gt;\n  &lt;meta charset="UTF-8"&gt;\n  &lt;title&gt;页面标题&lt;/title&gt;\n&lt;/head&gt;\n&lt;body&gt;\n  &lt;!-- 页面内容 --&gt;\n&lt;/body&gt;\n&lt;/html&gt;</code></pre><div class="note">💡 HTML5 的 DOCTYPE 声明非常简单，所有现代浏览器都支持标准模式。</div>',
    tags: ['DOCTYPE', 'HTML5', '标准模式']
  },
  'html-tag': {
    title: 'html 根元素',
    body: '<p class="lead">&lt;html&gt; 元素代表 HTML 文档的根，是所有其他元素的容器。</p><pre><code>&lt;!DOCTYPE html&gt;\n&lt;html lang="zh-CN"&gt;\n  &lt;head&gt;\n    &lt;meta charset="UTF-8"&gt;\n    &lt;title&gt;我的网站&lt;/title&gt;\n  &lt;/head&gt;\n  &lt;body&gt;\n    &lt;h1&gt;Hello World&lt;/h1&gt;\n  &lt;/body&gt;\n&lt;/html&gt;</code></pre><h3>重要属性</h3><ul><li><strong>lang</strong>：指定文档语言，如 lang="zh-CN"</li><li><strong>manifest</strong>：指定应用缓存（已废弃）</li></ul>',
    tags: ['html', '根元素', '语言']
  },
  'head-tag': {
    title: 'head 头部',
    body: '<p class="lead">&lt;head&gt; 元素包含文档的元数据，这些信息不会显示在页面上。</p><pre><code>&lt;head&gt;\n  &lt;meta charset="UTF-8"&gt;\n  &lt;meta name="viewport" content="width=device-width, initial-scale=1.0"&gt;\n  &lt;title&gt;页面标题&lt;/title&gt;\n  &lt;meta name="description" content="页面描述"&gt;\n  &lt;link rel="stylesheet" href="style.css"&gt;\n  &lt;script src="script.js" defer&gt;&lt;/script&gt;\n&lt;/head&gt;</code></pre>',
    tags: ['head', '元数据', '配置']
  },
  'body-tag': {
    title: 'body 主体',
    body: '<p class="lead">&lt;body&gt; 元素包含页面的所有可见内容。</p><pre><code>&lt;body&gt;\n  &lt;header&gt;页眉区域&lt;/header&gt;\n  &lt;nav&gt;导航菜单&lt;/nav&gt;\n  &lt;main&gt;\n    &lt;article&gt;主要内容&lt;/article&gt;\n    &lt;aside&gt;侧边栏&lt;/aside&gt;\n  &lt;/main&gt;\n  &lt;footer&gt;页脚区域&lt;/footer&gt;\n&lt;/body&gt;</code></pre>',
    tags: ['body', '可见内容', '主体']
  },
  'meta-charset': {
    title: '字符集 meta',
    body: '<p class="lead">指定文档的字符编码，防止乱码。</p><pre><code>&lt;meta charset="UTF-8"&gt;</code></pre><div class="note">💡 UTF-8 是最通用的字符编码，支持所有语言的字符。</div>',
    tags: ['charset', 'UTF-8', '编码']
  },
  'meta-viewport': {
    title: '视口 meta',
    body: '<p class="lead">控制移动端视口的缩放行为。</p><pre><code>&lt;meta name="viewport" content="width=device-width, initial-scale=1.0"&gt;</code></pre><h3>常用参数</h3><ul><li><strong>width=device-width</strong>：视口宽度等于设备宽度</li><li><strong>initial-scale=1.0</strong>：初始缩放比例</li><li><strong>maximum-scale=1.0</strong>：最大缩放比例</li><li><strong>user-scalable=no</strong>：禁止用户缩放</li></ul>',
    tags: ['viewport', '响应式', '移动端']
  },
  'meta-seo': {
    title: 'SEO meta',
    body: '<p class="lead">为搜索引擎提供页面信息，提升 SEO 效果。</p><pre><code>&lt;meta name="description" content="页面描述，会显示在搜索结果中"&gt;\n&lt;meta name="keywords" content="关键词1,关键词2,关键词3"&gt;\n&lt;meta name="author" content="作者名称"&gt;\n&lt;meta name="robots" content="index, follow"&gt;</code></pre><h3>robots 参数</h3><ul><li><strong>index</strong>：允许索引页面</li><li><strong>follow</strong>：允许跟踪链接</li><li><strong>noindex</strong>：禁止索引</li><li><strong>nofollow</strong>：禁止跟踪链接</li></ul>',
    tags: ['SEO', 'description', 'robots']
  },
  'title-tag': {
    title: '标题 title',
    body: '<p class="lead">&lt;title&gt; 定义浏览器工具栏标题、收藏夹标题和搜索结果标题。</p><pre><code>&lt;title&gt;我的网站 - 首页&lt;/title&gt;</code></pre><div class="note">🎯 标题是 SEO 最重要的因素之一，建议长度在 30-60 个字符之间。</div>',
    tags: ['title', '标题', 'SEO']
  },
  'header-tag': {
    title: 'header 页眉',
    body: '<p class="lead">&lt;header&gt; 表示页面或区块的页眉，通常包含 Logo、导航、标题等。</p><pre><code>&lt;header&gt;\n  &lt;h1&gt;网站标题&lt;/h1&gt;\n  &lt;nav&gt;\n    &lt;ul&gt;\n      &lt;li&gt;&lt;a href="/"&gt;首页&lt;/a&gt;&lt;/li&gt;\n      &lt;li&gt;&lt;a href="/about"&gt;关于&lt;/a&gt;&lt;/li&gt;\n    &lt;/ul&gt;\n  &lt;/nav&gt;\n&lt;/header&gt;</code></pre>',
    tags: ['header', '页眉', '语义化']
  },
  'nav-tag': {
    title: 'nav 导航',
    body: '<p class="lead">&lt;nav&gt; 表示页面的导航链接区域。</p><pre><code>&lt;nav&gt;\n  &lt;a href="/"&gt;首页&lt;/a&gt;\n  &lt;a href="/products"&gt;产品&lt;/a&gt;\n  &lt;a href="/services"&gt;服务&lt;/a&gt;\n  &lt;a href="/contact"&gt;联系&lt;/a&gt;\n&lt;/nav&gt;</code></pre>',
    tags: ['nav', '导航', '链接']
  },
  'main-tag': {
    title: 'main 主体',
    body: '<p class="lead">&lt;main&gt; 表示页面的主要内容区域，一个页面只能有一个。</p><pre><code>&lt;main&gt;\n  &lt;article&gt;\n    &lt;h2&gt;文章标题&lt;/h2&gt;\n    &lt;p&gt;文章内容...&lt;/p&gt;\n  &lt;/article&gt;\n&lt;/main&gt;</code></pre>',
    tags: ['main', '主体内容', '语义化']
  },
  'article-tag': {
    title: 'article 文章',
    body: '<p class="lead">&lt;article&gt; 表示独立、可复用的内容块，如博客文章、新闻条目。</p><pre><code>&lt;article&gt;\n  &lt;h2&gt;文章标题&lt;/h2&gt;\n  &lt;time datetime="2024-01-15"&gt;2024年1月15日&lt;/time&gt;\n  &lt;p&gt;文章正文内容...&lt;/p&gt;\n  &lt;footer&gt;作者：张三&lt;/footer&gt;\n&lt;/article&gt;</code></pre>',
    tags: ['article', '文章', '独立内容']
  },
  'section-tag': {
    title: 'section 区块',
    body: '<p class="lead">&lt;section&gt; 表示文档中的章节或区域，通常包含一个标题。</p><pre><code>&lt;section&gt;\n  &lt;h2&gt;关于我们&lt;/h2&gt;\n  &lt;p&gt;公司介绍...&lt;/p&gt;\n&lt;/section&gt;\n\n&lt;section&gt;\n  &lt;h2&gt;我们的服务&lt;/h2&gt;\n  &lt;ul&gt;\n    &lt;li&gt;服务1&lt;/li&gt;\n    &lt;li&gt;服务2&lt;/li&gt;\n  &lt;/ul&gt;\n&lt;/section&gt;</code></pre>',
    tags: ['section', '区块', '章节']
  },
  'aside-tag': {
    title: 'aside 侧边栏',
    body: '<p class="lead">&lt;aside&gt; 表示与主内容相关的附加信息，如侧边栏、广告等。</p><pre><code>&lt;aside&gt;\n  &lt;h3&gt;相关阅读&lt;/h3&gt;\n  &lt;ul&gt;\n    &lt;li&gt;&lt;a href="#"&gt;推荐文章1&lt;/a&gt;&lt;/li&gt;\n    &lt;li&gt;&lt;a href="#"&gt;推荐文章2&lt;/a&gt;&lt;/li&gt;\n  &lt;/ul&gt;\n&lt;/aside&gt;</code></pre>',
    tags: ['aside', '侧边栏', '附加信息']
  },
  'footer-tag': {
    title: 'footer 页脚',
    body: '<p class="lead">&lt;footer&gt; 表示页面或区块的页脚，通常包含版权信息、联系方式等。</p><pre><code>&lt;footer&gt;\n  &lt;p&gt;&amp;copy; 2024 我的网站. 保留所有权利。&lt;/p&gt;\n  &lt;nav&gt;\n    &lt;a href="/privacy"&gt;隐私政策&lt;/a&gt;\n    &lt;a href="/terms"&gt;服务条款&lt;/a&gt;\n  &lt;/nav&gt;\n&lt;/footer&gt;</code></pre>',
    tags: ['footer', '页脚', '版权']
  },
  'div-span': {
    title: 'div 与 span',
    body: '<p class="lead">&lt;div&gt; 是块级容器，&lt;span&gt; 是行内容器，用于样式和布局分组。</p><pre><code>&lt;div class="container"&gt;\n  &lt;div class="row"&gt;\n    &lt;div class="col"&gt;\n      &lt;span class="highlight"&gt;高亮文本&lt;/span&gt;\n    &lt;/div&gt;\n  &lt;/div&gt;\n&lt;/div&gt;</code></pre>',
    tags: ['div', 'span', '容器']
  },
  heading: {
    title: '标题 h1-h6',
    body: '<p class="lead">标题元素定义文档的层级结构，h1 级别最高，h6 最低。</p><pre><code>&lt;h1&gt;一级标题&lt;/h1&gt;\n&lt;h2&gt;二级标题&lt;/h2&gt;\n&lt;h3&gt;三级标题&lt;/h3&gt;\n&lt;h4&gt;四级标题&lt;/h4&gt;\n&lt;h5&gt;五级标题&lt;/h5&gt;\n&lt;h6&gt;六级标题&lt;/h6&gt;</code></pre><div class="note">🎯 每个页面建议只有一个 h1 标题，按层级使用 h2-h6。</div>',
    tags: ['标题', 'h1', '结构']
  },
  paragraph: {
    title: '段落 p',
    body: '<p class="lead">&lt;p&gt; 表示文本段落，浏览器会自动添加上下边距。</p><pre><code>&lt;p&gt;这是一个段落。段落之间会有一定的间距。&lt;/p&gt;\n&lt;p&gt;这是另一个段落。&lt;/p&gt;</code></pre>',
    tags: ['段落', 'p', '文本']
  },
  lists: {
    title: '列表 ul/ol/dl',
    body: '<p class="lead">无序列表、有序列表和定义列表。</p><pre><code>&lt;!-- 无序列表 --&gt;\n&lt;ul&gt;\n  &lt;li&gt;苹果&lt;/li&gt;\n  &lt;li&gt;香蕉&lt;/li&gt;\n  &lt;li&gt;橙子&lt;/li&gt;\n&lt;/ul&gt;\n\n&lt;!-- 有序列表 --&gt;\n&lt;ol&gt;\n  &lt;li&gt;第一步&lt;/li&gt;\n  &lt;li&gt;第二步&lt;/li&gt;\n  &lt;li&gt;第三步&lt;/li&gt;\n&lt;/ol&gt;\n\n&lt;!-- 定义列表 --&gt;\n&lt;dl&gt;\n  &lt;dt&gt;HTML&lt;/dt&gt;\n  &lt;dd&gt;超文本标记语言&lt;/dd&gt;\n  &lt;dt&gt;CSS&lt;/dt&gt;\n  &lt;dd&gt;层叠样式表&lt;/dd&gt;\n&lt;/dl&gt;</code></pre>',
    tags: ['列表', 'ul', 'ol']
  },
  figures: {
    title: '图文 figure',
    body: '<p class="lead">&lt;figure&gt; 表示独立的图文内容，&lt;figcaption&gt; 提供标题。</p><pre><code>&lt;figure&gt;\n  &lt;img src="image.jpg" alt="描述文字"&gt;\n  &lt;figcaption&gt;图片标题说明&lt;/figcaption&gt;\n&lt;/figure&gt;</code></pre>',
    tags: ['figure', '图文', 'figcaption']
  },
  links: {
    title: '链接 a',
    body: '<p class="lead">&lt;a&gt; 定义超链接，用于页面间跳转或锚点定位。</p><pre><code>&lt;!-- 外部链接 --&gt;\n&lt;a href="https://example.com" target="_blank"&gt;访问示例网站&lt;/a&gt;\n\n&lt;!-- 内部链接 --&gt;\n&lt;a href="/about.html"&gt;关于我们&lt;/a&gt;\n\n&lt;!-- 锚点链接 --&gt;\n&lt;a href="#section2"&gt;跳转到第二节&lt;/a&gt;\n\n&lt;!-- 电子邮件 --&gt;\n&lt;a href="mailto:someone@example.com"&gt;发送邮件&lt;/a&gt;\n\n&lt;!-- 电话号码 --&gt;\n&lt;a href="tel:+861234567890"&gt;拨打电话&lt;/a&gt;</code></pre>',
    tags: ['链接', 'a', '超链接']
  },
  images: {
    title: '图像 img',
    body: '<p class="lead">&lt;img&gt; 用于在页面中嵌入图像。</p><pre><code>&lt;!-- 基本用法 --&gt;\n&lt;img src="photo.jpg" alt="照片描述"&gt;\n\n&lt;!-- 设置尺寸 --&gt;\n&lt;img src="photo.jpg" alt="描述" width="300" height="200"&gt;\n\n&lt;!-- 响应式图片 --&gt;\n&lt;img srcset="small.jpg 480w, large.jpg 1080w" sizes="(max-width: 600px) 480px, 1080px" src="fallback.jpg" alt="描述"&gt;</code></pre><div class="note">⚠️ alt 属性是必需的，用于无障碍访问和图片加载失败时的替代文本。</div>',
    tags: ['图片', 'img', '图像']
  },
  'video-audio': {
    title: '视频与音频',
    body: '<p class="lead">&lt;video&gt; 和 &lt;audio&gt; 用于嵌入多媒体内容。</p><pre><code>&lt;!-- 视频 --&gt;\n&lt;video controls width="640" height="360"&gt;\n  &lt;source src="video.mp4" type="video/mp4"&gt;\n  &lt;source src="video.webm" type="video/webm"&gt;\n  您的浏览器不支持视频播放。\n&lt;/video&gt;\n\n&lt;!-- 音频 --&gt;\n&lt;audio controls&gt;\n  &lt;source src="audio.mp3" type="audio/mpeg"&gt;\n  &lt;source src="audio.ogg" type="audio/ogg"&gt;\n  您的浏览器不支持音频播放。\n&lt;/audio&gt;</code></pre>',
    tags: ['video', 'audio', '多媒体']
  },
  iframes: {
    title: '内联框架 iframe',
    body: '<p class="lead">&lt;iframe&gt; 在当前页面中嵌入另一个 HTML 页面。</p><pre><code>&lt;iframe src="https://example.com" width="800" height="600" title="示例网站"&gt;&lt;/iframe&gt;</code></pre>',
    tags: ['iframe', '嵌入', '框架']
  },
  tables: {
    title: '表格 table',
    body: '<p class="lead">&lt;table&gt; 用于展示表格数据。</p><pre><code>&lt;table border="1"&gt;\n  &lt;caption&gt;用户信息表&lt;/caption&gt;\n  &lt;thead&gt;\n    <tr>\n      &lt;th&gt;姓名&lt;/th&gt;\n      &lt;th&gt;年龄&lt;/th&gt;\n      &lt;th&gt;城市&lt;/th&gt;\n    </tr>\n  &lt;/thead&gt;\n  &lt;tbody&gt;\n    <tr>\n      &lt;td&gt;张三&lt;/td&gt;\n      &lt;td&gt;25&lt;/td&gt;\n      &lt;td&gt;北京&lt;/td&gt;\n    </tr>\n    <tr>\n      &lt;td&gt;李四&lt;/td&gt;\n      &lt;td&gt;30&lt;/td&gt;\n      &lt;td&gt;上海&lt;/td&gt;\n    </tr>\n  &lt;/tbody&gt;\n&lt;/table&gt;</code></pre>',
    tags: ['表格', 'table', '数据']
  },
  forms: {
    title: '表单 form',
    body: '<p class="lead">&lt;form&gt; 用于收集用户输入并提交到服务器。</p><pre><code>&lt;form action="/submit" method="post"&gt;\n  &lt;label for="name"&gt;姓名：&lt;/label&gt;\n  &lt;input type="text" id="name" name="name" required&gt;\n  \n  &lt;label for="email"&gt;邮箱：&lt;/label&gt;\n  &lt;input type="email" id="email" name="email" required&gt;\n  \n  &lt;button type="submit"&gt;提交&lt;/button&gt;\n&lt;/form&gt;</code></pre>',
    tags: ['表单', 'form', '提交']
  },
  inputs: {
    title: '输入控件',
    body: '<p class="lead">&lt;input&gt; 是最常用的表单控件，通过 type 属性呈现不同形态。</p><pre><code>&lt;!-- 文本输入 --&gt;\n&lt;input type="text" name="username" placeholder="用户名"&gt;\n\n&lt;!-- 密码输入 --&gt;\n&lt;input type="password" name="password"&gt;\n\n&lt;!-- 邮箱输入 --&gt;\n&lt;input type="email" name="email"&gt;\n\n&lt;!-- 数字输入 --&gt;\n&lt;input type="number" name="age" min="0" max="150"&gt;\n\n&lt;!-- 日期选择 --&gt;\n&lt;input type="date" name="birthday"&gt;\n\n&lt;!-- 单选按钮 --&gt;\n&lt;input type="radio" name="gender" value="male"&gt; 男\n&lt;input type="radio" name="gender" value="female"&gt; 女\n\n&lt;!-- 复选框 --&gt;\n&lt;input type="checkbox" name="agree"&gt; 同意条款\n\n&lt;!-- 文件上传 --&gt;\n&lt;input type="file" name="avatar"&gt;</code></pre>',
    tags: ['input', '表单', '输入']
  },
  buttons: {
    title: '按钮 button',
    body: '<p class="lead">&lt;button&gt; 定义可点击的按钮。</p><pre><code>&lt;!-- 提交按钮 --&gt;\n&lt;button type="submit"&gt;提交&lt;/button&gt;\n\n&lt;!-- 重置按钮 --&gt;\n&lt;button type="reset"&gt;重置&lt;/button&gt;\n\n&lt;!-- 普通按钮 --&gt;\n&lt;button type="button" onclick="alert("Hello")"&gt;点击我&lt;/button&gt;</code></pre>',
    tags: ['button', '按钮', '交互']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 HTML 规范获取更多信息。</p>',
        tags: ['HTML', '页面结构']
      }
    }
  })
})

// ========== 图谱数据 ==========
const graphNodes = ref(
  navSections.value.flatMap((section, idx) =>
    section.items.map(item => ({
      id: item.id,
      name: item.label,
      category: idx
    }))
  )
)

const graphLinks = ref([])

const addLink = (source, target) => {
  if (source && target && graphNodes.value.some(n => n.id === source) && graphNodes.value.some(n => n.id === target)) {
    graphLinks.value.push({ source, target })
  }
}

addLink('doctype', 'html-tag')
addLink('html-tag', 'head-tag')
addLink('html-tag', 'body-tag')
addLink('head-tag', 'meta-charset')
addLink('head-tag', 'meta-viewport')
addLink('head-tag', 'meta-seo')
addLink('head-tag', 'title-tag')
addLink('body-tag', 'header-tag')
addLink('body-tag', 'nav-tag')
addLink('body-tag', 'main-tag')
addLink('body-tag', 'footer-tag')
addLink('main-tag', 'article-tag')
addLink('main-tag', 'section-tag')
addLink('main-tag', 'aside-tag')
addLink('div-span', 'heading')
addLink('heading', 'paragraph')
addLink('paragraph', 'lists')
addLink('lists', 'figures')
addLink('links', 'images')
addLink('images', 'video-audio')
addLink('video-audio', 'iframes')
addLink('tables', 'forms')
addLink('forms', 'inputs')
addLink('inputs', 'buttons')

graphLinks.value = graphLinks.value.filter((link, index, self) =>
  index === self.findIndex(l => l.source === link.source && l.target === link.target)
)

const categories = ref(navSections.value.map(s => ({ name: s.title })))

// ========== ECharts 实例化 ==========
const chartRef = ref(null)
let chartInstance = ref(null)

const initChart = () => {
  if (!chartRef.value) return
  if (chartInstance.value) chartInstance.value.dispose()
  chartInstance.value = echarts.init(chartRef.value, isDark.value ? 'dark' : null)
  const option = {
    title: { show: false },
    tooltip: { show: true, formatter: (params) => params.name },
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
      lineStyle: { color: 'source', curveness: 0.3, width: 1.8 },
      force: { repulsion: 400, edgeLength: 130, gravity: 0.1 },
      label: { show: true, position: 'bottom', fontSize: 10, color: isDark.value ? '#e0e0e0' : '#333' },
      emphasis: { focus: 'adjacency' }
    }]
  }
  chartInstance.value.setOption(option)
  chartInstance.value.on('click', { seriesIndex: 0 }, (params) => {
    if (params.dataType === 'node') {
      const nodeId = params.data.id
      if (nodeId && contentMap[nodeId]) {
        selectedId.value = nodeId
        const targetEl = document.getElementById('content-' + nodeId)
        if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' })
      }
    }
  })
}

const zoomIn = () => { if (chartInstance.value) chartInstance.value.dispatchAction({ type: 'graphZoomIn' }) }
const zoomOut = () => { if (chartInstance.value) chartInstance.value.dispatchAction({ type: 'graphZoomOut' }) }
const fitToView = () => { if (chartInstance.value) chartInstance.value.dispatchAction({ type: 'graphRoam', roam: 'reset' }) }

const contentAreaRef = ref(null)
let scrollHandler = null

const updateActiveOnScroll = () => {
  if (!contentAreaRef.value) return
  const blocks = contentAreaRef.value.querySelectorAll('.content-block')
  let bestBlock = null, maxVisible = 0
  const areaRect = contentAreaRef.value.getBoundingClientRect()
  blocks.forEach(block => {
    const rect = block.getBoundingClientRect()
    const visibleTop = Math.max(rect.top, areaRect.top)
    const visibleBottom = Math.min(rect.bottom, areaRect.bottom)
    const visibleHeight = Math.max(0, visibleBottom - visibleTop)
    if (visibleHeight > maxVisible) {
      maxVisible = visibleHeight
      bestBlock = block
    }
  })
  if (bestBlock) {
    const id = bestBlock.id.replace('content-', '')
    if (id !== selectedId.value) selectedId.value = id
  }
}

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
  if (timer) clearInterval(timer)
  document.removeEventListener('click', handleClickOutside)
  if (contentAreaRef.value && scrollHandler) contentAreaRef.value.removeEventListener('scroll', scrollHandler)
  if (chartInstance.value) chartInstance.value.dispose()
})
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
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background-color: #FAF5FF;
  transition: background-color 0.3s, color 0.3s;
}

.app-container.dark {
  background-color: #1e1e2f;
  color: #e0e0e0;
}

.header {
  width: 100%;
  height: 10vh;
  background-color: #8B5CF6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
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

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

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
  font-family: monospace;
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
  font-family: monospace;
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
</style>