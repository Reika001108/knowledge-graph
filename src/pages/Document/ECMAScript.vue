<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">ECMAScript 知识库</h1>
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
          <h2>📜 <span class="gradient-text">ECMAScript 完全指南</span></h2>
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
          <p>📜 JavaScript 语言标准 | 从 ES1 到 ESNext</p>
          <p>✨ 点击节点双向联动 | 掌握现代 JavaScript</p>
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
          <h3>🔗 ECMAScript 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'JS开发者'
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

// ========== ECMAScript 导航数据 ==========
const navSections = ref([
  { title: '📖 语言概述', items: [
      { id: 'es-intro', label: 'ECMAScript 简介', hot: true },
      { id: 'es-history', label: '版本演进历史', hot: true },
      { id: 'es-features', label: '各版本新特性', hot: true }
    ]},
  { title: '📦 变量与作用域', items: [
      { id: 'es-var', label: 'var 声明', hot: true },
      { id: 'es-let-const', label: 'let 与 const', hot: true },
      { id: 'es-scope', label: '作用域', hot: true },
      { id: 'es-hoisting', label: '变量提升', hot: true }
    ]},
  { title: '🔧 函数特性', items: [
      { id: 'es-arrow', label: '箭头函数', hot: true },
      { id: 'es-default-params', label: '默认参数', hot: true },
      { id: 'es-rest-spread', label: 'Rest/Spread', hot: true },
      { id: 'es-destructuring', label: '解构赋值', hot: true }
    ]},
  { title: '📊 数据结构', items: [
      { id: 'es-map-set', label: 'Map 与 Set', hot: true },
      { id: 'es-weakmap', label: 'WeakMap/WeakSet', hot: true },
      { id: 'es-symbol', label: 'Symbol 类型', hot: true },
      { id: 'es-proxy', label: 'Proxy 与 Reflect', hot: true }
    ]},
  { title: '⚡ 异步编程', items: [
      { id: 'es-promise', label: 'Promise', hot: true },
      { id: 'es-async-await', label: 'async/await', hot: true },
      { id: 'es-iterator', label: '迭代器', hot: true },
      { id: 'es-generator', label: '生成器', hot: true }
    ]},
  { title: '🎯 ES2020+ 新特性', items: [
      { id: 'es-optional-chaining', label: '可选链操作符', hot: true },
      { id: 'es-nullish', label: '空值合并运算符', hot: true },
      { id: 'es-bigint', label: 'BigInt', hot: true },
      { id: 'es-globalThis', label: 'globalThis', hot: true },
      { id: 'es-top-level-await', label: '顶层 await' }
    ]},
  { title: '🔮 ESNext 特性', items: [
      { id: 'es-decorators', label: '装饰器', hot: true },
      { id: 'es-record-tuple', label: 'Record & Tuple', hot: true },
      { id: 'es-pipeline', label: '管道运算符', hot: true }
    ]}
])

const selectedId = ref('es-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== ECMAScript 内容映射表 ==========
const contentMap = {
  'es-intro': {
    title: 'ECMAScript 简介',
    body: '<p class="lead">ECMAScript 是 JavaScript 的语言规范标准，由 ECMA 国际组织维护。JavaScript 是 ECMAScript 的一种实现。</p><h3>核心特点</h3><ul><li><strong>标准化</strong>：确保不同浏览器实现一致的 JavaScript 行为</li><li><strong>持续演进</strong>：每年发布新版本，引入新特性</li><li><strong>向后兼容</strong>：新版本不破坏旧代码</li><li><strong>跨平台</strong>：可在浏览器、Node.js、Deno 等环境运行</li></ul><div class="note">💡 最新版本为 ECMAScript 2024 (ES15)，每年 6 月发布新规范。</div>',
    tags: ['ECMAScript', 'JavaScript', '语言规范']
  },
  'es-history': {
    title: '版本演进历史',
    body: '<p class="lead">ECMAScript 从 1997 年发布第一版，至今已有多个重要版本。</p><table class="mdn-table"><thead><tr><th>版本</th><th>发布时间</th><th>主要特性</th></tr></thead><tbody><tr><td>ES1</td><td>1997</td><td>首个标准</td></tr><tr><td>ES3</td><td>1999</td><td>正则表达式、try/catch、switch</td></tr><tr><td>ES5</td><td>2009</td><td>严格模式、JSON、数组方法</td></tr><tr><td>ES6/ES2015</td><td>2015</td><td>类、模块、箭头函数、Promise、let/const</td></tr><tr><td>ES7/ES2016</td><td>2016</td><td>Array.includes、指数运算符**</td></tr><tr><td>ES8/ES2017</td><td>2017</td><td>async/await、Object.values</td></tr><tr><td>ES9/ES2018</td><td>2018</td><td>Rest/Spread、异步迭代器</td></tr><tr><td>ES10/ES2019</td><td>2019</td><td>Array.flat、Object.fromEntries</td></tr><tr><td>ES11/ES2020</td><td>2020</td><td>可选链、空值合并、BigInt</td></tr><tr><td>ES12/ES2021</td><td>2021</td><td>逻辑赋值、String.replaceAll</td></tr><tr><td>ES13/ES2022</td><td>2022</td><td>顶层 await、类字段、私有属性</td></tr><tr><td>ES14/ES2023</td><td>2023</td><td>数组 findLast、Hashbang 语法</td></tr><tr><td>ES15/ES2024</td><td>2024</td><td>Promise.withResolvers、分组 Map</td></tr></tbody></table>',
    tags: ['ES6', 'ES2015', 'ES2020', '历史版本']
  },
  'es-features': {
    title: '各版本新特性',
    body: '<p class="lead">快速了解每个 ECMAScript 版本的核心特性。</p><pre><code>// ES5 (2009)\n"use strict"\nJSON.parse()\nArray.forEach()\n\n// ES6 (2015) - 最大更新\nlet, const, 箭头函数, 类, 模块, Promise\n解构赋值, 模板字符串, 默认参数\nMap, Set, Symbol, 迭代器\n\n// ES7 (2016)\nArray.includes()\n2 ** 3\n\n// ES8 (2017)\nasync/await\nObject.values(), Object.entries()\n\n// ES9 (2018)\n异步迭代器\n对象 Rest/Spread\nPromise.finally()\n\n// ES10 (2019)\nArray.flat(), Array.flatMap()\nObject.fromEntries()\n\n// ES11 (2020)\n可选链 ?.\n空值合并 ??\nBigInt\nglobalThis\n\n// ES12 (2021)\n逻辑赋值运算符 ||=, &amp;&amp;=, ??=\nString.replaceAll()\n\n// ES13 (2022)\n顶层 await\n类私有字段 #\n\n// ES14 (2023)\nArray.findLast()\n\n// ES15 (2024)\nPromise.withResolvers()\nMap.groupBy()</code></pre>',
    tags: ['新特性', '语法增强', 'API']
  },
  'es-var': {
    title: 'var 声明',
    body: '<p class="lead">var 是 ES5 及之前版本声明变量的唯一方式。</p><pre><code>// 基本用法\nvar name = "Alice"\nvar age = 25\n\n// 变量提升\nconsole.log(message)  // undefined\nvar message = "Hello"\n\n// 重复声明允许\nvar count = 1\nvar count = 2\n\n// 函数作用域\nfunction test() {\n  var x = 10\n  if (true) {\n    var y = 20\n  }\n  console.log(y)  // 20\n}\n\n// 全局变量挂载到 window\nvar globalVar = "global"\nconsole.log(window.globalVar)</code></pre>',
    tags: ['var', '变量提升', '函数作用域']
  },
  'es-let-const': {
    title: 'let 与 const',
    body: '<p class="lead">let 和 const 是 ES6 引入的块级作用域变量声明方式。</p><pre><code>// let - 可变的块级变量\nlet count = 1\ncount = 2\n\n// const - 不可变的常量\nconst PI = 3.14159\n// PI = 3.14  // 错误\n\n// const 对象属性可变\nconst user = { name: "Alice" }\nuser.name = "Bob"  // 允许\n\n// 块级作用域\nif (true) {\n  let blockVar = "只在块内可见"\n}\n// console.log(blockVar)  // 错误\n\n// 暂时性死区（TDZ）\n// console.log(tdzVar)  // 错误\nlet tdzVar = "value"\n\n// 不能重复声明\nlet x = 1\n// let x = 2  // 错误</code></pre>',
    tags: ['let', 'const', '块级作用域', 'TDZ']
  },
  'es-scope': {
    title: '作用域',
    body: '<p class="lead">JavaScript 作用域决定了变量的可访问范围。</p><pre><code>// 全局作用域\nvar globalVar = "全局"\n\n// 函数作用域\nfunction outer() {\n  var funcVar = "函数内部"\n  function inner() {\n    console.log(funcVar)\n  }\n}\n\n// 块级作用域\n{\n  let blockScoped = "块内可见"\n  var notBlockScoped = "函数作用域"\n}\n\n// 闭包\nfunction createCounter() {\n  let count = 0\n  return function() {\n    count++\n    return count\n  }\n}\nconst counter = createCounter()</code></pre>',
    tags: ['作用域', '闭包', '词法作用域']
  },
  'es-hoisting': {
    title: '变量提升',
    body: '<p class="lead">变量提升是 JavaScript 将声明移到作用域顶部的行为。</p><pre><code>// var 的提升\nconsole.log(a)  // undefined\nvar a = 5\n\n// 函数声明提升\nsayHello()\nfunction sayHello() {\n  console.log("Hello")\n}\n\n// 函数表达式不提升\n// sayHi()  // 错误\nvar sayHi = function() {}\n\n// let/const 的 TDZ\n// console.log(b)  // 错误\nlet b = 10\n\n// 类声明不提升\n// const obj = new MyClass()  // 错误\nclass MyClass {}</code></pre>',
    tags: ['提升', 'TDZ', '函数提升']
  },
  'es-arrow': {
    title: '箭头函数',
    body: '<p class="lead">箭头函数是 ES6 引入的简洁函数语法，不绑定自己的 this。</p><pre><code>// 基本语法\nconst add = (a, b) =&gt; a + b\nconst square = x =&gt; x * x\nconst greet = () =&gt; console.log("Hello")\n\n// 多行语句\nconst sum = (a, b) =&gt; {\n  const result = a + b\n  return result\n}\n\n// this 绑定\nfunction Timer() {\n  this.seconds = 0\n  setInterval(() =&gt; {\n    this.seconds++\n  }, 1000)\n}\n\n// 不能用箭头函数的情况\n// 1. 构造函数\n// 2. 需要 arguments 对象</code></pre>',
    tags: ['箭头函数', 'this', '简洁语法']
  },
  'es-default-params': {
    title: '默认参数',
    body: '<p class="lead">默认参数允许为函数参数设置默认值。</p><pre><code>// 基本用法\nfunction greet(name = "Guest") {\n  return `Hello, ${name}!`\n}\n\n// 多个默认参数\nfunction createUser(name = "Anonymous", age = 18) {\n  return { name, age }\n}\n\n// 表达式默认值\nfunction getDefaultName() {\n  return "Default"\n}\nfunction greetWithExpr(name = getDefaultName()) {\n  return `Hello, ${name}`\n}\n\n// 前面参数可用于后面参数\nfunction formatPrice(price, tax = 0.1, total = price * (1 + tax)) {\n  return total\n}</code></pre>',
    tags: ['默认参数', '参数解构', 'undefined']
  },
  'es-rest-spread': {
    title: 'Rest / Spread',
    body: '<p class="lead">Rest 参数收集剩余参数，Spread 语法展开数组或对象。</p><pre><code>// Rest 参数\nfunction sum(...numbers) {\n  return numbers.reduce((acc, n) =&gt; acc + n, 0)\n}\n\n// Spread 展开数组\nconst arr1 = [1, 2, 3]\nconst arr2 = [4, 5, 6]\nconst combined = [...arr1, ...arr2]\n\n// Spread 展开对象\nconst obj1 = { a: 1, b: 2 }\nconst obj2 = { c: 3, d: 4 }\nconst merged = { ...obj1, ...obj2 }\n\n// 函数调用中的 Spread\nconst nums = [5, 10, 15]\nconsole.log(Math.max(...nums))</code></pre>',
    tags: ['Rest参数', 'Spread语法', '解构']
  },
  'es-destructuring': {
    title: '解构赋值',
    body: '<p class="lead">解构赋值可以快速从数组或对象中提取值。</p><pre><code>// 数组解构\nconst arr = [1, 2, 3]\nconst [a, b, c] = arr\n\n// 交换变量\nlet p = 1, q = 2\n[p, q] = [q, p]\n\n// 对象解构\nconst user = { name: "Alice", age: 25 }\nconst { name, age } = user\n\n// 重命名\nconst { name: userName, age: userAge } = user\n\n// 默认值\nconst { email = "no@email.com" } = user\n\n// 函数参数解构\nfunction printUser({ name, age }) {\n  console.log(`${name} is ${age}`)\n}</code></pre>',
    tags: ['解构', '数组解构', '对象解构']
  },
  'es-map-set': {
    title: 'Map 与 Set',
    body: '<p class="lead">Map 和 Set 是 ES6 新增的数据结构。</p><pre><code>// Map - 键值对集合\nconst map = new Map()\nmap.set("name", "Alice")\nmap.set(42, "answer")\nconsole.log(map.get("name"))\nconsole.log(map.has(42))\n\n// 遍历 Map\nfor (const [key, value] of map) {\n  console.log(key, value)\n}\n\n// Set - 唯一值集合\nconst set = new Set([1, 2, 2, 3, 3, 4])\nset.add(5)\n\n// 数组去重\nconst unique = [...new Set([1, 1, 2, 2, 3])]\n\n// 遍历 Set\nfor (const value of set) {\n  console.log(value)\n}</code></pre>',
    tags: ['Map', 'Set', '数据结构']
  },
  'es-weakmap': {
    title: 'WeakMap / WeakSet',
    body: '<p class="lead">WeakMap 和 WeakSet 持有对象的弱引用，不影响垃圾回收。</p><pre><code>// WeakMap\nconst weakMap = new WeakMap()\nlet obj = { id: 1 }\nweakMap.set(obj, "some data")\nconsole.log(weakMap.get(obj))\n\nobj = null  // 条目可被垃圾回收\n\n// WeakMap 不可遍历\n// weakMap.forEach()  // 错误\n\n// WeakSet\nconst weakSet = new WeakSet()\nlet user = { name: "Alice" }\nweakSet.add(user)\n\n// 使用场景：存储 DOM 元素元数据\nconst elementMap = new WeakMap()\ndocument.querySelectorAll("button").forEach(btn =&gt; {\n  elementMap.set(btn, { clicks: 0 })\n})</code></pre>',
    tags: ['WeakMap', 'WeakSet', '弱引用']
  },
  'es-symbol': {
    title: 'Symbol 类型',
    body: '<p class="lead">Symbol 是 ES6 引入的原始数据类型，表示唯一标识符。</p><pre><code>// 创建 Symbol\nconst sym1 = Symbol()\nconst sym2 = Symbol("description")\n\n// Symbol.for() - 全局注册表\nconst globalSym1 = Symbol.for("app.id")\nconst globalSym2 = Symbol.for("app.id")\nconsole.log(globalSym1 === globalSym2)  // true\n\n// 作为对象属性键\nconst MY_KEY = Symbol()\nconst obj = {\n  [MY_KEY]: "secret value",\n  normalKey: "normal"\n}\n\n// 内置 Symbol - Symbol.iterator\nconst iterableObj = {\n  [Symbol.iterator]: function* () {\n    yield 1\n    yield 2\n    yield 3\n  }\n}</code></pre>',
    tags: ['Symbol', '唯一性', '内置Symbol']
  },
  'es-proxy': {
    title: 'Proxy 与 Reflect',
    body: '<p class="lead">Proxy 可以拦截对象操作，Reflect 提供默认行为。</p><pre><code>// 创建 Proxy\nconst target = { name: "Alice", age: 25 }\nconst handler = {\n  get(target, prop, receiver) {\n    console.log(`Getting ${prop}`)\n    return prop in target ? target[prop] : "default"\n  },\n  set(target, prop, value, receiver) {\n    console.log(`Setting ${prop} to ${value}`)\n    if (prop === "age" && value &lt; 0) {\n      throw new Error("Age cannot be negative")\n    }\n    target[prop] = value\n    return true\n  }\n}\n\nconst proxy = new Proxy(target, handler)\n\n// 验证器示例\nfunction createValidator(schema) {\n  return new Proxy({}, {\n    set(target, prop, value) {\n      if (schema[prop] &amp;&amp; !schema[prop](value)) {\n        throw new Error(`Invalid value for ${prop}`)\n      }\n      target[prop] = value\n      return true\n    }\n  })\n}</code></pre>',
    tags: ['Proxy', 'Reflect', '拦截器']
  },
  'es-promise': {
    title: 'Promise',
    body: '<p class="lead">Promise 是 ES6 引入的异步编程解决方案。</p><pre><code>// 创建 Promise\nconst promise = new Promise((resolve, reject) =&gt; {\n  setTimeout(() =&gt; {\n    resolve("Success!")\n  }, 1000)\n})\n\n// 使用 Promise\npromise\n  .then(result =&gt; console.log(result))\n  .catch(error =&gt; console.error(error))\n  .finally(() =&gt; console.log("Done"))\n\n// Promise 静态方法\nPromise.resolve(42)\nPromise.reject(new Error("error"))\n\n// Promise.all\nPromise.all([p1, p2, p3]).then(results =&gt; console.log(results))\n\n// Promise.race\nPromise.race([fast, slow]).then(result =&gt; console.log(result))\n\n// Promise.allSettled\nPromise.allSettled([p1, p2]).then(results =&gt; console.log(results))</code></pre>',
    tags: ['Promise', '异步', 'then/catch']
  },
  'es-async-await': {
    title: 'async/await',
    body: '<p class="lead">async/await 是 Promise 的语法糖，让异步代码更同步化。</p><pre><code>// async 函数返回 Promise\nasync function fetchData() {\n  return "data"\n}\n\n// await 等待 Promise 完成\nasync function getUser() {\n  const response = await fetch("/api/user")\n  const user = await response.json()\n  return user\n}\n\n// 错误处理\nasync function getData() {\n  try {\n    const response = await fetch("/api/data")\n    const data = await response.json()\n    return data\n  } catch (error) {\n    console.error("Fetch failed:", error)\n    return null\n  }\n}\n\n// 并发执行\nasync function concurrent() {\n  const [user, posts] = await Promise.all([\n    fetch("/api/user").then(r =&gt; r.json()),\n    fetch("/api/posts").then(r =&gt; r.json())\n  ])\n  return { user, posts }\n}</code></pre>',
    tags: ['async', 'await', '异步']
  },
  'es-iterator': {
    title: '迭代器',
    body: '<p class="lead">迭代器提供统一的遍历接口。</p><pre><code>// 自定义迭代器\nconst myIterator = {\n  data: [1, 2, 3],\n  index: 0,\n  next() {\n    if (this.index &lt; this.data.length) {\n      return { value: this.data[this.index++], done: false }\n    }\n    return { value: undefined, done: true }\n  }\n}\n\n// 可迭代对象\nconst iterable = {\n  [Symbol.iterator]() {\n    let step = 0\n    return {\n      next() {\n        step++\n        if (step &lt;= 3) {\n          return { value: step, done: false }\n        }\n        return { value: undefined, done: true }\n      }\n    }\n  }\n}\n\nfor (const value of iterable) {\n  console.log(value)\n}</code></pre>',
    tags: ['迭代器', 'Symbol.iterator', 'for...of']
  },
  'es-generator': {
    title: '生成器',
    body: '<p class="lead">生成器函数可以暂停和恢复执行。</p><pre><code>// 生成器函数定义\nfunction* generator() {\n  yield 1\n  yield 2\n  yield 3\n  return 4\n}\n\nconst gen = generator()\nconsole.log(gen.next())  // { value: 1, done: false }\nconsole.log(gen.next())  // { value: 2, done: false }\n\n// 无限序列生成器\nfunction* infinite() {\n  let i = 0\n  while (true) {\n    yield i++\n  }\n}\n\n// yield* 委托\nfunction* a() {\n  yield 1\n  yield 2\n}\nfunction* b() {\n  yield "a"\n  yield* a()\n  yield "b"\n}</code></pre>',
    tags: ['生成器', 'yield', '迭代器']
  },
  'es-optional-chaining': {
    title: '可选链操作符',
    body: '<p class="lead">可选链操作符 (?.) 安全地访问嵌套属性。</p><pre><code>// 基本用法\nconst user = {\n  name: "Alice",\n  address: {\n    city: "Beijing"\n  }\n}\n\n// 可选链\nconst city = user?.address?.city\nconst zip = user?.address?.zip  // undefined\n\n// 可选链调用方法\nconst result = user.getName?.()\n\n// 可选链访问数组\nconst firstItem = arr?.[0]\n\n// 可选链与 nullish 合并\nconst name = user?.name ?? "Guest"\n\n// 短路特性\nconst test = null\nconst x = test?.value ?? "default"</code></pre>',
    tags: ['可选链', '?.', '安全访问']
  },
  'es-nullish': {
    title: '空值合并运算符',
    body: '<p class="lead">空值合并运算符 (??) 只在值为 null 或 undefined 时返回右侧值。</p><pre><code>// 基本用法\nconst value1 = null ?? "default"      // "default"\nconst value2 = undefined ?? "default" // "default"\nconst value3 = 0 ?? "default"         // 0\nconst value4 = "" ?? "default"        // ""\n\n// 与 || 的区别\nconst count = 0\nconst orResult = count || 10    // 10\nconst nullishResult = count ?? 10  // 0\n\n// 可选链配合\nconst user = { name: "", age: 0 }\nconst name = user?.name ?? "Anonymous"\n\n// 赋值操作符\nlet x = null\nx ??= "default"</code></pre>',
    tags: ['空值合并', '??', 'nullish']
  },
  'es-bigint': {
    title: 'BigInt',
    body: '<p class="lead">BigInt 用于表示任意精度的整数。</p><pre><code>// 创建 BigInt\nconst big1 = 12345678901234567890n\nconst big2 = BigInt(1234567890)\n\n// 运算\nconst sum = 10n + 20n\nconst product = 5n * 6n\n\n// 比较\nconsole.log(10n === 10)   // false\nconsole.log(10n == 10)    // true\n\n// 不能与 Number 混合运算\n// const result = 10n + 5  // 错误\nconst result = 10n + BigInt(5)\n\n// 转换\nconst num = Number(100n)\nconst str = 100n.toString()</code></pre>',
    tags: ['BigInt', '大整数', '任意精度']
  },
  'es-globalThis': {
    title: 'globalThis',
    body: '<p class="lead">globalThis 提供跨平台的全局对象访问方式。</p><pre><code>// 传统方式\n// 浏览器: window\n// Node.js: global\n\n// globalThis 统一访问\nconsole.log(globalThis)\n\n// 设置全局变量\nvar myVar = "hello"\nconsole.log(globalThis.myVar)\n\n// 检测环境\nif (typeof globalThis.fetch === "function") {\n  // 浏览器环境\n}\n\n// 使用场景：编写跨平台库\nfunction getGlobalThis() {\n  return globalThis\n}</code></pre>',
    tags: ['globalThis', '全局对象', '跨平台']
  },
  'es-top-level-await': {
    title: '顶层 await',
    body: '<p class="lead">顶层 await 允许在模块顶层使用 await，无需 async 函数包裹。</p><pre><code>// 模块中使用顶层 await\n// data.js\nconst response = await fetch("/api/data")\nconst data = await response.json()\nexport default data\n\n// 使用模块\nimport data from "./data.js"\nconsole.log(data)\n\n// 动态加载\nconst module = await import("./module.js")\n\n// 多个顶层 await（并行）\nconst [user, posts] = await Promise.all([\n  fetch("/api/user").then(r =&gt; r.json()),\n  fetch("/api/posts").then(r =&gt; r.json())\n])</code></pre>',
    tags: ['顶层await', '模块', '异步加载']
  },
  'es-decorators': {
    title: '装饰器',
    body: '<p class="lead">装饰器是 ESNext 特性，用于修改类和类成员的行为。</p><pre><code>// 类装饰器\nfunction logged(constructor) {\n  console.log(`Class ${constructor.name} created`)\n  return constructor\n}\n\n@logged\nclass User {\n  constructor(name) {\n    this.name = name\n  }\n}\n\n// 方法装饰器\nfunction measure(target, propertyKey, descriptor) {\n  const original = descriptor.value\n  descriptor.value = function(...args) {\n    console.time(propertyKey)\n    const result = original.apply(this, args)\n    console.timeEnd(propertyKey)\n    return result\n  }\n}\n\nclass Calculator {\n  @measure\n  add(a, b) {\n    return a + b\n  }\n}</code></pre>',
    tags: ['装饰器', '元编程', 'ESNext']
  },
  'es-record-tuple': {
    title: 'Record & Tuple',
    body: '<p class="lead">Record 和 Tuple 是 ESNext 提案中的不可变数据结构。</p><pre><code>// Tuple - 不可变数组\nconst tuple = #[1, 2, 3]\nconsole.log(tuple[0])\n\n// Record - 不可变对象\nconst record = #{\n  name: "Alice",\n  age: 25\n}\n\n// 比较（按值比较）\nconst a = #[1, 2, 3]\nconst b = #[1, 2, 3]\nconsole.log(a === b)  // true\n\n// 从普通数据转换\nconst tupleFromArr = Tuple.from([1, 2, 3])\nconst recordFromObj = Record({ x: 1, y: 2 })</code></pre>',
    tags: ['Record', 'Tuple', '不可变']
  },
  'es-pipeline': {
    title: '管道运算符',
    body: '<p class="lead">管道运算符 (|>) 将表达式值传递给函数，提高可读性。</p><pre><code>// 提案中的管道运算符\n// const result = value |> fn\n\n// 示例\nconst double = (x) =&gt; x * 2\nconst addOne = (x) =&gt; x + 1\n\n// 传统写法\nconst result1 = addOne(double(5))\n\n// 管道写法（提案）\n// const result2 = 5 |> double |> addOne\n\n// 提案状态：Stage 2</code></pre>',
    tags: ['管道运算符', '函数组合', 'ESNext']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 ECMAScript 规范获取更多信息。</p>',
        tags: ['ECMAScript', 'JavaScript']
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

addLink('es-intro', 'es-history')
addLink('es-history', 'es-features')
addLink('es-var', 'es-let-const')
addLink('es-let-const', 'es-scope')
addLink('es-scope', 'es-hoisting')
addLink('es-arrow', 'es-default-params')
addLink('es-default-params', 'es-rest-spread')
addLink('es-rest-spread', 'es-destructuring')
addLink('es-map-set', 'es-weakmap')
addLink('es-map-set', 'es-symbol')
addLink('es-symbol', 'es-proxy')
addLink('es-promise', 'es-async-await')
addLink('es-iterator', 'es-generator')
addLink('es-optional-chaining', 'es-nullish')
addLink('es-bigint', 'es-globalThis')
addLink('es-decorators', 'es-record-tuple')
addLink('es-record-tuple', 'es-pipeline')

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