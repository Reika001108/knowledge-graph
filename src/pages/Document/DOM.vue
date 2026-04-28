<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">DOM 知识库</h1>
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
      <!-- 左侧导航 -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>🌳 <span class="gradient-text">DOM 完全指南</span></h2>
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
          <p>🌳 文档对象模型 | 网页编程接口</p>
          <p>✨ 点击节点双向联动 | 前端基石</p>
        </div>
      </aside>

      <!-- 中间内容区 -->
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

      <!-- 右侧图谱 -->
      <aside class="graph-panel">
        <div class="graph-header">
          <h3>🔗 DOM 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'DOM开发者'
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

// ========== DOM 导航数据 ==========
const navSections = ref([
  { title: '📖 基础概念', items: [
      { id: 'dom-intro', label: 'DOM 简介', hot: true },
      { id: 'dom-tree', label: 'DOM 树结构', hot: true },
      { id: 'node-types', label: '节点类型', hot: true },
      { id: 'document-object', label: 'Document 对象', hot: true }
    ]},
  { title: '🔍 元素选择与遍历', items: [
      { id: 'selectors', label: '选择器方法', hot: true },
      { id: 'traversal', label: '节点遍历', hot: true },
      { id: 'collections', label: 'HTMLCollection vs NodeList', hot: true }
    ]},
  { title: '✏️ DOM 操作', items: [
      { id: 'create-elements', label: '创建元素', hot: true },
      { id: 'modify-elements', label: '修改元素', hot: true },
      { id: 'remove-elements', label: '删除元素', hot: true },
      { id: 'innerHTML', label: 'innerHTML 与 textContent', hot: true }
    ]},
  { title: '🎨 属性与样式', items: [
      { id: 'attributes', label: '属性操作', hot: true },
      { id: 'classlist', label: 'classList 操作', hot: true },
      { id: 'styles', label: '样式操作', hot: true },
      { id: 'dataset', label: 'data-* 属性', hot: true }
    ]},
  { title: '🖱️ 事件处理', items: [
      { id: 'events', label: '事件模型', hot: true },
      { id: 'event-listener', label: '事件监听', hot: true },
      { id: 'event-propagation', label: '事件传播', hot: true },
      { id: 'event-delegation', label: '事件委托', hot: true }
    ]},
  { title: '📐 尺寸与位置', items: [
      { id: 'dimensions', label: '元素尺寸', hot: true },
      { id: 'positions', label: '元素位置', hot: true },
      { id: 'scroll', label: '滚动控制', hot: true },
      { id: 'viewport', label: '视口尺寸', hot: true }
    ]},
  { title: '⚡ 高级特性', items: [
      { id: 'observer-api', label: 'Observer API', hot: true },
      { id: 'virtual-dom', label: '虚拟 DOM', hot: true },
      { id: 'shadow-dom', label: 'Shadow DOM', hot: true }
    ]}
])

const selectedId = ref('dom-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== DOM 内容映射表 ==========
const contentMap = {
  'dom-intro': {
    title: 'DOM 简介',
    body: '<p class="lead">DOM（Document Object Model，文档对象模型）是 HTML 和 XML 文档的编程接口，它将文档表示为节点树，允许程序和脚本动态访问和修改文档内容、结构和样式。</p><h3>核心概念</h3><ul><li><strong>文档表示</strong>：将 HTML/XML 文档表示为树形结构</li><li><strong>语言中立</strong>：多种语言（JavaScript、Python 等）都可实现</li><li><strong>动态更新</strong>：可以实时修改页面内容</li><li><strong>标准化</strong>：由 W3C 维护的跨平台标准</li></ul><div class="note">💡 DOM 将网页与脚本连接起来，是前端开发的核心基础。</div>',
    tags: ['文档对象模型', 'API', 'W3C标准']
  },
  'dom-tree': {
    title: 'DOM 树结构',
    body: '<p class="lead">DOM 将 HTML 文档表示为树形结构，每个 HTML 元素都是树中的一个节点。</p><pre><code>&lt;html&gt;\n├── &lt;head&gt;\n│   ├── &lt;title&gt;页面标题&lt;/title&gt;\n│   └── &lt;meta charset="UTF-8"&gt;\n└── &lt;body&gt;\n    ├── &lt;h1&gt;主标题&lt;/h1&gt;\n    ├── &lt;div class="container"&gt;\n    │   ├── &lt;p&gt;段落1&lt;/p&gt;\n    │   └── &lt;p&gt;段落2&lt;/p&gt;\n    └── &lt;footer&gt;页脚&lt;/footer&gt;\n\n// 访问节点关系\nconst html = document.documentElement;      // &lt;html&gt; 根元素\nconst head = document.head;                 // &lt;head&gt; 元素\nconst body = document.body;                 // &lt;body&gt; 元素\nconst firstChild = body.firstChild;         // 第一个子节点\nconst lastChild = body.lastChild;           // 最后一个子节点\nconst parent = body.parentNode;             // 父节点</code></pre>',
    tags: ['树结构', '节点', '层次']
  },
  'node-types': {
    title: '节点类型',
    body: '<p class="lead">DOM 中的每个部分都是节点，不同类型的节点有不同的特性和用途。</p><pre><code>// 节点类型常量\nNode.ELEMENT_NODE === 1      // 元素节点（如 &lt;div&gt;）\nNode.ATTRIBUTE_NODE === 2    // 属性节点（已废弃）\nNode.TEXT_NODE === 3         // 文本节点\nNode.COMMENT_NODE === 8      // 注释节点\nNode.DOCUMENT_NODE === 9     // 文档节点\nNode.DOCUMENT_TYPE_NODE === 10 // 文档类型节点\n\n// 检查节点类型\nconst element = document.querySelector(\'div\');\nconsole.log(element.nodeType);     // 1\nconsole.log(element.nodeName);     // \'DIV\'\nconsole.log(element.tagName);      // \'DIV\'\n\nconst textNode = element.firstChild;\nconsole.log(textNode.nodeType);    // 3\nconsole.log(textNode.nodeValue);   // 文本内容</code></pre>',
    tags: ['节点类型', 'nodeType', 'nodeName']
  },
  'document-object': {
    title: 'Document 对象',
    body: '<p class="lead">Document 对象是 DOM 树的入口，提供了访问和操作文档的属性和方法。</p><pre><code>// 文档属性\nconsole.log(document.title);        // 页面标题\nconsole.log(document.URL);          // 当前 URL\nconsole.log(document.domain);       // 域名\nconsole.log(document.referrer);     // 来源页面\nconsole.log(document.cookie);       // Cookie\n\n// 文档方法\ndocument.write(\'&lt;p&gt;动态写入&lt;/p&gt;\');   // 写入 HTML\ndocument.open();                     // 打开文档流\ndocument.close();                    // 关闭文档流\n\n// 获取特定元素\ndocument.documentElement;            // &lt;html&gt; 元素\ndocument.head;                       // &lt;head&gt; 元素\ndocument.body;                       // &lt;body&gt; 元素\ndocument.forms;                      // 所有表单\ndocument.images;                     // 所有图片\ndocument.links;                      // 所有链接</code></pre>',
    tags: ['Document', '文档对象', '入口']
  },
  selectors: {
    title: '选择器方法',
    body: '<p class="lead">DOM 提供了多种方法来选择页面中的元素。</p><pre><code>// 单个元素选择\nconst element = document.getElementById(\'myId\');           // 通过 ID\nconst element = document.querySelector(\'.myClass\');       // CSS 选择器（第一个）\nconst element = document.querySelector(\'div\');            // 标签选择器\n\n// 多个元素选择\nconst elements = document.getElementsByClassName(\'myClass\');   // 通过类名（HTMLCollection）\nconst elements = document.getElementsByTagName(\'div\');         // 通过标签名（HTMLCollection）\nconst elements = document.getElementsByName(\'username\');       // 通过 name 属性\nconst elements = document.querySelectorAll(\'.myClass\');       // CSS 选择器（NodeList）\n\n// 性能比较\n// getElementById 和 getElementsByClassName 性能最佳\n// querySelector 更灵活但稍慢\n\n// 示例：选择所有 .item 元素\nconst items = document.querySelectorAll(\'.item\');\nitems.forEach(item => console.log(item));</code></pre>',
    tags: ['选择器', 'querySelector', 'getElementById']
  },
  traversal: {
    title: '节点遍历',
    body: '<p class="lead">在 DOM 树中移动和访问相邻节点。</p><pre><code>const element = document.querySelector(\'.container\');\n\n// 父节点\nconst parent = element.parentNode;\nconst parentElement = element.parentElement;\n\n// 子节点\nconst children = element.childNodes;        // 所有子节点（包括文本节点）\nconst childrenElements = element.children;   // 只包含元素子节点\nconst firstChild = element.firstChild;\nconst lastChild = element.lastChild;\nconst firstElementChild = element.firstElementChild;\nconst lastElementChild = element.lastElementChild;\n\n// 兄弟节点\nconst nextSibling = element.nextSibling;\nconst prevSibling = element.previousSibling;\nconst nextElement = element.nextElementSibling;\nconst prevElement = element.previousElementSibling;\n\n// 遍历所有子元素\nfor (let child of element.children) {\n  console.log(child);\n}</code></pre>',
    tags: ['遍历', '父子节点', '兄弟节点']
  },
  collections: {
    title: 'HTMLCollection vs NodeList',
    body: '<p class="lead">理解两种集合类型的区别对 DOM 操作至关重要。</p><pre><code>// HTMLCollection - 动态集合，实时更新\nconst divs = document.getElementsByTagName(\'div\');\nconsole.log(divs.length);\n// 添加新 div 后，divs.length 自动增加\n\n// NodeList - 通常是静态集合\nconst nodes = document.querySelectorAll(\'div\');\nconsole.log(nodes.length);\n// 添加新 div 后，nodes.length 不变\n\n// 将集合转换为数组\nconst array1 = Array.from(divs);\nconst array2 = [...divs];\nconst array3 = [].slice.call(nodes);\n\n// 遍历方式\nfor (let i = 0; i &lt; divs.length; i++) { }\nArray.from(divs).forEach(item => { });\nfor (let item of divs) { }</code></pre>',
    tags: ['HTMLCollection', 'NodeList', '动态集合']
  },
  'create-elements': {
    title: '创建元素',
    body: '<p class="lead">动态创建 DOM 元素并添加到页面中。</p><pre><code>// 创建元素\nconst div = document.createElement(\'div\');\nconst p = document.createElement(\'p\');\nconst text = document.createTextNode(\'Hello World\');\nconst comment = document.createComment(\'这是注释\');\n\n// 添加子节点\ndiv.appendChild(p);\np.appendChild(text);\n\n// 插入位置\nparent.appendChild(child);           // 末尾添加\nparent.insertBefore(newNode, ref);   // 参考节点前插入\nparent.prepend(child);               // 开头添加\nparent.append(child1, child2);       // 添加多个\nparent.replaceChild(newNode, old);   // 替换\n\n// 高级插入（字符串方式）\nelement.insertAdjacentHTML(\'beforebegin\', \'&lt;div&gt;&lt;/div&gt;\');\nelement.insertAdjacentHTML(\'afterbegin\', \'&lt;div&gt;&lt;/div&gt;\');\nelement.insertAdjacentHTML(\'beforeend\', \'&lt;div&gt;&lt;/div&gt;\');\nelement.insertAdjacentHTML(\'afterend\', \'&lt;div&gt;&lt;/div&gt;\');</code></pre>',
    tags: ['createElement', 'appendChild', '插入']
  },
  'modify-elements': {
    title: '修改元素',
    body: '<p class="lead">修改现有 DOM 元素的属性和内容。</p><pre><code>const element = document.querySelector(\'div\');\n\n// 修改文本内容\nelement.textContent = \'新文本\';           // 纯文本，安全\nelement.innerText = \'新文本\';            // 受 CSS 影响，触发重排\nelement.innerHTML = \'&lt;span&gt;HTML&lt;/span&gt;\'; // 解析 HTML\n\n// 复制节点\nconst clone = element.cloneNode(true);    // 深拷贝（包含子节点）\nconst cloneShallow = element.cloneNode(false); // 浅拷贝\n\n// 设置属性\nelement.id = \'newId\';\nelement.className = \'class1 class2\';\nelement.setAttribute(\'data-custom\', \'value\');\n\n// 获取属性\nconst id = element.id;\nconst custom = element.getAttribute(\'data-custom\');</code></pre>',
    tags: ['修改', 'textContent', 'innerHTML']
  },
  'remove-elements': {
    title: '删除元素',
    body: '<p class="lead">从 DOM 树中移除元素。</p><pre><code>const element = document.querySelector(\'.to-remove\');\nconst parent = element.parentNode;\n\n// 方法一：通过父节点删除\nparent.removeChild(element);\n\n// 方法二：直接删除（现代方法）\nelement.remove();\n\n// 清空所有子节点\nwhile (parent.firstChild) {\n  parent.removeChild(parent.firstChild);\n}\n\n// 清空内容（更高效）\nparent.innerHTML = \'\';\n\n// 移除属性\nelement.removeAttribute(\'disabled\');\nelement.removeAttribute(\'data-old\');</code></pre>',
    tags: ['remove', 'removeChild', '删除']
  },
  innerHTML: {
    title: 'innerHTML 与 textContent',
    body: '<p class="lead">innerHTML、textContent 和 innerText 的区别和使用场景。</p><pre><code>const div = document.querySelector(\'div\');\n\n// textContent - 获取/设置纯文本，忽略 HTML 标签\ndiv.textContent = \'&lt;span&gt;Hello&lt;/span&gt;\';  // 显示为字符串 &lt;span&gt;Hello&lt;/span&gt;\nconsole.log(div.textContent);\n\n// innerHTML - 获取/设置 HTML 内容，解析标签\ndiv.innerHTML = \'&lt;span&gt;Hello&lt;/span&gt;\';    // 显示为 Hello（带样式）\nconsole.log(div.innerHTML);\n\n// innerText - 近似于用户看到的文本（考虑 CSS）\nconsole.log(div.innerText);\n\n// 性能考虑\n// textContent 性能最佳，不触发重排\n// innerHTML 会触发重排，需注意 XSS 风险\n// 大量插入时使用 DocumentFragment</code></pre><div class="note">⚠️ 使用 innerHTML 时注意 XSS 攻击，不要插入用户输入内容。</div>',
    tags: ['innerHTML', 'textContent', 'innerText']
  },
  attributes: {
    title: '属性操作',
    body: '<p class="lead">操作元素的属性，包括标准属性和自定义属性。</p><pre><code>const element = document.querySelector(\'input\');\n\n// 标准属性（直接访问）\nelement.value = \'新值\';\nelement.type = \'text\';\nelement.disabled = true;\nelement.checked = true;\n\n// 通用属性方法\nelement.setAttribute(\'data-id\', \'123\');\nconst value = element.getAttribute(\'data-id\');\nconst hasAttr = element.hasAttribute(\'disabled\');\nelement.removeAttribute(\'disabled\');\n\n// 获取所有属性\nconst attributes = element.attributes;\nfor (let attr of attributes) {\n  console.log(attr.name, attr.value);\n}\n\n// 布尔属性\nelement.disabled = true;      // 设置\nelement.disabled = false;     // 移除</code></pre>',
    tags: ['属性', 'setAttribute', 'getAttribute']
  },
  classlist: {
    title: 'classList 操作',
    body: '<p class="lead">使用 classList API 方便地操作元素的 CSS 类。</p><pre><code>const element = document.querySelector(\'div\');\n\n// 添加类\nelement.classList.add(\'active\');\nelement.classList.add(\'highlight\', \'large\');  // 添加多个\n\n// 移除类\nelement.classList.remove(\'active\');\nelement.classList.remove(\'highlight\', \'large\');\n\n// 切换类\nelement.classList.toggle(\'active\');       // 存在则移除，不存在则添加\nelement.classList.toggle(\'active\', true); // 强制添加\n\n// 检查类\nif (element.classList.contains(\'active\')) {\n  console.log(\'有 active 类\');\n}\n\n// 替换类\nelement.classList.replace(\'old\', \'new\');\n\n// 获取类名（类数组）\nconsole.log(element.classList.length);\nconsole.log(element.classList[0]);</code></pre>',
    tags: ['classList', 'CSS类', 'add/remove']
  },
  styles: {
    title: '样式操作',
    body: '<p class="lead">动态修改元素的样式。</p><pre><code>const element = document.querySelector(\'div\');\n\n// 行内样式\nelement.style.color = \'red\';\nelement.style.backgroundColor = \'blue\';    // 驼峰命名\nelement.style.fontSize = \'16px\';\nelement.style.cssText = \'color: red; font-size: 16px;\';\n\n// 获取计算样式\nconst styles = getComputedStyle(element);\nconsole.log(styles.color);\nconsole.log(styles.fontSize);\n\n// 批量设置样式\nObject.assign(element.style, {\n  color: \'red\',\n  backgroundColor: \'blue\',\n  fontSize: \'16px\'\n});\n\n// 清除样式\nelement.style.color = \'\';\nelement.removeAttribute(\'style\');</code></pre>',
    tags: ['style', 'getComputedStyle', 'CSS']
  },
  dataset: {
    title: 'data-* 属性',
    body: '<p class="lead">使用 data-* 自定义属性存储数据。</p><pre><code>&lt;div id="user" data-id="123" data-name="John" data-role="admin"&gt;&lt;/div&gt;\n\n&lt;script&gt;\nconst div = document.querySelector(\'#user\');\n\n// 读取 data 属性\nconsole.log(div.dataset.id);      // \'123\'\nconsole.log(div.dataset.name);    // \'John\'\nconsole.log(div.dataset.role);    // \'admin\'\n\n// 写入 data 属性\ndiv.dataset.email = \'john@example.com\';\ndiv.dataset.isActive = \'true\';\n\n// 删除 data 属性\ndelete div.dataset.role;\n\n// data-* 与 dataset 的转换规则\n// data-user-id -&gt; dataset.userId\n// data-user-name -&gt; dataset.userName\n\n// 使用场景\n// - 存储元素相关的数据\n// - 事件处理中的配置\n// - 与 CSS 选择器配合 [data-*]\n&lt;/script&gt;</code></pre>',
    tags: ['dataset', 'data属性', '自定义数据']
  },
  events: {
    title: '事件模型',
    body: '<p class="lead">DOM 事件模型是处理用户交互的核心机制。</p><pre><code>// 事件类型分类\n// 鼠标事件：click, dblclick, mousedown, mouseup, mousemove\n// 键盘事件：keydown, keyup, keypress\n// 表单事件：submit, change, focus, blur, input\n// 文档事件：DOMContentLoaded, load, beforeunload\n// 触摸事件：touchstart, touchmove, touchend\n\n// 事件对象属性\nelement.addEventListener(\'click\', (event) => {\n  console.log(event.type);        // 事件类型\n  console.log(event.target);      // 触发事件的元素\n  console.log(event.currentTarget); // 绑定事件的元素\n  console.log(event.clientX);     // 鼠标 X 坐标\n  console.log(event.clientY);     // 鼠标 Y 坐标\n  console.log(event.key);         // 按下的键（键盘事件）\n});</code></pre>',
    tags: ['事件', 'event对象', '交互']
  },
  'event-listener': {
    title: '事件监听',
    body: '<p class="lead">注册和移除事件监听器的方法。</p><pre><code>function handleClick(event) {\n  console.log(\'点击了\', event.target);\n}\n\n// 添加事件监听\nelement.addEventListener(\'click\', handleClick);\nelement.addEventListener(\'click\', () => {\n  console.log(\'另一个监听器\');\n});\n\n// 一次性监听\nelement.addEventListener(\'click\', handler, { once: true });\n\n// 捕获阶段监听\nelement.addEventListener(\'click\', handler, { capture: true });\n\n// 移除事件监听（必须使用相同函数引用）\nelement.removeEventListener(\'click\', handleClick);\n\n// 传统方式（不推荐，会覆盖）\nelement.onclick = handleClick;\nelement.onclick = null;  // 移除\n\n// 内联事件（不推荐）\n&lt;button onclick="handleClick()"&gt;点击&lt;/button&gt;</code></pre>',
    tags: ['addEventListener', 'removeEventListener', '事件绑定']
  },
  'event-propagation': {
    title: '事件传播',
    body: '<p class="lead">理解事件传播的三个阶段：捕获、目标、冒泡。</p><pre><code>// 事件传播阶段\n// 1. 捕获阶段：从 window 向下到目标元素\n// 2. 目标阶段：到达目标元素\n// 3. 冒泡阶段：从目标元素向上到 window\n\n// 阻止传播\nelement.addEventListener(\'click\', (e) => {\n  e.stopPropagation();        // 阻止冒泡\n  e.stopImmediatePropagation(); // 阻止冒泡和当前元素的其他监听器\n});\n\n// 阻止默认行为\nelement.addEventListener(\'click\', (e) => {\n  e.preventDefault();  // 阻止链接跳转、表单提交等\n});\n\n// 利用冒泡实现事件委托\ndocument.querySelector(\'ul\').addEventListener(\'click\', (e) => {\n  if (e.target.tagName === \'LI\') {\n    console.log(\'点击了\', e.target.textContent);\n  }\n});</code></pre>',
    tags: ['冒泡', '捕获', 'stopPropagation']
  },
  'event-delegation': {
    title: '事件委托',
    body: '<p class="lead">利用事件冒泡机制，在父元素上统一处理子元素的事件。</p><pre><code>// 传统方式 - 为每个子元素绑定事件（性能差）\ndocument.querySelectorAll(\'li\').forEach(li => {\n  li.addEventListener(\'click\', () => {});\n});\n\n// 事件委托 - 父元素监听（推荐）\nconst list = document.querySelector(\'ul\');\nlist.addEventListener(\'click\', (e) => {\n  // 检查点击的是否是 li 元素\n  if (e.target.tagName === \'LI\') {\n    console.log(\'点击了\', e.target.textContent);\n    e.target.classList.toggle(\'active\');\n  }\n});\n\n// 处理动态添加的元素\n// 新添加的 li 自动享受事件处理\nconst newLi = document.createElement(\'li\');\nnewLi.textContent = \'新项目\';\nlist.appendChild(newLi);\n\n// 更精确的委托（使用 matches）\nlist.addEventListener(\'click\', (e) => {\n  if (e.target.matches(\'li.item\')) {\n    // 处理特定类名的 li\n  }\n});</code></pre><div class="note">🎯 事件委托减少监听器数量，自动处理动态元素，提升性能。</div>',
    tags: ['事件委托', '冒泡', '性能优化']
  },
  dimensions: {
    title: '元素尺寸',
    body: '<p class="lead">获取元素的尺寸信息。</p><pre><code>const element = document.querySelector(\'div\');\n\n// 内容尺寸\nconst width = element.clientWidth;      // 内容宽度 + padding\nconst height = element.clientHeight;    // 内容高度 + padding\n\n// 完整尺寸（包含滚动条）\nconst offsetWidth = element.offsetWidth;   // width + padding + border\nconst offsetHeight = element.offsetHeight;\n\n// 滚动尺寸\nconst scrollWidth = element.scrollWidth;   // 可滚动内容的宽度\nconst scrollHeight = element.scrollHeight; // 可滚动内容的高度\n\n// 获取精确边界\nconst rect = element.getBoundingClientRect();\nconsole.log(rect.top, rect.right, rect.bottom, rect.left);\nconsole.log(rect.width, rect.height);\n\n// 获取相对于视口的位置\nconst top = rect.top + window.scrollY;</code></pre>',
    tags: ['clientWidth', 'offsetWidth', 'getBoundingClientRect']
  },
  positions: {
    title: '元素位置',
    body: '<p class="lead">获取和设置元素的位置信息。</p><pre><code>const element = document.querySelector(\'div\');\n\n// 相对于 offsetParent 的偏移\nconst offsetTop = element.offsetTop;\nconst offsetLeft = element.offsetLeft;\n\n// 获取 offsetParent（最近的定位祖先）\nconst parent = element.offsetParent;\n\n// 获取相对于视口的位置\nconst rect = element.getBoundingClientRect();\nconsole.log(rect.top, rect.left);\n\n// 获取相对于文档的位置\nconst getPosition = (el) => {\n  let top = 0, left = 0;\n  while (el) {\n    top += el.offsetTop;\n    left += el.offsetLeft;\n    el = el.offsetParent;\n  }\n  return { top, left };\n};\n\n// 滚动到元素位置\nelement.scrollIntoView();\nelement.scrollIntoView({ behavior: \'smooth\', block: \'center\' });</code></pre>',
    tags: ['offsetTop', 'offsetLeft', '位置']
  },
  scroll: {
    title: '滚动控制',
    body: '<p class="lead">控制页面和元素的滚动行为。</p><pre><code>// 页面滚动\nwindow.scrollTo(0, 100);                    // 滚动到指定位置\nwindow.scrollTo({ top: 100, behavior: \'smooth\' }); // 平滑滚动\nwindow.scrollBy(0, 50);                     // 相对滚动\n\n// 获取滚动位置\nconst scrollY = window.scrollY;              // 垂直滚动距离\nconst scrollX = window.scrollX;              // 水平滚动距离\n\n// 元素滚动\nelement.scrollTop = 100;                     // 设置滚动位置\nelement.scrollTo({ top: 100, behavior: \'smooth\' });\nelement.scrollBy({ top: 50, behavior: \'smooth\' });\n\n// 滚动到视图\nelement.scrollIntoView();\nelement.scrollIntoView({ behavior: \'smooth\', block: \'center\' });\n\n// 监听滚动\nwindow.addEventListener(\'scroll\', () => {\n  console.log(window.scrollY);\n});</code></pre>',
    tags: ['scroll', 'scrollIntoView', '滚动']
  },
  viewport: {
    title: '视口尺寸',
    body: '<p class="lead">获取浏览器视口（可视区域）的尺寸信息。</p><pre><code>// 视口尺寸（不包含滚动条）\nconst viewportWidth = window.innerWidth;\nconst viewportHeight = window.innerHeight;\n\n// 文档总尺寸\nconst docWidth = document.documentElement.scrollWidth;\nconst docHeight = document.documentElement.scrollHeight;\n\n// 屏幕尺寸（设备屏幕）\nconst screenWidth = screen.width;\nconst screenHeight = screen.height;\n\n// 可用屏幕尺寸（排除任务栏）\nconst availWidth = screen.availWidth;\nconst availHeight = screen.availHeight;\n\n// 响应式检测\nconst isMobile = window.innerWidth &lt; 768;\n\n// 监听视口变化\nwindow.addEventListener(\'resize\', () => {\n  console.log(`视口大小: ${window.innerWidth} x ${window.innerHeight}`);\n});</code></pre>',
    tags: ['视口', 'innerWidth', 'resize']
  },
  'observer-api': {
    title: 'Observer API',
    body: '<p class="lead">现代浏览器提供的 Observer API 用于监测 DOM 变化。</p><pre><code>// MutationObserver - 监听 DOM 变化\nconst observer = new MutationObserver((mutations) => {\n  mutations.forEach(mutation => {\n    console.log(mutation.type, mutation.target);\n  });\n});\nobserver.observe(target, {\n  attributes: true,    // 属性变化\n  childList: true,     // 子节点变化\n  subtree: true        // 后代节点\n});\n\n// IntersectionObserver - 监听元素可见性\nconst io = new IntersectionObserver((entries) => {\n  entries.forEach(entry => {\n    if (entry.isIntersecting) {\n      console.log(\'元素进入视口\');\n    }\n  });\n});\nio.observe(element);\n\n// ResizeObserver - 监听元素尺寸变化\nconst ro = new ResizeObserver((entries) => {\n  for (let entry of entries) {\n    console.log(entry.contentRect.width, entry.contentRect.height);\n  }\n});\nro.observe(element);</code></pre>',
    tags: ['MutationObserver', 'IntersectionObserver', 'ResizeObserver']
  },
  'virtual-dom': {
    title: '虚拟 DOM',
    body: '<p class="lead">虚拟 DOM 是真实 DOM 的轻量级 JavaScript 表示，用于提升性能。</p><pre><code>// 虚拟节点表示\nconst vnode = {\n  tag: \'div\',\n  props: { id: \'app\', className: \'container\' },\n  children: [\n    { tag: \'h1\', props: {}, children: [\'Hello\'] },\n    { tag: \'p\', props: {}, children: [\'World\'] }\n  ]\n};\n\n// 简单渲染函数\nfunction render(vnode) {\n  if (typeof vnode === \'string\') {\n    return document.createTextNode(vnode);\n  }\n  const el = document.createElement(vnode.tag);\n  for (let [key, value] of Object.entries(vnode.props || {})) {\n    el.setAttribute(key, value);\n  }\n  (vnode.children || []).forEach(child => {\n    el.appendChild(render(child));\n  });\n  return el;\n}\n\n// diff 算法比较新旧虚拟 DOM，只更新变化部分</code></pre><div class="note">⚡ React 和 Vue 都使用虚拟 DOM 技术优化渲染性能。</div>',
    tags: ['虚拟DOM', 'diff算法', '性能优化']
  },
  'shadow-dom': {
    title: 'Shadow DOM',
    body: '<p class="lead">Shadow DOM 允许将 DOM 树封装在组件内部，实现样式和行为的隔离。</p><pre><code>// 创建 Shadow DOM\nconst host = document.querySelector(\'#host\');\nconst shadow = host.attachShadow({ mode: \'open\' });  // open 可外部访问\n\n// 添加内容\nshadow.innerHTML = `\n  &lt;style&gt;\n    p { color: red; }\n  &lt;/style&gt;\n  &lt;p&gt;这段文字是红色的&lt;/p&gt;\n  &lt;slot&gt;&lt;/slot&gt;\n`;\n\n// 外部样式不影响 Shadow DOM\n// Shadow DOM 内的样式也不会影响外部\n\n// 插槽使用\n// &lt;my-component&gt;\n//   &lt;span slot="title"&gt;自定义标题&lt;/span&gt;\n// &lt;/my-component&gt;\n\n// 模式选择\n// open: 外部可通过 element.shadowRoot 访问\n// closed: 外部无法访问</code></pre>',
    tags: ['Shadow DOM', 'Web Components', '封装']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 MDN DOM 文档获取更多信息。</p>',
        tags: ['DOM', 'Web API']
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

addLink('dom-intro', 'dom-tree')
addLink('dom-tree', 'node-types')
addLink('dom-tree', 'document-object')
addLink('dom-tree', 'selectors')
addLink('selectors', 'traversal')
addLink('selectors', 'collections')
addLink('dom-tree', 'create-elements')
addLink('create-elements', 'modify-elements')
addLink('modify-elements', 'remove-elements')
addLink('modify-elements', 'innerHTML')
addLink('attributes', 'classlist')
addLink('attributes', 'styles')
addLink('attributes', 'dataset')
addLink('events', 'event-listener')
addLink('event-listener', 'event-propagation')
addLink('event-propagation', 'event-delegation')
addLink('dimensions', 'positions')
addLink('positions', 'scroll')
addLink('dimensions', 'viewport')
addLink('observer-api', 'virtual-dom')
addLink('observer-api', 'shadow-dom')

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