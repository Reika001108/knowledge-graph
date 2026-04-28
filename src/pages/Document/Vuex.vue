<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">Vuex 知识库</h1>
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
      <!-- 左侧导航（锚点链接 - Vuex 分类） -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>📦 <span class="gradient-text">Vuex 状态管理</span></h2>
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
          <p>📦 基于 Vuex 4 官方文档 | Vue 3 兼容</p>
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

      <!-- 右侧图谱（Vuex 知识关系图） -->
      <aside class="graph-panel">
        <div class="graph-header">
          <h3>🔗 Vuex 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
    return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'Vuex用户';
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

    // 修改：点击个人中心跳转到 /person 页面
    const goToProfile = () => {
    window.location.href = 'http://localhost:5173/person';
    };

    const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user_info');
    showDropdown.value = false;
    window.location.href = 'http://localhost:5173/';
    };

    // ========== Vuex 导航数据 ==========
    const navSections = ref([
    { title: '📚 核心概念', items: [
        { id: 'vuex-intro', label: 'Vuex 简介', hot: true },
        { id: 'vuex-setup', label: '安装与配置', hot: true },
        { id: 'state', label: 'State', hot: true },
        { id: 'getters', label: 'Getters', hot: true },
        { id: 'mutations', label: 'Mutations', hot: true },
        { id: 'actions', label: 'Actions', hot: true },
        { id: 'modules', label: 'Modules', hot: true },
        ]},
    { title: '🔧 使用方式', items: [
        { id: 'map-helpers', label: '映射辅助函数' },
        { id: 'composition-api', label: '组合式 API 中使用' },
        { id: 'strict-mode', label: '严格模式' },
        { id: 'form-handling', label: '表单处理' },
        ]},
    { title: '⚡ 高级特性', items: [
        { id: 'plugins', label: '插件系统' },
        { id: 'hot-reload', label: '热重载' },
        { id: 'typescript', label: 'TypeScript 支持' },
        { id: 'testing', label: '单元测试' },
        ]},
    { title: '🏗️ 架构与对比', items: [
        { id: 'vuex-vs-pinia', label: 'Vuex vs Pinia' },
        { id: 'best-practices', label: '最佳实践' },
        { id: 'migration', label: '从 Vuex 3 迁移' },
        ]},
    ]);

    const selectedId = ref('vuex-intro');

    // 扁平化所有知识点
    const allFlatItems = computed(() => {
    const flat = [];
    navSections.value.forEach(section => {
        section.items.forEach(item => flat.push(item));
    });
    return flat;
    });

    // ========== Vuex 内容映射表 ==========
    const contentMap = {
    'vuex-intro': {
        title: 'Vuex 简介',
        body: `
        <p class="lead">Vuex 是 Vue.js 应用程序的状态管理库，采用集中式存储管理应用的所有组件的状态，并以相应的规则保证状态以一种可预测的方式发生变化。</p>
        <h3>核心思想</h3>
        <ul>
            <li><strong>单一状态树</strong>：一个对象包含全部应用层级状态，作为唯一数据源</li>
            <li><strong>状态是只读的</strong>：唯一改变状态的方式是提交 mutation</li>
            <li><strong>变更由函数执行</strong>：mutation 是同步事务，actions 可包含异步操作</li>
        </ul>
        <div class="note">💡 Vuex 受 Flux 和 Redux 启发，但专为 Vue 设计，利用 Vue 的响应式系统。</div>
        <h3>Vuex 架构图</h3>
        <img src="/src/pages/img/vuex.png" style="width:800px;height:600px"/>
        
        `,
        tags: ['状态管理', 'Vue', 'Flux']
    },
    'vuex-setup': {
        title: '安装与配置',
        body: `
        <p class="lead">Vuex 4 专为 Vue 3 设计，Vuex 3 用于 Vue 2。</p>
        <h3>安装命令</h3>
        <pre><code>npm install vuex@next --save
    # 或 Vue 2 项目
    npm install vuex@3 --save</code></pre>
        <h3>创建 Store</h3>
        <pre><code>import { createApp } from 'vue'
    import { createStore } from 'vuex'
    import App from './App.vue'

    // 创建 store
    const store = createStore({
    state() {
        return {
        count: 0
        }
    },
    mutations: {
        increment(state) {
        state.count++
        }
    }
    })

    const app = createApp(App)
    app.use(store)
    app.mount('#app')</code></pre>
        <p>在组件中可以通过 <code>$store</code> 访问 store 实例。</p>
        `,
        tags: ['安装', 'createStore', '配置']
    },
    state: {
        title: 'State',
        body: `
        <p class="lead">State 是 Vuex 存储数据的核心，采用单一状态树。</p>
        <h3>定义 State</h3>
        <pre><code>const store = createStore({
    state() {
        return {
        user: null,
        products: [],
        isLoading: false,
        cart: { items: [], total: 0 }
        }
    }
    })</code></pre>
        <h3>在组件中访问 State</h3>
        <pre><code>// 方式一：直接访问
    this.$store.state.count

    // 方式二：使用计算属性（推荐）
    computed: {
    count() {
        return this.$store.state.count
    }
    }

    // 方式三：使用 mapState 辅助函数
    import { mapState } from 'vuex'
    computed: {
    ...mapState(['count', 'user']),
    ...mapState({
        cartTotal: state => state.cart.total
    })
    }</code></pre>
        <div class="note">📌 State 是响应式的，当 state 变化时，依赖的组件会自动更新。</div>
        `,
        tags: ['state', 'mapState', '响应式']
    },
    getters: {
        title: 'Getters',
        body: `
        <p class="lead">Getters 类似于组件的计算属性，用于从 state 中派生出一些状态。</p>
        <h3>定义 Getters</h3>
        <pre><code>const store = createStore({
    state: () => ({
        todos: [
        { id: 1, text: '学习 Vuex', done: true },
        { id: 2, text: '构建项目', done: false }
        ]
    }),
    getters: {
        // 基本 getter
        doneTodos: (state) => state.todos.filter(todo => todo.done),
        // 访问其他 getter
        doneTodosCount: (state, getters) => getters.doneTodos.length,
        // 返回函数（支持传参）
        getTodoById: (state) => (id) => state.todos.find(todo => todo.id === id)
    }
    })</code></pre>
        <h3>在组件中使用</h3>
        <pre><code>// 直接访问
    this.$store.getters.doneTodosCount

    // 使用 mapGetters
    import { mapGetters } from 'vuex'
    computed: {
    ...mapGetters(['doneTodos', 'doneTodosCount']),
    ...mapGetters({
        count: 'doneTodosCount'
    })
    }</code></pre>
        `,
        tags: ['getters', 'mapGetters', '派生状态']
    },
    mutations: {
        title: 'Mutations',
        body: `
        <p class="lead">Mutations 是 Vuex 中唯一允许修改 state 的方式，必须是同步函数。</p>
        <h3>定义 Mutations</h3>
        <pre><code>const store = createStore({
    state: () => ({
        count: 0,
        user: null
    }),
    mutations: {
        // 基本 mutation
        increment(state) {
        state.count++
        },
        // 携带载荷（payload）
        incrementBy(state, n) {
        state.count += n
        },
        // 对象载荷
        setUser(state, payload) {
        state.user = { ...payload }
        }
    }
    })</code></pre>
        <h3>提交 Mutations</h3>
        <pre><code>// 方式一：直接提交
    store.commit('increment')
    store.commit('incrementBy', 10)
    store.commit('setUser', { name: 'Alice', age: 25 })

    // 方式二：对象风格提交
    store.commit({
    type: 'incrementBy',
    amount: 10
    })

    // 在组件中
    this.$store.commit('increment')

    // 使用 mapMutations
    import { mapMutations } from 'vuex'
    methods: {
    ...mapMutations(['increment', 'incrementBy']),
    ...mapMutations({
        add: 'increment'
    })
    }</code></pre>
        <div class="note">⚠️ Mutations 必须是同步函数，异步操作应使用 Actions。</div>
        `,
        tags: ['mutations', 'commit', '同步']
    },
    actions: {
        title: 'Actions',
        body: `
        <p class="lead">Actions 类似于 Mutations，不同在于：Action 提交的是 Mutation，而不是直接变更状态；Action 可以包含任意异步操作。</p>
        <h3>定义 Actions</h3>
        <pre><code>const store = createStore({
    state: () => ({
        user: null,
        loading: false
    }),
    mutations: {
        setUser(state, user) { state.user = user },
        setLoading(state, status) { state.loading = status }
    },
    actions: {
        // 基本 action
        incrementAsync({ commit }) {
        setTimeout(() => {
            commit('increment')
        }, 1000)
        },
        // 异步请求
        async fetchUser({ commit }, userId) {
        commit('setLoading', true)
        try {
            const response = await fetch(\`/api/users/\${userId}\`)
            const user = await response.json()
            commit('setUser', user)
        } finally {
            commit('setLoading', false)
        }
        },
        // 组合 actions
        async checkout({ commit, state }, products) {
        const savedCartItems = [...state.cart.items]
        commit('checkoutRequest')
        try {
            await shopApi.buyProducts(products)
            commit('checkoutSuccess')
        } catch (error) {
            commit('checkoutFailure', savedCartItems)
        }
        }
    }
    })</code></pre>
        <h3>分发 Actions</h3>
        <pre><code>// 直接分发
    store.dispatch('incrementAsync')
    store.dispatch('fetchUser', 123)

    // 对象风格
    store.dispatch({
    type: 'fetchUser',
    userId: 123
    })

    // 在组件中
    this.$store.dispatch('fetchUser', userId)

    // 使用 mapActions
    import { mapActions } from 'vuex'
    methods: {
    ...mapActions(['fetchUser', 'incrementAsync']),
    ...mapActions({
        getUser: 'fetchUser'
    })
    }</code></pre>
        `,
        tags: ['actions', 'dispatch', '异步']
    },
    modules: {
        title: 'Modules',
        body: `
        <p class="lead">当应用变得复杂时，可以将 store 分割成模块。每个模块拥有自己的 state、mutations、actions、getters。</p>
        <h3>定义模块</h3>
        <pre><code>const moduleA = {
    namespaced: true,  // 启用命名空间
    state: () => ({ count: 0 }),
    mutations: {
        increment(state) { state.count++ }
    },
    getters: {
        doubleCount(state) { return state.count * 2 }
    },
    actions: {
        incrementIfOdd({ state, commit }) {
        if (state.count % 2 === 1) commit('increment')
        }
    }
    }

    const moduleB = {
    namespaced: true,
    state: () => ({ ... }),
    modules: {
        subModule: { ... }  // 支持嵌套
    }
    }

    const store = createStore({
    modules: {
        a: moduleA,
        b: moduleB
    }
    })</code></pre>
        <h3>访问模块内容</h3>
        <pre><code>// 访问 state
    store.state.a.count

    // 提交 mutation（带命名空间）
    store.commit('a/increment')

    // 分发 action
    store.dispatch('a/incrementIfOdd')

    // 在组件中使用 mapState/mapGetters 带命名空间
    import { mapState, mapGetters, mapMutations } from 'vuex'

    computed: {
    ...mapState('a', ['count']),
    ...mapGetters('a', ['doubleCount'])
    }
    methods: {
    ...mapMutations('a', ['increment'])
    }</code></pre>
        <div class="note">📦 命名空间使模块高度封装，推荐始终启用 <code>namespaced: true</code>。</div>
        `,
        tags: ['modules', '命名空间', '模块化']
    },
    'map-helpers': {
        title: '映射辅助函数',
        body: `
        <p class="lead">Vuex 提供了一系列辅助函数，用于简化在组件中绑定 store 的代码。</p>
        <pre><code>import { mapState, mapGetters, mapMutations, mapActions } from 'vuex'

    export default {
    computed: {
        // 映射 state
        ...mapState(['count', 'user']),
        ...mapState({
        localCount: 'count',
        cartTotal: state => state.cart.total
        }),
        // 映射 getters
        ...mapGetters(['doneTodos', 'doneTodosCount']),
        ...mapGetters({
        done: 'doneTodos'
        })
    },
    methods: {
        // 映射 mutations
        ...mapMutations(['increment', 'setUser']),
        ...mapMutations({
        add: 'increment'
        }),
        // 映射 actions
        ...mapActions(['fetchUser', 'updateProfile']),
        ...mapActions({
        getUser: 'fetchUser'
        })
    }
    }

    // 带命名空间的模块
    ...mapState('moduleA', ['count'])
    ...mapGetters('moduleA', ['doubleCount'])
    ...mapMutations('moduleA', ['increment'])
    ...mapActions('moduleA', ['fetchData'])</code></pre>
        `,
        tags: ['mapState', 'mapGetters', 'mapMutations', 'mapActions']
    },
    'composition-api': {
        title: '组合式 API 中使用 Vuex',
        body: `
        <p class="lead">在 Vue 3 的组合式 API 中，可以使用 <code>useStore</code> 获取 store 实例。</p>
        <pre><code>&lt;script setup&gt;
    import { computed } from 'vue'
    import { useStore } from 'vuex'

    const store = useStore()

    // 访问 state
    const count = computed(() => store.state.count)

    // 访问 getters
    const doubleCount = computed(() => store.getters.doubleCount)

    // 提交 mutation
    const increment = () => store.commit('increment')

    // 分发 action
    const fetchUser = () => store.dispatch('fetchUser', userId)

    // 使用 mapState 风格（需要额外处理）
    import { mapState, mapGetters, useStore } from 'vuex'

    const store = useStore()
    const stateMapped = mapState(['count'])
    const stateRefs = {}
    Object.keys(stateMapped).forEach(key => {
    stateRefs[key] = computed(stateMapped[key].bind({ $store: store }))
    })
    &lt;/script&gt;</code></pre>
        <p>也可以使用 <code>vuex-composition-helpers</code> 库获得更好的体验。</p>
        `,
        tags: ['组合式 API', 'useStore', 'Vue 3']
    },
    'strict-mode': {
        title: '严格模式',
        body: `
        <p class="lead">在严格模式下，任何非 mutation 引起的 state 变更都会抛出错误，确保状态变更的可追踪性。</p>
        <pre><code>const store = createStore({
    // ...
    strict: true  // 开启严格模式
    })</code></pre>
        <div class="note">⚠️ 严格模式会深度监测状态树，对性能有一定影响。不要在 production 环境开启。</div>
        <pre><code>const store = createStore({
    // ...
    strict: process.env.NODE_ENV !== 'production'
    })</code></pre>
        `,
        tags: ['严格模式', '调试', '开发环境']
    },
    'form-handling': {
        title: '表单处理',
        body: `
        <p class="lead">在 Vuex 中处理表单输入，推荐使用 getter 和 mutation 配合 v-model。</p>
        <h3>方式一：使用计算属性的 setter</h3>
        <pre><code>&lt;input v-model="message"&gt;

    computed: {
    message: {
        get() {
        return this.$store.state.form.message
        },
        set(value) {
        this.$store.commit('updateMessage', value)
        }
    }
    }</code></pre>
        <h3>方式二：使用双向绑定的 mutation</h3>
        <pre><code>&lt;input :value="message" @input="updateMessage"&gt;

    methods: {
    updateMessage(e) {
        this.$store.commit('updateMessage', e.target.value)
    }
    }</code></pre>
        <h3>方式三：使用 mapMutations</h3>
        <pre><code>&lt;input :value="message" @input="updateMessage"&gt;

    methods: {
    ...mapMutations(['updateMessage'])
    }</code></pre>
        `,
        tags: ['表单', 'v-model', '双向绑定']
    },
    plugins: {
        title: '插件系统',
        body: `
        <p class="lead">Vuex 插件是一个函数，接收 store 作为唯一参数，可以订阅 mutation 和修改 store。</p>
        <h3>创建插件</h3>
        <pre><code>// 日志插件
    const logger = store => {
    // 订阅 mutation
    store.subscribe((mutation, state) => {
        console.log('Mutation:', mutation.type, mutation.payload)
        console.log('State after:', state)
    })
    }

    // 持久化插件
    const persistPlugin = store => {
    // 恢复状态
    const saved = localStorage.getItem('vuex-state')
    if (saved) {
        store.replaceState(JSON.parse(saved))
    }
    // 订阅变化
    store.subscribe((mutation, state) => {
        localStorage.setItem('vuex-state', JSON.stringify(state))
    })
    }

    // 使用插件
    const store = createStore({
    // ...
    plugins: [logger, persistPlugin]
    })</code></pre>
        <h3>内置插件</h3>
        <p>Vuex 提供了 <code>createLogger</code> 插件用于调试。</p>
        <pre><code>import { createLogger } from 'vuex'

    const store = createStore({
    plugins: [createLogger({
        collapsed: false,
        filter(mutation, state) { return mutation.type !== 'aBlacklistedMutation' }
    })]
    })</code></pre>
        `,
        tags: ['插件', 'subscribe', '日志']
    },
    'hot-reload': {
        title: '热重载',
        body: `
        <p class="lead">使用 webpack 的 Hot Module Replacement API，可以在开发过程中热重载 mutations、modules、actions、getters。</p>
        <pre><code>// store/index.js
    if (import.meta.hot) {
    import.meta.hot.accept(['./mutations', './modules'], () => {
        const newMutations = require('./mutations').default
        const newModules = require('./modules').default
        store.hotUpdate({
        mutations: newMutations,
        modules: newModules
        })
    })
    }</code></pre>
        <p>热重载可以保持当前应用状态，无需刷新页面，极大提升开发效率。</p>
        `,
        tags: ['热重载', 'HMR', '开发体验']
    },
    typescript: {
        title: 'TypeScript 支持',
        body: `
        <p class="lead">Vuex 4 提供了完整的 TypeScript 类型支持。</p>
        <h3>类型化 Store</h3>
        <pre><code>import { createStore, Store } from 'vuex'

    interface State {
    count: number
    user: { name: string } | null
    }

    export const store = createStore<State>({
    state: {
        count: 0,
        user: null
    },
    mutations: {
        increment(state: State) {
        state.count++
        }
    },
    actions: {
        incrementAsync({ commit }) {
        setTimeout(() => commit('increment'), 1000)
        }
    }
    })

    // 在组件中获取类型化的 store
    import { useStore } from 'vuex'
    import { key } from './store'

    const store = useStore(key)</code></pre>
        <h3>模块类型化</h3>
        <pre><code>interface ModuleAState {
    count: number
    }

    const moduleA = {
    namespaced: true,
    state: (): ModuleAState => ({ count: 0 }),
    mutations: {
        increment(state: ModuleAState) { state.count++ }
    }
    }</code></pre>
        `,
        tags: ['TypeScript', '类型安全', '类型推断']
    },
    testing: {
        title: '单元测试',
        body: `
        <p class="lead">Vuex 可以独立于 Vue 组件进行测试。</p>
        <h3>测试 Mutations</h3>
        <pre><code>import { mutations } from './store'

    const { increment } = mutations

    test('increment increments state count', () => {
    const state = { count: 0 }
    increment(state)
    expect(state.count).toBe(1)
    })</code></pre>
        <h3>测试 Actions</h3>
        <pre><code>import { actions } from './store'

    test('incrementAsync commits increment', async () => {
    const commit = jest.fn()
    await actions.incrementAsync({ commit })
    expect(commit).toHaveBeenCalledWith('increment')
    })</code></pre>
        <h3>测试 Getters</h3>
        <pre><code>import { getters } from './store'

    test('doubleCount returns count * 2', () => {
    const state = { count: 5 }
    expect(getters.doubleCount(state)).toBe(10)
    })</code></pre>
        `,
        tags: ['测试', 'Jest', 'Vitest']
    },
    'vuex-vs-pinia': {
        title: 'Vuex vs Pinia',
        body: `
        <p class="lead">Pinia 是 Vuex 的现代替代品，了解它们的区别有助于技术选型。</p>
        <table class="mdn-table">
            <thead><tr><th>特性</th><th>Vuex 4</th><th>Pinia</th></tr></thead>
            <tbody>
            <tr><td>API 风格</td><td>Options API 风格</td><td>Options / Setup 双风格</td> </tr>
            <tr><td>Mutations</td><td>✅ 需要</td><td>❌ 不需要（直接修改）</td> </tr>
            <tr><td>TypeScript</td><td>⚠️ 需要额外配置</td><td>🎯 原生完美支持</td> </tr>
            <tr><td>模块化</td><td>📁 modules 嵌套</td><td>🎨 按 store 自然拆分</td> </tr>
            <tr><td>体积</td><td>~10KB+</td><td>~1.5KB</td> </tr>
            <tr><td>DevTools</td><td>✅ 支持</td><td>✅ 支持</td> </tr>
            <tr><td>官方推荐</td><td>Vue 2 项目</td><td>Vue 3 新项目</td> </tr>
            </tbody>
        8讲
        <div class="note">🏆 Vuex 5 将基于 Pinia 的设计重新构建，对于新 Vue 3 项目，官方推荐使用 Pinia。</div>
        `,
        tags: ['对比', 'Pinia', '技术选型']
    },
    'best-practices': {
        title: '最佳实践',
        body: `
        <p class="lead">编写高质量 Vuex 代码的建议：</p>
        <ul>
            <li>✅ 使用模块化组织 store，按业务领域拆分</li>
            <li>✅ 启用命名空间 (<code>namespaced: true</code>) 避免命名冲突</li>
            <li>✅ 保持 mutations 简单，只负责修改 state</li>
            <li>✅ 复杂逻辑放在 actions 中，支持异步操作</li>
            <li>✅ 使用辅助函数 (<code>mapState</code>, <code>mapActions</code> 等) 简化代码</li>
            <li>✅ 开发环境开启严格模式，生产环境关闭</li>
            <li>✅ 使用常量定义 mutation types，便于维护</li>
            <li>✅ 避免在 getters 中产生副作用</li>
            <li>✅ 编写单元测试覆盖 mutations 和 actions</li>
        </ul>
        <h3>Mutation 常量示例</h3>
        <pre><code>// mutation-types.js
    export const INCREMENT = 'INCREMENT'
    export const SET_USER = 'SET_USER'

    // store.js
    import { INCREMENT, SET_USER } from './mutation-types'

    const store = createStore({
    mutations: {
        [INCREMENT](state) { state.count++ },
        [SET_USER](state, user) { state.user = user }
    }
    })</code></pre>
        `,
        tags: ['最佳实践', '代码组织', '性能']
    },
    migration: {
        title: '从 Vuex 3 迁移到 Vuex 4',
        body: `
        <p class="lead">Vuex 4 主要为 Vue 3 提供支持，API 基本保持兼容。</p>
        <h3>主要变更</h3>
        <ul>
            <li><strong>创建方式</strong>：<code>new Vuex.Store()</code> → <code>createStore()</code></li>
            <li><strong>安装方式</strong>：<code>new Vue({ store })</code> → <code>app.use(store)</code></li>
            <li><strong>TypeScript</strong>：改进的类型支持</li>
            <li><strong>辅助函数</strong>：保持兼容</li>
        </ul>
        <h3>迁移步骤</h3>
        <pre><code>// Vuex 3 (Vue 2)
    import Vue from 'vue'
    import Vuex from 'vuex'

    Vue.use(Vuex)
    const store = new Vuex.Store({ ... })
    new Vue({ store })

    // Vuex 4 (Vue 3)
    import { createApp } from 'vue'
    import { createStore } from 'vuex'

    const store = createStore({ ... })
    const app = createApp(App)
    app.use(store)</code></pre>
        <p>其他 API（state, getters, mutations, actions, modules）基本保持不变，迁移成本较低。</p>
        `,
        tags: ['迁移', 'Vuex 3', '升级']
    }
    };

    // 确保所有导航项都有默认内容
    navSections.value.forEach(section => {
    section.items.forEach(item => {
        if (!contentMap[item.id]) {
        contentMap[item.id] = {
            title: item.label,
            body: `<p>📖 关于 <strong>${item.label}</strong> 的详细文档。参考 Vuex 官方文档获取更多信息。</p><pre><code>// ${item.label} 示例代码\nimport { createStore } from 'vuex'\n\nconst store = createStore({\n  // store 定义\n})</code></pre>`,
            tags: ['Vuex', '状态管理']
        };
        }
    });
    });

    // ========== 图谱数据（Vuex 知识点关系网）==========
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

    // 构建 Vuex 知识关系
    addLink('vuex-intro', 'vuex-setup');
    addLink('vuex-setup', 'state');
    addLink('state', 'getters');
    addLink('state', 'mutations');
    addLink('mutations', 'actions');
    addLink('actions', 'modules');
    addLink('state', 'map-helpers');
    addLink('mutations', 'map-helpers');
    addLink('actions', 'map-helpers');
    addLink('modules', 'map-helpers');
    addLink('strict-mode', 'mutations');
    addLink('form-handling', 'state');
    addLink('form-handling', 'mutations');
    addLink('plugins', 'vuex-setup');
    addLink('hot-reload', 'modules');
    addLink('typescript', 'vuex-setup');
    addLink('testing', 'mutations');
    addLink('testing', 'actions');
    addLink('vuex-vs-pinia', 'vuex-intro');
    addLink('best-practices', 'modules');
    addLink('migration', 'vuex-intro');

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
    /* ===== 全局设计令牌（原紫色配色） ===== */
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

    /* 顶栏样式 - 原紫色 */
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