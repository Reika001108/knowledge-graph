<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">React 知识库</h1>
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
          <h2>⚛️ <span class="gradient-text">React 完全指南</span></h2>
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
          <p>⚛️ 用于构建用户界面的 JavaScript 库</p>
          <p>✨ 点击节点双向联动 | 组件化开发</p>
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
          <h3>🔗 React 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'React开发者'
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

// ========== React 导航数据 ==========
const navSections = ref([
  { title: '🚀 快速入门', items: [
      { id: 'react-intro', label: 'React 简介', hot: true },
      { id: 'react-install', label: '安装与配置', hot: true },
      { id: 'react-jsx', label: 'JSX 语法', hot: true },
      { id: 'react-components', label: '组件基础', hot: true }
    ]},
  { title: '🎣 Hooks', items: [
      { id: 'react-usestate', label: 'useState', hot: true },
      { id: 'react-useeffect', label: 'useEffect', hot: true },
      { id: 'react-usecontext', label: 'useContext', hot: true },
      { id: 'react-usereducer', label: 'useReducer', hot: true },
      { id: 'react-usecallback', label: 'useCallback', hot: true },
      { id: 'react-usememo', label: 'useMemo', hot: true },
      { id: 'react-useref', label: 'useRef', hot: true }
    ]},
  { title: '📝 状态管理', items: [
      { id: 'react-state', label: '组件状态', hot: true },
      { id: 'react-props', label: 'Props 属性传递', hot: true },
      { id: 'react-lifting', label: '状态提升', hot: true },
      { id: 'react-context', label: 'Context API', hot: true }
    ]},
  { title: '🎨 组件模式', items: [
      { id: 'react-conditional', label: '条件渲染', hot: true },
      { id: 'react-list', label: '列表与 Keys', hot: true },
      { id: 'react-forms', label: '表单处理', hot: true },
      { id: 'react-lifecycle', label: '生命周期', hot: true },
      { id: 'react-composition', label: '组合 vs 继承', hot: true }
    ]},
  { title: '⚡ 高级特性', items: [
      { id: 'react-fragments', label: 'Fragments', hot: true },
      { id: 'react-portals', label: 'Portals', hot: true },
      { id: 'react-lazy', label: '懒加载', hot: true },
      { id: 'react-error-boundaries', label: '错误边界', hot: true },
      { id: 'react-refs', label: 'Refs 转发', hot: true }
    ]},
  { title: '🔧 性能优化', items: [
      { id: 'react-memo', label: 'React.memo', hot: true },
      { id: 'react-profiler', label: 'Profiler', hot: true },
      { id: 'react-code-splitting', label: '代码分割', hot: true }
    ]}
])

const selectedId = ref('react-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== React 内容映射表 ==========
const contentMap = {
  'react-intro': {
    title: 'React 简介',
    body: '<p class="lead">React 是一个用于构建用户界面的 JavaScript 库，采用声明式编程和组件化开发模式，由 Facebook 开发并维护。</p><h3>核心特点</h3><ul><li><strong>声明式</strong>：只需描述 UI 最终状态，React 负责更新</li><li><strong>组件化</strong>：封装可复用的组件</li><li><strong>虚拟 DOM</strong>：高效更新界面</li><li><strong>单向数据流</strong>：数据从父组件流向子组件</li><li><strong>Hooks</strong>：函数组件中使用状态和生命周期</li></ul><div class="note">💡 React 由 Jordan Walke 创建，于 2013 年开源，是目前最流行的前端框架之一。</div>',
    tags: ['React', 'UI库', '组件化']
  },
  'react-install': {
    title: '安装与配置',
    body: '<p class="lead">React 可以通过多种方式创建项目。</p><pre><code>// 使用 Vite（推荐）\nnpm create vite@latest my-app -- --template react\nnpm create vite@latest my-app -- --template react-ts\n\n// 使用 Create React App\nnpx create-react-app my-app\nnpx create-react-app my-app --template typescript\n\n// 使用 Next.js\nnpx create-next-app@latest my-app\n\n// 手动安装\nnpm install react react-dom\n\n// 运行项目\nnpm run dev\nnpm start</code></pre>',
    tags: ['安装', 'Vite', 'CRA']
  },
  'react-jsx': {
    title: 'JSX 语法',
    body: '<p class="lead">JSX 是 JavaScript 的语法扩展，用于描述 UI 结构。</p><pre><code>// 基本语法\nconst element = &lt;h1&gt;Hello, React!&lt;/h1&gt;\n\n// 嵌入表达式\nconst name = "Alice"\nconst element = &lt;h1&gt;Hello, {name}!&lt;/h1&gt;\n\n// 属性绑定\nconst imgUrl = "https://example.com/image.jpg"\nconst element = &lt;img src={imgUrl} alt="description" /&gt;\n\n// 子元素\nconst element = (\n  &lt;div&gt;\n    &lt;h1&gt;标题&lt;/h1&gt;\n    &lt;p&gt;段落内容&lt;/p&gt;\n  &lt;/div&gt;\n)\n\n// 条件渲染\nconst content = isLoggedIn ? &lt;UserGreeting /&gt; : &lt;GuestGreeting /&gt;\n\n// 列表渲染\nconst items = [1, 2, 3]\nconst list = items.map(item => &lt;li key={item}&gt;{item}&lt;/li&gt;)</code></pre>',
    tags: ['JSX', '语法', '表达式']
  },
  'react-components': {
    title: '组件基础',
    body: '<p class="lead">组件是 React 的核心，有两种定义方式。</p><pre><code>// 函数组件（推荐）\nfunction Welcome(props) {\n  return &lt;h1&gt;Hello, {props.name}!&lt;/h1&gt;\n}\n\n// 箭头函数组件\nconst Welcome = (props) => &lt;h1&gt;Hello, {props.name}!&lt;/h1&gt;\n\n// 类组件\nclass Welcome extends React.Component {\n  render() {\n    return &lt;h1&gt;Hello, {this.props.name}!&lt;/h1&gt;\n  }\n}\n\n// 组件使用\nfunction App() {\n  return (\n    &lt;div&gt;\n      &lt;Welcome name="Alice" /&gt;\n      &lt;Welcome name="Bob" /&gt;\n    &lt;/div&gt;\n  )\n}</code></pre>',
    tags: ['组件', '函数组件', '类组件']
  },
  'react-usestate': {
    title: 'useState',
    body: '<p class="lead">useState 用于在函数组件中添加状态。</p><pre><code>import { useState } from "react"\n\nfunction Counter() {\n  const [count, setCount] = useState(0)\n  const [user, setUser] = useState({ name: "Alice", age: 25 })\n  const [todos, setTodos] = useState([])\n  \n  // 更新状态\n  const increment = () => setCount(count + 1)\n  const updateName = () => setUser({ ...user, name: "Bob" })\n  const addTodo = () => setTodos([...todos, { id: Date.now(), text: "New Todo" }])\n  \n  // 函数式更新\n  const incrementByPrev = () => setCount(prev => prev + 1)\n  \n  return (\n    &lt;div&gt;\n      &lt;p&gt;Count: {count}&lt;/p&gt;\n      &lt;button onClick={increment}&gt;增加&lt;/button&gt;\n    &lt;/div&gt;\n  )\n}</code></pre>',
    tags: ['useState', '状态', 'Hook']
  },
  'react-useeffect': {
    title: 'useEffect',
    body: '<p class="lead">useEffect 用于处理副作用操作。</p><pre><code>import { useState, useEffect } from "react"\n\nfunction Example() {\n  const [count, setCount] = useState(0)\n  \n  // 组件挂载和更新时执行\n  useEffect(() => {\n    document.title = `点击了 ${count} 次`\n  })\n  \n  // 只在组件挂载时执行\n  useEffect(() => {\n    const timer = setInterval(() => {\n      console.log("tick")\n    }, 1000)\n    \n    // 清理函数\n    return () => clearInterval(timer)\n  }, [])\n  \n  // 依赖 count，count 变化时执行\n  useEffect(() => {\n    console.log(`count 变为: ${count}`)\n  }, [count])\n  \n  // 数据获取\n  useEffect(() => {\n    let isMounted = true\n    \n    fetchData().then(data => {\n      if (isMounted) {\n        setData(data)\n      }\n    })\n    \n    return () => { isMounted = false }\n  }, [])\n  \n  return &lt;div&gt;{count}&lt;/div&gt;\n}</code></pre>',
    tags: ['useEffect', '副作用', '生命周期']
  },
  'react-usecontext': {
    title: 'useContext',
    body: '<p class="lead">useContext 用于访问 Context 数据，避免 props 逐层传递。</p><pre><code>import { createContext, useContext, useState } from "react"\n\n// 创建 Context\nconst ThemeContext = createContext()\nconst UserContext = createContext()\n\n// Provider 组件\nfunction App() {\n  const [theme, setTheme] = useState("light")\n  const user = { name: "Alice", role: "admin" }\n  \n  return (\n    &lt;ThemeContext.Provider value={{ theme, setTheme }}&gt;\n      &lt;UserContext.Provider value={user}&gt;\n        &lt;Toolbar /&gt;\n      &lt;/UserContext.Provider&gt;\n    &lt;/ThemeContext.Provider&gt;\n  )\n}\n\n// 消费 Context\nfunction Toolbar() {\n  const { theme, setTheme } = useContext(ThemeContext)\n  const user = useContext(UserContext)\n  \n  return (\n    &lt;div&gt;\n      &lt;p&gt;当前主题: {theme}&lt;/p&gt;\n      &lt;p&gt;用户: {user.name}&lt;/p&gt;\n      &lt;button onClick={() => setTheme("dark")}&gt;切换主题&lt;/button&gt;\n    &lt;/div&gt;\n  )\n}</code></pre>',
    tags: ['useContext', 'Context', '状态共享']
  },
  'react-usereducer': {
    title: 'useReducer',
    body: '<p class="lead">useReducer 是 useState 的替代方案，适用于复杂状态逻辑。</p><pre><code>import { useReducer } from "react"\n\n// 定义 reducer\nconst initialState = { count: 0, todos: [] }\n\nfunction reducer(state, action) {\n  switch (action.type) {\n    case "increment":\n      return { ...state, count: state.count + 1 }\n    case "decrement":\n      return { ...state, count: state.count - 1 }\n    case "addTodo":\n      return { ...state, todos: [...state.todos, action.payload] }\n    case "reset":\n      return initialState\n    default:\n      return state\n  }\n}\n\nfunction Counter() {\n  const [state, dispatch] = useReducer(reducer, initialState)\n  \n  return (\n    &lt;div&gt;\n      &lt;p&gt;Count: {state.count}&lt;/p&gt;\n      &lt;button onClick={() => dispatch({ type: "increment" })}&gt;+&lt;/button&gt;\n      &lt;button onClick={() => dispatch({ type: "decrement" })}&gt;-&lt;/button&gt;\n      &lt;button onClick={() => dispatch({ type: "reset" })}&gt;重置&lt;/button&gt;\n    &lt;/div&gt;\n  )\n}</code></pre>',
    tags: ['useReducer', 'Reducer', '状态管理']
  },
  'react-usecallback': {
    title: 'useCallback',
    body: '<p class="lead">useCallback 缓存函数引用，避免子组件不必要的重渲染。</p><pre><code>import { useState, useCallback } from "react"\n\nfunction Parent() {\n  const [count, setCount] = useState(0)\n  const [text, setText] = useState("")\n  \n  // 没有 useCallback，每次渲染都会创建新函数\n  const handleClick = useCallback(() => {\n    console.log("按钮被点击")\n  }, [])  // 空依赖，函数不会重新创建\n  \n  const handleIncrement = useCallback(() => {\n    setCount(prev => prev + 1)\n  }, [])  // setCount 是稳定的，不需要依赖\n  \n  const handleTextChange = useCallback((e) => {\n    setText(e.target.value)\n  }, [])  // setText 是稳定的\n  \n  return (\n    &lt;div&gt;\n      &lt;ChildButton onClick={handleClick} /&gt;\n      &lt;ChildButton onClick={handleIncrement} /&gt;\n    &lt;/div&gt;\n  )\n}\n\nconst ChildButton = React.memo(({ onClick }) => {\n  console.log("子组件渲染")\n  return &lt;button onClick={onClick}&gt;点击&lt;/button&gt;\n})</code></pre>',
    tags: ['useCallback', '性能优化', '函数缓存']
  },
  'react-usememo': {
    title: 'useMemo',
    body: '<p class="lead">useMemo 缓存计算结果，避免重复计算。</p><pre><code>import { useState, useMemo } from "react"\n\nfunction ExpensiveComponent({ numbers }) {\n  const [filter, setFilter] = useState("")\n  \n  // 没有 useMemo，每次渲染都会重新计算\n  const expensiveResult = useMemo(() => {\n    console.log("执行复杂计算...")\n    return numbers\n      .filter(n => n.toString().includes(filter))\n      .reduce((sum, n) => sum + n, 0)\n  }, [numbers, filter])  // 只有 numbers 或 filter 变化时重新计算\n  \n  // 缓存对象，避免子组件不必要的重渲染\n  const config = useMemo(() => ({\n    theme: "dark",\n    size: "large",\n    onAction: () => console.log("action")\n  }), [])\n  \n  return (\n    &lt;div&gt;\n      &lt;input value={filter} onChange={(e) => setFilter(e.target.value)} /&gt;\n      &lt;p&gt;计算结果: {expensiveResult}&lt;/p&gt;\n    &lt;/div&gt;\n  )\n}</code></pre>',
    tags: ['useMemo', '计算缓存', '性能优化']
  },
  'react-useref': {
    title: 'useRef',
    body: '<p class="lead">useRef 用于访问 DOM 元素或存储可变值。</p><pre><code>import { useRef, useEffect } from "react"\n\nfunction TextInput() {\n  // 访问 DOM 元素\n  const inputRef = useRef(null)\n  \n  useEffect(() => {\n    inputRef.current.focus()\n  }, [])\n  \n  // 存储可变值（不会触发重渲染）\n  const intervalRef = useRef(null)\n  const countRef = useRef(0)\n  \n  const startTimer = () => {\n    intervalRef.current = setInterval(() => {\n      countRef.current++\n      console.log(countRef.current)\n    }, 1000)\n  }\n  \n  const stopTimer = () => {\n    clearInterval(intervalRef.current)\n  }\n  \n  // 获取前一个值\n  const [count, setCount] = useState(0)\n  const prevCountRef = useRef()\n  \n  useEffect(() => {\n    prevCountRef.current = count\n  }, [count])\n  \n  const prevCount = prevCountRef.current\n  \n  return (\n    &lt;div&gt;\n      &lt;input ref={inputRef} type="text" /&gt;\n      &lt;p&gt;前一个值: {prevCount}, 当前值: {count}&lt;/p&gt;\n      &lt;button onClick={startTimer}&gt;开始&lt;/button&gt;\n      &lt;button onClick={stopTimer}&gt;停止&lt;/button&gt;\n    &lt;/div&gt;\n  )\n}</code></pre>',
    tags: ['useRef', 'DOM引用', '可变值']
  },
  'react-state': {
    title: '组件状态',
    body: '<p class="lead">React 组件的状态管理。</p><pre><code>// 函数组件状态\nfunction FunctionComponent() {\n  const [count, setCount] = useState(0)\n  const [user, setUser] = useState({ name: "", age: 0 })\n  \n  // 状态更新可能是异步的\n  const handleClick = () => {\n    setCount(count + 1)\n    console.log(count)  // 还是旧值\n  }\n  \n  // 使用函数式更新获取最新值\n  const handleAsyncClick = () => {\n    setCount(prev => prev + 1)\n  }\n  \n  return &lt;div&gt;{count}&lt;/div&gt;\n}\n\n// 类组件状态\nclass ClassComponent extends React.Component {\n  state = {\n    count: 0,\n    user: { name: "", age: 0 }\n  }\n  \n  handleClick = () => {\n    this.setState({ count: this.state.count + 1 })\n    // 基于前一个状态更新\n    this.setState(prev => ({ count: prev.count + 1 }))\n  }\n  \n  render() {\n    return &lt;div&gt;{this.state.count}&lt;/div&gt;\n  }\n}</code></pre>',
    tags: ['状态', 'setState', 'useState']
  },
  'react-props': {
    title: 'Props 属性传递',
    body: '<p class="lead">Props 用于父组件向子组件传递数据。</p><pre><code>// 父组件\nfunction Parent() {\n  const user = { name: "Alice", age: 25 }\n  \n  return (\n    &lt;Child\n      name="Bob"\n      age={30}\n      user={user}\n      onUpdate={handleUpdate}\n    &gt;\n      &lt;span&gt;子元素内容&lt;/span&gt;\n    &lt;/Child&gt;\n  )\n}\n\n// 子组件\nfunction Child({ name, age, user, onUpdate, children }) {\n  // 默认值\n  const { name: userName = "Guest" } = props\n  \n  // PropTypes 类型检查\n  Child.propTypes = {\n    name: PropTypes.string.isRequired,\n    age: PropTypes.number,\n    onUpdate: PropTypes.func\n  }\n  \n  // 默认值\n  Child.defaultProps = {\n    age: 18\n  }\n  \n  return (\n    &lt;div&gt;\n      &lt;p&gt;Name: {name}&lt;/p&gt;\n      &lt;p&gt;Age: {age}&lt;/p&gt;\n      {children}\n    &lt;/div&gt;\n  )\n}</code></pre>',
    tags: ['Props', '属性', '数据传递']
  },
  'react-lifting': {
    title: '状态提升',
    body: '<p class="lead">将共享状态提升到最近的共同祖先组件。</p><pre><code>function Parent() {\n  const [temperature, setTemperature] = useState(0)\n  \n  const handleTemperatureChange = (newTemp) => {\n    setTemperature(newTemp)\n  }\n  \n  return (\n    &lt;div&gt;\n      &lt;Child1 temperature={temperature} onTemperatureChange={handleTemperatureChange} /&gt;\n      &lt;Child2 temperature={temperature} /&gt;\n    &lt;/div&gt;\n  )\n}\n\nfunction Child1({ temperature, onTemperatureChange }) {\n  return (\n    &lt;input\n      type="number"\n      value={temperature}\n      onChange={(e) => onTemperatureChange(Number(e.target.value))}\n    /&gt;\n  )\n}\n\nfunction Child2({ temperature }) {\n  return &lt;p&gt;当前温度: {temperature}&lt;/p&gt;\n}</code></pre>',
    tags: ['状态提升', '共享状态', '数据流']
  },
  'react-context': {
    title: 'Context API',
    body: '<p class="lead">Context 提供跨组件层级的数据传递。</p><pre><code>// 创建 Context\nconst ThemeContext = React.createContext("light")\nconst LanguageContext = React.createContext("zh")\n\n// Provider\nfunction App() {\n  return (\n    &lt;ThemeContext.Provider value="dark"&gt;\n      &lt;LanguageContext.Provider value="en"&gt;\n        &lt;Toolbar /&gt;\n      &lt;/LanguageContext.Provider&gt;\n    &lt;/ThemeContext.Provider&gt;\n  )\n}\n\n// 类组件消费\nclass Toolbar extends React.Component {\n  static contextType = ThemeContext\n  render() {\n    return &lt;div&gt;Theme: {this.context}&lt;/div&gt;\n  }\n}\n\n// 函数组件消费\nfunction Button() {\n  const theme = useContext(ThemeContext)\n  const language = useContext(LanguageContext)\n  return &lt;button&gt;{theme} - {language}&lt;/button&gt;\n}\n\n// Consumer 方式\nfunction Content() {\n  return (\n    &lt;ThemeContext.Consumer&gt;\n      {theme => &lt;div&gt;当前主题: {theme}&lt;/div&gt;}\n    &lt;/ThemeContext.Consumer&gt;\n  )\n}</code></pre>',
    tags: ['Context', '跨层级', 'Provider']
  },
  'react-conditional': {
    title: '条件渲染',
    body: '<p class="lead">React 中的条件渲染方式。</p><pre><code>function Greeting({ isLoggedIn, user }) {\n  // 方式1：if 语句\n  if (isLoggedIn) {\n    return &lt;UserGreeting name={user.name} /&gt;\n  }\n  return &lt;GuestGreeting /&gt;\n  \n  // 方式2：三元运算符\n  return isLoggedIn ? &lt;UserGreeting /&gt; : &lt;GuestGreeting /&gt;\n  \n  // 方式3：逻辑与 (&&)\n  return (\n    &lt;div&gt;\n      {isLoggedIn && &lt;UserMenu /&gt;}\n      {!isLoggedIn && &lt;LoginButton /&gt;}\n    &lt;/div&gt;\n  )\n  \n  // 方式4：立即执行函数\n  return (\n    &lt;div&gt;\n      {(() => {\n        if (status === "loading") return &lt;Spinner /&gt;\n        if (status === "error") return &lt;ErrorMessage /&gt;\n        return &lt;DataDisplay /&gt;\n      })()}\n    &lt;/div&gt;\n  )\n}</code></pre>',
    tags: ['条件渲染', 'if', '三元运算符']
  },
  'react-list': {
    title: '列表与 Keys',
    body: '<p class="lead">渲染列表时需要提供 key 属性。</p><pre><code>function TodoList({ todos }) {\n  // 使用 map 渲染列表\n  const todoItems = todos.map(todo => (\n    &lt;li key={todo.id}&gt;\n      {todo.text}\n    &lt;/li&gt;\n  ))\n  \n  // 列表项组件\n  const TodoItem = ({ todo }) => (\n    &lt;li key={todo.id}&gt;{todo.text}&lt;/li&gt;\n  )\n  \n  // Key 的选择\n  // 1. 使用唯一 ID（推荐）\n  &lt;li key={item.id}&gt;...&lt;/li&gt;\n  \n  // 2. 使用数组索引（仅当列表稳定时）\n  &lt;li key={index}&gt;...&lt;/li&gt;\n  \n  // 3. 使用组合 key\n  &lt;li key={`${item.id}-${item.type}`}&gt;...&lt;/li&gt;\n  \n  return (\n    &lt;ul&gt;\n      {todos.map(todo => (\n        &lt;TodoItem key={todo.id} todo={todo} /&gt;\n      ))}\n    &lt;/ul&gt;\n  )\n}</code></pre>',
    tags: ['列表', 'Keys', 'map']
  },
  'react-forms': {
    title: '表单处理',
    body: '<p class="lead">React 中的表单处理方式。</p><pre><code>import { useState } from "react"\n\nfunction ContactForm() {\n  // 受控组件\n  const [formData, setFormData] = useState({\n    name: "",\n    email: "",\n    message: "",\n    newsletter: false\n  })\n  \n  const handleChange = (e) => {\n    const { name, value, type, checked } = e.target\n    setFormData(prev => ({\n      ...prev,\n      [name]: type === "checkbox" ? checked : value\n    }))\n  }\n  \n  const handleSubmit = (e) => {\n    e.preventDefault()\n    console.log(formData)\n  }\n  \n  // 非受控组件\n  const nameRef = useRef()\n  const emailRef = useRef()\n  \n  const handleUncontrolledSubmit = (e) => {\n    e.preventDefault()\n    console.log(nameRef.current.value)\n  }\n  \n  return (\n    &lt;form onSubmit={handleSubmit}&gt;\n      &lt;input\n        name="name"\n        value={formData.name}\n        onChange={handleChange}\n        placeholder="姓名"\n      /&gt;\n      &lt;input\n        name="email"\n        type="email"\n        value={formData.email}\n        onChange={handleChange}\n        placeholder="邮箱"\n      /&gt;\n      &lt;textarea\n        name="message"\n        value={formData.message}\n        onChange={handleChange}\n        placeholder="留言"\n      /&gt;\n      &lt;label&gt;\n        &lt;input\n          name="newsletter"\n          type="checkbox"\n          checked={formData.newsletter}\n          onChange={handleChange}\n        />\n        订阅新闻\n      &lt;/label&gt;\n      &lt;button type="submit"&gt;提交&lt;/button&gt;\n    &lt;/form&gt;\n  )\n}</code></pre>',
    tags: ['表单', '受控组件', '非受控组件']
  },
  'react-lifecycle': {
    title: '生命周期',
    body: '<p class="lead">React 组件的生命周期方法（类组件）。</p><pre><code>class LifecycleComponent extends React.Component {\n  constructor(props) {\n    super(props)\n    this.state = { count: 0 }\n    console.log("constructor")\n  }\n  \n  static getDerivedStateFromProps(props, state) {\n    console.log("getDerivedStateFromProps")\n    return null\n  }\n  \n  componentDidMount() {\n    console.log("componentDidMount")\n    // 数据获取、订阅、DOM 操作\n  }\n  \n  shouldComponentUpdate(nextProps, nextState) {\n    console.log("shouldComponentUpdate")\n    return true  // 返回 false 阻止渲染\n  }\n  \n  getSnapshotBeforeUpdate(prevProps, prevState) {\n    console.log("getSnapshotBeforeUpdate")\n    return null\n  }\n  \n  componentDidUpdate(prevProps, prevState, snapshot) {\n    console.log("componentDidUpdate")\n  }\n  \n  componentWillUnmount() {\n    console.log("componentWillUnmount")\n    // 清理订阅、定时器\n  }\n  \n  render() {\n    console.log("render")\n    return &lt;div&gt;{this.state.count}&lt;/div&gt;\n  }\n}\n\n// 函数组件生命周期（Hooks）\nfunction FunctionComponent() {\n  useEffect(() => {\n    console.log("componentDidMount")\n    return () => console.log("componentWillUnmount")\n  }, [])\n  \n  useEffect(() => {\n    console.log("componentDidUpdate")\n  })\n  \n  return &lt;div&gt;Functional&lt;/div&gt;\n}</code></pre>',
    tags: ['生命周期', 'mount', 'update']
  },
  'react-composition': {
    title: '组合 vs 继承',
    body: '<p class="lead">React 推荐使用组合而非继承来复用代码。</p><pre><code>// 容器组件\nfunction Dialog({ title, content, actions }) {\n  return (\n    &lt;div className="dialog"&gt;\n      &lt;h2&gt;{title}&lt;/h2&gt;\n      &lt;div className="content"&gt;{content}&lt;/div&gt;\n      &lt;div className="actions"&gt;{actions}&lt;/div&gt;\n    &lt;/div&gt;\n  )\n}\n\n// 使用组合\nfunction WelcomeDialog() {\n  return (\n    &lt;Dialog\n      title="欢迎"\n      content="欢迎使用 React！"\n      actions={\n        &lt;&gt;\n          &lt;button&gt;确定&lt;/button&gt;\n          &lt;button&gt;取消&lt;/button&gt;\n        &lt;/&gt;\n      }\n    /&gt;\n  )\n}\n\n// 特殊化（通过组合实现）\nfunction SuccessDialog() {\n  return (\n    &lt;Dialog\n      title="成功"\n      content={\n        &lt;&gt;\n          &lt;CheckIcon /&gt;\n          &lt;p&gt;操作成功！&lt;/p&gt;\n        &lt;/&gt;\n      }\n      actions={&lt;button&gt;确定&lt;/button&gt;}\n    /&gt;\n  )\n}</code></pre>',
    tags: ['组合', '继承', '复用']
  },
  'react-fragments': {
    title: 'Fragments',
    body: '<p class="lead">Fragments 允许在不添加额外 DOM 节点的情况下返回多个元素。</p><pre><code>// 短语法（推荐）\nfunction List() {\n  return (\n    &lt;&gt;\n      &lt;li&gt;项目1&lt;/li&gt;\n      &lt;li&gt;项目2&lt;/li&gt;\n      &lt;li&gt;项目3&lt;/li&gt;\n    &lt;/&gt;\n  )\n}\n\n// 完整语法\nfunction Table() {\n  return (\n    &lt;React.Fragment&gt;\n      &lt;tr&gt;&lt;td&gt;数据1&lt;/td&gt;&lt;/tr&gt;\n      &lt;tr&gt;&lt;td&gt;数据2&lt;/td&gt;&lt;/tr&gt;\n    &lt;/React.Fragment&gt;\n  )\n}\n\n// 带 key 的 Fragment\nfunction Glossary(props) {\n  return (\n    &lt;dl&gt;\n      {props.items.map(item => (\n        &lt;React.Fragment key={item.id}&gt;\n          &lt;dt&gt;{item.term}&lt;/dt&gt;\n          &lt;dd&gt;{item.description}&lt;/dd&gt;\n        &lt;/React.Fragment&gt;\n      ))}\n    &lt;/dl&gt;\n  )\n}</code></pre>',
    tags: ['Fragment', '空标签', '分组']
  },
  'react-portals': {
    title: 'Portals',
    body: '<p class="lead">Portals 将子节点渲染到父组件之外的 DOM 节点。</p><pre><code>import { createPortal } from "react-dom"\n\nfunction Modal({ children, isOpen, onClose }) {\n  if (!isOpen) return null\n  \n  // 渲染到 body 下的 modal-root 元素\n  return createPortal(\n    &lt;div className="modal-overlay"&gt;\n      &lt;div className="modal"&gt;\n        &lt;button onClick={onClose}&gt;关闭&lt;/button&gt;\n        {children}\n      &lt;/div&gt;\n    &lt;/div&gt;,\n    document.getElementById("modal-root")\n  )\n}\n\nfunction Tooltip({ children, text }) {\n  const [show, setShow] = useState(false)\n  \n  return (\n    &lt;div onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}&gt;\n      {children}\n      {show && createPortal(\n        &lt;div className="tooltip"&gt;{text}&lt;/div&gt;,\n        document.body\n      )}\n    &lt;/div&gt;\n  )\n}\n\n// 使用\n&lt;Modal isOpen={isOpen} onClose={() => setOpen(false)}&gt;\n  &lt;h2&gt;模态框标题&lt;/h2&gt;\n  &lt;p&gt;模态框内容&lt;/p&gt;\n&lt;/Modal&gt;</code></pre>',
    tags: ['Portals', 'createPortal', '模态框']
  },
  'react-lazy': {
    title: '懒加载',
    body: '<p class="lead">React.lazy 和 Suspense 实现组件懒加载。</p><pre><code>import { lazy, Suspense } from "react"\n\n// 懒加载组件\nconst Home = lazy(() => import("./pages/Home"))\nconst About = lazy(() => import("./pages/About"))\nconst UserProfile = lazy(() => import("./pages/UserProfile"))\n\nfunction App() {\n  return (\n    &lt;Suspense fallback={&lt;div&gt;加载中...&lt;/div&gt;}&gt;\n      &lt;Routes&gt;\n        &lt;Route path="/" element={&lt;Home /&gt;} /&gt;\n        &lt;Route path="/about" element={&lt;About /&gt;} /&gt;\n        &lt;Route path="/user/:id" element={&lt;UserProfile /&gt;} /&gt;\n      &lt;/Routes&gt;\n    &lt;/Suspense&gt;\n  )\n}\n\n// 命名导出懒加载\nconst MyComponent = lazy(() =>\n  import("./MyComponent").then(module => ({ default: module.MyComponent }))\n)\n\n// 错误边界 + 懒加载\nfunction App() {\n  return (\n    &lt;ErrorBoundary fallback={&lt;div&gt;加载失败&lt;/div&gt;}&gt;\n      &lt;Suspense fallback={&lt;Spinner /&gt;}&gt;\n        &lt;LazyComponent /&gt;\n      &lt;/Suspense&gt;\n    &lt;/ErrorBoundary&gt;\n  )\n}</code></pre>',
    tags: ['懒加载', 'React.lazy', 'Suspense']
  },
  'react-error-boundaries': {
    title: '错误边界',
    body: '<p class="lead">错误边界捕获子组件树中的 JavaScript 错误。</p><pre><code>class ErrorBoundary extends React.Component {\n  constructor(props) {\n    super(props)\n    this.state = { hasError: false, error: null }\n  }\n  \n  static getDerivedStateFromError(error) {\n    return { hasError: true, error }\n  }\n  \n  componentDidCatch(error, errorInfo) {\n    console.error("捕获错误:", error, errorInfo)\n    // 上报错误到服务\n    logErrorToService(error, errorInfo)\n  }\n  \n  render() {\n    if (this.state.hasError) {\n      return this.props.fallback || (\n        &lt;div className="error-fallback"&gt;\n          &lt;h2&gt;出错了&lt;/h2&gt;\n          &lt;button onClick={() => window.location.reload()}&gt;刷新页面&lt;/button&gt;\n        &lt;/div&gt;\n      )\n    }\n    \n    return this.props.children\n  }\n}\n\n// 使用\nfunction App() {\n  return (\n    &lt;ErrorBoundary fallback={&lt;ErrorDisplay /&gt;}&gt;\n      &lt;Widget /&gt;\n    &lt;/ErrorBoundary&gt;\n  )\n}\n\n// 自定义错误边界 Hook\nfunction useErrorHandler() {\n  const [error, setError] = useState(null)\n  \n  if (error) {\n    throw error\n  }\n  \n  return setError\n}</code></pre>',
    tags: ['错误边界', 'ErrorBoundary', '错误处理']
  },
  'react-refs': {
    title: 'Refs 转发',
    body: '<p class="lead">Refs 转发将 ref 传递给子组件。</p><pre><code>// 使用 forwardRef\nconst FancyButton = React.forwardRef((props, ref) => {\n  return &lt;button ref={ref} className="fancy-button"&gt;\n    {props.children}\n  &lt;/button&gt;\n})\n\n// 高阶组件中的 ref 转发\nfunction logProps(Component) {\n  class LogProps extends React.Component {\n    componentDidUpdate(prevProps) {\n      console.log("旧 props:", prevProps)\n      console.log("新 props:", this.props)\n    }\n    \n    render() {\n      const { forwardedRef, ...rest } = this.props\n      return &lt;Component ref={forwardedRef} {...rest} /&gt;\n    }\n  }\n  \n  return React.forwardRef((props, ref) => {\n    return &lt;LogProps {...props} forwardedRef={ref} /&gt;\n  })\n}\n\n// 使用\nfunction Parent() {\n  const buttonRef = useRef()\n  \n  useEffect(() => {\n    buttonRef.current.focus()\n  }, [])\n  \n  return (\n    &lt;FancyButton ref={buttonRef}&gt;\n      点击我\n    &lt;/FancyButton&gt;\n  )\n}</code></pre>',
    tags: ['Refs转发', 'forwardRef', 'ref传递']
  },
  'react-memo': {
    title: 'React.memo',
    body: '<p class="lead">React.memo 用于优化函数组件的重渲染。</p><pre><code>// 基本使用\nconst MemoizedComponent = React.memo(MyComponent)\n\n// 自定义比较函数\nconst MemoizedComponent = React.memo(MyComponent, (prevProps, nextProps) => {\n  // 返回 true 表示不重新渲染，false 表示重新渲染\n  return prevProps.id === nextProps.id\n})\n\nfunction Parent() {\n  const [count, setCount] = useState(0)\n  const [data, setData] = useState({ id: 1, name: "Alice" })\n  \n  // 使用 useCallback 避免函数重新创建\n  const handleClick = useCallback(() => {\n    console.log("clicked")\n  }, [])\n  \n  return (\n    &lt;div&gt;\n      &lt;p&gt;Count: {count}&lt;/p&gt;\n      &lt;button onClick={() => setCount(count + 1)}&gt;增加&lt;/button&gt;\n      &lt;ExpensiveChild data={data} onClick={handleClick} /&gt;\n    &lt;/div&gt;\n  )\n}\n\nconst ExpensiveChild = React.memo(({ data, onClick }) => {\n  console.log("子组件渲染")\n  return (\n    &lt;div&gt;\n      &lt;p&gt;{data.name}&lt;/p&gt;\n      &lt;button onClick={onClick}&gt;点击&lt;/button&gt;\n    &lt;/div&gt;\n  )\n})</code></pre>',
    tags: ['React.memo', '性能优化', '重渲染']
  },
  'react-profiler': {
    title: 'Profiler',
    body: '<p class="lead">Profiler 组件用于测量 React 应用渲染性能。</p><pre><code>import { Profiler } from "react"\n\nfunction onRenderCallback(\n  id,           // Profiler 树的 id\n  phase,        // "mount" 或 "update"\n  actualDuration,  // 渲染耗时\n  baseDuration,    // 无 memo 时的耗时\n  startTime,       // 开始渲染时间\n  commitTime,      // 提交时间\n  interactions     // 交互集合\n) {\n  console.log(`组件 ${id} ${phase} 耗时: ${actualDuration}ms`)\n  // 上报性能数据\n  reportPerformance({\n    component: id,\n    phase,\n    duration: actualDuration\n  })\n}\n\nfunction App() {\n  return (\n    &lt;Profiler id="App" onRender={onRenderCallback}&gt;\n      &lt;Profiler id="Header" onRender={onRenderCallback}&gt;\n        &lt;Header /&gt;\n      &lt;/Profiler&gt;\n      &lt;Profiler id="Main" onRender={onRenderCallback}&gt;\n        &lt;Main /&gt;\n      &lt;/Profiler&gt;\n    &lt;/Profiler&gt;\n  )\n}</code></pre>',
    tags: ['Profiler', '性能', '测量']
  },
  'react-code-splitting': {
    title: '代码分割',
    body: '<p class="lead">代码分割可以减小初始包体积，提升加载速度。</p><pre><code>// 动态 import\nconst module = await import("./module.js")\n\n// 路由级代码分割\nconst Home = lazy(() => import("./routes/Home"))\nconst About = lazy(() => import("./routes/About"))\nconst Dashboard = lazy(() => import("./routes/Dashboard"))\n\nfunction App() {\n  return (\n    &lt;Suspense fallback={&lt;Loading /&gt;}&gt;\n      &lt;Routes&gt;\n        &lt;Route path="/" element={&lt;Home /&gt;} /&gt;\n        &lt;Route path="/about" element={&lt;About /&gt;} /&gt;\n        &lt;Route path="/dashboard" element={&lt;Dashboard /&gt;} /&gt;\n      &lt;/Routes&gt;\n    &lt;/Suspense&gt;\n  )\n}\n\n// 组件级代码分割\nconst HeavyChart = lazy(() => import("./components/HeavyChart"))\nconst VideoPlayer = lazy(() => import("./components/VideoPlayer"))\n\nfunction Dashboard() {\n  const [showChart, setShowChart] = useState(false)\n  \n  return (\n    &lt;div&gt;\n      &lt;button onClick={() => setShowChart(true)}&gt;显示图表&lt;/button&gt;\n      {showChart && (\n        &lt;Suspense fallback={&lt;div&gt;加载图表中...&lt;/div&gt;}&gt;\n          &lt;HeavyChart /&gt;\n        &lt;/Suspense&gt;\n      )}\n    &lt;/div&gt;\n  )\n}</code></pre>',
    tags: ['代码分割', '动态导入', '懒加载']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 React 官方文档获取更多信息。</p>',
        tags: ['React', '前端框架']
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

addLink('react-intro', 'react-install')
addLink('react-install', 'react-jsx')
addLink('react-jsx', 'react-components')
addLink('react-usestate', 'react-useeffect')
addLink('react-useeffect', 'react-usecontext')
addLink('react-usecontext', 'react-usereducer')
addLink('react-usereducer', 'react-usecallback')
addLink('react-usecallback', 'react-usememo')
addLink('react-usememo', 'react-useref')
addLink('react-state', 'react-props')
addLink('react-props', 'react-lifting')
addLink('react-lifting', 'react-context')
addLink('react-conditional', 'react-list')
addLink('react-list', 'react-forms')
addLink('react-forms', 'react-lifecycle')
addLink('react-lifecycle', 'react-composition')
addLink('react-fragments', 'react-portals')
addLink('react-portals', 'react-lazy')
addLink('react-lazy', 'react-error-boundaries')
addLink('react-error-boundaries', 'react-refs')
addLink('react-memo', 'react-profiler')
addLink('react-profiler', 'react-code-splitting')

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