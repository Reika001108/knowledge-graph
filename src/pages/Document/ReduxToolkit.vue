<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">Redux Toolkit 知识库</h1>
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
          <h2>⚡ <span class="gradient-text">Redux Toolkit 完全指南</span></h2>
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
          <p>⚡ 官方推荐的 Redux 开发工具集</p>
          <p>✨ 点击节点双向联动 | 简化 Redux 开发</p>
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
          <h3>🔗 Redux Toolkit 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'RTK用户'
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

// ========== Redux Toolkit 导航数据 ==========
const navSections = ref([
  { title: '🚀 快速入门', items: [
      { id: 'rtk-intro', label: 'Redux Toolkit 简介', hot: true },
      { id: 'rtk-install', label: '安装与配置', hot: true },
      { id: 'rtk-vs-redux', label: 'RTK vs 传统 Redux', hot: true }
    ]},
  { title: '📦 核心 API', items: [
      { id: 'rtk-configure-store', label: 'configureStore', hot: true },
      { id: 'rtk-create-slice', label: 'createSlice', hot: true },
      { id: 'rtk-create-action', label: 'createAction', hot: true },
      { id: 'rtk-create-reducer', label: 'createReducer', hot: true }
    ]},
  { title: '⚡ 异步处理', items: [
      { id: 'rtk-create-async-thunk', label: 'createAsyncThunk', hot: true },
      { id: 'rtk-create-listener', label: 'createListenerMiddleware', hot: true },
      { id: 'rtk-observable', label: 'Redux Observable', hot: true }
    ]},
  { title: '🔄 RTK Query', items: [
      { id: 'rtk-query-intro', label: 'RTK Query 简介', hot: true },
      { id: 'rtk-create-api', label: 'createApi', hot: true },
      { id: 'rtk-fetch-base-query', label: 'fetchBaseQuery', hot: true },
      { id: 'rtk-cache', label: '缓存与失效', hot: true }
    ]},
  { title: '🔧 工具与最佳实践', items: [
      { id: 'rtk-entity-adapter', label: '实体适配器', hot: true },
      { id: 'rtk-immutable', label: '不可变更新', hot: true },
      { id: 'rtk-typescript', label: 'TypeScript 支持', hot: true },
      { id: 'rtk-devtools', label: 'DevTools 集成', hot: true }
    ]}
])

const selectedId = ref('rtk-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== Redux Toolkit 内容映射表 ==========
const contentMap = {
  'rtk-intro': {
    title: 'Redux Toolkit 简介',
    body: '<p class="lead">Redux Toolkit 是官方推荐的 Redux 开发工具集，旨在简化 Redux 开发，减少样板代码，提供最佳实践。</p><h3>核心特点</h3><ul><li><strong>简化配置</strong>：自动配置中间件和 DevTools</li><li><strong>减少样板</strong>：createSlice 自动生成 actions 和 reducers</li><li><strong>不可变更新</strong>：内置 Immer，支持可变语法</li><li><strong>RTK Query</strong>：强大的数据获取和缓存方案</li><li><strong>TypeScript 优先</strong>：优秀的类型推断</li></ul><div class="note">💡 Redux Toolkit 是 Redux 团队官方维护的，推荐在所有 Redux 项目中使用。</div>',
    tags: ['Redux', '官方工具集', '简化开发']
  },
  'rtk-install': {
    title: '安装与配置',
    body: '<p class="lead">Redux Toolkit 可以通过 npm 快速安装。</p><pre><code># 使用 npm\nnpm install @reduxjs/toolkit react-redux\n\n# 使用 yarn\nyarn add @reduxjs/toolkit react-redux\n\n# 使用 pnpm\npnpm add @reduxjs/toolkit react-redux\n\n# 使用 Vite 创建项目\nnpm create vite@latest my-app -- --template react\nnpm install @reduxjs/toolkit react-redux\n\n# 使用 Create React App\nnpx create-react-app my-app --template redux</code></pre>',
    tags: ['安装', 'npm', '配置']
  },
  'rtk-vs-redux': {
    title: 'RTK vs 传统 Redux',
    body: '<p class="lead">Redux Toolkit 与传统 Redux 的对比。</p><table class="mdn-table"><thead><tr><th>特性</th><th>Redux Toolkit</th><th>传统 Redux</th></tr></thead><tbody><tr><td>代码量</th><td>减少 50-70%</th><td>较多</th></td><tr><td>配置</th><td>自动配置</th><td>手动配置</th></td><tr><td>不可变更新</th><td>Immer 自动处理</th><td>手动扩展运算符</th></td><tr><td>异步处理</th></tr>/th>内建 createAsyncThunk</th><td>需要 thunk 中间件</th></tr></td><td>类型安全</th><td>优秀</th><td>需要手动类型</th></td><td>RTK Query</th><td>内置</th><td>需要额外配置</th></tr></tbody></table><pre><code>// 传统 Redux\nconst ADD_TODO = "ADD_TODO"\nconst addTodo = (text) => ({ type: ADD_TODO, payload: text })\nconst todosReducer = (state = [], action) => {\n  switch (action.type) {\n    case ADD_TODO:\n      return [...state, { text: action.payload, completed: false }]\n    default: return state\n  }\n}\n\n// Redux Toolkit\nconst todosSlice = createSlice({\n  name: "todos",\n  initialState: [],\n  reducers: {\n    addTodo: (state, action) => {\n      state.push({ text: action.payload, completed: false })\n    }\n  }\n})</code></pre>',
    tags: ['对比', '简化', '样板代码']
  },
  'rtk-configure-store': {
    title: 'configureStore',
    body: '<p class="lead">configureStore 是创建 Redux store 的简化方法，自动配置中间件和 DevTools。</p><pre><code>import { configureStore } from "@reduxjs/toolkit"\nimport todosReducer from "./features/todos/todosSlice"\nimport usersReducer from "./features/users/usersSlice"\n\n// 基本用法\nconst store = configureStore({\n  reducer: {\n    todos: todosReducer,\n    users: usersReducer\n  }\n})\n\n// 高级配置\nconst store = configureStore({\n  reducer: rootReducer,\n  middleware: (getDefaultMiddleware) =>\n    getDefaultMiddleware({\n      serializableCheck: false,\n      thunk: true\n    }).concat(logger),\n  devTools: process.env.NODE_ENV !== "production",\n  preloadedState: initialState,\n  enhancers: (defaultEnhancers) => [...defaultEnhancers, customEnhancer]\n})\n\n// 导出类型\nexport type RootState = ReturnType<typeof store.getState>\nexport type AppDispatch = typeof store.dispatch</code></pre>',
    tags: ['configureStore', 'Store配置', '中间件']
  },
  'rtk-create-slice': {
    title: 'createSlice',
    body: '<p class="lead">createSlice 自动生成 action creators 和 action types。</p><pre><code>import { createSlice } from "@reduxjs/toolkit"\n\nconst counterSlice = createSlice({\n  name: "counter",\n  initialState: { value: 0 },\n  reducers: {\n    increment: (state) => {\n      state.value += 1\n    },\n    decrement: (state) => {\n      state.value -= 1\n    },\n    incrementByAmount: (state, action) => {\n      state.value += action.payload\n    },\n    reset: () => ({ value: 0 })\n  },\n  extraReducers: (builder) => {\n    builder\n      .addCase(fetchUser.pending, (state) => {\n        state.status = "loading"\n      })\n      .addCase(fetchUser.fulfilled, (state, action) => {\n        state.status = "succeeded"\n        state.user = action.payload\n      })\n  }\n})\n\nexport const { increment, decrement, incrementByAmount, reset } = counterSlice.actions\nexport default counterSlice.reducer</code></pre>',
    tags: ['createSlice', 'reducers', 'extraReducers']
  },
  'rtk-create-action': {
    title: 'createAction',
    body: '<p class="lead">createAction 简化 action creator 的创建。</p><pre><code>import { createAction } from "@reduxjs/toolkit"\n\n// 基本用法\nconst increment = createAction("counter/increment")\nconst decrement = createAction("counter/decrement")\n\n// 带 payload 准备函数\nconst addTodo = createAction("todos/addTodo", (text) => {\n  return { payload: { id: Date.now(), text, completed: false } }\n})\n\n// 使用\nstore.dispatch(increment())\nstore.dispatch(addTodo("学习 Redux Toolkit"))\n\n// 在 reducer 中使用\nimport { createReducer } from "@reduxjs/toolkit"\n\nconst todosReducer = createReducer([], (builder) => {\n  builder.addCase(addTodo, (state, action) => {\n    state.push(action.payload)\n  })\n})\n\n// 类型安全\ninterface PayloadAction<T> {\n  type: string\n  payload: T\n}</code></pre>',
    tags: ['createAction', 'Action Creator', 'payload']
  },
  'rtk-create-reducer': {
    title: 'createReducer',
    body: '<p class="lead">createReducer 使用 builder 语法处理 action，内置 Immer 支持。</p><pre><code>import { createReducer } from "@reduxjs/toolkit"\n\nconst initialState = { value: 0 }\n\nconst counterReducer = createReducer(initialState, (builder) => {\n  builder\n    .addCase(increment, (state) => {\n      state.value += 1\n    })\n    .addCase(decrement, (state) => {\n      state.value -= 1\n    })\n    .addCase(incrementByAmount, (state, action) => {\n      state.value += action.payload\n    })\n    .addMatcher(\n      (action) => action.type.endsWith("/pending"),\n      (state) => {\n        state.loading = true\n      }\n    )\n    .addDefaultCase((state, action) => {\n      return state\n    })\n})\n\n// 使用 map 对象语法\nconst todosReducer = createReducer(initialState, {\n  [addTodo.type]: (state, action) => {\n    state.push(action.payload)\n  }\n})</code></pre>',
    tags: ['createReducer', 'builder', 'Immer']
  },
  'rtk-create-async-thunk': {
    title: 'createAsyncThunk',
    body: '<p class="lead">createAsyncThunk 处理异步操作，自动生成 pending/fulfilled/rejected action。</p><pre><code>import { createAsyncThunk } from "@reduxjs/toolkit"\n\n// 基本用法\nconst fetchUser = createAsyncThunk(\n  "user/fetchUser",\n  async (userId, { rejectWithValue }) => {\n    try {\n      const response = await fetch(`/api/users/${userId}`)\n      if (!response.ok) {\n        throw new Error("Failed to fetch user")\n      }\n      return await response.json()\n    } catch (error) {\n      return rejectWithValue(error.message)\n    }\n  }\n)\n\n// 带条件的 thunk\nconst fetchUserIfNeeded = createAsyncThunk(\n  "user/fetchUserIfNeeded",\n  async (userId, { getState, rejectWithValue }) => {\n    const { user } = getState()\n    if (user.loading || user.data) {\n      return rejectWithValue("Already loading or loaded")\n    }\n    const response = await fetch(`/api/users/${userId}`)\n    return response.json()\n  }\n)\n\n// 在 slice 中处理\nconst userSlice = createSlice({\n  name: "user",\n  initialState: { data: null, status: "idle", error: null },\n  reducers: {},\n  extraReducers: (builder) => {\n    builder\n      .addCase(fetchUser.pending, (state) => {\n        state.status = "loading"\n      })\n      .addCase(fetchUser.fulfilled, (state, action) => {\n        state.status = "succeeded"\n        state.data = action.payload\n      })\n      .addCase(fetchUser.rejected, (state, action) => {\n        state.status = "failed"\n        state.error = action.payload as string\n      })\n  }\n})</code></pre>',
    tags: ['createAsyncThunk', '异步', 'Promise']
  },
  'rtk-create-listener': {
    title: 'createListenerMiddleware',
    body: '<p class="lead">监听中间件用于响应 action 执行副作用。</p><pre><code>import { createListenerMiddleware } from "@reduxjs/toolkit"\n\nconst listenerMiddleware = createListenerMiddleware()\n\n// 监听特定 action\nlistenerMiddleware.startListening({\n  actionCreator: increment,\n  effect: async (action, listenerApi) => {\n    console.log("Increment triggered", action.payload)\n    listenerApi.dispatch(logAction(action))\n  }\n})\n\n// 监听条件匹配\nlistenerMiddleware.startListening({\n  matcher: (action) => action.type.startsWith("todos/"),\n  effect: async (action, listenerApi) => {\n    const state = listenerApi.getState()\n    localStorage.setItem("todos", JSON.stringify(state.todos))\n  }\n})\n\n// 防抖\nlistenerMiddleware.startListening({\n  actionCreator: search,\n  effect: async (action, listenerApi) => {\n    listenerApi.cancelActiveListeners()\n    await listenerApi.delay(500)\n    listenerApi.dispatch(fetchResults(action.payload))\n  }\n})\n\n// 配置 store\nconst store = configureStore({\n  reducer: rootReducer,\n  middleware: (getDefaultMiddleware) =>\n    getDefaultMiddleware().prepend(listenerMiddleware.middleware)\n})</code></pre>',
    tags: ['监听中间件', '副作用', '防抖']
  },
  'rtk-observable': {
    title: 'Redux Observable',
    body: '<p class="lead">使用 RxJS 处理异步 action 流。</p><pre><code>// 安装\nnpm install redux-observable rxjs\n\n// 创建 epic\nimport { ofType } from "redux-observable"\nimport { map, mergeMap, catchError } from "rxjs/operators"\nimport { of } from "rxjs"\n\nconst fetchUserEpic = (action$) =>\n  action$.pipe(\n    ofType(fetchUser.type),\n    mergeMap((action) =>\n      from(api.fetchUser(action.payload)).pipe(\n        map((response) => fetchUser.fulfilled(response)),\n        catchError((error) => of(fetchUser.rejected(error.message)))\n      )\n    )\n  )\n\n// 组合 epics\nimport { combineEpics } from "redux-observable"\n\nconst rootEpic = combineEpics(fetchUserEpic, saveTodoEpic)\n\n// 配置 middleware\nimport { createEpicMiddleware } from "redux-observable"\n\nconst epicMiddleware = createEpicMiddleware()\nconst store = configureStore({\n  reducer: rootReducer,\n  middleware: (getDefaultMiddleware) =>\n    getDefaultMiddleware({ thunk: false }).concat(epicMiddleware)\n})\n\nepicMiddleware.run(rootEpic)</code></pre>',
    tags: ['Redux Observable', 'RxJS', 'Epic']
  },
  'rtk-query-intro': {
    title: 'RTK Query 简介',
    body: '<p class="lead">RTK Query 是强大的数据获取和缓存工具，内置在 Redux Toolkit 中。</p><h3>核心特点</h3><ul><li><strong>自动缓存</strong>：管理请求缓存和生命周期</li><li><strong>去重</strong>：相同请求自动去重</li><li><strong>轮询</strong>：支持自动轮询</li><li><strong>乐观更新</strong>：支持乐观 UI 更新</li><li><strong>TypeScript</strong>：完整的类型推断</li></ul><div class="note">💡 RTK Query 消除了手动编写数据获取和缓存逻辑的需要。</div>',
    tags: ['RTK Query', '数据获取', '缓存']
  },
  'rtk-create-api': {
    title: 'createApi',
    body: '<p class="lead">createApi 是 RTK Query 的核心 API，用于定义 API 服务。</p><pre><code>import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"\n\nexport const api = createApi({\n  reducerPath: "api",\n  baseQuery: fetchBaseQuery({ baseUrl: "https://api.example.com/" }),\n  tagTypes: ["User", "Post"],\n  endpoints: (builder) => ({\n    getUsers: builder.query({\n      query: () => "users",\n      providesTags: ["User"]\n    }),\n    getUserById: builder.query({\n      query: (id) => `users/${id}`,\n      providesTags: (result, error, id) => [{ type: "User", id }]\n    }),\n    addUser: builder.mutation({\n      query: (user) => ({\n        url: "users",\n        method: "POST",\n        body: user\n      }),\n      invalidatesTags: ["User"]\n    }),\n    updateUser: builder.mutation({\n      query: ({ id, ...patch }) => ({\n        url: `users/${id}`,\n        method: "PATCH",\n        body: patch\n      }),\n      invalidatesTags: (result, error, { id }) => [{ type: "User", id }]\n    })\n  })\n})\n\nexport const {\n  useGetUsersQuery,\n  useGetUserByIdQuery,\n  useAddUserMutation,\n  useUpdateUserMutation\n} = api</code></pre>',
    tags: ['createApi', 'endpoints', 'query/mutation']
  },
  'rtk-fetch-base-query': {
    title: 'fetchBaseQuery',
    body: '<p class="lead">fetchBaseQuery 是基于 fetch 的查询函数包装器。</p><pre><code>import { fetchBaseQuery } from "@reduxjs/toolkit/query/react"\n\n// 基本配置\nconst baseQuery = fetchBaseQuery({\n  baseUrl: "https://api.example.com/",\n  prepareHeaders: (headers, { getState }) => {\n    const token = (getState() as RootState).auth.token\n    if (token) {\n      headers.set("authorization", `Bearer ${token}`)\n    }\n    return headers\n  },\n  credentials: "include"\n})\n\n// 自定义 baseQuery\nconst customBaseQuery = async (args, api, extraOptions) => {\n  const result = await fetchBaseQuery({\n    baseUrl: "https://api.example.com/",\n    prepareHeaders: (headers) => {\n      headers.set("X-Custom-Header", "value")\n      return headers\n    }\n  })(args, api, extraOptions)\n\n  if (result.error?.status === 401) {\n    // 处理未授权\n    api.dispatch(logout())\n  }\n  return result\n}\n\n// 在 createApi 中使用\nexport const api = createApi({\n  baseQuery: customBaseQuery,\n  endpoints: (builder) => ({\n    // ...\n  })\n})</code></pre>',
    tags: ['fetchBaseQuery', '请求配置', '认证']
  },
  'rtk-cache': {
    title: '缓存与失效',
    body: '<p class="lead">RTK Query 的缓存管理和自动失效机制。</p><pre><code>import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"\n\nexport const api = createApi({\n  reducerPath: "api",\n  baseQuery: fetchBaseQuery({ baseUrl: "/" }),\n  tagTypes: ["Post", "User"],\n  endpoints: (builder) => ({\n    getPosts: builder.query({\n      query: () => "posts",\n      providesTags: (result) =>\n        result\n          ? [\n              ...result.map(({ id }) => ({ type: "Post", id })),\n              { type: "Post", id: "LIST" }\n            ]\n          : [{ type: "Post", id: "LIST" }]\n    }),\n    addPost: builder.mutation({\n      query: (post) => ({\n        url: "posts",\n        method: "POST",\n        body: post\n      }),\n      invalidatesTags: [{ type: "Post", id: "LIST" }]\n    }),\n    updatePost: builder.mutation({\n      query: ({ id, ...patch }) => ({\n        url: `posts/${id}`,\n        method: "PATCH",\n        body: patch\n      }),\n      invalidatesTags: (result, error, { id }) => [{ type: "Post", id }]\n    })\n  })\n})\n\n// 手动缓存控制\nconst { refetch } = useGetPostsQuery()\nconst { invalidateTags } = api.util\n\ninvalidateTags([{ type: "Post", id: "LIST" }])</code></pre>',
    tags: ['缓存', 'tags', 'invalidatesTags']
  },
  'rtk-entity-adapter': {
    title: '实体适配器',
    body: '<p class="lead">实体适配器提供标准化方式处理集合数据。</p><pre><code>import { createEntityAdapter, createSlice } from "@reduxjs/toolkit"\n\n// 创建适配器\nconst todosAdapter = createEntityAdapter({\n  selectId: (todo) => todo.id,\n  sortComparer: (a, b) => b.createdAt - a.createdAt\n})\n\nconst initialState = todosAdapter.getInitialState({\n  status: "idle",\n  loading: false\n})\n\nconst todosSlice = createSlice({\n  name: "todos",\n  initialState,\n  reducers: {\n    addTodo: todosAdapter.addOne,\n    addTodos: todosAdapter.addMany,\n    updateTodo: todosAdapter.updateOne,\n    deleteTodo: todosAdapter.removeOne,\n    toggleAll: (state) => {\n      Object.values(state.entities).forEach((todo) => {\n        todo.completed = !todo.completed\n      })\n    }\n  }\n})\n\n// 选择器\nconst todoSelectors = todosAdapter.getSelectors((state) => state.todos)\n\n// 使用\nconst allTodos = todoSelectors.selectAll(state)\nconst todoById = todoSelectors.selectById(state, 1)\nconst totalTodos = todoSelectors.selectTotal(state)\nconst todoIds = todoSelectors.selectIds(state)</code></pre>',
    tags: ['实体适配器', 'createEntityAdapter', '规范化']
  },
  'rtk-immutable': {
    title: '不可变更新',
    body: '<p class="lead">Redux Toolkit 内置 Immer，支持可变语法更新状态。</p><pre><code>// 传统不可变更新\nconst newState = {\n  ...state,\n  users: state.users.map(user =>\n    user.id === action.payload.id\n      ? { ...user, name: action.payload.name }\n      : user\n  )\n}\n\n// RTK 可变语法（Immer 处理）\nconst reducer = (state, action) => {\n  const user = state.users.find(u => u.id === action.payload.id)\n  if (user) {\n    user.name = action.payload.name  // 直接修改\n  }\n  // 添加新项\n  state.users.push({ id: Date.now(), name: "New User" })\n  // 删除项\n  state.users = state.users.filter(u => u.id !== action.payload.id)\n  // 嵌套更新\n  state.profile.settings.theme = "dark"\n}\n\n// 注意：Immer 代理不能用于某些操作\n// 错误示例\nconst newState = state  // 直接返回原对象\nstate.someProperty = value  // 正确\nstate = someValue  // 错误，不能重新赋值 state 参数</code></pre>',
    tags: ['Immer', '不可变', '可变语法']
  },
  'rtk-typescript': {
    title: 'TypeScript 支持',
    body: '<p class="lead">Redux Toolkit 提供一流的 TypeScript 支持。</p><pre><code>// 定义 RootState 和 AppDispatch\nexport type RootState = ReturnType<typeof store.getState>\nexport type AppDispatch = typeof store.dispatch\n\n// 类型化 Hooks\nimport { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux"\n\nexport const useAppDispatch: () => AppDispatch = useDispatch\nexport const useAppSelector: TypedUseSelectorHook<RootState> = useSelector\n\n// 类型化 Slice\ninterface UserState {\n  data: User | null\n  status: "idle" | "loading" | "succeeded" | "failed"\n}\n\nconst userSlice = createSlice({\n  name: "user",\n  initialState: { data: null, status: "idle" } as UserState,\n  reducers: {},\n  extraReducers: (builder) => {\n    builder.addCase(fetchUser.fulfilled, (state, action: PayloadAction<User>) => {\n      state.data = action.payload\n    })\n  }\n})\n\n// 类型化 createAsyncThunk\nconst fetchUser = createAsyncThunk<User, string, { rejectValue: string }>(\n  "user/fetchUser",\n  async (userId, { rejectWithValue }) => {\n    try {\n      const response = await fetch(`/api/users/${userId}`)\n      return await response.json()\n    } catch (error) {\n      return rejectWithValue(error.message)\n    }\n  }\n)</code></pre>',
    tags: ['TypeScript', '类型安全', 'Hooks']
  },
  'rtk-devtools': {
    title: 'DevTools 集成',
    body: '<p class="lead">Redux Toolkit 自动集成 DevTools，支持时间旅行调试。</p><pre><code>// configureStore 默认启用 DevTools\nconst store = configureStore({\n  reducer: rootReducer,\n  devTools: process.env.NODE_ENV !== "production"\n})\n\n// 自定义 DevTools 配置\nconst store = configureStore({\n  reducer: rootReducer,\n  devTools: {\n    name: "My App",\n    trace: true,\n    traceLimit: 25,\n    actionsBlacklist: ["IGNORED_ACTION"],\n    actionsWhitelist: ["IMPORTANT_ACTION"],\n    maxAge: 50\n  }\n})\n\n// 使用 Redux DevTools Extension\n// 1. 安装浏览器扩展\n// 2. 打开 DevTools 面板\n// 3. 查看 action 历史、状态变化\n// 4. 时间旅行调试\n\n// RTK Query DevTools 支持\n// 在 DevTools 中查看查询缓存、请求状态</code></pre>',
    tags: ['DevTools', '调试', '时间旅行']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 Redux Toolkit 官方文档获取更多信息。</p>',
        tags: ['Redux Toolkit', '状态管理']
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

addLink('rtk-intro', 'rtk-install')
addLink('rtk-install', 'rtk-vs-redux')
addLink('rtk-configure-store', 'rtk-create-slice')
addLink('rtk-create-slice', 'rtk-create-action')
addLink('rtk-create-action', 'rtk-create-reducer')
addLink('rtk-create-async-thunk', 'rtk-create-listener')
addLink('rtk-create-listener', 'rtk-observable')
addLink('rtk-query-intro', 'rtk-create-api')
addLink('rtk-create-api', 'rtk-fetch-base-query')
addLink('rtk-fetch-base-query', 'rtk-cache')
addLink('rtk-entity-adapter', 'rtk-immutable')
addLink('rtk-immutable', 'rtk-typescript')
addLink('rtk-typescript', 'rtk-devtools')

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