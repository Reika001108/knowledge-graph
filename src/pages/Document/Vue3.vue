<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">Vue 3 知识库</h1>
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
          <h2>🟢 <span class="gradient-text">Vue 3 完全指南</span></h2>
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
          <p>✨ 点击节点双向联动 | 新一代响应式系统</p>
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
          <h3>🔗 Vue 3 知识图谱 <span class="graph-badge">ECharts</span></h3>
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

// ========== Vue 3 导航数据 ==========
const navSections = ref([
  { title: '🚀 快速入门', items: [
      { id: 'vue3-intro', label: 'Vue 3 简介', hot: true },
      { id: 'vue3-install', label: '安装与配置', hot: true },
      { id: 'vue3-app', label: '应用实例', hot: true }
    ]},
  { title: '📝 模板语法', items: [
      { id: 'vue3-template', label: '模板语法', hot: true },
      { id: 'vue3-directives', label: '内置指令', hot: true },
      { id: 'vue3-reactivity', label: '响应式基础', hot: true }
    ]},
  { title: '🔧 组合式 API', items: [
      { id: 'vue3-composition', label: '组合式 API 简介', hot: true },
      { id: 'vue3-ref', label: 'ref 与 reactive', hot: true },
      { id: 'vue3-computed', label: 'computed', hot: true },
      { id: 'vue3-watch', label: 'watch 与 watchEffect', hot: true },
      { id: 'vue3-lifecycle', label: '生命周期钩子', hot: true }
    ]},
  { title: '🧩 组件系统', items: [
      { id: 'vue3-components', label: '组件基础', hot: true },
      { id: 'vue3-props', label: 'Props', hot: true },
      { id: 'vue3-emits', label: '自定义事件', hot: true },
      { id: 'vue3-slots', label: '插槽', hot: true },
      { id: 'vue3-provide-inject', label: '依赖注入', hot: true }
    ]},
  { title: '🌐 生态工具', items: [
      { id: 'vue3-router', label: 'Vue Router 4', hot: true },
      { id: 'vue3-pinia', label: 'Pinia 状态管理', hot: true },
      { id: 'vue3-vite', label: 'Vite 构建工具', hot: true }
    ]},
  { title: '⚡ 高级特性', items: [
      { id: 'vue3-teleport', label: 'Teleport', hot: true },
      { id: 'vue3-suspense', label: 'Suspense', hot: true },
      { id: 'vue3-transitions', label: '过渡动画', hot: true },
      { id: 'vue3-custom-directives', label: '自定义指令', hot: true }
    ]}
])

const selectedId = ref('vue3-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== Vue 3 内容映射表 ==========
const contentMap = {
  'vue3-intro': {
    title: 'Vue 3 简介',
    body: '<p class="lead">Vue 3 是 Vue.js 的最新主要版本，于 2020 年 9 月正式发布，带来了组合式 API、响应式重构、TypeScript 支持等重大改进。</p><h3>核心特点</h3><ul><li><strong>组合式 API</strong>：更灵活的逻辑复用</li><li><strong>响应式重构</strong>：基于 Proxy 的响应式系统</li><li><strong>TypeScript 支持</strong>：原生 TypeScript 支持</li><li><strong>性能提升</strong>：更小更快</li><li><strong>新内置组件</strong>：Teleport、Suspense</li></ul><div class="note">💡 Vue 3 是 Vue 2 的重大升级，推荐新项目使用。</div>',
    tags: ['Vue3', '组合式API', '响应式']
  },
  'vue3-install': {
    title: '安装与配置',
    body: '<p class="lead">Vue 3 可以通过多种方式安装和使用。</p><pre><code>// CDN 引入\n&lt;script src="https://unpkg.com/vue@3/dist/vue.global.js"&gt;&lt;/script&gt;\n\n// npm 安装\nnpm install vue@3\n\n// 使用 Vite 创建项目\nnpm create vue@latest\n\n// 使用 Vue CLI（已进入维护模式）\nnpm install -g @vue/cli\nvue create my-project</code></pre>',
    tags: ['安装', 'Vite', 'CDN']
  },
  'vue3-app': {
    title: '应用实例',
    body: '<p class="lead">每个 Vue 应用都是通过 createApp 函数创建一个新的应用实例开始的。</p><pre><code>import { createApp } from "vue"\nimport App from "./App.vue"\n\nconst app = createApp(App)\n\n// 全局配置\napp.config.errorHandler = (err) => {\n  console.error(err)\n}\n\n// 注册全局组件\napp.component("MyComponent", MyComponent)\n\n// 注册全局指令\napp.directive("focus", {\n  mounted(el) {\n    el.focus()\n  }\n})\n\n// 挂载应用\napp.mount("#app")</code></pre>',
    tags: ['createApp', '应用实例', '挂载']
  },
  'vue3-template': {
    title: '模板语法',
    body: '<p class="lead">Vue 3 使用基于 HTML 的模板语法，支持插值和指令。</p><pre><code>&lt;!-- 文本插值 --&gt;\n&lt;span&gt;{{ message }}&lt;/span&gt;\n\n&lt;!-- 原始 HTML --&gt;\n&lt;div v-html="rawHtml"&gt;&lt;/div&gt;\n\n&lt;!-- 属性绑定 --&gt;\n&lt;div :id="dynamicId"&gt;&lt;/div&gt;\n\n&lt;!-- 动态参数 --&gt;\n&lt;div :[attributeName]="value"&gt;&lt;/div&gt;\n\n&lt;!-- 表达式 --&gt;\n{{ number + 1 }}\n{{ ok ? "YES" : "NO" }}\n{{ message.split("").reverse().join("") }}</code></pre>',
    tags: ['模板', '插值', '绑定']
  },
  'vue3-directives': {
    title: '内置指令',
    body: '<p class="lead">Vue 3 提供了丰富的内置指令。</p><pre><code>&lt;!-- v-text / v-html --&gt;\n&lt;span v-text="message"&gt;&lt;/span&gt;\n&lt;div v-html="html"&gt;&lt;/div&gt;\n\n&lt;!-- v-show --&gt;\n&lt;div v-show="isVisible"&gt;显示/隐藏&lt;/div&gt;\n\n&lt;!-- v-if / v-else-if / v-else --&gt;\n&lt;div v-if="type === "A"&gt;A&lt;/div&gt;\n&lt;div v-else-if="type === "B"&gt;B&lt;/div&gt;\n&lt;div v-else&gt;C&lt;/div&gt;\n\n&lt;!-- v-for --&gt;\n&lt;li v-for="item in items" :key="item.id"&gt;{{ item.text }}&lt;/li&gt;\n\n&lt;!-- v-on --&gt;\n&lt;button @click="handleClick"&gt;点击&lt;/button&gt;\n\n&lt;!-- v-bind --&gt;\n&lt;img :src="imageSrc"&gt;\n\n&lt;!-- v-model --&gt;\n&lt;input v-model="message"&gt;</code></pre>',
    tags: ['指令', 'v-if', 'v-for']
  },
  'vue3-reactivity': {
    title: '响应式基础',
    body: '<p class="lead">Vue 3 使用基于 Proxy 的响应式系统。</p><pre><code>import { reactive, ref } from "vue"\n\n// reactive - 对象响应式\nconst state = reactive({\n  count: 0,\n  user: { name: "Alice" }\n})\n\n// ref - 基本类型响应式\nconst count = ref(0)\nconst message = ref("Hello")\n\n// 访问 ref 需要 .value\ncount.value++\nconsole.log(count.value)\n\n// 在模板中自动解包\n&lt;template&gt;\n  &lt;div&gt;{{ count }}&lt;/div&gt;\n&lt;/template&gt;</code></pre>',
    tags: ['响应式', 'reactive', 'ref']
  },
  'vue3-composition': {
    title: '组合式 API 简介',
    body: '<p class="lead">组合式 API 提供了更灵活的逻辑组织和复用方式。</p><pre><code>&lt;script setup&gt;\nimport { ref, onMounted } from "vue"\n\n// 响应式状态\nconst count = ref(0)\n\n// 函数\nfunction increment() {\n  count.value++\n}\n\n// 生命周期钩子\nonMounted(() => {\n  console.log("组件已挂载")\n})\n&lt;/script&gt;\n\n&lt;template&gt;\n  &lt;button @click="increment"&gt;{{ count }}&lt;/button&gt;\n&lt;/template&gt;</code></pre>',
    tags: ['组合式API', 'script setup', '逻辑复用']
  },
  'vue3-ref': {
    title: 'ref 与 reactive',
    body: '<p class="lead">ref 和 reactive 是 Vue 3 响应式系统的核心 API。</p><pre><code>import { ref, reactive, isRef, unref } from "vue"\n\n// ref - 适用于基本类型\nconst count = ref(0)\nconst message = ref("Hello")\n\n// reactive - 适用于对象\nconst state = reactive({\n  count: 0,\n  user: { name: "Alice" }\n})\n\n// ref 解包\nconst countRef = ref(0)\nconst { count } = countRef  // 响应式丢失\n\n// 使用 toRefs 保持响应式\nimport { toRefs } from "vue"\nconst state = reactive({ count: 0, name: "Vue" })\nconst { count, name } = toRefs(state)\n\n// 判断是否为 ref\nconsole.log(isRef(count))  // true\n\n// unref - 如果是 ref 返回 value，否则返回原值\nconst value = unref(maybeRef)</code></pre>',
    tags: ['ref', 'reactive', 'toRefs']
  },
  'vue3-computed': {
    title: 'computed',
    body: '<p class="lead">计算属性基于依赖缓存，只有依赖变化时才会重新计算。</p><pre><code>import { ref, computed } from "vue"\n\nconst firstName = ref("John")\nconst lastName = ref("Doe")\n\n// 只读计算属性\nconst fullName = computed(() => {\n  return firstName.value + " " + lastName.value\n})\n\n// 可写计算属性\nconst fullNameWritable = computed({\n  get() {\n    return firstName.value + " " + lastName.value\n  },\n  set(newValue) {\n    const names = newValue.split(" ")\n    firstName.value = names[0]\n    lastName.value = names[1]\n  }\n})\n\n// 在模板中使用\n&lt;div&gt;{{ fullName }}&lt;/div&gt;</code></pre>',
    tags: ['computed', '计算属性', '缓存']
  },
  'vue3-watch': {
    title: 'watch 与 watchEffect',
    body: '<p class="lead">侦听器用于监听数据变化并执行副作用。</p><pre><code>import { ref, watch, watchEffect } from "vue"\n\nconst count = ref(0)\nconst name = ref("Alice")\n\n// watch - 懒执行，指定数据源\nwatch(count, (newVal, oldVal) => {\n  console.log(`count 从 ${oldVal} 变为 ${newVal}`)\n})\n\n// 监听多个数据源\nwatch([count, name], ([newCount, newName], [oldCount, oldName]) => {\n  console.log(newCount, newName)\n})\n\n// 深度监听\nwatch(user, (newVal) => {\n  console.log("user changed", newVal)\n}, { deep: true })\n\n// 立即执行\nwatch(count, (val) => {\n  console.log(val)\n}, { immediate: true })\n\n// watchEffect - 立即执行，自动收集依赖\nwatchEffect(() => {\n  console.log(`count 是: ${count.value}`)\n})\n\n// 停止监听\nconst stop = watchEffect(() => {})\nstop()</code></pre>',
    tags: ['watch', 'watchEffect', '侦听器']
  },
  'vue3-lifecycle': {
    title: '生命周期钩子',
    body: '<p class="lead">Vue 3 生命周期钩子，组合式 API 中使用 on 前缀。</p><pre><code>import {\n  onBeforeMount,\n  onMounted,\n  onBeforeUpdate,\n  onUpdated,\n  onBeforeUnmount,\n  onUnmounted\n} from "vue"\n\nexport default {\n  setup() {\n    onBeforeMount(() => {\n      console.log("挂载前")\n    })\n\n    onMounted(() => {\n      console.log("挂载完成")\n      // 可以访问 DOM\n    })\n\n    onBeforeUpdate(() => {\n      console.log("更新前")\n    })\n\n    onUpdated(() => {\n      console.log("更新完成")\n    })\n\n    onBeforeUnmount(() => {\n      console.log("卸载前")\n      // 清理定时器等\n    })\n\n    onUnmounted(() => {\n      console.log("卸载完成")\n    })\n\n    return {}\n  }\n}</code></pre>',
    tags: ['生命周期', 'onMounted', '钩子']
  },
  'vue3-components': {
    title: '组件基础',
    body: '<p class="lead">组件是可复用的 Vue 实例，Vue 3 推荐使用单文件组件（SFC）。</p><pre><code>&lt;!-- 单文件组件 MyButton.vue --&gt;\n&lt;script setup&gt;\ndefineProps(["text"])\nconst emit = defineEmits(["click"])\n&lt;/script&gt;\n\n&lt;template&gt;\n  &lt;button @click="emit("click")"&gt;{{ text }}&lt;/button&gt;\n&lt;/template&gt;\n\n&lt;style scoped&gt;\nbutton {\n  padding: 8px 16px;\n  border-radius: 4px;\n}\n&lt;/style&gt;\n\n// 使用组件\n&lt;script setup&gt;\nimport MyButton from "./MyButton.vue"\n&lt;/script&gt;\n\n&lt;template&gt;\n  &lt;MyButton text="点击我" @click="handleClick" /&gt;\n&lt;/template&gt;</code></pre>',
    tags: ['组件', 'SFC', '单文件组件']
  },
  'vue3-props': {
    title: 'Props',
    body: '<p class="lead">Props 用于父组件向子组件传递数据。</p><pre><code>&lt;script setup&gt;\n// 简单声明\nconst props = defineProps(["message", "count"])\n\n// 类型声明\nconst props = defineProps({\n  message: String,\n  count: {\n    type: Number,\n    default: 0,\n    required: true\n  },\n  user: {\n    type: Object,\n    default: () => ({ name: "Guest" })\n  },\n  tags: {\n    type: Array,\n    validator: (value) => value.length > 0\n  }\n})\n\n// TypeScript 方式\ninterface Props {\n  message: string\n  count?: number\n}\nconst props = defineProps&lt;Props&gt;()\n&lt;/script&gt;</code></pre>',
    tags: ['props', 'defineProps', '属性传递']
  },
  'vue3-emits': {
    title: '自定义事件',
    body: '<p class="lead">子组件通过 emit 向父组件发送事件。</p><pre><code>&lt;script setup&gt;\n// 简单声明\nconst emit = defineEmits(["update", "close"])\n\n// 类型声明\nconst emit = defineEmits({\n  update: (value) => typeof value === "number",\n  close: null\n})\n\n// TypeScript 方式\nconst emit = defineEmits&lt;{\n  (e: "update", value: number): void\n  (e: "close"): void\n}&gt;()\n\n// 触发事件\nemit("update", 10)\nemit("close")\n&lt;/script&gt;\n\n&lt;template&gt;\n  &lt;button @click="emit("update", 10)"&gt;更新&lt;/button&gt;\n&lt;/template&gt;</code></pre>',
    tags: ['emit', 'defineEmits', '事件']
  },
  'vue3-slots': {
    title: '插槽',
    body: '<p class="lead">插槽用于内容分发。</p><pre><code>&lt;!-- 子组件 --&gt;\n&lt;script setup&gt;\ndefineProps(["title"])\n&lt;/script&gt;\n\n&lt;template&gt;\n  &lt;div class="card"&gt;\n    &lt;div class="header"&gt;\n      &lt;slot name="header"&gt;{{ title }}&lt;/slot&gt;\n    &lt;/div&gt;\n    &lt;div class="body"&gt;\n      &lt;slot&gt;默认内容&lt;/slot&gt;\n    &lt;/div&gt;\n    &lt;div class="footer"&gt;\n      &lt;slot name="footer"&gt;页脚&lt;/slot&gt;\n    &lt;/div&gt;\n  &lt;/div&gt;\n&lt;/template&gt;\n\n&lt;!-- 父组件 --&gt;\n&lt;template&gt;\n  &lt;Child title="卡片标题"&gt;\n    &lt;template #header&gt;\n      &lt;h1&gt;自定义标题&lt;/h1&gt;\n    &lt;/template&gt;\n    &lt;p&gt;自定义内容&lt;/p&gt;\n    &lt;template #footer&gt;\n      &lt;button&gt;操作&lt;/button&gt;\n    &lt;/template&gt;\n  &lt;/Child&gt;\n&lt;/template&gt;</code></pre>',
    tags: ['插槽', 'slot', '内容分发']
  },
  'vue3-provide-inject': {
    title: '依赖注入',
    body: '<p class="lead">provide 和 inject 用于跨层级组件通信。</p><pre><code>// 祖先组件\n&lt;script setup&gt;\nimport { provide, ref } from "vue"\n\nconst theme = ref("dark")\nprovide("theme", theme)\nprovide("updateTheme", (newTheme) => {\n  theme.value = newTheme\n})\n&lt;/script&gt;\n\n// 后代组件\n&lt;script setup&gt;\nimport { inject } from "vue"\n\nconst theme = inject("theme", "light")\nconst updateTheme = inject("updateTheme")\n\nfunction switchTheme() {\n  updateTheme(theme === "dark" ? "light" : "dark")\n}\n&lt;/script&gt;</code></pre>',
    tags: ['provide', 'inject', '依赖注入']
  },
  'vue3-router': {
    title: 'Vue Router 4',
    body: '<p class="lead">Vue Router 4 是为 Vue 3 设计的官方路由管理器。</p><pre><code>// 安装\nnpm install vue-router@4\n\n// 配置路由\nimport { createRouter, createWebHistory } from "vue-router"\n\nconst routes = [\n  { path: "/", component: Home },\n  { path: "/about", component: () => import("./views/About.vue") },\n  { path: "/user/:id", component: User }\n]\n\nconst router = createRouter({\n  history: createWebHistory(),\n  routes\n})\n\n// 使用\nimport { useRouter, useRoute } from "vue-router"\n\nconst router = useRouter()\nconst route = useRoute()\n\nrouter.push("/about")\nconsole.log(route.params.id)</code></pre>',
    tags: ['Vue Router', '路由', '导航']
  },
  'vue3-pinia': {
    title: 'Pinia 状态管理',
    body: '<p class="lead">Pinia 是 Vue 的官方状态管理库，是 Vuex 的替代品。</p><pre><code>// 安装\nnpm install pinia\n\n// 创建 store\nimport { defineStore } from "pinia"\n\nexport const useCounterStore = defineStore("counter", () => {\n  const count = ref(0)\n  const doubleCount = computed(() => count.value * 2)\n  \n  function increment() {\n    count.value++\n  }\n  \n  return { count, doubleCount, increment }\n})\n\n// 在组件中使用\nimport { useCounterStore } from "@/stores/counter"\n\nconst counter = useCounterStore()\ncounter.increment()\nconsole.log(counter.doubleCount)</code></pre>',
    tags: ['Pinia', '状态管理', 'store']
  },
  'vue3-vite': {
    title: 'Vite 构建工具',
    body: '<p class="lead">Vite 是下一代前端构建工具，为 Vue 3 提供极速的开发体验。</p><pre><code># 创建 Vue 3 项目\nnpm create vue@latest\n\n# 安装依赖\nnpm install\n\n# 开发服务器\nnpm run dev\n\n# 构建\nnpm run build\n\n# vite.config.js\nimport { defineConfig } from "vite"\nimport vue from "@vitejs/plugin-vue"\n\nexport default defineConfig({\n  plugins: [vue()],\n  server: { port: 3000 },\n  resolve: { alias: { "@": "/src" } }\n})</code></pre>',
    tags: ['Vite', '构建工具', '开发服务器']
  },
  'vue3-teleport': {
    title: 'Teleport',
    body: '<p class="lead">Teleport 将组件内容渲染到 DOM 的其他位置。</p><pre><code>&lt;!-- 模态框组件 --&gt;\n&lt;template&gt;\n  &lt;Teleport to="body"&gt;\n    &lt;div v-if="visible" class="modal"&gt;\n      &lt;div class="modal-content"&gt;\n        &lt;slot /&gt;\n        &lt;button @click="emit("close")"&gt;关闭&lt;/button&gt;\n      &lt;/div&gt;\n    &lt;/div&gt;\n  &lt;/Teleport&gt;\n&lt;/template&gt;\n\n// 使用\n&lt;Modal v-if="showModal" @close="showModal = false"&gt;\n  &lt;h2&gt;对话框标题&lt;/h2&gt;\n  &lt;p&gt;对话框内容&lt;/p&gt;\n&lt;/Modal&gt;</code></pre>',
    tags: ['Teleport', '传送', '模态框']
  },
  'vue3-suspense': {
    title: 'Suspense',
    body: '<p class="lead">Suspense 用于处理异步组件的加载状态。</p><pre><code>&lt;template&gt;\n  &lt;Suspense&gt;\n    &lt;template #default&gt;\n      &lt;AsyncComponent /&gt;\n    &lt;/template&gt;\n    &lt;template #fallback&gt;\n      &lt;div&gt;加载中...&lt;/div&gt;\n    &lt;/template&gt;\n  &lt;/Suspense&gt;\n&lt;/template&gt;\n\n// 异步组件\n&lt;script setup&gt;\nconst data = await fetch("/api/data").then(r => r.json())\n&lt;/script&gt;</code></pre>',
    tags: ['Suspense', '异步组件', '加载状态']
  },
  'vue3-transitions': {
    title: '过渡动画',
    body: '<p class="lead">Vue 3 提供内置的过渡动画组件。</p><pre><code>&lt;!-- 单个元素过渡 --&gt;\n&lt;Transition name="fade"&gt;\n  &lt;div v-if="show"&gt;动画内容&lt;/div&gt;\n&lt;/Transition&gt;\n\n&lt;style&gt;\n.fade-enter-active, .fade-leave-active {\n  transition: opacity 0.5s;\n}\n.fade-enter-from, .fade-leave-to {\n  opacity: 0;\n}\n&lt;/style&gt;\n\n&lt;!-- 列表过渡 --&gt;\n&lt;TransitionGroup name="list" tag="ul"&gt;\n  &lt;li v-for="item in items" :key="item.id"&gt;{{ item.text }}&lt;/li&gt;\n&lt;/TransitionGroup&gt;</code></pre>',
    tags: ['过渡', '动画', 'Transition']
  },
  'vue3-custom-directives': {
    title: '自定义指令',
    body: '<p class="lead">自定义指令用于底层 DOM 操作。</p><pre><code>// 全局注册\nconst app = createApp(App)\napp.directive("focus", {\n  mounted(el) {\n    el.focus()\n  }\n})\n\n// 局部注册\n&lt;script setup&gt;\nconst vFocus = {\n  mounted(el) {\n    el.focus()\n  }\n}\n&lt;/script&gt;\n\n&lt;template&gt;\n  &lt;input v-focus /&gt;\n&lt;/template&gt;\n\n// 带参数的自定义指令\nconst vColor = {\n  mounted(el, binding) {\n    el.style.color = binding.value\n  },\n  updated(el, binding) {\n    el.style.color = binding.value\n  }\n}\n\n&lt;input v-color="red" /&gt;</code></pre>',
    tags: ['自定义指令', 'directives', 'DOM操作']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 Vue 3 官方文档获取更多信息。</p>',
        tags: ['Vue3', '前端框架']
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

addLink('vue3-intro', 'vue3-install')
addLink('vue3-install', 'vue3-app')
addLink('vue3-template', 'vue3-directives')
addLink('vue3-directives', 'vue3-reactivity')
addLink('vue3-composition', 'vue3-ref')
addLink('vue3-ref', 'vue3-computed')
addLink('vue3-computed', 'vue3-watch')
addLink('vue3-watch', 'vue3-lifecycle')
addLink('vue3-components', 'vue3-props')
addLink('vue3-props', 'vue3-emits')
addLink('vue3-emits', 'vue3-slots')
addLink('vue3-slots', 'vue3-provide-inject')
addLink('vue3-router', 'vue3-pinia')
addLink('vue3-pinia', 'vue3-vite')
addLink('vue3-teleport', 'vue3-suspense')
addLink('vue3-suspense', 'vue3-transitions')
addLink('vue3-transitions', 'vue3-custom-directives')

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