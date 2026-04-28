<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">Redux 知识库</h1>
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
          <h2>🔄 <span class="gradient-text">Redux 完全指南</span></h2>
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
          <p>🔄 JavaScript 状态容器 | 可预测的状态管理</p>
          <p>✨ 点击节点双向联动 | 单向数据流</p>
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
          <h3>🔗 Redux 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'Redux开发者'
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

// ========== Redux 导航数据 ==========
const navSections = ref([
  { title: '🚀 核心概念', items: [
      { id: 'redux-intro', label: 'Redux 简介', hot: true },
      { id: 'redux-actions', label: 'Actions', hot: true },
      { id: 'redux-reducers', label: 'Reducers', hot: true },
      { id: 'redux-store', label: 'Store', hot: true }
    ]},
  { title: '🔄 数据流', items: [
      { id: 'redux-data-flow', label: '单向数据流', hot: true },
      { id: 'redux-dispatch', label: 'dispatch', hot: true },
      { id: 'redux-selectors', label: '选择器', hot: true }
    ]},
  { title: '🔧 中间件', items: [
      { id: 'redux-middleware', label: '中间件简介', hot: true },
      { id: 'redux-thunk', label: 'Redux Thunk', hot: true },
      { id: 'redux-saga', label: 'Redux Saga', hot: true },
      { id: 'redux-logger', label: '日志中间件', hot: true }
    ]},
  { title: '⚛️ React-Redux', items: [
      { id: 'react-redux-intro', label: 'React-Redux 简介', hot: true },
      { id: 'react-redux-hooks', label: 'Hooks API', hot: true },
      { id: 'react-redux-connect', label: 'connect 高阶组件', hot: true },
      { id: 'react-redux-provider', label: 'Provider', hot: true }
    ]},
  { title: '📦 高级特性', items: [
      { id: 'redux-toolkit', label: 'Redux Toolkit', hot: true },
      { id: 'redux-devtools', label: 'DevTools', hot: true },
      { id: 'redux-persist', label: '状态持久化', hot: true },
      { id: 'redux-ducks', label: 'Ducks 模式', hot: true }
    ]}
])

const selectedId = ref('redux-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== Redux 内容映射表 ==========
const contentMap = {
  'redux-intro': {
    title: 'Redux 简介',
    body: '<p class="lead">Redux 是一个 JavaScript 状态容器，提供可预测的状态管理，常用于 React 应用中。</p><h3>核心原则</h3><ul><li><strong>单一数据源</strong>：整个应用的状态存储在单个 store 中</li><li><strong>状态只读</strong>：唯一改变状态的方式是触发 action</li><li><strong>纯函数更新</strong>：使用纯函数 reducer 描述状态变化</li></ul><div class="note">💡 Redux 由 Dan Abramov 和 Andrew Clark 创建，受 Flux 和 Elm 启发。</div>',
    tags: ['状态管理', 'Flux', '单向数据流']
  },
  'redux-actions': {
    title: 'Actions',
    body: '<p class="lead">Action 是普通 JavaScript 对象，描述发生了什么事件。</p><pre><code>// Action 类型常量\nconst INCREMENT = "INCREMENT"\nconst DECREMENT = "DECREMENT"\nconst ADD_TODO = "ADD_TODO"\n\n// Action 创建函数\nfunction increment() {\n  return { type: INCREMENT }\n}\n\nfunction decrement() {\n  return { type: DECREMENT }\n}\n\nfunction addTodo(text) {\n  return {\n    type: ADD_TODO,\n    payload: { id: Date.now(), text, completed: false }\n  }\n}\n\n// 带元数据的 Action\nfunction setUser(user) {\n  return {\n    type: "SET_USER",\n    payload: user,\n    meta: { timestamp: Date.now() }\n  }\n}\n\n// 错误处理\nfunction fetchUserFailed(error) {\n  return {\n    type: "FETCH_USER_FAILED",\n    error: true,\n    payload: error\n  }\n}</code></pre>',
    tags: ['Action', 'Action Creator', 'type']
  },
  'redux-reducers': {
    title: 'Reducers',
    body: '<p class="lead">Reducer 是纯函数，接收当前状态和 action，返回新状态。</p><pre><code>// 初始状态\nconst initialState = {\n  count: 0,\n  todos: [],\n  user: null\n}\n\n// Reducer 函数\nfunction counterReducer(state = initialState, action) {\n  switch (action.type) {\n    case "INCREMENT":\n      return { ...state, count: state.count + 1 }\n    case "DECREMENT":\n      return { ...state, count: state.count - 1 }\n    case "ADD_TODO":\n      return {\n        ...state,\n        todos: [...state.todos, action.payload]\n      }\n    case "SET_USER":\n      return { ...state, user: action.payload }\n    default:\n      return state\n  }\n}\n\n// 组合 Reducers\nimport { combineReducers } from "redux"\n\nconst rootReducer = combineReducers({\n  counter: counterReducer,\n  todos: todosReducer,\n  user: userReducer\n})</code></pre>',
    tags: ['Reducer', '纯函数', 'combineReducers']
  },
  'redux-store': {
    title: 'Store',
    body: '<p class="lead">Store 是保存状态的对象，提供 dispatch、getState、subscribe 等方法。</p><pre><code>import { createStore } from "redux"\nimport rootReducer from "./reducers"\n\n// 创建 Store\nconst store = createStore(rootReducer)\n\n// 获取状态\nconst state = store.getState()\nconsole.log(state.count)\n\n// 订阅状态变化\nconst unsubscribe = store.subscribe(() => {\n  console.log("状态更新:", store.getState())\n})\n\n// 分发 Action\nstore.dispatch({ type: "INCREMENT" })\nstore.dispatch(addTodo("学习 Redux"))\n\n// 取消订阅\nunsubscribe()\n\n// 替换 Reducer（热替换）\nstore.replaceReducer(nextReducer)</code></pre>',
    tags: ['Store', 'createStore', 'dispatch']
  },
  'redux-data-flow': {
    title: '单向数据流',
    body: '<p class="lead">Redux 采用严格的单向数据流架构。</p><pre><code>// 数据流步骤\n// 1. 调用 store.dispatch(action)\n// 2. Redux store 调用 reducer 函数\n// 3. 根 reducer 合并多个子 reducer 的结果\n// 4. Redux store 保存新的状态树\n// 5. 订阅者收到通知并更新 UI\n\n// 完整示例\n// View: 用户点击按钮\n&lt;button onClick={() => store.dispatch(increment())}&gt;+1&lt;/button&gt;\n\n// Action: 描述发生了什么\nconst increment = () => ({ type: "INCREMENT" })\n\n// Reducer: 根据 action 更新状态\nconst counter = (state = 0, action) => {\n  switch (action.type) {\n    case "INCREMENT": return state + 1\n    default: return state\n  }\n}\n\n// Store: 保存状态\nconst store = createStore(counter)\n\n// View: 订阅状态变化\nstore.subscribe(() => render(store.getState()))</code></pre>',
    tags: ['数据流', '单向', '架构']
  },
  'redux-dispatch': {
    title: 'dispatch',
    body: '<p class="lead">dispatch 是触发状态更新的唯一方式。</p><pre><code>// 基本用法\nstore.dispatch({ type: "INCREMENT" })\n\n// 使用 Action Creator\nstore.dispatch(increment())\nstore.dispatch(addTodo("学习 Redux"))\n\n// 批量 dispatch（需要中间件）\nfunction batchDispatch(actions) {\n  actions.forEach(action => store.dispatch(action))\n}\n\n// 异步 dispatch（使用 thunk）\nconst fetchUser = (id) => async (dispatch) => {\n  dispatch({ type: "FETCH_USER_START" })\n  try {\n    const user = await api.getUser(id)\n    dispatch({ type: "FETCH_USER_SUCCESS", payload: user })\n  } catch (error) {\n    dispatch({ type: "FETCH_USER_FAILED", error })\n  }\n}\n\nstore.dispatch(fetchUser(123))</code></pre>',
    tags: ['dispatch', '异步Action', 'Action Creator']
  },
  'redux-selectors': {
    title: '选择器',
    body: '<p class="lead">选择器用于从 store 中提取和计算派生数据。</p><pre><code>// 基础选择器\nconst getTodos = state => state.todos\nconst getFilter = state => state.filter\n\n// 派生数据选择器\nconst getVisibleTodos = state => {\n  const todos = getTodos(state)\n  const filter = getFilter(state)\n  \n  switch (filter) {\n    case "active":\n      return todos.filter(t => !t.completed)\n    case "completed":\n      return todos.filter(t => t.completed)\n    default:\n      return todos\n  }\n}\n\n// 使用 reselect 创建记忆化选择器\nimport { createSelector } from "reselect"\n\nconst getTodos = state => state.todos\nconst getFilter = state => state.filter\n\nconst getVisibleTodos = createSelector(\n  [getTodos, getFilter],\n  (todos, filter) => {\n    // 仅在 todos 或 filter 变化时重新计算\n    switch (filter) {\n      case "active": return todos.filter(t => !t.completed)\n      case "completed": return todos.filter(t => t.completed)\n      default: return todos\n    }\n  }\n)\n\n// 在组件中使用\nconst visibleTodos = useSelector(getVisibleTodos)</code></pre>',
    tags: ['Selector', '派生数据', 'reselect']
  },
  'redux-middleware': {
    title: '中间件简介',
    body: '<p class="lead">中间件提供 action 被 dispatch 之后、到达 reducer 之前的扩展点。</p><pre><code>// 中间件结构\nconst loggerMiddleware = store => next => action => {\n  console.log("dispatching:", action)\n  const result = next(action)\n  console.log("next state:", store.getState())\n  return result\n}\n\n// 应用中间件\nimport { createStore, applyMiddleware } from "redux"\n\nconst store = createStore(\n  rootReducer,\n  applyMiddleware(loggerMiddleware, thunkMiddleware)\n)\n\n// 多个中间件的执行顺序\n// 中间件按 applyMiddleware 参数顺序依次执行\n// 每个中间件可以决定是否将 action 传递给下一个中间件</code></pre>',
    tags: ['中间件', 'applyMiddleware', '增强器']
  },
  'redux-thunk': {
    title: 'Redux Thunk',
    body: '<p class="lead">Redux Thunk 是处理异步 Action 的中间件。</p><pre><code>// 安装\nnpm install redux-thunk\n\n// 配置\nimport { createStore, applyMiddleware } from "redux"\nimport thunk from "redux-thunk"\n\nconst store = createStore(rootReducer, applyMiddleware(thunk))\n\n// 异步 Action Creator\nconst fetchUser = (userId) => async (dispatch, getState) => {\n  dispatch({ type: "FETCH_USER_REQUEST" })\n  \n  try {\n    const response = await fetch(`/api/users/${userId}`)\n    const user = await response.json()\n    dispatch({ type: "FETCH_USER_SUCCESS", payload: user })\n  } catch (error) {\n    dispatch({ type: "FETCH_USER_FAILURE", error: error.message })\n  }\n}\n\n// 条件 dispatch\nconst incrementIfOdd = () => (dispatch, getState) => {\n  const { count } = getState()\n  if (count % 2 === 1) {\n    dispatch({ type: "INCREMENT" })\n  }\n}\n\n// 延迟 dispatch\nconst incrementAsync = (delay = 1000) => dispatch => {\n  setTimeout(() => {\n    dispatch({ type: "INCREMENT" })\n  }, delay)\n}</code></pre>',
    tags: ['Redux Thunk', '异步', '副作用']
  },
  'redux-saga': {
    title: 'Redux Saga',
    body: '<p class="lead">Redux Saga 使用 ES6 生成器处理副作用。</p><pre><code>// 安装\nnpm install redux-saga\n\n// 配置\nimport createSagaMiddleware from "redux-saga"\nimport rootSaga from "./sagas"\n\nconst sagaMiddleware = createSagaMiddleware()\nconst store = createStore(rootReducer, applyMiddleware(sagaMiddleware))\nsagaMiddleware.run(rootSaga)\n\n// Saga 示例\nimport { call, put, takeEvery, takeLatest } from "redux-saga/effects"\n\nfunction* fetchUser(action) {\n  try {\n    const user = yield call(api.fetchUser, action.payload)\n    yield put({ type: "FETCH_USER_SUCCESS", payload: user })\n  } catch (error) {\n    yield put({ type: "FETCH_USER_FAILURE", error: error.message })\n  }\n}\n\nfunction* watchFetchUser() {\n  yield takeEvery("FETCH_USER_REQUEST", fetchUser)\n}\n\nfunction* rootSaga() {\n  yield all([\n    watchFetchUser(),\n    // 其他 saga\n  ])\n}\n\n// takeLatest（只处理最新请求）\nfunction* watchFetchUser() {\n  yield takeLatest("FETCH_USER_REQUEST", fetchUser)\n}</code></pre>',
    tags: ['Redux Saga', '生成器', '副作用']
  },
  'redux-logger': {
    title: '日志中间件',
    body: '<p class="lead">日志中间件用于调试 Redux 应用。</p><pre><code>// 安装\nnpm install redux-logger\n\n// 配置\nimport logger from "redux-logger"\n\nconst store = createStore(\n  rootReducer,\n  applyMiddleware(logger)\n)\n\n// 自定义配置\nconst logger = createLogger({\n  collapsed: true,           // 折叠日志\n  duration: true,            // 显示耗时\n  timestamp: true,           // 显示时间戳\n  colors: {\n    title: () => "#8B5CF6",\n    prevState: () => "#9E9E9E",\n    action: () => "#03A9F4",\n    nextState: () => "#4CAF50",\n    error: () => "#F20404"\n  }\n})\n\n// 生产环境禁用\nconst middleware = process.env.NODE_ENV !== "production"\n  ? applyMiddleware(logger, thunk)\n  : applyMiddleware(thunk)</code></pre>',
    tags: ['日志', '调试', 'redux-logger']
  },
  'react-redux-intro': {
    title: 'React-Redux 简介',
    body: '<p class="lead">React-Redux 是 React 的官方 Redux 绑定库。</p><pre><code>// 安装\nnpm install react-redux\n\n// 基本使用流程\n// 1. 创建 store\n// 2. 使用 Provider 包裹应用\n// 3. 在组件中使用 useSelector 和 useDispatch\n\nimport { Provider } from "react-redux"\nimport { createStore } from "redux"\nimport rootReducer from "./reducers"\n\nconst store = createStore(rootReducer)\n\nfunction App() {\n  return (\n    &lt;Provider store={store}&gt;\n      &lt;Counter /&gt;\n    &lt;/Provider&gt;\n  )\n}</code></pre>',
    tags: ['React-Redux', 'Provider', '绑定']
  },
  'react-redux-hooks': {
    title: 'Hooks API',
    body: '<p class="lead">React-Redux 提供了现代化的 Hooks API。</p><pre><code>import { useSelector, useDispatch } from "react-redux"\n\nfunction Counter() {\n  // 读取状态\n  const count = useSelector(state => state.counter.count)\n  const todos = useSelector(state => state.todos)\n  \n  // 获取 dispatch\n  const dispatch = useDispatch()\n  \n  // 使用 memoized 选择器\n  const visibleTodos = useSelector(getVisibleTodos)\n  \n  // 相等性检查\n  const user = useSelector(state => state.user, shallowEqual)\n  \n  // 使用自定义 Hooks 封装\n  const useCounter = () => {\n    const count = useSelector(state => state.counter.count)\n    const dispatch = useDispatch()\n    return {\n      count,\n      increment: () => dispatch({ type: "INCREMENT" }),\n      decrement: () => dispatch({ type: "DECREMENT" })\n    }\n  }\n  \n  return (\n    &lt;div&gt;\n      &lt;p&gt;Count: {count}&lt;/p&gt;\n      &lt;button onClick={() => dispatch({ type: "INCREMENT" })}&gt;+&lt;/button&gt;\n    &lt;/div&gt;\n  )\n}</code></pre>',
    tags: ['useSelector', 'useDispatch', 'Hooks']
  },
  'react-redux-connect': {
    title: 'connect 高阶组件',
    body: '<p class="lead">connect 是 React-Redux 的传统 API，用于连接组件和 Redux。</p><pre><code>import { connect } from "react-redux"\n\n// 映射状态到 Props\nconst mapStateToProps = (state, ownProps) => ({\n  count: state.counter.count,\n  todoCount: state.todos.length,\n  userId: ownProps.userId\n})\n\n// 映射 Dispatch 到 Props\nconst mapDispatchToProps = {\n  increment: () => ({ type: "INCREMENT" }),\n  decrement: () => ({ type: "DECREMENT" }),\n  addTodo: (text) => ({ type: "ADD_TODO", payload: text })\n}\n\n// 函数形式\nconst mapDispatchToProps = (dispatch) => ({\n  increment: () => dispatch({ type: "INCREMENT" }),\n  decrement: () => dispatch({ type: "DECREMENT" })\n})\n\n// 合并 Props\nconst mergeProps = (stateProps, dispatchProps, ownProps) => ({\n  ...stateProps,\n  ...dispatchProps,\n  ...ownProps\n})\n\n// 使用 connect\nexport default connect(\n  mapStateToProps,\n  mapDispatchToProps,\n  mergeProps,\n  { pure: true }\n)(CounterComponent)</code></pre>',
    tags: ['connect', 'mapStateToProps', 'mapDispatchToProps']
  },
  'react-redux-provider': {
    title: 'Provider',
    body: '<p class="lead">Provider 使 Redux store 在整个应用中可用。</p><pre><code>import { Provider } from "react-redux"\nimport { createStore } from "redux"\nimport rootReducer from "./reducers"\n\nconst store = createStore(rootReducer)\n\n// 基础用法\nReactDOM.render(\n  &lt;Provider store={store}&gt;\n    &lt;App /&gt;\n  &lt;/Provider&gt;,\n  document.getElementById("root")\n)\n\n// 多个 store（不推荐）\n&lt;Provider store={store1}&gt;\n  &lt;Provider store={store2}&gt;\n    &lt;App /&gt;\n  &lt;/Provider&gt;\n&lt;/Provider&gt;\n\n// 动态 store\nfunction Root({ store }) {\n  return (\n    &lt;Provider store={store}&gt;\n      &lt;App /&gt;\n    &lt;/Provider&gt;\n  )\n}</code></pre>',
    tags: ['Provider', 'store', '上下文']
  },
  'redux-toolkit': {
    title: 'Redux Toolkit',
    body: '<p class="lead">Redux Toolkit 是官方推荐的 Redux 开发工具集。</p><pre><code>// 安装\nnpm install @reduxjs/toolkit\n\n// 创建 Slice\nimport { createSlice, configureStore } from "@reduxjs/toolkit"\n\nconst counterSlice = createSlice({\n  name: "counter",\n  initialState: { value: 0 },\n  reducers: {\n    increment: (state) => { state.value += 1 },\n    decrement: (state) => { state.value -= 1 },\n    incrementByAmount: (state, action) => {\n      state.value += action.payload\n    }\n  }\n})\n\nexport const { increment, decrement, incrementByAmount } = counterSlice.actions\n\n// 异步 Thunk\nimport { createAsyncThunk } from "@reduxjs/toolkit"\n\nexport const fetchUser = createAsyncThunk(\n  "user/fetchUser",\n  async (userId) => {\n    const response = await fetch(`/api/users/${userId}`)\n    return response.json()\n  }\n)\n\nconst userSlice = createSlice({\n  name: "user",\n  initialState: { user: null, status: "idle" },\n  extraReducers: (builder) => {\n    builder\n      .addCase(fetchUser.pending, (state) => {\n        state.status = "loading"\n      })\n      .addCase(fetchUser.fulfilled, (state, action) => {\n        state.status = "succeeded"\n        state.user = action.payload\n      })\n      .addCase(fetchUser.rejected, (state) => {\n        state.status = "failed"\n      })\n  }\n})\n\n// 配置 Store\nconst store = configureStore({\n  reducer: {\n    counter: counterSlice.reducer,\n    user: userSlice.reducer\n  }\n})\n\nexport default store</code></pre>',
    tags: ['Redux Toolkit', 'createSlice', 'configureStore']
  },
  'redux-devtools': {
    title: 'DevTools',
    body: '<p class="lead">Redux DevTools 用于调试和时间旅行。</p><pre><code>// 安装浏览器扩展\n// Chrome: Redux DevTools Extension\n\n// 配置 Store\nimport { createStore } from "redux"\n\nconst store = createStore(\n  rootReducer,\n  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()\n)\n\n// 使用 composeWithDevTools\nimport { composeWithDevTools } from "redux-devtools-extension"\n\nconst store = createStore(\n  rootReducer,\n  composeWithDevTools(\n    applyMiddleware(thunk),\n    // 其他增强器\n  )\n)\n\n// 自定义 DevTools 选项\nconst composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__?.({\n  trace: true,           // 追踪 action 调用栈\n  traceLimit: 25,\n  actionsBlacklist: ["IGNORED_ACTION"],\n  actionsWhitelist: ["IMPORTANT_ACTION"],\n}) || compose</code></pre>',
    tags: ['DevTools', '调试', '时间旅行']
  },
  'redux-persist': {
    title: '状态持久化',
    body: '<p class="lead">Redux Persist 用于持久化存储状态。</p><pre><code>// 安装\nnpm install redux-persist\n\n// 配置\nimport { persistStore, persistReducer } from "redux-persist"\nimport storage from "redux-persist/lib/storage"\n\nconst persistConfig = {\n  key: "root",\n  storage,\n  whitelist: ["user", "settings"],  // 只持久化这些 reducer\n  blacklist: ["temp"],               // 排除这些 reducer\n  transforms: []\n}\n\nconst persistedReducer = persistReducer(persistConfig, rootReducer)\n\nconst store = createStore(persistedReducer)\nconst persistor = persistStore(store)\n\n// React 中使用\nimport { PersistGate } from "redux-persist/integration/react"\n\nfunction App() {\n  return (\n    &lt;Provider store={store}&gt;\n      &lt;PersistGate loading={&lt;div&gt;Loading...&lt;/div&gt;} persistor={persistor}&gt;\n        &lt;RootComponent /&gt;\n      &lt;/PersistGate&gt;\n    &lt;/Provider&gt;\n  )\n}\n\n// 清除持久化存储\npersistor.purge()</code></pre>',
    tags: ['持久化', 'redux-persist', 'storage']
  },
  'redux-ducks': {
    title: 'Ducks 模式',
    body: '<p class="lead">Ducks 模式将 action types、actions 和 reducer 放在同一个文件中。</p><pre><code>// ducks/counter.js\n// Action Types\nconst INCREMENT = "counter/INCREMENT"\nconst DECREMENT = "counter/DECREMENT"\n\n// Reducer\nconst initialState = { value: 0 }\n\nexport default function reducer(state = initialState, action) {\n  switch (action.type) {\n    case INCREMENT:\n      return { ...state, value: state.value + 1 }\n    case DECREMENT:\n      return { ...state, value: state.value - 1 }\n    default:\n      return state\n  }\n}\n\n// Action Creators\nexport const increment = () => ({ type: INCREMENT })\nexport const decrement = () => ({ type: DECREMENT })\n\n// 组合 ducks\n// rootReducer.js\nimport { combineReducers } from "redux"\nimport counter from "./ducks/counter"\nimport user from "./ducks/user"\n\nexport default combineReducers({\n  counter,\n  user\n})</code></pre>',
    tags: ['Ducks模式', '模块化', '组织代码']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 Redux 官方文档获取更多信息。</p>',
        tags: ['Redux', '状态管理']
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

addLink('redux-intro', 'redux-actions')
addLink('redux-actions', 'redux-reducers')
addLink('redux-reducers', 'redux-store')
addLink('redux-data-flow', 'redux-dispatch')
addLink('redux-dispatch', 'redux-selectors')
addLink('redux-middleware', 'redux-thunk')
addLink('redux-thunk', 'redux-saga')
addLink('redux-saga', 'redux-logger')
addLink('react-redux-intro', 'react-redux-hooks')
addLink('react-redux-hooks', 'react-redux-connect')
addLink('react-redux-connect', 'react-redux-provider')
addLink('redux-toolkit', 'redux-devtools')
addLink('redux-devtools', 'redux-persist')
addLink('redux-persist', 'redux-ducks')

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