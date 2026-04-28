<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">Pinia 知识库</h1>
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
      <!-- 左侧导航（锚点链接 - Pinia 分类） -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>🍍 <span class="gradient-text">Pinia 状态管理</span></h2>
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
          <p>🍍 基于 Pinia 官方文档 & Vue 生态</p>
          <p>✨ 点击节点双向联动 | 完整示例代码</p>
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

      <!-- 右侧图谱（Pinia 知识关系图） -->
      <aside class="graph-panel">
        <div class="graph-header">
          <h3>🔗 Pinia 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'Pinia用户';
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

const goToProfile = () => alert('👤 个人中心 (可扩展)');
const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user_info');
  showDropdown.value = false;
  window.location.href = 'http://localhost:5173/';
};

// ========== Pinia 导航数据 ==========
const navSections = ref([
  { title: '🍍 核心概念', items: [
      { id: 'pinia-intro', label: 'Pinia 简介', hot: true },
      { id: 'pinia-setup', label: '安装与配置', hot: true },
      { id: 'defining-store', label: '定义 Store', hot: true },
      { id: 'state', label: 'State 状态', hot: true },
      { id: 'getters', label: 'Getters', hot: true },
      { id: 'actions', label: 'Actions', hot: true },
    ]},
  { title: '📦 使用方式', items: [
      { id: 'using-store', label: '使用 Store' },
      { id: 'store-ref', label: 'storeToRefs' },
      { id: 'reactive-state', label: '响应式状态' },
      { id: 'subscribing', label: '订阅状态' },
    ]},
  { title: '🔄 高级特性', items: [
      { id: 'cross-stores', label: '跨 Store 访问' },
      { id: 'plugins', label: '插件系统', hot: true },
      { id: 'hydration', label: 'SSR 水合' },
      { id: 'typescript', label: 'TypeScript 支持', hot: true },
      { id: 'devtools', label: 'DevTools 集成' },
    ]},
  { title: '🏗️ 架构与对比', items: [
      { id: 'vuex-comparison', label: 'Pinia vs Vuex' },
      { id: 'best-practices', label: '最佳实践' },
      { id: 'testing', label: '单元测试' },
    ]},
]);

const selectedId = ref('pinia-intro');

// 扁平化所有知识点
const allFlatItems = computed(() => {
  const flat = [];
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item));
  });
  return flat;
});

// ========== Pinia 内容映射表 ==========
const contentMap = {
  'pinia-intro': {
    title: 'Pinia 简介',
    body: `
      <p class="lead">Pinia 是 Vue 的专属状态管理库，它允许你跨组件或页面共享状态。它是 Vuex 的继任者，官方推荐的新一代状态管理方案。</p>
      <h3>核心特性</h3>
      <ul>
        <li><strong>直观</strong>：像组件一样编写 store，支持响应式</li>
        <li><strong>类型安全</strong>：完美的 TypeScript 支持，自动推断类型</li>
        <li><strong>DevTools 支持</strong>：Vue DevTools 中可追踪 actions、mutations</li>
        <li><strong>模块化</strong>：按模块拆分 store，按需导入</li>
        <li><strong>轻量</strong>：体积约 1.5KB，无多余依赖</li>
      </ul>
      <div class="note">💡 Pinia 名字来源于西班牙语 "piña" (菠萝)，寓意甜蜜且充满活力。</div>
    `,
    tags: ['状态管理', 'Vue', '官方推荐']
  },
  'pinia-setup': {
    title: '安装与配置',
    body: `
      <p class="lead">Pinia 的安装非常简单，支持 Vue 3 和 Vue 2（需额外安装组合式 API）。</p>
      <h3>安装命令</h3>
      <pre><code>npm install pinia
# 或
yarn add pinia
pnpm add pinia</code></pre>
      <h3>在 Vue 应用中注册</h3>
      <pre><code>import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.mount('#app')</code></pre>
      <p>创建 pinia 实例后，它会自动处理 store 的响应式系统和 DevTools 集成。</p>
    `,
    tags: ['安装', '配置', 'createPinia']
  },
  'defining-store': {
    title: '定义 Store',
    body: `
      <p class="lead">使用 <code>defineStore()</code> 定义一个 store。第一个参数是 store 的唯一 ID，第二个参数可以是 options 对象或 setup 函数。</p>
      <h3>Options Store 写法（类似 Vuex）</h3>
      <pre><code>import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0, name: 'Pinia' }),
  getters: {
    doubleCount: (state) => state.count * 2,
  },
  actions: {
    increment() {
      this.count++
    },
  },
})</code></pre>
      <h3>Setup Store 写法（类似组合式 API）</h3>
      <pre><code>export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const name = ref('Pinia')
  const doubleCount = computed(() => count.value * 2)
  function increment() {
    count.value++
  }
  return { count, name, doubleCount, increment }
})</code></pre>
      <div class="note">🎯 推荐使用 Setup Store 写法，更灵活且与组合式 API 风格一致。</div>
    `,
    tags: ['defineStore', 'Options Store', 'Setup Store']
  },
  state: {
    title: 'State 状态',
    body: `
      <p class="lead">State 是 store 中存储数据的核心部分，它是一个响应式对象。</p>
      <h3>定义 state</h3>
      <pre><code>state: () => ({
  user: null,
  posts: [],
  loading: false,
})</code></pre>
      <h3>访问和修改 state</h3>
      <pre><code>const store = useUserStore()

// 直接读取
console.log(store.user)

// 直接修改（推荐简单情况）
store.user = { name: 'Alice' }

// 批量修改
store.$patch({
  user: { name: 'Bob' },
  loading: true,
})

// 替换整个 state
store.$state = { user: null, posts: [], loading: false }</code></pre>
      <p>直接修改 state 会自动触发响应式更新，无需像 Vuex 那样 commit mutation。</p>
    `,
    tags: ['state', '$patch', '响应式']
  },
  getters: {
    title: 'Getters',
    body: `
      <p class="lead">Getters 类似于 Vue 中的计算属性，用于派生状态。它们会基于 state 计算出新值，并自动缓存。</p>
      <h3>定义 getters</h3>
      <pre><code>export const useStore = defineStore('main', {
  state: () => ({ todos: [] }),
  getters: {
    // 普通 getter
    completedTodos: (state) => state.todos.filter(todo => todo.done),
    // 接收参数（返回函数）
    getTodoById: (state) => (id) => state.todos.find(todo => todo.id === id),
    // 访问其他 getter
    summary: (state) => {
      const completed = state.todos.filter(t => t.done).length
      return \`已完成 \${completed} / \${state.todos.length}\`
    }
  }
})</code></pre>
      <h3>Setup Store 中的 getters</h3>
      <pre><code>export const useStore = defineStore('main', () => {
  const todos = ref([])
  const completedTodos = computed(() => todos.value.filter(t => t.done))
  return { todos, completedTodos }
})</code></pre>
    `,
    tags: ['getters', '计算属性', '派生状态']
  },
  actions: {
    title: 'Actions',
    body: `
      <p class="lead">Actions 相当于组件中的 methods，用于处理异步操作和复杂的状态变更逻辑。</p>
      <h3>定义 actions</h3>
      <pre><code>export const useUserStore = defineStore('user', {
  state: () => ({ user: null, token: null }),
  actions: {
    // 同步 action
    setUser(userData) {
      this.user = userData
    },
    // 异步 action
    async login(username, password) {
      const response = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      })
      const data = await response.json()
      this.user = data.user
      this.token = data.token
      return data
    }
  }
})</code></pre>
      <h3>调用 actions</h3>
      <pre><code>const userStore = useUserStore()
// 直接调用，无需 dispatch
userStore.setUser({ name: 'Alice' })
await userStore.login('alice', '123456')</code></pre>
      <div class="note">🚀 Actions 可以直接访问 this（store 实例），支持 async/await，完全替代 Vuex 中 actions + mutations 的双重模式。</div>
    `,
    tags: ['actions', '异步', 'methods']
  },
  'using-store': {
    title: '使用 Store',
    body: `
      <p class="lead">在组件中使用 store 非常简单，直接导入并调用即可。</p>
      <pre><code>&lt;script setup&gt;
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()

// 直接使用
console.log(counter.count)
counter.increment()
&lt;/script&gt;

&lt;template&gt;
  &lt;div&gt;
    &lt;p&gt;Count: {{ counter.count }}&lt;/p&gt;
    &lt;p&gt;Double: {{ counter.doubleCount }}&lt;/p&gt;
    &lt;button @click="counter.increment"&gt;+1&lt;/button&gt;
  &lt;/div&gt;
&lt;/template&gt;</code></pre>
      <p>注意：store 实例是一个 reactive 对象，解构会失去响应式，需要使用 <code>storeToRefs</code>。</p>
    `,
    tags: ['useStore', '组件中使用', '响应式']
  },
  'store-ref': {
    title: 'storeToRefs',
    body: `
      <p class="lead">当需要解构 store 中的 state 和 getters 并保持响应式时，使用 <code>storeToRefs</code>。</p>
      <pre><code>&lt;script setup&gt;
import { storeToRefs } from 'pinia'
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()
// ✅ 使用 storeToRefs 保持响应式
const { count, doubleCount } = storeToRefs(counter)
// ❌ 直接解构会失去响应式
// const { count, doubleCount } = counter

// actions 可以直接解构，因为它们是函数
const { increment } = counter
&lt;/script&gt;</code></pre>
      <div class="note">📌 <code>storeToRefs</code> 只提取 state 和 getters，不会处理 actions。</div>
    `,
    tags: ['storeToRefs', '解构', '响应式保持']
  },
  'reactive-state': {
    title: '响应式状态',
    body: `
      <p class="lead">Pinia 基于 Vue 3 的响应式系统，store 中的 state 本身就是响应式的。</p>
      <h3>响应式原理</h3>
      <pre><code>// 在组件中
const store = useStore()

// 使用 computed 派生响应式数据
const myCount = computed(() => store.count)

// 使用 watch 监听变化
watch(() => store.count, (newVal) => {
  console.log('count changed:', newVal)
})

// 在 template 中直接使用
// {{ store.count }} 会自动更新</code></pre>
      <p>Pinia 使用 Vue 的 <code>reactive</code> 和 <code>ref</code> 实现响应式，与 Vue 生态无缝集成。</p>
    `,
    tags: ['响应式', 'computed', 'watch']
  },
  subscribing: {
    title: '订阅状态',
    body: `
      <p class="lead">Pinia 提供了 <code>$subscribe</code> 方法，用于监听 state 的变化。</p>
      <pre><code>const store = useStore()

// 订阅整个 state 的变化
const unsubscribe = store.$subscribe((mutation, state) => {
  console.log('state changed:', mutation, state)
  // mutation 包含 storeId, type, events 等信息
})

// 取消订阅
unsubscribe()

// 订阅 actions
const unsubscribeAction = store.$onAction(({
  name, store, args, after, onError
}) => {
  console.log(\`Action \${name} called with \${args}\`)
  after((result) => {
    console.log(\`Action \${name} completed with result \${result}\`)
  })
})</code></pre>
      <p>订阅功能对于日志记录、持久化存储、调试等场景非常有用。</p>
    `,
    tags: ['$subscribe', '$onAction', '监听']
  },
  'cross-stores': {
    title: '跨 Store 访问',
    body: `
      <p class="lead">在 store 的 actions 或 getters 中，可以直接访问其他 store。</p>
      <pre><code>import { defineStore } from 'pinia'
import { useUserStore } from './user'

export const useCartStore = defineStore('cart', {
  state: () => ({ items: [] }),
  getters: {
    // 使用其他 store 的数据
    checkoutInfo: (state) => {
      const userStore = useUserStore()
      return {
        user: userStore.user,
        items: state.items,
        total: state.items.reduce((sum, i) => sum + i.price, 0)
      }
    }
  },
  actions: {
    async checkout() {
      const userStore = useUserStore()
      if (!userStore.isLoggedIn) {
        throw new Error('请先登录')
      }
      // 执行结算逻辑
    }
  }
})</code></pre>
      <div class="note">🔄 循环依赖？Pinia 会自动处理，但建议避免深层循环引用。</div>
    `,
    tags: ['跨 Store', '模块通信', '依赖注入']
  },
  plugins: {
    title: '插件系统',
    body: `
      <p class="lead">Pinia 插件可以扩展 store 的功能，例如添加持久化、全局 action 钩子等。</p>
      <h3>创建插件</h3>
      <pre><code>// 持久化插件示例
function persistPlugin({ store }) {
  // 从 localStorage 恢复状态
  const saved = localStorage.getItem(store.$id)
  if (saved) {
    store.$state = JSON.parse(saved)
  }
  // 订阅变化并保存
  store.$subscribe((mutation, state) => {
    localStorage.setItem(store.$id, JSON.stringify(state))
  })
}

// 注册插件
const pinia = createPinia()
pinia.use(persistPlugin)</code></pre>
      <h3>常用插件</h3>
      <ul>
        <li><code>pinia-plugin-persistedstate</code> - 自动持久化</li>
        <li><code>pinia-plugin-debounce</code> - action 防抖</li>
      </ul>
    `,
    tags: ['插件', '扩展', '持久化']
  },
  hydration: {
    title: 'SSR 水合',
    body: `
      <p class="lead">Pinia 完美支持服务端渲染（SSR），可以在 Nuxt 或自定义 SSR 环境中使用。</p>
      <pre><code>// 在 SSR 入口文件中
import { createPinia } from 'pinia'

// 每次请求创建新的 pinia 实例
const pinia = createPinia()
app.use(pinia)

// 在渲染前，可以预取数据并填充 store
await store.fetchInitialData()

// 序列化状态到 HTML
const state = JSON.stringify(pinia.state.value)
// 注入到页面中
html = html.replace('<!--pinia-state-->', 
  \`&lt;script&gt;window.__PINIA_STATE__ = \${state}&lt;/script&gt;\`)</code></pre>
      <p>在客户端，使用 <code>createPinia().use(...)</code> 并恢复状态。</p>
    `,
    tags: ['SSR', '水合', 'Nuxt']
  },
  typescript: {
    title: 'TypeScript 支持',
    body: `
      <p class="lead">Pinia 提供一流的 TypeScript 支持，几乎所有 API 都有完整的类型推断。</p>
      <pre><code>import { defineStore } from 'pinia'

interface User {
  id: number
  name: string
}

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as User | null,
    token: '' as string,
  }),
  getters: {
    // 自动推断返回类型
    isLoggedIn: (state) => !!state.user,
  },
  actions: {
    // 参数和返回值类型自动推断
    setUser(user: User) {
      this.user = user
    },
  },
})

// Setup Store 写法
export const useCounterStore = defineStore('counter', () => {
  const count = ref<number>(0)
  const doubleCount = computed(() => count.value * 2)
  return { count, doubleCount }
})</code></pre>
    `,
    tags: ['TypeScript', '类型推断', '类型安全']
  },
  devtools: {
    title: 'DevTools 集成',
    body: `
      <p class="lead">Pinia 与 Vue DevTools 深度集成，提供强大的调试体验。</p>
      <h3>DevTools 功能</h3>
      <ul>
        <li>查看所有注册的 stores 及其当前状态</li>
        <li>追踪 actions 的调用历史和时间线</li>
        <li>支持时间旅行调试（需配合 Vuex-like 模式）</li>
        <li>手动修改 state 进行测试</li>
      </ul>
      <pre><code>// 可以在插件中自定义 DevTools 行为
const pinia = createPinia()
pinia.use(({ store }) => {
  store.$subscribe((mutation, state) => {
    // 自定义 DevTools 记录
  })
})</code></pre>
      <div class="note">🔧 确保安装了 Vue DevTools 扩展（支持 Vue 3）。</div>
    `,
    tags: ['DevTools', '调试', '时间旅行']
  },
  'vuex-comparison': {
    title: 'Pinia vs Vuex',
    body: `
      <p class="lead">Pinia 是 Vuex 的现代替代品，以下是主要区别：</p>
      <table class="mdn-table">
        <thead><tr><th>特性</th><th>Pinia</th><th>Vuex 4</th></tr></thead>
        <tbody>
          <tr><td>代码量</td><td>~1.5KB</td><td>~10KB+</td></tr>
          <tr><td>Mutations</td><td>❌ 不需要</td><td>✅ 需要</td></tr>
          <tr><td>TypeScript</td><td>🎯 原生完美支持</td><td>⚠️ 需要额外配置</td></tr>
          <tr><td>模块化</td><td>🎨 按 store 自然拆分</td><td>📁 需要 modules 嵌套</td></tr>
          <tr><td>DevTools</td><td>✅ 完全支持</td><td>✅ 支持</td></tr>
          <tr><td>服务端渲染</td><td>✅ 原生支持</td><td>✅ 支持</td></tr>
        </tbody>
      8讲
      <div class="note">🏆 对于新项目，官方推荐使用 Pinia；Vuex 5 将基于 Pinia 的设计重新构建。</div>
    `,
    tags: ['对比', 'Vuex', '迁移']
  },
  'best-practices': {
    title: '最佳实践',
    body: `
      <p class="lead">编写高质量 Pinia 代码的建议：</p>
      <ul>
        <li>✅ 按业务领域拆分 store（userStore, cartStore, productStore）</li>
        <li>✅ 使用 Setup Store 语法以获得更好的类型推断和组合式 API 体验</li>
        <li>✅ 避免在 getters 中产生副作用</li>
        <li>✅ 复杂异步逻辑放在 actions 中，保持 actions 单一职责</li>
        <li>✅ 使用 <code>storeToRefs</code> 解构响应式属性</li>
        <li>✅ 利用插件实现横切关注点（日志、持久化）</li>
        <li>✅ 编写单元测试覆盖 actions 和 getters</li>
      </ul>
    `,
    tags: ['最佳实践', '代码组织', '性能']
  },
  testing: {
    title: '单元测试',
    body: `
      <p class="lead">Pinia store 可以轻松地进行单元测试，无需模拟整个 Vue 实例。</p>
      <pre><code>import { setActivePinia, createPinia } from 'pinia'
import { useCounterStore } from '@/stores/counter'

describe('Counter Store', () => {
  beforeEach(() => {
    // 每个测试前创建新的 pinia 实例
    setActivePinia(createPinia())
  })

  test('increment should increase count', () => {
    const store = useCounterStore()
    expect(store.count).toBe(0)
    store.increment()
    expect(store.count).toBe(1)
  })

  test('doubleCount getter works', () => {
    const store = useCounterStore()
    store.count = 5
    expect(store.doubleCount).toBe(10)
  })
})</code></pre>
      <p>配合 Vitest 或 Jest，可以方便地测试 store 的逻辑。</p>
    `,
    tags: ['测试', 'Vitest', 'Jest']
  }
};

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: `<p>📖 关于 <strong>${item.label}</strong> 的详细文档。参考 Pinia 官方文档获取更多信息。</p><pre><code>// ${item.label} 示例代码\nimport { defineStore } from 'pinia'\n\nexport const useStore = defineStore('main', {\n  // store 定义\n})</code></pre>`,
        tags: ['Pinia', '状态管理']
      };
    }
  });
});

// ========== 图谱数据（Pinia 知识点关系网）==========
const graphNodes = ref(
  navSections.value.flatMap((section, idx) =>
    section.items.map(item => ({
      id: item.id,
      name: item.label,
      category: idx,
    }))
  )
);

const graphLinks = ref([]);
const addLink = (source, target) => {
  if (source && target && graphNodes.value.some(n => n.id === source) && graphNodes.value.some(n => n.id === target)) {
    graphLinks.value.push({ source, target });
  }
};

// 构建 Pinia 知识关系
addLink('pinia-intro', 'pinia-setup');
addLink('pinia-setup', 'defining-store');
addLink('defining-store', 'state');
addLink('defining-store', 'getters');
addLink('defining-store', 'actions');
addLink('state', 'reactive-state');
addLink('state', 'subscribing');
addLink('using-store', 'store-ref');
addLink('using-store', 'reactive-state');
addLink('cross-stores', 'defining-store');
addLink('plugins', 'pinia-setup');
addLink('typescript', 'defining-store');
addLink('devtools', 'pinia-setup');
addLink('vuex-comparison', 'pinia-intro');
addLink('best-practices', 'testing');
addLink('hydration', 'pinia-setup');

// 去重
graphLinks.value = graphLinks.value.filter((link, index, self) =>
  index === self.findIndex(l => l.source === link.source && l.target === link.target)
);

const categories = ref(navSections.value.map(s => ({ name: s.title })));

// ========== ECharts 实例化与交互 ==========
const chartRef = ref(null);
let chartInstance = ref(null);

const initChart = () => {
  if (!chartRef.value) return;
  if (chartInstance.value) chartInstance.value.dispose();
  chartInstance.value = echarts.init(chartRef.value, isDark.value ? 'dark' : null);
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
  };
  chartInstance.value.setOption(option);
  chartInstance.value.on('click', { seriesIndex: 0 }, (params) => {
    if (params.dataType === 'node') {
      const nodeId = params.data.id;
      if (nodeId && contentMap[nodeId]) {
        selectedId.value = nodeId;
        const targetEl = document.getElementById('content-' + nodeId);
        if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
};

const zoomIn = () => { if (chartInstance.value) chartInstance.value.dispatchAction({ type: 'graphZoomIn' }); };
const zoomOut = () => { if (chartInstance.value) chartInstance.value.dispatchAction({ type: 'graphZoomOut' }); };
const fitToView = () => { if (chartInstance.value) chartInstance.value.dispatchAction({ type: 'graphRoam', roam: 'reset' }); };

const contentAreaRef = ref(null);
let scrollHandler = null;
const updateActiveOnScroll = () => {
  if (!contentAreaRef.value) return;
  const blocks = contentAreaRef.value.querySelectorAll('.content-block');
  let bestBlock = null, maxVisible = 0;
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
    const token = localStorage.getItem('authToken');
    if (!token) userInfo.value = { username: 'CSS设计师', email: 'css@example.com' };
    else try { userInfo.value = JSON.parse(localStorage.getItem('user_info')); } catch(e) {}
    document.addEventListener('click', handleClickOutside);
    timer = setInterval(updateTime, 1000);
    nextTick(() => {
      initChart();
      if (contentAreaRef.value) {
        scrollHandler = updateActiveOnScroll;
        contentAreaRef.value.addEventListener('scroll', scrollHandler);
        updateActiveOnScroll();
      }
      const defaultTarget = document.getElementById('content-selectors_intro');
      if (defaultTarget) defaultTarget.scrollIntoView();
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
/* ===== 全局设计令牌（恢复原配色） ===== */
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

/* 顶栏样式 - 恢复原紫色 */
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

/* 中间内容区 */
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