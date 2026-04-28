<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">jQuery 知识库</h1>
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
          <h2>$ <span class="gradient-text">jQuery 完全指南</span></h2>
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
          <p>$ 快速、简洁的 JavaScript 库</p>
          <p>✨ 点击节点双向联动 | DOM 操作神器</p>
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
          <h3>🔗 jQuery 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'jQuery用户'
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

// ========== jQuery 导航数据 ==========
const navSections = ref([
  { title: '🚀 快速入门', items: [
      { id: 'jquery-intro', label: 'jQuery 简介', hot: true },
      { id: 'jquery-install', label: '安装与引入', hot: true },
      { id: 'jquery-ready', label: '文档就绪事件', hot: true }
    ]},
  { title: '🔍 选择器', items: [
      { id: 'jquery-selectors', label: '基本选择器', hot: true },
      { id: 'jquery-filter', label: '过滤选择器', hot: true },
      { id: 'jquery-traversal', label: 'DOM 遍历', hot: true }
    ]},
  { title: '✏️ DOM 操作', items: [
      { id: 'jquery-manipulation', label: '内容操作', hot: true },
      { id: 'jquery-attributes', label: '属性操作', hot: true },
      { id: 'jquery-css', label: 'CSS 样式', hot: true },
      { id: 'jquery-add-remove', label: '添加/删除元素', hot: true }
    ]},
  { title: '🖱️ 事件处理', items: [
      { id: 'jquery-events', label: '事件绑定', hot: true },
      { id: 'jquery-mouse', label: '鼠标事件', hot: true },
      { id: 'jquery-form', label: '表单事件', hot: true },
      { id: 'jquery-event-delegation', label: '事件委托', hot: true }
    ]},
  { title: '🎬 动画效果', items: [
      { id: 'jquery-show-hide', label: '显示/隐藏', hot: true },
      { id: 'jquery-fade', label: '淡入淡出', hot: true },
      { id: 'jquery-slide', label: '滑动效果', hot: true },
      { id: 'jquery-animate', label: '自定义动画', hot: true }
    ]},
  { title: '📡 AJAX', items: [
      { id: 'jquery-ajax', label: 'AJAX 简介', hot: true },
      { id: 'jquery-get-post', label: 'GET/POST 请求', hot: true },
      { id: 'jquery-ajax-methods', label: '$.ajax 方法', hot: true },
      { id: 'jquery-json', label: '处理 JSON', hot: true }
    ]},
  { title: '🔧 工具方法', items: [
      { id: 'jquery-utils', label: '实用工具', hot: true },
      { id: 'jquery-effects', label: '效果方法', hot: true },
      { id: 'jquery-plugins', label: '插件开发', hot: true }
    ]}
])

const selectedId = ref('jquery-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== jQuery 内容映射表 ==========
const contentMap = {
  'jquery-intro': {
    title: 'jQuery 简介',
    body: '<p class="lead">jQuery 是一个快速、简洁的 JavaScript 库，简化了 HTML 文档遍历、事件处理、动画和 AJAX 交互。</p><h3>核心特点</h3><ul><li><strong>链式语法</strong>：一行代码完成多个操作</li><li><strong>强大的选择器</strong>：类似 CSS 的选择器语法</li><li><strong>跨浏览器兼容</strong>：解决浏览器差异</li><li><strong>丰富的插件生态</strong>：大量第三方插件</li></ul><div class="note">💡 jQuery 由 John Resig 于 2006 年创建，曾是全球最流行的 JavaScript 库。</div>',
    tags: ['jQuery', 'JavaScript库', 'DOM操作']
  },
  'jquery-install': {
    title: '安装与引入',
    body: '<p class="lead">jQuery 可以通过 CDN 或本地文件引入。</p><pre><code>&lt;!-- CDN 引入 --&gt;\n&lt;script src="https://code.jquery.com/jquery-3.7.1.min.js"&gt;&lt;/script&gt;\n\n&lt;!-- 备选 CDN --&gt;\n&lt;script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"&gt;&lt;/script&gt;\n\n&lt;!-- 本地文件 --&gt;\n&lt;script src="js/jquery-3.7.1.min.js"&gt;&lt;/script&gt;\n\n// npm 安装\nnpm install jquery</code></pre>',
    tags: ['安装', 'CDN', '引入']
  },
  'jquery-ready': {
    title: '文档就绪事件',
    body: '<p class="lead">确保 DOM 加载完成后再执行代码。</p><pre><code>// 完整写法\n$(document).ready(function() {\n  console.log("DOM 已加载")\n})\n\n// 简写\n$(function() {\n  console.log("DOM 已加载")\n})\n\n// 箭头函数\n$( () => {\n  console.log("DOM 已加载")\n})\n\n// 注意：$ 可能与其他库冲突\njQuery(document).ready(function($) {\n  // 使用 $ 安全操作\n})</code></pre>',
    tags: ['ready', 'DOM加载', '$(function)']
  },
  'jquery-selectors': {
    title: '基本选择器',
    body: '<p class="lead">jQuery 选择器基于 CSS 选择器语法。</p><pre><code>// 元素选择器\n$("div")       // 所有 div\n$("p")         // 所有 p\n\n// ID 选择器\n$("#header")   // id="header" 的元素\n\n// 类选择器\n$(".active")   // class="active" 的元素\n\n// 属性选择器\n$("[href]")               // 有 href 属性的元素\n$("[type="text"]")        // type="text" 的元素\n$("[name^="user"]")       // name 以 user 开头\n$("[name$="name"]")       // name 以 name 结尾\n\n// 组合选择器\n$("div, p, .active")     // 多个选择器\n$("div .item")            // 后代选择器\n$("ul > li")              // 子元素选择器\n$("h1 + p")               // 相邻兄弟选择器</code></pre>',
    tags: ['选择器', 'CSS选择器', '$()']
  },
  'jquery-filter': {
    title: '过滤选择器',
    body: '<p class="lead">过滤选择器用于筛选元素集合。</p><pre><code>// 基本过滤\n$("li:first")        // 第一个 li\n$("li:last")         // 最后一个 li\n$("li:even")         // 偶数索引 li\n$("li:odd")          // 奇数索引 li\n$("li:eq(2)")        // 索引为 2 的 li\n$("li:gt(2)")        // 索引大于 2 的 li\n$("li:lt(2)")        // 索引小于 2 的 li\n\n// 内容过滤\n$("div:contains("text")")  // 包含文本的 div\n$("div:empty")             // 空的 div\n$("div:has(p)")            // 包含 p 的 div\n$("div:parent")            // 有子元素的 div\n\n// 可见性过滤\n$("div:visible")     // 可见的 div\n$("div:hidden")      // 隐藏的 div\n\n// 表单过滤\n$(":input")          // 所有表单元素\n$(":text")           // 文本框\n$(":password")       // 密码框\n$(":radio")          // 单选按钮\n$(":checkbox")       // 复选框\n$(":checked")        // 选中的复选框/单选\n$(":selected")       // 选中的选项</code></pre>',
    tags: ['过滤', ':first', ':eq']
  },
  'jquery-traversal': {
    title: 'DOM 遍历',
    body: '<p class="lead">遍历 DOM 树中的元素。</p><pre><code>// 向上遍历\n$("li").parent()           // 父元素\n$("li").parents()          // 所有祖先\n$("li").parentsUntil("div") // 直到 div 的祖先\n$("li").closest("ul")      // 最近的 ul\n\n// 向下遍历\n$("div").children()        // 直接子元素\n$("div").find("span")      // 所有后代 span\n\n// 水平遍历\n$("li").siblings()         // 所有兄弟\n$("li").next()             // 下一个兄弟\n$("li").nextAll()          // 后面所有兄弟\n$("li").prev()             // 上一个兄弟\n$("li").prevAll()          // 前面所有兄弟\n\n// 过滤\n$("div").filter(".active")  // 过滤出 .active\n$("div").not(".active")     // 排除 .active\n$("div").first()            // 第一个\n$("div").last()             // 最后一个\n$("div").eq(2)              // 索引为 2</code></pre>',
    tags: ['遍历', 'parent', 'find']
  },
  'jquery-manipulation': {
    title: '内容操作',
    body: '<p class="lead">获取和设置元素内容。</p><pre><code>// 获取/设置 HTML 内容\nvar html = $("div").html()           // 获取 HTML\n$("div").html("&lt;span&gt;新内容&lt;/span&gt;") // 设置 HTML\n\n// 获取/设置文本内容\nvar text = $("div").text()           // 获取文本\n$("div").text("新文本")               // 设置文本\n\n// 获取/设置表单值\nvar value = $("input").val()         // 获取值\n$("input").val("新值")                // 设置值\n\n// 获取/设置元素尺寸\nvar width = $("div").width()         // 宽度\n$("div").width(200)                  // 设置宽度\nvar height = $("div").height()       // 高度\nvar innerWidth = $("div").innerWidth()  // 内宽（含 padding）\nvar outerWidth = $("div").outerWidth()  // 外宽（含 padding + border）</code></pre>',
    tags: ['html', 'text', 'val']
  },
  'jquery-attributes': {
    title: '属性操作',
    body: '<p class="lead">获取和设置元素属性。</p><pre><code>// 属性操作\nvar href = $("a").attr("href")        // 获取属性\n$("a").attr("href", "https://example.com")  // 设置属性\n$("a").attr({ href: "/new", title: "链接" })  // 多个属性\n$("a").removeAttr("title")            // 移除属性\n\n// CSS 类操作\n$("div").addClass("active")           // 添加类\n$("div").removeClass("active")        // 移除类\n$("div").toggleClass("active")        // 切换类\n$("div").hasClass("active")           // 检查类\n\n// 数据属性\n$("div").data("id", 123)              // 设置数据\nvar id = $("div").data("id")          // 获取数据\n$("div").removeData("id")             // 移除数据</code></pre>',
    tags: ['attr', 'addClass', 'data']
  },
  'jquery-css': {
    title: 'CSS 样式',
    body: '<p class="lead">获取和设置 CSS 样式。</p><pre><code>// 单个样式\nvar color = $("div").css("color")      // 获取\n$("div").css("color", "red")          // 设置\n\n// 多个样式\n$("div").css({\n  color: "red",\n  backgroundColor: "blue",\n  fontSize: "16px"\n})\n\n// 位置\nvar offset = $("div").offset()         // 相对于文档的位置\nvar position = $("div").position()     // 相对于父元素的位置\nvar scrollTop = $(window).scrollTop()  // 滚动条位置\n$(window).scrollTop(100)              // 设置滚动条位置</code></pre>',
    tags: ['css', 'offset', '位置']
  },
  'jquery-add-remove': {
    title: '添加/删除元素',
    body: '<p class="lead">动态添加和删除 DOM 元素。</p><pre><code>// 创建元素\nvar newDiv = $("&lt;div&gt;&lt;/div&gt;")        // 创建元素\nvar newDiv = $("&lt;div&gt;", {            // 创建并设置属性\n  id: "new",\n  class: "box",\n  text: "Hello",\n  click: function() {}\n})\n\n// 内部插入\n$("div").append("&lt;p&gt;末尾追加&lt;/p&gt;")   // 末尾追加\n$("div").prepend("&lt;p&gt;开头插入&lt;/p&gt;")  // 开头插入\n$("div").appendTo("body")            // 追加到 body\n\n// 外部插入\n$("div").after("&lt;span&gt;之后&lt;/span&gt;")   // 元素之后\n$("div").before("&lt;span&gt;之前&lt;/span&gt;")  // 元素之前\n\n// 删除/清空\n$("div").remove()                    // 删除元素\n$("div").empty()                     // 清空子元素\n\n// 包裹\n$("span").wrap("&lt;div&gt;&lt;/div&gt;")        // 包裹每个元素\n$("span").wrapAll("&lt;div&gt;&lt;/div&gt;")     // 包裹所有元素\n$("span").unwrap()                   // 移除父元素</code></pre>',
    tags: ['append', 'remove', '创建元素']
  },
  'jquery-events': {
    title: '事件绑定',
    body: '<p class="lead">绑定和解除事件处理程序。</p><pre><code>// 简写事件方法\n$("button").click(function() {\n  console.log("点击")\n})\n\n// on() 方法（推荐）\n$("button").on("click", function() {\n  console.log("点击")\n})\n\n// 多个事件\n$("div").on("mouseenter mouseleave", function() {\n  console.log("鼠标进入/离开")\n})\n\n// 事件数据传递\n$("button").on("click", { name: "Alice" }, function(e) {\n  console.log(e.data.name)\n})\n\n// 一次性事件\n$("button").one("click", function() {\n  console.log("只执行一次")\n})\n\n// 解除绑定\n$("button").off("click")               // 解绑所有 click\n$("button").off("click", handleClick)  // 解绑特定函数\n\n// 触发事件\n$("button").trigger("click")           // 触发 click 事件</code></pre>',
    tags: ['on', 'click', '事件绑定']
  },
  'jquery-mouse': {
    title: '鼠标事件',
    body: '<p class="lead">鼠标交互事件。</p><pre><code>// 点击事件\n$("button").click(function(e) {\n  console.log("点击", e.pageX, e.pageY)\n})\n\n$("button").dblclick(function() {\n  console.log("双击")\n})\n\n// 鼠标按下/释放\n$("div").mousedown(function() {\n  console.log("按下")\n})\n$("div").mouseup(function() {\n  console.log("释放")\n})\n\n// 鼠标移动\n$("div").mousemove(function(e) {\n  console.log(e.clientX, e.clientY)\n})\n\n// 鼠标进入/离开\n$("div").mouseenter(function() {\n  console.log("进入")\n})\n$("div").mouseleave(function() {\n  console.log("离开")\n})\n\n// 悬停\n$("div").hover(\n  function() { $(this).addClass("hover") },\n  function() { $(this).removeClass("hover") }\n)</code></pre>',
    tags: ['click', 'hover', '鼠标事件']
  },
  'jquery-form': {
    title: '表单事件',
    body: '<p class="lead">表单交互事件。</p><pre><code>// 表单提交\n$("form").submit(function(e) {\n  e.preventDefault()\n  var data = $(this).serialize()  // 序列化表单数据\n  console.log(data)\n})\n\n// 输入变化\n$("input").change(function() {\n  console.log("值已改变", $(this).val())\n})\n\n// 实时输入\n$("input").on("input", function() {\n  console.log("输入中", $(this).val())\n})\n\n// 焦点\n$("input").focus(function() {\n  $(this).css("border-color", "blue")\n})\n$("input").blur(function() {\n  $(this).css("border-color", "")\n})\n\n// 选择变化\n$("select").change(function() {\n  console.log($("option:selected", this).val())\n})</code></pre>',
    tags: ['submit', 'change', 'focus']
  },
  'jquery-event-delegation': {
    title: '事件委托',
    body: '<p class="lead">事件委托用于处理动态添加的元素。</p><pre><code>// 传统绑定（对动态元素无效）\n$(".item").click(function() {})\n\n// 事件委托（推荐）\n$("ul").on("click", ".item", function() {\n  console.log("点击", $(this).text())\n})\n\n// 动态添加的元素自动响应\n$("button").click(function() {\n  $("ul").append("&lt;li class="item"&gt;新项目&lt;/li&gt;")\n})\n\n// 委托多个事件\n$("ul").on({\n  click: function() { console.log("click") },\n  mouseenter: function() { console.log("enter") }\n}, ".item")\n\n// 解除委托\n$("ul").off("click", ".item")</code></pre>',
    tags: ['事件委托', 'on', '动态元素']
  },
  'jquery-show-hide': {
    title: '显示/隐藏',
    body: '<p class="lead">控制元素的显示和隐藏。</p><pre><code>// 基本显示/隐藏\n$("div").show()          // 显示\n$("div").hide()          // 隐藏\n$("div").toggle()        // 切换显示/隐藏\n\n// 带动画\n$("div").show("slow")    // 慢速显示\n$("div").hide(500)       // 500ms 隐藏\n$("div").toggle("fast")  // 快速切换\n\n// 回调函数\n$("div").hide(300, function() {\n  console.log("隐藏完成")\n})\n\n// 检查可见性\nif ($("div").is(":visible")) {\n  console.log("可见")\n}</code></pre>',
    tags: ['show', 'hide', 'toggle']
  },
  'jquery-fade': {
    title: '淡入淡出',
    body: '<p class="lead">淡入淡出动画效果。</p><pre><code>// 淡入\n$("div").fadeIn()\n$("div").fadeIn(500)\n$("div").fadeIn("slow")\n\n// 淡出\n$("div").fadeOut()\n$("div").fadeOut(500)\n\n// 淡入淡出切换\n$("div").fadeToggle()\n$("div").fadeToggle(300)\n\n// 淡入到指定透明度\n$("div").fadeTo(500, 0.5)  // 500ms 淡入到 50% 透明度\n\n// 回调\n$("div").fadeOut(300, function() {\n  console.log("动画完成")\n})</code></pre>',
    tags: ['fadeIn', 'fadeOut', 'fadeTo']
  },
  'jquery-slide': {
    title: '滑动效果',
    body: '<p class="lead">滑动动画效果。</p><pre><code>// 向下滑动（显示）\n$("div").slideDown()\n$("div").slideDown(500)\n\n// 向上滑动（隐藏）\n$("div").slideUp()\n$("div").slideUp(300)\n\n// 切换滑动\n$("div").slideToggle()\n$("div").slideToggle("fast")\n\n// 回调\n$("div").slideUp(400, function() {\n  console.log("滑动完成")\n})\n\n// 手风琴效果\n$(".accordion").click(function() {\n  $(this).next().slideToggle()\n})</code></pre>',
    tags: ['slideDown', 'slideUp', 'slideToggle']
  },
  'jquery-animate': {
    title: '自定义动画',
    body: '<p class="lead">创建自定义 CSS 动画。</p><pre><code>// 基本动画\n$("div").animate({\n  left: "+=100px",\n  opacity: 0.5,\n  width: "200px",\n  fontSize: "20px"\n}, 500)\n\n// 多个属性\n$("div").animate({\n  left: "300px",\n  top: "200px",\n  opacity: 1\n}, 1000, "swing", function() {\n  console.log("动画完成")\n})\n\n// 链式动画\n$("div")\n  .animate({ left: "100px" }, 300)\n  .animate({ top: "100px" }, 300)\n  .animate({ left: "0px" }, 300)\n  .animate({ top: "0px" }, 300)\n\n// 停止动画\n$("div").stop()           // 停止当前动画\n$("div").stop(true)       // 停止所有动画\n$("div").stop(true, true) // 停止并跳转到结束状态\n\n// 延迟\n$("div").delay(1000).fadeOut()</code></pre>',
    tags: ['animate', 'stop', 'delay']
  },
  'jquery-ajax': {
    title: 'AJAX 简介',
    body: '<p class="lead">jQuery 提供简化的 AJAX 方法。</p><pre><code>// 加载 HTML\n$("#result").load("/api/data", function() {\n  console.log("加载完成")\n})\n\n// 带数据加载\n$("#result").load("/api/data", { id: 123 })\n\n// 加载完成回调\n$("#result").load("/api/data", function(response, status, xhr) {\n  if (status === "success") {\n    console.log("成功")\n  } else {\n    console.log("失败")\n  }\n})</code></pre>',
    tags: ['AJAX', 'load', '异步']
  },
  'jquery-get-post': {
    title: 'GET/POST 请求',
    body: '<p class="lead">简化的 GET 和 POST 请求方法。</p><pre><code>// GET 请求\n$.get("/api/users", function(data) {\n  console.log(data)\n})\n\n// 带参数\n$.get("/api/users", { id: 123 }, function(data) {\n  console.log(data)\n})\n\n// POST 请求\n$.post("/api/users", { name: "Alice", age: 25 }, function(data) {\n  console.log(data)\n})\n\n// 错误处理\n$.get("/api/users")\n  .done(function(data) { console.log(data) })\n  .fail(function(xhr) { console.error(xhr.statusText) })\n  .always(function() { console.log("完成") })\n\n// 使用 promise\n$.get("/api/users").then(function(data) {\n  return $.get("/api/posts")\n}).then(function(posts) {\n  console.log(posts)\n})</code></pre>',
    tags: ['$.get', '$.post', 'GET/POST']
  },
  'jquery-ajax-methods': {
    title: '$.ajax 方法',
    body: '<p class="lead">最完整的 AJAX 配置方法。</p><pre><code>$.ajax({\n  url: "/api/users",\n  method: "GET",\n  data: { page: 1, limit: 10 },\n  dataType: "json",\n  timeout: 5000,\n  beforeSend: function(xhr) {\n    xhr.setRequestHeader("Authorization", "Bearer token")\n  },\n  success: function(data) {\n    console.log(data)\n  },\n  error: function(xhr, status, error) {\n    console.error(error)\n  },\n  complete: function() {\n    console.log("请求完成")\n  }\n})\n\n// PUT 请求\n$.ajax({\n  url: "/api/users/1",\n  method: "PUT",\n  contentType: "application/json",\n  data: JSON.stringify({ name: "Alice" })\n})\n\n// DELETE 请求\n$.ajax({\n  url: "/api/users/1",\n  method: "DELETE"\n})</code></pre>',
    tags: ['$.ajax', '配置', '请求']
  },
  'jquery-json': {
    title: '处理 JSON',
    body: '<p class="lead">发送和接收 JSON 数据。</p><pre><code>// 发送 JSON\n$.ajax({\n  url: "/api/users",\n  method: "POST",\n  contentType: "application/json",\n  data: JSON.stringify({\n    name: "Alice",\n    age: 25,\n    email: "alice@example.com"\n  }),\n  dataType: "json",\n  success: function(response) {\n    console.log(response.id)\n  }\n})\n\n// 快捷方法发送 JSON\n$.post("/api/users", JSON.stringify(data))\n  .done(function(res) { console.log(res) })\n\n// 解析 JSON（$.getJSON）\n$.getJSON("/api/users/1", function(user) {\n  console.log(user.name)\n})</code></pre>',
    tags: ['JSON', '$.getJSON', 'contentType']
  },
  'jquery-utils': {
    title: '实用工具',
    body: '<p class="lead">jQuery 提供的实用工具方法。</p><pre><code>// 循环遍历\n$.each([1, 2, 3], function(index, value) {\n  console.log(index, value)\n})\n\n$.each($("li"), function(index, element) {\n  console.log($(element).text())\n})\n\n// 扩展对象\nvar obj1 = { a: 1, b: 2 }\nvar obj2 = { b: 3, c: 4 }\nvar merged = $.extend(obj1, obj2)        // 修改 obj1\nvar merged = $.extend({}, obj1, obj2)     // 新对象\nvar deep = $.extend(true, obj1, obj2)     // 深度合并\n\n// 类型检查\n$.isArray([])           // true\n$.isFunction(function(){}) // true\n$.isNumeric("123")      // true\n$.isEmptyObject({})     // true\n$.isPlainObject({})     // true\n\n// 去除空格\nvar trimmed = $.trim("  Hello  ")  // "Hello"\n\n// 解析 JSON\nvar obj = $.parseJSON(\'{"name":"Alice"}\')\n\n// 代理（绑定 this）\nvar obj = { name: "Alice", greet: function() { console.log(this.name) } }\nsetTimeout($.proxy(obj, "greet"), 1000)</code></pre>',
    tags: ['$.each', '$.extend', '工具']
  },
  'jquery-effects': {
    title: '效果方法',
    body: '<p class="lead">其他效果方法。</p><pre><code>// 滑动到顶部\n$(window).scrollTop(0)\n\n// 滚动到元素\n$("target").scrollIntoView()\n$("html, body").animate({ scrollTop: $("#target").offset().top }, 500)\n\n// 闪烁效果（需要插件或自定义）\nfunction blink(element) {\n  $(element).fadeOut(100).fadeIn(100)\n}\n\n// 脉冲效果\nfunction pulse(element) {\n  $(element).animate({ opacity: 0.5 }, 100).animate({ opacity: 1 }, 100)\n}\n\n// 震动效果\nfunction shake(element) {\n  $(element).animate({ left: "+=5px" }, 50)\n    .animate({ left: "-=10px" }, 100)\n    .animate({ left: "+=5px" }, 50)\n}</code></pre>',
    tags: ['效果', '滚动', '闪烁']
  },
  'jquery-plugins': {
    title: '插件开发',
    body: '<p class="lead">开发 jQuery 插件。</p><pre><code>// 基本插件结构\n$.fn.myPlugin = function(options) {\n  var settings = $.extend({\n    color: "red",\n    duration: 300\n  }, options)\n\n  return this.each(function() {\n    $(this).css("color", settings.color)\n    $(this).fadeIn(settings.duration)\n  })\n}\n\n// 使用插件\n$("div").myPlugin({ color: "blue" })\n\n// 链式调用\n$("div").myPlugin().addClass("active")\n\n// 带方法的插件\n$.fn.tooltip = function(action) {\n  if (action === "show") {\n    return this.each(function() {\n      // 显示逻辑\n    })\n  }\n  // 初始化\n  return this.each(function() {\n    // 初始化逻辑\n  })\n}\n\n// 全局函数插件\n$.myGlobalFunction = function() {\n  console.log("全局函数")\n}</code></pre>',
    tags: ['插件', '$.fn', '扩展']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 jQuery 官方文档获取更多信息。</p>',
        tags: ['jQuery', 'JavaScript库']
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

addLink('jquery-intro', 'jquery-install')
addLink('jquery-install', 'jquery-ready')
addLink('jquery-selectors', 'jquery-filter')
addLink('jquery-filter', 'jquery-traversal')
addLink('jquery-manipulation', 'jquery-attributes')
addLink('jquery-attributes', 'jquery-css')
addLink('jquery-css', 'jquery-add-remove')
addLink('jquery-events', 'jquery-mouse')
addLink('jquery-mouse', 'jquery-form')
addLink('jquery-form', 'jquery-event-delegation')
addLink('jquery-show-hide', 'jquery-fade')
addLink('jquery-fade', 'jquery-slide')
addLink('jquery-slide', 'jquery-animate')
addLink('jquery-ajax', 'jquery-get-post')
addLink('jquery-get-post', 'jquery-ajax-methods')
addLink('jquery-ajax-methods', 'jquery-json')
addLink('jquery-utils', 'jquery-effects')
addLink('jquery-effects', 'jquery-plugins')

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