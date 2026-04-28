<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">页面交互知识库</h1>
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
          <h2>🖱️ <span class="gradient-text">页面交互完全指南</span></h2>
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
          <p>🖱️ 打造流畅的页面交互体验</p>
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
          <h3>🔗 页面交互知识图谱 <span class="graph-badge">ECharts</span></h3>
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

// ========== 页面交互导航数据 ==========
const navSections = ref([
  { title: '📖 事件基础', items: [
      { id: 'event-intro', label: '事件模型', hot: true },
      { id: 'event-types', label: '事件类型', hot: true },
      { id: 'event-listener', label: '事件监听', hot: true },
      { id: 'event-object', label: '事件对象', hot: true }
    ]},
  { title: '🔄 事件传播', items: [
      { id: 'event-bubbling', label: '事件冒泡', hot: true },
      { id: 'event-capturing', label: '事件捕获', hot: true },
      { id: 'event-delegation', label: '事件委托', hot: true },
      { id: 'event-prevention', label: '阻止默认行为', hot: true }
    ]},
  { title: '🖱️ 鼠标与键盘', items: [
      { id: 'mouse-events', label: '鼠标事件', hot: true },
      { id: 'keyboard-events', label: '键盘事件', hot: true },
      { id: 'drag-drop', label: '拖拽操作', hot: true },
      { id: 'pointer-events', label: '指针事件', hot: true }
    ]},
  { title: '📱 表单与输入', items: [
      { id: 'form-events', label: '表单事件', hot: true },
      { id: 'input-validation', label: '输入验证', hot: true },
      { id: 'autocomplete', label: '自动完成', hot: true },
      { id: 'clipboard', label: '剪贴板操作', hot: true }
    ]},
  { title: '🎨 视觉与动画', items: [
      { id: 'css-animation', label: 'CSS 动画', hot: true },
      { id: 'js-animation', label: 'JS 动画', hot: true },
      { id: 'transition', label: '过渡效果', hot: true },
      { id: 'loading-states', label: '加载状态', hot: true }
    ]},
  { title: '📜 滚动与视图', items: [
      { id: 'scroll-events', label: '滚动事件', hot: true },
      { id: 'scroll-effects', label: '滚动效果', hot: true },
      { id: 'intersection', label: '交叉观察器', hot: true },
      { id: 'resize-events', label: '视口变化', hot: true }
    ]},
  { title: '💬 反馈与通知', items: [
      { id: 'tooltips', label: '工具提示', hot: true },
      { id: 'modals', label: '模态框', hot: true },
      { id: 'toast-notifications', label: 'Toast 通知', hot: true },
      { id: 'loading-indicators', label: '加载指示器', hot: true }
    ]}
])

const selectedId = ref('event-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== 页面交互内容映射表 ==========
const contentMap = {
  'event-intro': {
    title: '事件模型',
    body: '<p class="lead">事件模型是页面交互的核心，定义了用户操作与程序响应之间的通信机制。</p><h3>核心概念</h3><ul><li><strong>事件</strong>：用户操作或浏览器行为触发的信号</li><li><strong>事件监听器</strong>：响应事件的函数</li><li><strong>事件传播</strong>：事件在 DOM 树中的传递过程</li><li><strong>事件对象</strong>：携带事件相关信息</li></ul><div class="note">💡 事件驱动编程是现代 Web 交互的基础。</div>',
    tags: ['事件模型', 'DOM', '交互基础']
  },
  'event-types': {
    title: '事件类型',
    body: '<p class="lead">JavaScript 支持丰富的事件类型。</p><pre><code>// 鼠标事件\nclick, dblclick, mousedown, mouseup, mousemove\nmouseenter, mouseleave, mouseover, mouseout\n\n// 键盘事件\nkeydown, keyup, keypress\n\n// 表单事件\nsubmit, change, focus, blur, input, reset\n\n// 文档/窗口事件\nload, DOMContentLoaded, resize, scroll, beforeunload\n\n// 触摸事件\ntouchstart, touchmove, touchend, touchcancel\n\n// 剪贴板事件\ncut, copy, paste\n\n// 拖拽事件\ndragstart, drag, dragend, dragenter, dragleave, dragover, drop</code></pre>',
    tags: ['事件类型', '鼠标', '键盘']
  },
  'event-listener': {
    title: '事件监听',
    body: '<p class="lead">添加和移除事件监听器的方法。</p><pre><code>// addEventListener（推荐）\nelement.addEventListener("click", handleClick)\nelement.addEventListener("click", handleClick, { once: true })\nelement.addEventListener("click", handleClick, { capture: true })\n\n// 移除监听器\nelement.removeEventListener("click", handleClick)\n\n// 传统方式（不推荐，会覆盖）\nelement.onclick = handleClick\nelement.onclick = null\n\n// 内联事件（不推荐）\n&lt;button onclick="handleClick()"&gt;点击&lt;/button&gt;\n\n// 一次性监听\nelement.addEventListener("click", handler, { once: true })</code></pre>',
    tags: ['addEventListener', '事件绑定', '监听器']
  },
  'event-object': {
    title: '事件对象',
    body: '<p class="lead">事件对象包含事件的相关信息。</p><pre><code>element.addEventListener("click", (event) => {\n  console.log(event.type)        // 事件类型\n  console.log(event.target)      // 触发事件的元素\n  console.log(event.currentTarget) // 绑定事件的元素\n  console.log(event.timeStamp)   // 时间戳\n  \n  // 鼠标事件属性\n  console.log(event.clientX, event.clientY)  // 相对于视口\n  console.log(event.pageX, event.pageY)      // 相对于页面\n  console.log(event.screenX, event.screenY)  // 相对于屏幕\n  console.log(event.button)      // 按下的鼠标按钮\n  console.log(event.ctrlKey)     // Ctrl 键是否按下\n  \n  // 键盘事件属性\n  console.log(event.key)         // 按下的键值\n  console.log(event.code)        // 物理键码\n  console.log(event.shiftKey)    // Shift 键是否按下\n})</code></pre>',
    tags: ['事件对象', 'event', '属性']
  },
  'event-bubbling': {
    title: '事件冒泡',
    body: '<p class="lead">事件冒泡是指事件从目标元素向上传播到根元素。</p><pre><code>&lt;div id="parent"&gt;\n  &lt;button id="child"&gt;点击我&lt;/button&gt;\n&lt;/div&gt;\n\n&lt;script&gt;\ndocument.getElementById("parent").addEventListener("click", () => {\n  console.log("父元素触发")\n})\n\ndocument.getElementById("child").addEventListener("click", () => {\n  console.log("子元素触发")\n})\n\n// 点击按钮输出顺序：\n// "子元素触发" → "父元素触发"\n\n// 阻止冒泡\nelement.addEventListener("click", (event) => {\n  event.stopPropagation()\n})\n&lt;/script&gt;</code></pre>',
    tags: ['事件冒泡', 'stopPropagation', '传播']
  },
  'event-capturing': {
    title: '事件捕获',
    body: '<p class="lead">事件捕获是从根元素向下传播到目标元素。</p><pre><code>// 使用捕获阶段（第三个参数为 true）\nparent.addEventListener("click", () => {\n  console.log("父元素捕获")\n}, true)\n\nchild.addEventListener("click", () => {\n  console.log("子元素目标")\n})\n\n// 传播顺序\n// 1. 捕获阶段（从根到目标）\n// 2. 目标阶段\n// 3. 冒泡阶段（从目标到根）\n\n// 同时监听捕获和冒泡\nparent.addEventListener("click", handlerCapture, true)\nparent.addEventListener("click", handlerBubble, false)</code></pre>',
    tags: ['事件捕获', 'capture', '传播阶段']
  },
  'event-delegation': {
    title: '事件委托',
    body: '<p class="lead">事件委托利用事件冒泡，在父元素上统一处理子元素的事件。</p><pre><code>// 传统方式（性能差）\ndocument.querySelectorAll("li").forEach(li => {\n  li.addEventListener("click", handleClick)\n})\n\n// 事件委托（推荐）\nconst list = document.querySelector("ul")\nlist.addEventListener("click", (event) => {\n  if (event.target.tagName === "LI") {\n    console.log("点击了:", event.target.textContent)\n    event.target.classList.toggle("active")\n  }\n})\n\n// 更精确的委托\nlist.addEventListener("click", (event) => {\n  if (event.target.matches("li.item")) {\n    // 处理特定类名的 li\n  }\n  if (event.target.closest(".item")) {\n    // 处理最近匹配的祖先\n  }\n})\n\n// 动态添加的元素自动享受事件处理\nconst newLi = document.createElement("li")\nnewLi.textContent = "新项目"\nlist.appendChild(newLi)</code></pre>',
    tags: ['事件委托', '性能优化', '动态元素']
  },
  'event-prevention': {
    title: '阻止默认行为',
    body: '<p class="lead">阻止浏览器默认行为。</p><pre><code>// 阻止链接跳转\nlink.addEventListener("click", (event) => {\n  event.preventDefault()\n  console.log("链接被阻止")\n})\n\n// 阻止表单提交\nform.addEventListener("submit", (event) => {\n  event.preventDefault()\n  // 自定义提交逻辑\n})\n\n// 阻止右键菜单\ndocument.addEventListener("contextmenu", (event) => {\n  event.preventDefault()\n  // 显示自定义菜单\n})\n\n// 阻止文本选择\ndocument.addEventListener("selectstart", (event) => {\n  event.preventDefault()\n})\n\n// 阻止双击选中文本\ndocument.addEventListener("mousedown", (event) => {\n  if (event.detail > 1) {\n    event.preventDefault()\n  }\n})</code></pre>',
    tags: ['preventDefault', '默认行为', '阻止']
  },
  'mouse-events': {
    title: '鼠标事件',
    body: '<p class="lead">鼠标交互的各种事件。</p><pre><code>// 点击事件\nelement.onclick = () => console.log("单击")\nelement.ondblclick = () => console.log("双击")\n\n// 鼠标按下/释放\nelement.onmousedown = (e) => console.log("按下", e.button)\nelement.onmouseup = () => console.log("释放")\n\n// 鼠标移动\nelement.onmousemove = (e) => console.log(e.clientX, e.clientY)\n\n// 鼠标进入/离开\nelement.onmouseenter = () => console.log("进入")\nelement.onmouseleave = () => console.log("离开")\n\n// 悬停效果\nbutton.addEventListener("mouseenter", () => {\n  button.style.backgroundColor = "blue"\n})\nbutton.addEventListener("mouseleave", () => {\n  button.style.backgroundColor = ""\n})\n\n// 鼠标坐标跟踪\nconst tracker = document.getElementById("tracker")\ndocument.addEventListener("mousemove", (e) => {\n  tracker.textContent = `X: ${e.clientX}, Y: ${e.clientY}`\n})</code></pre>',
    tags: ['鼠标事件', 'click', 'hover']
  },
  'keyboard-events': {
    title: '键盘事件',
    body: '<p class="lead">键盘交互事件处理。</p><pre><code>// 键盘事件\ndocument.addEventListener("keydown", (e) => {\n  console.log(`按下: ${e.key}, 代码: ${e.code}`)\n  \n  // 组合键检测\n  if (e.ctrlKey && e.key === "s") {\n    e.preventDefault()\n    console.log("保存快捷键触发")\n  }\n  \n  if (e.altKey && e.key === "ArrowLeft") {\n    console.log("后退")\n  }\n})\n\ndocument.addEventListener("keyup", (e) => {\n  console.log(`释放: ${e.key}`)\n})\n\n// 常用快捷键\n// Ctrl + C: 复制\n// Ctrl + V: 粘贴\n// Ctrl + Z: 撤销\n// Ctrl + Y: 重做\n// Ctrl + F: 搜索\n// Esc: 取消/关闭\n\n// 输入框限制\ninput.addEventListener("keydown", (e) => {\n  if (!/\\d/.test(e.key) && e.key !== "Backspace") {\n    e.preventDefault()\n  }\n})</code></pre>',
    tags: ['键盘事件', '快捷键', 'keydown']
  },
  'drag-drop': {
    title: '拖拽操作',
    body: '<p class="lead">实现元素的拖拽功能。</p><pre><code>&lt;div draggable="true" id="drag"&gt;拖拽我&lt;/div&gt;\n\nconst dragElement = document.getElementById("drag")\nconst dropZone = document.getElementById("drop")\n\n// 拖拽开始\ndragElement.addEventListener("dragstart", (e) => {\n  e.dataTransfer.setData("text/plain", e.target.id)\n  e.dataTransfer.effectAllowed = "copy"\n})\n\n// 拖拽进入\ndropZone.addEventListener("dragenter", (e) => {\n  e.preventDefault()\n  dropZone.classList.add("drag-over")\n})\n\n// 拖拽经过\ndropZone.addEventListener("dragover", (e) => {\n  e.preventDefault()\n})\n\n// 拖拽离开\ndropZone.addEventListener("dragleave", (e) => {\n  dropZone.classList.remove("drag-over")\n})\n\n// 放置\ndropZone.addEventListener("drop", (e) => {\n  e.preventDefault()\n  const id = e.dataTransfer.getData("text/plain")\n  const dragged = document.getElementById(id)\n  dropZone.appendChild(dragged)\n  dropZone.classList.remove("drag-over")\n})\n\n// 拖拽结束\ndragElement.addEventListener("dragend", (e) => {\n  console.log("拖拽结束")\n})</code></pre>',
    tags: ['拖拽', 'drag and drop', 'HTML5拖拽']
  },
  'pointer-events': {
    title: '指针事件',
    body: '<p class="lead">统一处理鼠标、触摸、手写笔等输入设备。</p><pre><code>// 指针事件（Pointer Events）\nelement.addEventListener("pointerdown", (e) => {\n  console.log(`指针类型: ${e.pointerType}`)  // mouse, touch, pen\n  console.log(`压力: ${e.pressure}`)\n  console.log(`倾斜: ${e.tiltX}, ${e.tiltY}`)\n})\n\nelement.addEventListener("pointermove", (e) => {\n  console.log(e.clientX, e.clientY)\n})\n\nelement.addEventListener("pointerup", (e) => {\n  console.log("指针抬起")\n})\n\n// 触摸事件（移动端）\nelement.addEventListener("touchstart", (e) => {\n  console.log(`触摸点数量: ${e.touches.length}`)\n  const touch = e.touches[0]\n  console.log(touch.clientX, touch.clientY)\n})\n\nelement.addEventListener("touchmove", (e) => {\n  e.preventDefault()\n})\n\nelement.addEventListener("touchend", (e) => {\n  console.log("触摸结束")\n})\n\n// 手势识别\nlet startX, startY\nelement.addEventListener("touchstart", (e) => {\n  startX = e.touches[0].clientX\n  startY = e.touches[0].clientY\n})\n\nelement.addEventListener("touchmove", (e) => {\n  const deltaX = e.touches[0].clientX - startX\n  const deltaY = e.touches[0].clientY - startY\n  \n  if (Math.abs(deltaX) > Math.abs(deltaY)) {\n    console.log(deltaX > 0 ? "向右滑动" : "向左滑动")\n  } else {\n    console.log(deltaY > 0 ? "向下滑动" : "向上滑动")\n  }\n})</code></pre>',
    tags: ['指针事件', '触摸事件', '手势']
  },
  'form-events': {
    title: '表单事件',
    body: '<p class="lead">表单元素的交互事件处理。</p><pre><code>// 输入事件\ninput.addEventListener("input", (e) => {\n  console.log("输入内容:", e.target.value)\n})\n\n// 焦点事件\ninput.addEventListener("focus", () => {\n  console.log("获得焦点")\n  input.style.borderColor = "blue"\n})\n\ninput.addEventListener("blur", () => {\n  console.log("失去焦点")\n})\n\n// 变化事件（适用于 select, checkbox, radio）\nselect.addEventListener("change", (e) => {\n  console.log("选中值:", e.target.value)\n})\n\n// 表单提交\nform.addEventListener("submit", (e) => {\n  e.preventDefault()\n  const formData = new FormData(form)\n  console.log(Object.fromEntries(formData))\n})\n\n// 表单重置\nform.addEventListener("reset", () => {\n  console.log("表单已重置")\n})</code></pre>',
    tags: ['表单事件', 'input', 'submit']
  },
  'input-validation': {
    title: '输入验证',
    body: '<p class="lead">实时验证用户输入。</p><pre><code>// 实时验证\nconst emailInput = document.getElementById("email")\nconst errorSpan = document.getElementById("error")\n\nemailInput.addEventListener("input", (e) => {\n  const value = e.target.value\n  const isValid = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value)\n  \n  if (!isValid && value) {\n    errorSpan.textContent = "请输入有效的邮箱地址"\n    emailInput.classList.add("invalid")\n  } else {\n    errorSpan.textContent = ""\n    emailInput.classList.remove("invalid")\n  }\n})\n\n// 字符计数\nconst textarea = document.getElementById("bio")\nconst counter = document.getElementById("counter")\nconst maxLength = 200\n\ntextarea.addEventListener("input", (e) => {\n  const remaining = maxLength - e.target.value.length\n  counter.textContent = `${remaining} 字符剩余`\n  \n  if (remaining < 0) {\n    e.target.value = e.target.value.slice(0, maxLength)\n    counter.style.color = "red"\n  } else {\n    counter.style.color = ""\n  }\n})\n\n// 密码强度检测\npasswordInput.addEventListener("input", (e) => {\n  const password = e.target.value\n  let strength = 0\n  \n  if (password.length >= 8) strength++\n  if (/[a-z]/.test(password)) strength++\n  if (/[A-Z]/.test(password)) strength++\n  if (/\\d/.test(password)) strength++\n  if (/[^a-zA-Z\\d]/.test(password)) strength++\n  \n  updateStrengthIndicator(strength)\n})</code></pre>',
    tags: ['表单验证', '实时验证', '输入检测']
  },
  autocomplete: {
    title: '自动完成',
    body: '<p class="lead">实现搜索框的自动完成功能。</p><pre><code>// 简单的自动完成\nconst searchInput = document.getElementById("search")\nconst suggestions = document.getElementById("suggestions")\nconst data = ["Apple", "Banana", "Orange", "Grape", "Watermelon"]\n\nsearchInput.addEventListener("input", (e) => {\n  const value = e.target.value.toLowerCase()\n  const filtered = data.filter(item => \n    item.toLowerCase().includes(value)\n  )\n  \n  suggestions.innerHTML = filtered.map(item =>\n    `&lt;div class="suggestion"&gt;${item}&lt;/div&gt;`\n  ).join("")\n  \n  suggestions.style.display = filtered.length ? "block" : "none"\n})\n\n// 防抖优化\nlet debounceTimer\nsearchInput.addEventListener("input", (e) => {\n  clearTimeout(debounceTimer)\n  debounceTimer = setTimeout(() => {\n    // 执行搜索\n    fetchSuggestions(e.target.value)\n  }, 300)\n})\n\n// 键盘导航\nlet selectedIndex = -1\ndocument.addEventListener("keydown", (e) => {\n  if (e.key === "ArrowDown") {\n    selectedIndex++\n    highlightSuggestion(selectedIndex)\n  } else if (e.key === "ArrowUp") {\n    selectedIndex--\n    highlightSuggestion(selectedIndex)\n  } else if (e.key === "Enter") {\n    selectSuggestion(selectedIndex)\n  }\n})</code></pre>',
    tags: ['自动完成', '搜索建议', '防抖']
  },
  clipboard: {
    title: '剪贴板操作',
    body: '<p class="lead">读取和写入剪贴板。</p><pre><code>// 复制文本\nasync function copyText(text) {\n  try {\n    await navigator.clipboard.writeText(text)\n    console.log("复制成功")\n    showToast("已复制到剪贴板")\n  } catch (err) {\n    console.error("复制失败:", err)\n    fallbackCopy(text)\n  }\n}\n\n// 降级复制\nfunction fallbackCopy(text) {\n  const textarea = document.createElement("textarea")\n  textarea.value = text\n  document.body.appendChild(textarea)\n  textarea.select()\n  document.execCommand("copy")\n  document.body.removeChild(textarea)\n}\n\n// 读取剪贴板\nasync function pasteText() {\n  try {\n    const text = await navigator.clipboard.readText()\n    console.log("粘贴内容:", text)\n    return text\n  } catch (err) {\n    console.error("读取失败:", err)\n  }\n}\n\n// 监听粘贴事件\ndocument.addEventListener("paste", async (e) => {\n  const items = e.clipboardData.items\n  for (const item of items) {\n    if (item.type.indexOf("image") !== -1) {\n      const blob = item.getAsFile()\n      displayImage(blob)\n    }\n  }\n})\n\n// 复制按钮\n&lt;button onclick="copyText(\'要复制的文本\')"&gt;复制&lt;/button&gt;</code></pre>',
    tags: ['剪贴板', '复制粘贴', 'clipboard']
  },
  'css-animation': {
    title: 'CSS 动画',
    body: '<p class="lead">使用 CSS 实现动画效果。</p><pre><code>&lt;!-- 过渡效果 --&gt;\n&lt;style&gt;\n.button {\n  transition: all 0.3s ease;\n}\n.button:hover {\n  transform: scale(1.1);\n  background: #8B5CF6;\n}\n&lt;/style&gt;\n\n&lt;!-- 关键帧动画 --&gt;\n&lt;style&gt;\n@keyframes fadeIn {\n  from { opacity: 0; transform: translateY(20px); }\n  to { opacity: 1; transform: translateY(0); }\n}\n\n.fade-in {\n  animation: fadeIn 0.5s ease-out;\n}\n\n@keyframes spin {\n  to { transform: rotate(360deg); }\n}\n\n.spinner {\n  animation: spin 1s linear infinite;\n}\n&lt;/style&gt;\n\n// JS 控制动画\nconst element = document.querySelector(".fade-in")\nelement.addEventListener("animationend", () => {\n  console.log("动画结束")\n})\n\nelement.classList.add("fade-in")\n\n// 使用 Web Animations API\nelement.animate([\n  { opacity: 0, transform: "translateY(20px)" },\n  { opacity: 1, transform: "translateY(0)" }\n], {\n  duration: 500,\n  easing: "ease-out"\n})</code></pre>',
    tags: ['CSS动画', '过渡', '关键帧']
  },
  'js-animation': {
    title: 'JS 动画',
    body: '<p class="lead">使用 JavaScript 实现动画效果。</p><pre><code>// requestAnimationFrame\nfunction animate(element, target) {\n  let start = null\n  const startPosition = element.offsetLeft\n  const distance = target - startPosition\n  \n  function step(timestamp) {\n    if (!start) start = timestamp\n    const progress = timestamp - start\n    const percent = Math.min(progress / 500, 1)\n    \n    element.style.left = startPosition + (distance * percent) + "px"\n    \n    if (progress < 500) {\n      requestAnimationFrame(step)\n    }\n  }\n  \n  requestAnimationFrame(step)\n}\n\n// 平滑滚动\nfunction smoothScroll(target) {\n  const element = document.querySelector(target)\n  element.scrollIntoView({\n    behavior: "smooth",\n    block: "start"\n  })\n}\n\n// 数字递增动画\nfunction animateNumber(element, start, end, duration = 1000) {\n  const increment = (end - start) / (duration / 16)\n  let current = start\n  \n  const timer = setInterval(() => {\n    current += increment\n    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {\n      current = end\n      clearInterval(timer)\n    }\n    element.textContent = Math.floor(current)\n  }, 16)\n}</code></pre>',
    tags: ['JS动画', 'requestAnimationFrame', '平滑滚动']
  },
  transition: {
    title: '过渡效果',
    body: '<p class="lead">创建流畅的过渡效果。</p><pre><code>// 页面切换过渡\n.page-enter-active, .page-leave-active {\n  transition: opacity 0.3s ease;\n}\n.page-enter-from, .page-leave-to {\n  opacity: 0;\n}\n\n// 手风琴效果\n.accordion-content {\n  max-height: 0;\n  overflow: hidden;\n  transition: max-height 0.3s ease-out;\n}\n.accordion-content.open {\n  max-height: 500px;\n}\n\n// 悬停效果卡片\n.card {\n  transition: transform 0.2s, box-shadow 0.2s;\n}\n.card:hover {\n  transform: translateY(-4px);\n  box-shadow: 0 10px 25px rgba(0,0,0,0.1);\n}\n\n// 淡入淡出\n.fade {\n  transition: opacity 0.3s;\n}\n.fade.hide {\n  opacity: 0;\n  pointer-events: none;\n}</code></pre>',
    tags: ['过渡', 'transition', '动画效果']
  },
  'loading-states': {
    title: '加载状态',
    body: '<p class="lead">管理页面的加载状态。</p><pre><code>// 骨架屏\n&lt;div class="skeleton"&gt;\n  &lt;div class="skeleton-line"&gt;&lt;/div&gt;\n  &lt;div class="skeleton-line short"&gt;&lt;/div&gt;\n&lt;/div&gt;\n\n&lt;style&gt;\n.skeleton-line {\n  height: 20px;\n  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);\n  background-size: 200% 100%;\n  animation: loading 1.5s infinite;\n}\n\n@keyframes loading {\n  0% { background-position: 200% 0; }\n  100% { background-position: -200% 0; }\n}\n&lt;/style&gt;\n\n// 加载按钮状态\nasync function submitForm() {\n  const button = event.target\n  const originalText = button.textContent\n  \n  button.disabled = true\n  button.textContent = "提交中..."\n  \n  try {\n    await api.submit()\n    button.textContent = "提交成功"\n  } catch (error) {\n    button.textContent = "提交失败"\n  } finally {\n    setTimeout(() => {\n      button.disabled = false\n      button.textContent = originalText\n    }, 2000)\n  }\n}\n\n// 全局加载指示器\nlet loadingCount = 0\n\nfunction showLoading() {\n  if (loadingCount === 0) {\n    document.getElementById("global-loader").style.display = "flex"\n  }\n  loadingCount++\n}\n\nfunction hideLoading() {\n  loadingCount--\n  if (loadingCount === 0) {\n    document.getElementById("global-loader").style.display = "none"\n  }\n}</code></pre>',
    tags: ['加载状态', '骨架屏', 'loading']
  },
  'scroll-events': {
    title: '滚动事件',
    body: '<p class="lead">监听和处理页面滚动。</p><pre><code>// 基本滚动监听\nwindow.addEventListener("scroll", () => {\n  const scrollY = window.scrollY\n  console.log("滚动位置:", scrollY)\n})\n\n// 防抖优化\nlet scrollTimer\nwindow.addEventListener("scroll", () => {\n  clearTimeout(scrollTimer)\n  scrollTimer = setTimeout(() => {\n    console.log("滚动结束:", window.scrollY)\n  }, 150)\n})\n\n// 节流优化\nlet ticking = false\nwindow.addEventListener("scroll", () => {\n  if (!ticking) {\n    requestAnimationFrame(() => {\n      console.log(window.scrollY)\n      ticking = false\n    })\n    ticking = true\n  }\n})\n\n// 导航栏吸顶\nconst header = document.querySelector("header")\nconst sticky = header.offsetTop\n\nwindow.addEventListener("scroll", () => {\n  if (window.scrollY > sticky) {\n    header.classList.add("sticky")\n  } else {\n    header.classList.remove("sticky")\n  }\n})\n\n// 返回顶部按钮\nconst backToTop = document.getElementById("backToTop")\nwindow.addEventListener("scroll", () => {\n  if (window.scrollY > 300) {\n    backToTop.style.display = "block"\n  } else {\n    backToTop.style.display = "none"\n  }\n})\n\nbackToTop.addEventListener("click", () => {\n  window.scrollTo({ top: 0, behavior: "smooth" })\n})</code></pre>',
    tags: ['滚动事件', '节流', '吸顶']
  },
  'scroll-effects': {
    title: '滚动效果',
    body: '<p class="lead">创建视差滚动和滚动动画效果。</p><pre><code>// 视差滚动\nwindow.addEventListener("scroll", () => {\n  const scrolled = window.scrollY\n  const parallax = document.querySelector(".parallax")\n  parallax.style.transform = `translateY(${scrolled * 0.5}px)`\n})\n\n// 滚动时改变透明度\nconst hero = document.querySelector(".hero")\nwindow.addEventListener("scroll", () => {\n  const opacity = 1 - window.scrollY / 500\n  hero.style.opacity = Math.max(0, opacity)\n})\n\n// 滚动时元素淡入\nconst fadeElements = document.querySelectorAll(".fade-on-scroll")\n\nconst fadeObserver = new IntersectionObserver((entries) => {\n  entries.forEach(entry => {\n    if (entry.isIntersecting) {\n      entry.target.classList.add("visible")\n      fadeObserver.unobserve(entry.target)\n    }\n  })\n}, { threshold: 0.1 })\n\nfadeElements.forEach(el => fadeObserver.observe(el))\n\n// 滚动进度条\nwindow.addEventListener("scroll", () => {\n  const scrollTop = window.scrollY\n  const docHeight = document.documentElement.scrollHeight - window.innerHeight\n  const progress = (scrollTop / docHeight) * 100\n  document.querySelector(".progress-bar").style.width = `${progress}%`\n})</code></pre>',
    tags: ['滚动效果', '视差', '滚动动画']
  },
  intersection: {
    title: '交叉观察器',
    body: '<p class="lead">监听元素与视口的交叉状态。</p><pre><code>// 创建观察器\nconst observer = new IntersectionObserver((entries) => {\n  entries.forEach(entry => {\n    if (entry.isIntersecting) {\n      console.log("元素进入视口", entry.target)\n      entry.target.classList.add("visible")\n      observer.unobserve(entry.target)\n    }\n  })\n}, {\n  threshold: 0.5,\n  rootMargin: "0px"\n})\n\n// 观察元素\ndocument.querySelectorAll(".lazy").forEach(el => observer.observe(el))\n\n// 图片懒加载\nconst imageObserver = new IntersectionObserver((entries) => {\n  entries.forEach(entry => {\n    if (entry.isIntersecting) {\n      const img = entry.target\n      img.src = img.dataset.src\n      imageObserver.unobserve(img)\n    }\n  })\n})\n\ndocument.querySelectorAll("img[data-src]").forEach(img => {\n  imageObserver.observe(img)\n})\n\n// 无限滚动\nconst sentinel = document.getElementById("sentinel")\nconst loadMoreObserver = new IntersectionObserver((entries) => {\n  if (entries[0].isIntersecting) {\n    loadMoreItems()\n  }\n})\nloadMoreObserver.observe(sentinel)\n\n// 广告曝光追踪\nconst adObserver = new IntersectionObserver((entries) => {\n  entries.forEach(entry => {\n    if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {\n      console.log("广告曝光:", entry.target)\n      reportImpression(entry.target.id)\n    }\n  })\n}, { threshold: 0.5 })</code></pre>',
    tags: ['Intersection Observer', '懒加载', '无限滚动']
  },
  'resize-events': {
    title: '视口变化',
    body: '<p class="lead">监听窗口和元素尺寸变化。</p><pre><code>// 窗口大小变化\nlet resizeTimer\nwindow.addEventListener("resize", () => {\n  clearTimeout(resizeTimer)\n  resizeTimer = setTimeout(() => {\n    console.log(`窗口大小: ${window.innerWidth} x ${window.innerHeight}`)\n    adjustLayout()\n  }, 250)\n})\n\n// 响应式断点检测\nfunction checkBreakpoint() {\n  const width = window.innerWidth\n  if (width < 768) {\n    console.log("移动端布局")\n  } else if (width < 1024) {\n    console.log("平板布局")\n  } else {\n    console.log("桌面布局")\n  }\n}\n\nwindow.addEventListener("resize", checkBreakpoint)\n\n// ResizeObserver 监听元素尺寸\nconst element = document.querySelector(".resizable")\nconst resizeObserver = new ResizeObserver((entries) => {\n  for (const entry of entries) {\n    console.log("元素尺寸:", entry.contentRect.width, entry.contentRect.height)\n  }\n})\nresizeObserver.observe(element)\n\n// 响应式图片加载\nfunction updateImageSrc() {\n  const img = document.getElementById("responsive-img")\n  if (window.innerWidth < 768) {\n    img.src = img.dataset.mobile\n  } else {\n    img.src = img.dataset.desktop\n  }\n}\n\nwindow.addEventListener("resize", updateImageSrc)\nupdateImageSrc()</code></pre>',
    tags: ['resize', '视口', '响应式']
  },
  tooltips: {
    title: '工具提示',
    body: '<p class="lead">创建自定义工具提示。</p><pre><code>&lt;div class="tooltip" data-tip="提示内容"&gt;悬停我&lt;/div&gt;\n\n&lt;style&gt;\n.tooltip {\n  position: relative;\n}\n.tooltip::before {\n  content: attr(data-tip);\n  position: absolute;\n  bottom: 100%;\n  left: 50%;\n  transform: translateX(-50%);\n  background: #333;\n  color: white;\n  padding: 4px 8px;\n  border-radius: 4px;\n  font-size: 12px;\n  white-space: nowrap;\n  opacity: 0;\n  pointer-events: none;\n  transition: opacity 0.2s;\n}\n.tooltip:hover::before {\n  opacity: 1;\n}\n&lt;/style&gt;</code></pre>',
    tags: ['工具提示', 'tooltip', '提示框']
  },
  modals: {
    title: '模态框',
    body: '<p class="lead">创建模态对话框。</p><pre><code>class Modal {\n  constructor(options) {\n    this.title = options.title || "提示"\n    this.content = options.content || ""\n    this.onConfirm = options.onConfirm || (() => {})\n    this.onCancel = options.onCancel || (() => {})\n    this.create()\n  }\n  \n  create() {\n    this.overlay = document.createElement("div")\n    this.overlay.className = "modal-overlay"\n    \n    this.modal = document.createElement("div")\n    this.modal.className = "modal"\n    \n    this.modal.innerHTML = `\n      &lt;div class="modal-header"&gt;\n        &lt;h3&gt;${this.title}&lt;/h3&gt;\n        &lt;button class="close"&gt;&amp;times;&lt;/button&gt;\n      &lt;/div&gt;\n      &lt;div class="modal-body"&gt;${this.content}&lt;/div&gt;\n      &lt;div class="modal-footer"&gt;\n        &lt;button class="btn-cancel"&gt;取消&lt;/button&gt;\n        &lt;button class="btn-confirm"&gt;确认&lt;/button&gt;\n      &lt;/div&gt;\n    `\n    \n    this.overlay.appendChild(this.modal)\n    document.body.appendChild(this.overlay)\n    this.bindEvents()\n    this.show()\n  }\n  \n  bindEvents() {\n    this.modal.querySelector(".close").onclick = () => this.close()\n    this.modal.querySelector(".btn-cancel").onclick = () => this.close()\n    this.modal.querySelector(".btn-confirm").onclick = () => {\n      this.onConfirm()\n      this.close()\n    }\n    this.overlay.onclick = (e) => {\n      if (e.target === this.overlay) this.close()\n    }\n  }\n  \n  show() {\n    this.overlay.style.display = "flex"\n    setTimeout(() => this.modal.classList.add("show"), 10)\n  }\n  \n  close() {\n    this.modal.classList.remove("show")\n    setTimeout(() => this.overlay.remove(), 300)\n  }\n}\n\nnew Modal({\n  title: "确认删除",\n  content: "确定要删除这条记录吗？",\n  onConfirm: () => console.log("已删除")\n})</code></pre>',
    tags: ['模态框', '对话框', '弹窗']
  },
  'toast-notifications': {
    title: 'Toast 通知',
    body: '<p class="lead">创建临时通知提示。</p><pre><code>class Toast {\n  static show(message, type = "info", duration = 3000) {\n    const toast = document.createElement("div")\n    toast.className = `toast toast-${type}`\n    toast.textContent = message\n    \n    document.body.appendChild(toast)\n    \n    setTimeout(() => toast.classList.add("show"), 10)\n    \n    setTimeout(() => {\n      toast.classList.remove("show")\n      setTimeout(() => toast.remove(), 300)\n    }, duration)\n  }\n  \n  static success(message) { this.show(message, "success") }\n  static error(message) { this.show(message, "error") }\n  static warning(message) { this.show(message, "warning") }\n  static info(message) { this.show(message, "info") }\n}\n\nToast.success("操作成功！")\nToast.error("操作失败！")\n\n.toast {\n  position: fixed;\n  bottom: 20px;\n  left: 50%;\n  transform: translateX(-50%) translateY(100px);\n  padding: 12px 24px;\n  border-radius: 8px;\n  background: #333;\n  color: white;\n  opacity: 0;\n  transition: all 0.3s ease;\n  z-index: 10000;\n}\n\n.toast.show {\n  transform: translateX(-50%) translateY(0);\n  opacity: 1;\n}\n\n.toast-success { background: #10b981; }\n.toast-error { background: #ef4444; }\n.toast-warning { background: #f59e0b; }\n.toast-info { background: #3b82f6; }</code></pre>',
    tags: ['Toast', '通知', '提示']
  },
  'loading-indicators': {
    title: '加载指示器',
    body: '<p class="lead">创建加载动画和指示器。</p><pre><code>&lt;div class="spinner"&gt;&lt;/div&gt;\n\n&lt;style&gt;\n.spinner {\n  width: 40px;\n  height: 40px;\n  border: 4px solid #f3f3f3;\n  border-top: 4px solid #8B5CF6;\n  border-radius: 50%;\n  animation: spin 1s linear infinite;\n}\n\n@keyframes spin {\n  0% { transform: rotate(0deg); }\n  100% { transform: rotate(360deg); }\n}\n&lt;/style&gt;\n\n// 脉冲点动画\n.pulse-dots {\n  display: flex;\n  gap: 8px;\n}\n\n.pulse-dots div {\n  width: 8px;\n  height: 8px;\n  background: #8B5CF6;\n  border-radius: 50%;\n  animation: pulse 1.4s infinite ease-in-out both;\n}\n\n.pulse-dots div:nth-child(1) { animation-delay: -0.32s; }\n.pulse-dots div:nth-child(2) { animation-delay: -0.16s; }\n\n@keyframes pulse {\n  0%, 80%, 100% { transform: scale(0); opacity: 0.5; }\n  40% { transform: scale(1); opacity: 1; }\n}\n\n// 骨架屏加载\n.skeleton-card {\n  background: #f0f0f0;\n  border-radius: 8px;\n  padding: 20px;\n  position: relative;\n  overflow: hidden;\n}\n\n.skeleton-card::after {\n  content: "";\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100%;\n  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);\n  animation: shimmer 1.5s infinite;\n}\n\n@keyframes shimmer {\n  0% { transform: translateX(-100%); }\n  100% { transform: translateX(100%); }\n}</code></pre>',
    tags: ['加载动画', 'spinner', '骨架屏']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 MDN 交互文档获取更多信息。</p>',
        tags: ['页面交互', '前端']
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

addLink('event-intro', 'event-types')
addLink('event-types', 'event-listener')
addLink('event-listener', 'event-object')
addLink('event-bubbling', 'event-capturing')
addLink('event-capturing', 'event-delegation')
addLink('event-delegation', 'event-prevention')
addLink('mouse-events', 'keyboard-events')
addLink('keyboard-events', 'drag-drop')
addLink('drag-drop', 'pointer-events')
addLink('form-events', 'input-validation')
addLink('input-validation', 'autocomplete')
addLink('autocomplete', 'clipboard')
addLink('css-animation', 'js-animation')
addLink('js-animation', 'transition')
addLink('transition', 'loading-states')
addLink('scroll-events', 'scroll-effects')
addLink('scroll-effects', 'intersection')
addLink('intersection', 'resize-events')
addLink('tooltips', 'modals')
addLink('modals', 'toast-notifications')
addLink('toast-notifications', 'loading-indicators')

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