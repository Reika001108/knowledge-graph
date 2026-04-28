<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">Vue 2 知识库</h1>
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
          <h2>🟢 <span class="gradient-text">Vue 2 完全指南</span></h2>
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
          <p>🟢 渐进式 JavaScript 框架 | 构建用户界面</p>
          <p>✨ 点击节点双向联动 | 从入门到精通</p>
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
          <h3>🔗 Vue 2 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'Vue开发者'
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

// ========== Vue 2 导航数据 ==========
const navSections = ref([
  { title: '🚀 快速入门', items: [
      { id: 'vue2-intro', label: 'Vue 2 简介', hot: true },
      { id: 'vue2-install', label: '安装与配置', hot: true },
      { id: 'vue2-instance', label: 'Vue 实例', hot: true }
    ]},
  { title: '📝 模板语法', items: [
      { id: 'vue2-template', label: '模板语法', hot: true },
      { id: 'vue2-directives', label: '内置指令', hot: true },
      { id: 'vue2-filters', label: '过滤器', hot: true }
    ]},
  { title: '🔧 核心特性', items: [
      { id: 'vue2-data', label: '数据与方法', hot: true },
      { id: 'vue2-computed', label: '计算属性', hot: true },
      { id: 'vue2-watchers', label: '侦听器', hot: true },
      { id: 'vue2-lifecycle', label: '生命周期', hot: true }
    ]},
  { title: '🧩 组件系统', items: [
      { id: 'vue2-components', label: '组件基础', hot: true },
      { id: 'vue2-props', label: 'Props 属性', hot: true },
      { id: 'vue2-events', label: '自定义事件', hot: true },
      { id: 'vue2-slots', label: '插槽', hot: true },
      { id: 'vue2-mixins', label: '混入', hot: true }
    ]},
  { title: '🌐 生态工具', items: [
      { id: 'vue2-router', label: 'Vue Router', hot: true },
      { id: 'vue2-vuex', label: 'Vuex 状态管理', hot: true },
      { id: 'vue2-cli', label: 'Vue CLI', hot: true },
      { id: 'vue2-devTools', label: 'DevTools', hot: true }
    ]},
  { title: '⚡ 高级特性', items: [
      { id: 'vue2-reactivity', label: '响应式原理', hot: true },
      { id: 'vue2-render', label: '渲染函数', hot: true },
      { id: 'vue2-transitions', label: '过渡动画', hot: true },
      { id: 'vue2-custom-directives', label: '自定义指令', hot: true }
    ]}
])

const selectedId = ref('vue2-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== Vue 2 内容映射表 ==========
const contentMap = {
  'vue2-intro': {
    title: 'Vue 2 简介',
    body: '<p class="lead">Vue.js 是一套用于构建用户界面的渐进式 JavaScript 框架，Vue 2 是其经典版本，于 2016 年发布，拥有庞大的生态系统和社区支持。</p><h3>核心特点</h3><ul><li><strong>渐进式</strong>：可逐步采用，从简单到复杂</li><li><strong>响应式</strong>：数据变化自动更新视图</li><li><strong>组件化</strong>：可复用的组件系统</li><li><strong>虚拟 DOM</strong>：高效渲染</li><li><strong>双向绑定</strong>：v-model 指令</li></ul><div class="note">💡 Vue 2 将于 2023 年 12 月 31 日结束支持，建议新项目使用 Vue 3。</div>',
    tags: ['Vue', '渐进式', '响应式']
  },
  'vue2-install': {
    title: '安装与配置',
    body: '<p class="lead">Vue 2 可以通过多种方式安装和使用。</p><pre><code>// CDN 引入\n&lt;script src="https://cdn.jsdelivr.net/npm/vue@2/dist/vue.js"&gt;&lt;/script&gt;\n\n// 生产环境\n&lt;script src="https://cdn.jsdelivr.net/npm/vue@2"&gt;&lt;/script&gt;\n\n// npm 安装\nnpm install vue@2\n\n// Vue CLI 创建项目\nnpm install -g @vue/cli\nvue create my-project\n\n// 基本使用\nconst app = new Vue({\n  el: "#app",\n  data: { message: "Hello Vue!" }\n})</code></pre>',
    tags: ['安装', 'CDN', 'Vue CLI']
  },
  'vue2-instance': {
    title: 'Vue 实例',
    body: '<p class="lead">每个 Vue 应用都是通过 Vue 函数创建一个新的 Vue 实例开始的。</p><pre><code>// 创建实例\nconst vm = new Vue({\n  el: "#app",\n  data: { message: "Hello" },\n  methods: {\n    greet() {\n      console.log(this.message)\n    }\n  },\n  computed: {\n    reversedMessage() {\n      return this.message.split("").reverse().join("")\n    }\n  },\n  watch: {\n    message(newVal, oldVal) {\n      console.log(newVal, oldVal)\n    }\n  }\n})\n\n// 实例属性和方法\nvm.$data   // 数据对象\nvm.$el     // 根 DOM 元素\nvm.$watch() // 观察实例数据\nvm.$mount() // 手动挂载</code></pre>',
    tags: ['实例', 'Vue对象', 'vm']
  },
  'vue2-template': {
    title: '模板语法',
    body: '<p class="lead">Vue.js 使用基于 HTML 的模板语法，允许声明式地将 DOM 绑定到底层实例数据。</p><pre><code>&lt;!-- 文本插值 --&gt;\n&lt;span&gt;{{ message }}&lt;/span&gt;\n&lt;span&gt;{{ message | capitalize }}&lt;/span&gt;\n\n&lt;!-- 原始 HTML --&gt;\n&lt;div v-html="rawHtml"&gt;&lt;/div&gt;\n\n&lt;!-- 属性绑定 --&gt;\n&lt;div v-bind:id="dynamicId"&gt;&lt;/div&gt;\n&lt;div :id="dynamicId"&gt;&lt;/div&gt;\n\n&lt;!-- 表达式 --&gt;\n{{ number + 1 }}\n{{ ok ? "YES" : "NO" }}\n{{ message.split("").reverse().join("") }}</code></pre>',
    tags: ['模板', '插值', '指令']
  },
  'vue2-directives': {
    title: '内置指令',
    body: '<p class="lead">Vue 提供了丰富的内置指令。</p><pre><code>&lt;!-- v-text --&gt;\n&lt;span v-text="message"&gt;&lt;/span&gt;\n\n&lt;!-- v-html --&gt;\n&lt;div v-html="html"&gt;&lt;/div&gt;\n\n&lt;!-- v-show --&gt;\n&lt;div v-show="isVisible"&gt;显示/隐藏&lt;/div&gt;\n\n&lt;!-- v-if / v-else / v-else-if --&gt;\n&lt;div v-if="type === "A"&gt;A&lt;/div&gt;\n&lt;div v-else-if="type === "B"&gt;B&lt;/div&gt;\n&lt;div v-else&gt;C&lt;/div&gt;\n\n&lt;!-- v-for --&gt;\n&lt;li v-for="item in items" :key="item.id"&gt;{{ item.text }}&lt;/li&gt;\n\n&lt;!-- v-on --&gt;\n&lt;button v-on:click="handleClick"&gt;点击&lt;/button&gt;\n&lt;button @click="handleClick"&gt;点击&lt;/button&gt;\n\n&lt;!-- v-bind --&gt;\n&lt;img v-bind:src="imageSrc"&gt;\n&lt;img :src="imageSrc"&gt;\n\n&lt;!-- v-model --&gt;\n&lt;input v-model="message"&gt;</code></pre>',
    tags: ['指令', 'v-if', 'v-for']
  },
  'vue2-filters': {
    title: '过滤器',
    body: '<p class="lead">过滤器用于文本格式化。</p><pre><code>// 定义过滤器\nVue.filter("capitalize", function(value) {\n  if (!value) return ""\n  return value.charAt(0).toUpperCase() + value.slice(1)\n})\n\n// 在模板中使用\n&lt;div&gt;{{ message | capitalize }}&lt;/div&gt;\n\n// 链式调用\n&lt;div&gt;{{ message | filterA | filterB }}&lt;/div&gt;\n\n// 传递参数\n&lt;div&gt;{{ date | formatDate("YYYY-MM-DD") }}&lt;/div&gt;</code></pre>',
    tags: ['过滤器', '格式化', '文本']
  },
  'vue2-data': {
    title: '数据与方法',
    body: '<p class="lead">Vue 实例的 data 对象存储数据，methods 存储方法。</p><pre><code>const vm = new Vue({\n  data: {\n    count: 0,\n    user: { name: "Alice", age: 25 }\n  },\n  methods: {\n    increment() {\n      this.count++\n    },\n    updateName(name) {\n      this.user.name = name\n    }\n  }\n})\n\n// 访问数据\nvm.count = 10\nvm.user.age = 26\n\n// 添加新属性（需要使用 Vue.set）\nVue.set(vm.user, "email", "alice@example.com")\n\n// 删除属性\nVue.delete(vm.user, "age")</code></pre>',
    tags: ['data', 'methods', '响应式']
  },
  'vue2-computed': {
    title: '计算属性',
    body: '<p class="lead">计算属性基于依赖缓存，只有依赖变化时才会重新计算。</p><pre><code>new Vue({\n  data: {\n    firstName: "John",\n    lastName: "Doe",\n    todos: [\n      { text: "学习 Vue", done: true },\n      { text: "构建应用", done: false }\n    ]\n  },\n  computed: {\n    fullName() {\n      return this.firstName + " " + this.lastName\n    },\n    completedTodos() {\n      return this.todos.filter(todo => todo.done)\n    },\n    // 带 getter 和 setter\n    fullNameWithSetter: {\n      get() {\n        return this.firstName + " " + this.lastName\n      },\n      set(newValue) {\n        const names = newValue.split(" ")\n        this.firstName = names[0]\n        this.lastName = names[1]\n      }\n    }\n  }\n})</code></pre>',
    tags: ['计算属性', 'computed', '缓存']
  },
  'vue2-watchers': {
    title: '侦听器',
    body: '<p class="lead">侦听器用于监听数据变化并执行异步或开销较大的操作。</p><pre><code>new Vue({\n  data: {\n    question: "",\n    answer: "等待输入..."\n  },\n  watch: {\n    question(newVal, oldVal) {\n      this.getAnswer(newVal)\n    },\n    // 深度监听\n    user: {\n      handler(newVal) {\n        console.log("user changed", newVal)\n      },\n      deep: true\n    },\n    // 立即执行\n    count: {\n      handler(val) {\n        console.log("count changed", val)\n      },\n      immediate: true\n    }\n  },\n  methods: {\n    getAnswer(question) {\n      // 异步请求\n      fetch(`/api/answer?q=${question}`)\n        .then(res => res.json())\n        .then(data => this.answer = data.answer)\n    }\n  }\n})</code></pre>',
    tags: ['watch', '侦听器', '异步']
  },
  'vue2-lifecycle': {
    title: '生命周期',
    body: '<p class="lead">Vue 实例从创建到销毁的完整生命周期。</p><pre><code>new Vue({\n  beforeCreate() {\n    console.log("实例初始化前")\n  },\n  created() {\n    console.log("实例创建完成")\n    // 可访问 data、methods\n  },\n  beforeMount() {\n    console.log("挂载前")\n  },\n  mounted() {\n    console.log("挂载完成")\n    // 可访问 DOM\n  },\n  beforeUpdate() {\n    console.log("更新前")\n  },\n  updated() {\n    console.log("更新完成")\n  },\n  beforeDestroy() {\n    console.log("销毁前")\n    // 清理定时器、取消订阅等\n  },\n  destroyed() {\n    console.log("销毁完成")\n  }\n})</code></pre>',
    tags: ['生命周期', '钩子', 'mounted']
  },
  'vue2-components': {
    title: '组件基础',
    body: '<p class="lead">组件是可复用的 Vue 实例。</p><pre><code>// 全局注册\nVue.component("my-button", {\n  template: "&lt;button @click="handleClick"&gt;{{ text }}&lt;/button&gt;",\n  data() {\n    return { text: "按钮" }\n  },\n  methods: {\n    handleClick() {\n      console.log("点击")\n    }\n  }\n})\n\n// 局部注册\nconst MyComponent = {\n  template: "&lt;div&gt;局部组件&lt;/div&gt;"\n}\n\nnew Vue({\n  components: { MyComponent }\n})\n\n// 单文件组件 (.vue)\n// &lt;template&gt;...&lt;/template&gt;\n// &lt;script&gt;...&lt;/script&gt;\n// &lt;style&gt;...&lt;/style&gt;</code></pre>',
    tags: ['组件', '注册', '复用']
  },
  'vue2-props': {
    title: 'Props 属性',
    body: '<p class="lead">Props 用于父组件向子组件传递数据。</p><pre><code>// 子组件\nVue.component("child", {\n  props: ["message"],\n  props: {\n    message: String,\n    count: {\n      type: Number,\n      default: 0,\n      required: true\n    },\n    user: {\n      type: Object,\n      default() {\n        return { name: "Guest" }\n      }\n    },\n    tags: {\n      type: Array,\n      validator(value) {\n        return value.length > 0\n      }\n    }\n  },\n  template: "&lt;div&gt;{{ message }}&lt;/div&gt;"\n})\n\n// 父组件\n&lt;child message="Hello" :count="10" :user="user" /&gt;</code></pre>',
    tags: ['props', '属性', '数据传递']
  },
  'vue2-events': {
    title: '自定义事件',
    body: '<p class="lead">子组件通过 $emit 向父组件发送事件。</p><pre><code>// 子组件\nVue.component("child", {\n  template: "&lt;button @click="sendEvent"&gt;点击&lt;/button&gt;",\n  methods: {\n    sendEvent() {\n      this.$emit("custom-event", { data: "from child" })\n    }\n  }\n})\n\n// 父组件\n&lt;child @custom-event="handleEvent" /&gt;\n\nnew Vue({\n  methods: {\n    handleEvent(payload) {\n      console.log(payload.data)\n    }\n  }\n})\n\n// 使用 .sync 修饰符\n&lt;child :title.sync="title" /&gt;\n// 子组件中 this.$emit("update:title", newTitle)</code></pre>',
    tags: ['$emit', '自定义事件', '事件通信']
  },
  'vue2-slots': {
    title: '插槽',
    body: '<p class="lead">插槽用于内容分发。</p><pre><code>// 子组件\nVue.component("child", {\n  template: `\n    &lt;div class="card"&gt;\n      &lt;div class="header"&gt;\n        &lt;slot name="header"&gt;默认头部&lt;/slot&gt;\n      &lt;/div&gt;\n      &lt;div class="body"&gt;\n        &lt;slot&gt;默认内容&lt;/slot&gt;\n      &lt;/div&gt;\n      &lt;div class="footer"&gt;\n        &lt;slot name="footer"&gt;默认底部&lt;/slot&gt;\n      &lt;/div&gt;\n    &lt;/div&gt;\n  `\n})\n\n// 父组件\n&lt;child&gt;\n  &lt;template v-slot:header&gt;\n    &lt;h1&gt;自定义标题&lt;/h1&gt;\n  &lt;/template&gt;\n  &lt;p&gt;自定义内容&lt;/p&gt;\n  &lt;template #footer&gt;\n    &lt;button&gt;操作&lt;/button&gt;\n  &lt;/template&gt;\n&lt;/child&gt;</code></pre>',
    tags: ['插槽', 'slot', '内容分发']
  },
  'vue2-mixins': {
    title: '混入',
    body: '<p class="lead">混入用于分发可复用功能。</p><pre><code>// 定义混入\nconst myMixin = {\n  data() {\n    return {\n      mixinData: "来自混入"\n    }\n  },\n  created() {\n    console.log("混入的钩子")\n  },\n  methods: {\n    mixinMethod() {\n      console.log("混入的方法")\n    }\n  }\n}\n\n// 使用混入\nnew Vue({\n  mixins: [myMixin],\n  created() {\n    console.log(this.mixinData)\n    this.mixinMethod()\n  }\n})\n\n// 全局混入（谨慎使用）\nVue.mixin({\n  methods: {\n    globalMethod() {}\n  }\n})</code></pre>',
    tags: ['mixins', '混入', '复用']
  },
  'vue2-router': {
    title: 'Vue Router',
    body: '<p class="lead">Vue Router 是 Vue.js 的官方路由管理器。</p><pre><code>// 安装\nnpm install vue-router@3\n\n// 配置路由\nimport Vue from "vue"\nimport VueRouter from "vue-router"\nimport Home from "./views/Home.vue"\n\nVue.use(VueRouter)\n\nconst routes = [\n  { path: "/", component: Home },\n  { path: "/about", component: () => import("./views/About.vue") },\n  { path: "/user/:id", component: User, props: true }\n]\n\nconst router = new VueRouter({\n  mode: "history",\n  routes\n})\n\nnew Vue({ router }).$mount("#app")\n\n// 使用\n&lt;router-link to="/"&gt;首页&lt;/router-link&gt;\n&lt;router-view&gt;&lt;/router-view&gt;</code></pre>',
    tags: ['Vue Router', '路由', '导航']
  },
  'vue2-vuex': {
    title: 'Vuex 状态管理',
    body: '<p class="lead">Vuex 是 Vue.js 的状态管理模式。</p><pre><code>// 安装\nnpm install vuex@3\n\n// 创建 store\nimport Vue from "vue"\nimport Vuex from "vuex"\n\nVue.use(Vuex)\n\nconst store = new Vuex.Store({\n  state: {\n    count: 0,\n    user: null\n  },\n  getters: {\n    doubleCount: state => state.count * 2\n  },\n  mutations: {\n    increment(state) {\n      state.count++\n    },\n    setUser(state, user) {\n      state.user = user\n    }\n  },\n  actions: {\n    async fetchUser({ commit }, id) {\n      const user = await api.getUser(id)\n      commit("setUser", user)\n    }\n  }\n})\n\n// 在组件中使用\ncomputed: {\n  count() {\n    return this.$store.state.count\n  },\n  doubleCount() {\n    return this.$store.getters.doubleCount\n  }\n},\nmethods: {\n  increment() {\n    this.$store.commit("increment")\n  },\n  fetchUser() {\n    this.$store.dispatch("fetchUser", 123)\n  }\n}</code></pre>',
    tags: ['Vuex', '状态管理', 'store']
  },
  'vue2-cli': {
    title: 'Vue CLI',
    body: '<p class="lead">Vue CLI 是官方的项目脚手架工具。</p><pre><code># 安装\nnpm install -g @vue/cli\n\n# 创建项目\nvue create my-project\n\n# 交互式选项\n# - 手动选择特性 (Babel, Router, Vuex, CSS预处理器)\n# - 版本选择 Vue 2\n# - 配置文件存放位置\n\n# 运行项目\nnpm run serve\n\n# 构建项目\nnpm run build\n\n# 添加插件\nvue add router\nvue add vuex\nvue add eslint\n\n# 图形化界面\nvue ui</code></pre>',
    tags: ['Vue CLI', '脚手架', '构建']
  },
  'vue2-devTools': {
    title: 'DevTools',
    body: '<p class="lead">Vue DevTools 是浏览器调试工具。</p><pre><code>// 安装\n// Chrome/Firefox 商店搜索 "Vue Devtools"\n\n// 功能\n// 1. 查看组件树\n// 2. 查看/修改组件数据\n// 3. 事件追踪\n// 4. 性能分析\n// 5. Vuex 状态管理\n\n// 在开发环境自动启用\n// 生产环境默认禁用，可手动启用\nVue.config.devtools = true</code></pre>',
    tags: ['DevTools', '调试', '开发工具']
  },
  'vue2-reactivity': {
    title: '响应式原理',
    body: '<p class="lead">Vue 2 使用 Object.defineProperty 实现响应式。</p><pre><code>// 响应式原理\nObject.defineProperty(data, "key", {\n  enumerable: true,\n  configurable: true,\n  get() {\n    console.log("获取值")\n    return value\n  },\n  set(newVal) {\n    console.log("设置值", newVal)\n    value = newVal\n    // 触发更新\n    update()\n  }\n})\n\n// 注意事项\n// 1. 无法检测对象属性的添加/删除\nVue.set(obj, "newProp", value)\n// 2. 无法检测数组索引修改\nVue.set(arr, index, value)\n// 3. 无法检测数组长度修改\narr.splice(newLength)</code></pre>',
    tags: ['响应式', 'Object.defineProperty', '原理']
  },
  'vue2-render': {
    title: '渲染函数',
    body: '<p class="lead">渲染函数用于更灵活地生成虚拟 DOM。</p><pre><code>Vue.component("my-component", {\n  render(createElement) {\n    return createElement(\n      "div",\n      {\n        class: { container: true },\n        attrs: { id: "app" },\n        on: { click: this.handleClick }\n      },\n      [\n        createElement("h1", this.title),\n        createElement("p", this.content)\n      ]\n    )\n  },\n  data() {\n    return {\n      title: "标题",\n      content: "内容",\n      handleClick() {}\n    }\n  }\n})</code></pre>',
    tags: ['渲染函数', 'render', '虚拟DOM']
  },
  'vue2-transitions': {
    title: '过渡动画',
    body: '<p class="lead">Vue 提供内置的过渡动画组件。</p><pre><code>&lt;!-- 单个元素过渡 --&gt;\n&lt;transition name="fade"&gt;\n  &lt;div v-if="show"&gt;动画内容&lt;/div&gt;\n&lt;/transition&gt;\n\n&lt;style&gt;\n.fade-enter-active, .fade-leave-active {\n  transition: opacity 0.5s;\n}\n.fade-enter, .fade-leave-to {\n  opacity: 0;\n}\n&lt;/style&gt;\n\n&lt;!-- 列表过渡 --&gt;\n&lt;transition-group name="list" tag="ul"&gt;\n  &lt;li v-for="item in items" :key="item.id"&gt;{{ item.text }}&lt;/li&gt;\n&lt;/transition-group&gt;</code></pre>',
    tags: ['过渡', '动画', 'transition']
  },
  'vue2-custom-directives': {
    title: '自定义指令',
    body: '<p class="lead">自定义指令用于底层 DOM 操作。</p><pre><code>// 全局注册\nVue.directive("focus", {\n  inserted(el) {\n    el.focus()\n  }\n})\n\n// 局部注册\ndirectives: {\n  color: {\n    bind(el, binding) {\n      el.style.color = binding.value\n    },\n    update(el, binding) {\n      el.style.color = binding.value\n    }\n  }\n}\n\n// 使用\n&lt;input v-focus&gt;\n&lt;p v-color="red"&gt;红色文字&lt;/p&gt;</code></pre>',
    tags: ['自定义指令', 'directives', 'DOM操作']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 Vue 2 官方文档获取更多信息。</p>',
        tags: ['Vue', '前端框架']
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

addLink('vue2-intro', 'vue2-install')
addLink('vue2-install', 'vue2-instance')
addLink('vue2-template', 'vue2-directives')
addLink('vue2-directives', 'vue2-filters')
addLink('vue2-data', 'vue2-computed')
addLink('vue2-computed', 'vue2-watchers')
addLink('vue2-watchers', 'vue2-lifecycle')
addLink('vue2-components', 'vue2-props')
addLink('vue2-props', 'vue2-events')
addLink('vue2-events', 'vue2-slots')
addLink('vue2-slots', 'vue2-mixins')
addLink('vue2-router', 'vue2-vuex')
addLink('vue2-vuex', 'vue2-cli')
addLink('vue2-cli', 'vue2-devTools')
addLink('vue2-reactivity', 'vue2-render')
addLink('vue2-render', 'vue2-transitions')
addLink('vue2-transitions', 'vue2-custom-directives')

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