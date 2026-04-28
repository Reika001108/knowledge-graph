<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">ES6+ 知识库</h1>
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
          <h2>⚡ <span class="gradient-text">ES6+ 完全指南</span></h2>
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
          <p>⚡ ECMAScript 2015~2024 | 现代 JavaScript 完全指南</p>
          <p>✨ 点击节点双向联动 | 掌握最新语法特性</p>
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
          <h3>🔗 ES6+ 知识图谱 <span class="graph-badge">ECharts</span></h3>
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

// ========== ES6+ 导航数据 ==========
const navSections = ref([
  { title: '📦 ES2015 (ES6)', items: [
      { id: 'es6-let-const', label: 'let 与 const', hot: true },
      { id: 'es6-arrow', label: '箭头函数', hot: true },
      { id: 'es6-destructuring', label: '解构赋值', hot: true },
      { id: 'es6-template', label: '模板字符串', hot: true },
      { id: 'es6-spread-rest', label: 'Spread / Rest', hot: true },
      { id: 'es6-class', label: 'Class 类', hot: true },
      { id: 'es6-module', label: '模块化', hot: true }
    ]},
  { title: '🔧 ES2015 数据结构', items: [
      { id: 'es6-promise', label: 'Promise', hot: true },
      { id: 'es6-map-set', label: 'Map & Set', hot: true },
      { id: 'es6-symbol', label: 'Symbol', hot: true },
      { id: 'es6-iterator', label: '迭代器', hot: true },
      { id: 'es6-generator', label: '生成器', hot: true }
    ]},
  { title: '📚 ES2016-ES2018', items: [
      { id: 'es7-includes', label: 'Array.includes()', hot: true },
      { id: 'es7-exponent', label: '指数运算符 **', hot: true },
      { id: 'es8-async-await', label: 'async/await', hot: true },
      { id: 'es8-object-values', label: 'Object.values/entries', hot: true },
      { id: 'es9-rest-spread', label: '对象 Rest/Spread', hot: true },
      { id: 'es9-promise-finally', label: 'Promise.finally()', hot: true }
    ]},
  { title: '✨ ES2019-ES2021', items: [
      { id: 'es10-flat', label: 'Array.flat/flatMap', hot: true },
      { id: 'es10-trim', label: 'String.trimStart/End', hot: true },
      { id: 'es11-optional', label: '可选链 ?.', hot: true },
      { id: 'es11-nullish', label: '空值合并 ??', hot: true },
      { id: 'es11-bigint', label: 'BigInt', hot: true },
      { id: 'es11-globalThis', label: 'globalThis', hot: true },
      { id: 'es12-logical', label: '逻辑赋值运算符', hot: true },
      { id: 'es12-replaceAll', label: 'String.replaceAll()', hot: true }
    ]},
  { title: '🚀 ES2022-ES2024', items: [
      { id: 'es13-top-await', label: '顶层 await', hot: true },
      { id: 'es13-class-fields', label: '类私有字段 #', hot: true },
      { id: 'es13-at', label: 'Array.at()', hot: true },
      { id: 'es14-findLast', label: 'Array.findLast()', hot: true },
      { id: 'es14-hashbang', label: 'Hashbang 语法', hot: true },
      { id: 'es15-promise', label: 'Promise.withResolvers()', hot: true },
      { id: 'es15-group', label: 'Map.groupBy()', hot: true }
    ]}
])

const selectedId = ref('es6-let-const')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== ES6+ 内容映射表 ==========
const contentMap = {
  // ES2015 (ES6)
  'es6-let-const': {
    title: 'let 与 const',
    body: '<p class="lead">let 和 const 是 ES6 引入的块级作用域变量声明方式，解决了 var 的变量提升和作用域问题。</p><pre><code>// let - 可变的块级变量\nlet count = 1\ncount = 2\n\n// const - 不可变的常量\nconst PI = 3.14159\n// PI = 3.14  // 错误\n\n// const 对象属性可变\nconst user = { name: "Alice" }\nuser.name = "Bob"  // 允许\n\n// 块级作用域\nif (true) {\n  let blockVar = "只在块内可见"\n}\n// console.log(blockVar)  // 错误\n\n// 暂时性死区（TDZ）\n// console.log(tdzVar)  // 错误\nlet tdzVar = "value"\n\n// 不能重复声明\nlet x = 1\n// let x = 2  // 错误\n\n// for 循环中的 let\nfor (let i = 0; i &lt; 3; i++) {\n  setTimeout(() =&gt; console.log(i), 100)  // 0,1,2\n}</code></pre>',
    tags: ['let', 'const', '块级作用域', 'TDZ']
  },
  'es6-arrow': {
    title: '箭头函数',
    body: '<p class="lead">箭头函数是 ES6 引入的简洁函数语法，不绑定自己的 this 和 arguments。</p><pre><code>// 基本语法\nconst add = (a, b) =&gt; a + b\nconst square = x =&gt; x * x\nconst greet = () =&gt; console.log("Hello")\n\n// 返回对象\nconst getUser = () =&gt; ({ name: "Alice", age: 25 })\n\n// 多行语句需要花括号和 return\nconst sum = (a, b) =&gt; {\n  const result = a + b\n  return result\n}\n\n// this 绑定（继承外部 this）\nfunction Timer() {\n  this.seconds = 0\n  setInterval(() =&gt; {\n    this.seconds++  // 指向 Timer 实例\n  }, 1000)\n}\n\n// 不能用箭头函数的情况\n// 1. 构造函数（不能 new）\n// 2. 需要 arguments 对象\n// 3. 对象方法（需要动态 this 时）</code></pre>',
    tags: ['箭头函数', 'this', '简洁语法']
  },
  'es6-destructuring': {
    title: '解构赋值',
    body: '<p class="lead">解构赋值可以快速从数组或对象中提取值并赋给变量。</p><pre><code>// 数组解构\nconst arr = [1, 2, 3]\nconst [a, b, c] = arr\n\n// 跳过元素\nconst [, second, third] = [1, 2, 3]\n\n// 交换变量\nlet p = 1, q = 2\n[p, q] = [q, p]\n\n// 默认值\nconst [x = 1, y = 2] = [5]\n\n// 嵌套数组解构\nconst nested = [1, [2, 3], 4]\nconst [one, [two, three], four] = nested\n\n// 对象解构\nconst user = { name: "Alice", age: 25, city: "Beijing" }\nconst { name, age } = user\n\n// 重命名\nconst { name: userName, age: userAge } = user\n\n// 默认值\nconst { email = "no@email.com" } = user\n\n// 嵌套对象解构\nconst person = {\n  info: { name: "Bob", address: { city: "Shanghai" } }\n}\nconst { info: { name: personName, address: { city } } } = person\n\n// 函数参数解构\nfunction printUser({ name, age }) {\n  console.log(`${name} is ${age} years old`)\n}</code></pre>',
    tags: ['解构', '数组解构', '对象解构']
  },
  'es6-template': {
    title: '模板字符串',
    body: '<p class="lead">模板字符串使用反引号，支持嵌入表达式和多行字符串。</p><pre><code>// 基本用法\nconst name = "Alice"\nconst greeting = `Hello, ${name}!`\n\n// 多行字符串\nconst multiline = `\n  第一行\n  第二行\n  第三行\n`\n\n// 表达式\nconst a = 5, b = 10\nconst result = `${a} + ${b} = ${a + b}`\n\n// 函数调用\nfunction upper(str) {\n  return str.toUpperCase()\n}\nconst message = `Hello ${upper("world")}`\n\n// 嵌套模板\nconst items = ["apple", "banana", "orange"]\nconst html = `\n  &lt;ul&gt;\n    ${items.map(item =&gt; `&lt;li&gt;${item}&lt;/li&gt;`).join("")}\n  &lt;/ul&gt;\n`\n\n// 标签模板\nfunction tag(strings, ...values) {\n  console.log(strings)  // ["Hello ", "!"]\n  console.log(values)   // ["Alice"]\n  return strings.reduce((acc, str, i) =&gt; acc + str + (values[i] || ""), "")\n}\nconst tagged = tag`Hello ${name}!`</code></pre>',
    tags: ['模板字符串', '反引号', '表达式插值']
  },
  'es6-spread-rest': {
    title: 'Spread / Rest',
    body: '<p class="lead">Spread 语法展开可迭代对象，Rest 参数收集剩余参数。</p><pre><code>// Rest 参数（函数参数）\nfunction sum(...numbers) {\n  return numbers.reduce((acc, n) =&gt; acc + n, 0)\n}\nconsole.log(sum(1, 2, 3, 4))  // 10\n\n// Spread 展开数组\nconst arr1 = [1, 2, 3]\nconst arr2 = [4, 5, 6]\nconst combined = [...arr1, ...arr2]  // [1,2,3,4,5,6]\nconst copy = [...arr1]\n\n// 函数调用中的 Spread\nconst nums = [5, 10, 15]\nconsole.log(Math.max(...nums))  // 15\n\n// 字符串展开\nconst chars = [..."hello"]  // ["h","e","l","l","o"]\n\n// 剩余元素（数组解构）\nconst [first, second, ...others] = [1, 2, 3, 4, 5]\n// first=1, second=2, others=[3,4,5]</code></pre>',
    tags: ['Rest参数', 'Spread语法', '展开']
  },
  'es6-class': {
    title: 'Class 类',
    body: '<p class="lead">ES6 引入的 class 语法糖，让 JavaScript 面向对象编程更清晰。</p><pre><code>// 类定义\nclass Animal {\n  constructor(name) {\n    this.name = name\n  }\n  \n  speak() {\n    console.log(`${this.name} makes a sound`)\n  }\n  \n  static description() {\n    return "Animal class"\n  }\n  \n  get fullName() {\n    return this.name\n  }\n  \n  set fullName(value) {\n    this.name = value\n  }\n}\n\n// 继承\nclass Dog extends Animal {\n  constructor(name, breed) {\n    super(name)  // 调用父类构造函数\n    this.breed = breed\n  }\n  \n  speak() {\n    console.log(`${this.name} barks`)\n  }\n  \n  wagTail() {\n    console.log(`${this.name} wags tail`)\n  }\n}\n\nconst dog = new Dog("Rex", "German Shepherd")\ndog.speak()  // "Rex barks"\n\n// 私有字段（ES2022）\nclass Person {\n  #age = 25  // 私有字段\n  \n  getAge() {\n    return this.#age\n  }\n}</code></pre>',
    tags: ['Class', '继承', '构造函数']
  },
  'es6-module': {
    title: '模块化',
    body: '<p class="lead">ES6 模块化使用 import 和 export 语法，实现代码的模块化组织。</p><pre><code>// math.js - 导出\nexport const PI = 3.14159\nexport function add(a, b) { return a + b }\nexport class Calculator {}\n\nexport default function multiply(a, b) { return a * b }\n\n// utils.js - 批量导出\nconst helper1 = () =&gt; {}\nconst helper2 = () =&gt; {}\nexport { helper1, helper2 }\n\n// 重命名导出\nexport { helper1 as h1, helper2 as h2 }\n\n// app.js - 导入\nimport multiply, { PI, add, Calculator } from "./math.js"\nimport * as math from "./math.js"\nimport { helper1 as h1 } from "./utils.js"\n\n// 动态导入（异步）\nconst module = await import("./dynamic.js")\n\n// 模块聚合\nexport { add } from "./math.js"\nexport * from "./utils.js"</code></pre>',
    tags: ['模块', 'import', 'export']
  },
  'es6-promise': {
    title: 'Promise',
    body: '<p class="lead">Promise 是 ES6 引入的异步编程解决方案，解决回调地狱问题。</p><pre><code>// 创建 Promise\nconst promise = new Promise((resolve, reject) =&gt; {\n  setTimeout(() =&gt; {\n    const success = true\n    if (success) {\n      resolve("Success!")\n    } else {\n      reject(new Error("Failed"))\n    }\n  }, 1000)\n})\n\n// 使用 Promise\npromise\n  .then(result =&gt; console.log(result))\n  .catch(error =&gt; console.error(error))\n  .finally(() =&gt; console.log("Done"))\n\n// Promise 静态方法\nPromise.resolve(42)\nPromise.reject(new Error("error"))\n\n// Promise.all（全部成功）\nPromise.all([p1, p2, p3]).then(results =&gt; console.log(results))\n\n// Promise.race（最先完成）\nPromise.race([fast, slow]).then(result =&gt; console.log(result))\n\n// Promise.allSettled（ES2020）\nPromise.allSettled([p1, p2]).then(results =&gt; console.log(results))\n\n// Promise.any（ES2021，第一个成功）\nPromise.any([p1, p2]).then(result =&gt; console.log(result))</code></pre>',
    tags: ['Promise', '异步', 'then/catch']
  },
  'es6-map-set': {
    title: 'Map & Set',
    body: '<p class="lead">Map 和 Set 是 ES6 新增的数据结构，提供更灵活的键值存储和唯一值集合。</p><pre><code>// Map - 键值对集合（键可以是任意类型）\nconst map = new Map()\nmap.set("name", "Alice")\nmap.set(42, "answer")\nmap.set({ id: 1 }, "object key")\n\nconsole.log(map.get("name"))  // "Alice"\nconsole.log(map.has(42))      // true\nconsole.log(map.size)         // 3\n\nmap.delete(42)\n// map.clear()\n\n// 遍历 Map\nfor (const [key, value] of map) {\n  console.log(key, value)\n}\nmap.forEach((value, key) =&gt; console.log(key, value))\n\n// Set - 唯一值集合\nconst set = new Set([1, 2, 2, 3, 3, 4])  // {1,2,3,4}\nset.add(5)\nconsole.log(set.has(3))   // true\nconsole.log(set.size)     // 5\n\n// 数组去重\nconst unique = [...new Set([1, 1, 2, 2, 3])]  // [1,2,3]\n\n// 遍历 Set\nfor (const value of set) {\n  console.log(value)\n}</code></pre>',
    tags: ['Map', 'Set', '数据结构']
  },
  'es6-symbol': {
    title: 'Symbol',
    body: '<p class="lead">Symbol 是 ES6 引入的原始数据类型，表示唯一标识符。</p><pre><code>// 创建 Symbol\nconst sym1 = Symbol()\nconst sym2 = Symbol("description")\nconst sym3 = Symbol("description")  // 即使描述相同也不同\nconsole.log(sym2 === sym3)  // false\n\n// Symbol.for() - 全局注册表\nconst globalSym1 = Symbol.for("app.id")\nconst globalSym2 = Symbol.for("app.id")\nconsole.log(globalSym1 === globalSym2)  // true\n\n// 作为对象属性键\nconst MY_KEY = Symbol()\nconst obj = {\n  [MY_KEY]: "secret value",\n  normalKey: "normal"\n}\nconsole.log(obj[MY_KEY])  // "secret value"\n\n// 内置 Symbol - Symbol.iterator\nconst iterableObj = {\n  [Symbol.iterator]: function* () {\n    yield 1\n    yield 2\n    yield 3\n  }\n}</code></pre>',
    tags: ['Symbol', '唯一值', '内置Symbol']
  },
  'es6-iterator': {
    title: '迭代器',
    body: '<p class="lead">迭代器提供统一的遍历接口，是 for...of 循环的基础。</p><pre><code>// 自定义迭代器\nconst myIterator = {\n  data: [1, 2, 3],\n  index: 0,\n  next() {\n    if (this.index &lt; this.data.length) {\n      return { value: this.data[this.index++], done: false }\n    }\n    return { value: undefined, done: true }\n  }\n}\n\n// 可迭代对象\nconst iterable = {\n  [Symbol.iterator]() {\n    let step = 0\n    return {\n      next() {\n        step++\n        if (step &lt;= 3) {\n          return { value: step, done: false }\n        }\n        return { value: undefined, done: true }\n      }\n    }\n  }\n}\n\nfor (const value of iterable) {\n  console.log(value)  // 1, 2, 3\n}\n\n// 内置可迭代对象\n// Array, String, Map, Set, arguments, NodeList\nconst arr = [1, 2, 3]\nconst iterator = arr[Symbol.iterator]()\nconsole.log(iterator.next())  // { value: 1, done: false }</code></pre>',
    tags: ['迭代器', 'Symbol.iterator', 'for...of']
  },
  'es6-generator': {
    title: '生成器',
    body: '<p class="lead">生成器函数可以暂停和恢复执行，使用 function* 语法和 yield 关键字。</p><pre><code>// 生成器函数定义\nfunction* generator() {\n  yield 1\n  yield 2\n  yield 3\n  return 4\n}\n\nconst gen = generator()\nconsole.log(gen.next())  // { value: 1, done: false }\nconsole.log(gen.next())  // { value: 2, done: false }\nconsole.log(gen.next())  // { value: 3, done: false }\nconsole.log(gen.next())  // { value: 4, done: true }\n\n// 无限序列生成器\nfunction* infinite() {\n  let i = 0\n  while (true) {\n    yield i++\n  }\n}\n\n// 向生成器发送值\nfunction* twoWay() {\n  const x = yield "first"\n  const y = yield x + 1\n  return y + 1\n}\n\nconst g = twoWay()\nconsole.log(g.next())      // { value: "first", done: false }\nconsole.log(g.next(5))     // { value: 6, done: false }\n\n// yield* 委托\nfunction* a() {\n  yield 1\n  yield 2\n}\nfunction* b() {\n  yield "a"\n  yield* a()\n  yield "b"\n}</code></pre>',
    tags: ['生成器', 'yield', 'function*']
  },
  'es7-includes': {
    title: 'Array.includes()',
    body: '<p class="lead">ES7 引入的 Array.prototype.includes() 方法判断数组是否包含某个元素。</p><pre><code>// 基本用法\nconst arr = [1, 2, 3, 4, 5]\nconsole.log(arr.includes(3))   // true\nconsole.log(arr.includes(6))   // false\n\n// 指定起始索引\nconsole.log(arr.includes(3, 3))   // false（从索引3开始）\nconsole.log(arr.includes(3, -2))  // true（从倒数第2个开始）\n\n// 与 indexOf 的区别\nconst arr2 = [1, 2, NaN]\nconsole.log(arr2.indexOf(NaN))     // -1\nconsole.log(arr2.includes(NaN))    // true\n\n// 字符串同理\nconst str = "hello world"\nconsole.log(str.includes("world"))  // true</code></pre>',
    tags: ['Array.includes', 'ES7', '数组方法']
  },
  'es7-exponent': {
    title: '指数运算符 **',
    body: '<p class="lead">ES7 引入的指数运算符 ** 用于幂运算，替代 Math.pow()。</p><pre><code>// 基本用法\nconsole.log(2 ** 3)   // 8\nconsole.log(2 ** 4)   // 16\nconsole.log(5 ** 2)   // 25\n\n// 与传统 Math.pow() 对比\nconsole.log(Math.pow(2, 3))   // 8\nconsole.log(2 ** 3)           // 8\n\n// 结合赋值运算符\nlet x = 2\nx **= 3\nconsole.log(x)  // 8\n\n// 负数底数需要括号\nconsole.log((-2) ** 3)   // -8\n\n// 指数为小数\nconsole.log(4 ** 0.5)    // 2（平方根）\nconsole.log(8 ** (1/3))  // 2（立方根）</code></pre>',
    tags: ['指数运算符', 'ES7', '幂运算']
  },
  'es8-async-await': {
    title: 'async/await',
    body: '<p class="lead">async/await 是 Promise 的语法糖，让异步代码写起来像同步代码。</p><pre><code>// async 函数返回 Promise\nasync function fetchData() {\n  return "data"\n}\nfetchData().then(console.log)  // "data"\n\n// await 等待 Promise 完成\nasync function getUser() {\n  const response = await fetch("/api/user")\n  const user = await response.json()\n  return user\n}\n\n// 错误处理（try/catch）\nasync function getData() {\n  try {\n    const response = await fetch("/api/data")\n    const data = await response.json()\n    return data\n  } catch (error) {\n    console.error("Fetch failed:", error)\n    return null\n  }\n}\n\n// 并发执行\nasync function concurrent() {\n  const [user, posts] = await Promise.all([\n    fetch("/api/user").then(r =&gt; r.json()),\n    fetch("/api/posts").then(r =&gt; r.json())\n  ])\n  return { user, posts }\n}\n\n// 循环中的 await\nasync function processItems(items) {\n  for (const item of items) {\n    await processItem(item)  // 串行执行\n  }\n}</code></pre>',
    tags: ['async', 'await', '异步']
  },
  'es8-object-values': {
    title: 'Object.values/entries',
    body: '<p class="lead">ES8 引入 Object.values() 和 Object.entries() 方法。</p><pre><code>const obj = { a: 1, b: 2, c: 3 }\n\n// Object.values() - 获取值数组\nconsole.log(Object.values(obj))  // [1, 2, 3]\n\n// Object.entries() - 获取键值对数组\nconsole.log(Object.entries(obj))  // [["a", 1], ["b", 2], ["c", 3]]\n\n// 遍历对象\nfor (const [key, value] of Object.entries(obj)) {\n  console.log(`${key}: ${value}`)\n}\n\n// 将对象转换为 Map\nconst map = new Map(Object.entries(obj))\n\n// 从键值对数组创建对象\nconst entries = [["name", "Alice"], ["age", 25]]\nconst newObj = Object.fromEntries(entries)  // ES10\n\n// 字符串也适用\nconsole.log(Object.values("hello"))  // ["h","e","l","l","o"]</code></pre>',
    tags: ['Object.values', 'Object.entries', 'ES8']
  },
  'es9-rest-spread': {
    title: '对象 Rest/Spread',
    body: '<p class="lead">ES9 将 Rest/Spread 语法扩展到对象。</p><pre><code>// 对象 Spread\nconst obj1 = { a: 1, b: 2 }\nconst obj2 = { c: 3, d: 4 }\nconst merged = { ...obj1, ...obj2 }  // { a:1, b:2, c:3, d:4 }\nconst clone = { ...obj1 }  // 浅拷贝\n\n// 对象 Rest\nconst { a, b, ...rest } = { a: 1, b: 2, c: 3, d: 4 }\nconsole.log(a)     // 1\nconsole.log(b)     // 2\nconsole.log(rest)  // { c: 3, d: 4 }\n\n// 合并对象并覆盖属性\nconst user = { name: "Alice", age: 25 }\nconst updates = { age: 26, city: "Beijing" }\nconst updatedUser = { ...user, ...updates }\n// { name: "Alice", age: 26, city: "Beijing" }\n\n// 浅拷贝注意（嵌套对象仍是引用）\nconst original = { a: { x: 1 } }\nconst copy = { ...original }\ncopy.a.x = 2\nconsole.log(original.a.x)  // 2</code></pre>',
    tags: ['对象Spread', '对象Rest', 'ES9']
  },
  'es9-promise-finally': {
    title: 'Promise.finally()',
    body: '<p class="lead">Promise.finally() 无论成功或失败都会执行的回调。</p><pre><code>// 基本用法\nfetch("/api/data")\n  .then(response =&gt; response.json())\n  .catch(error =&gt; console.error(error))\n  .finally(() =&gt; {\n    console.log("请求完成，无论成功还是失败")\n    hideLoadingSpinner()\n  })\n\n// 典型场景：关闭加载状态\nlet isLoading = true\napiCall()\n  .then(data =&gt; processData(data))\n  .catch(err =&gt; handleError(err))\n  .finally(() =&gt; {\n    isLoading = false\n  })\n\n// finally 不接收参数，无法知道结果状态</code></pre>',
    tags: ['Promise.finally', 'ES9', '异步']
  },
  'es10-flat': {
    title: 'Array.flat/flatMap',
    body: '<p class="lead">ES10 引入 Array.flat() 和 Array.flatMap() 方法。</p><pre><code>// Array.flat() - 展平嵌套数组\nconst arr1 = [1, 2, [3, 4]]\nconsole.log(arr1.flat())  // [1, 2, 3, 4]\n\nconst arr2 = [1, 2, [3, 4, [5, 6]]]\nconsole.log(arr2.flat())      // [1, 2, 3, 4, [5, 6]]\nconsole.log(arr2.flat(2))     // [1, 2, 3, 4, 5, 6]\nconsole.log(arr2.flat(Infinity))  // 完全展平\n\n// 去除空项\nconst arr3 = [1, 2, , 4, 5]\nconsole.log(arr3.flat())  // [1, 2, 4, 5]\n\n// Array.flatMap() - map 后 flat\nconst arr4 = [1, 2, 3]\nconst result = arr4.flatMap(x =&gt; [x, x * 2])\n// [1, 2, 2, 4, 3, 6]\n\n// 相当于 map 后 flat\narr4.map(x =&gt; [x, x * 2]).flat()</code></pre>',
    tags: ['Array.flat', 'Array.flatMap', 'ES10']
  },
  'es10-trim': {
    title: 'String.trimStart/End',
    body: '<p class="lead">ES10 引入 String.trimStart() 和 String.trimEnd() 方法。</p><pre><code>const str = "  Hello World  "\n\n// 去除开头空格\nconsole.log(str.trimStart())  // "Hello World  "\nconsole.log(str.trimLeft())   // 别名\n\n// 去除结尾空格\nconsole.log(str.trimEnd())    // "  Hello World"\nconsole.log(str.trimRight())  // 别名\n\n// 去除两端空格\nconsole.log(str.trim())       // "Hello World"\n\n// 实际应用\nconst userInput = "  alice@example.com  "\nconst email = userInput.trim()\n\n// 保留中间空格\nconst sentence = "  Hello   World  "\nconsole.log(sentence.trimStart())  // "Hello   World  "</code></pre>',
    tags: ['trimStart', 'trimEnd', 'ES10']
  },
  'es11-optional': {
    title: '可选链 ?.',
    body: '<p class="lead">可选链操作符 (?.) 安全地访问嵌套属性，避免 TypeError。</p><pre><code>const user = {\n  name: "Alice",\n  address: {\n    city: "Beijing"\n  }\n}\n\n// 传统方式\nconst city = user &amp;&amp; user.address &amp;&amp; user.address.city\n\n// 可选链\nconst city2 = user?.address?.city  // "Beijing"\nconst zip = user?.address?.zip     // undefined（不报错）\n\n// 可选链调用方法\nconst result = user.getName?.()\n\n// 可选链访问数组\nconst firstItem = arr?.[0]\n\n// 可选链与 nullish 合并\nconst name = user?.name ?? "Guest"\n\n// 动态属性\nconst key = "address"\nconst value = user?.[key]?.city\n\n// 短路特性\nconst test = null\nconst x = test?.value ?? "default"  // 不会访问 value</code></pre>',
    tags: ['可选链', '?.', 'ES2020']
  },
  'es11-nullish': {
    title: '空值合并 ??',
    body: '<p class="lead">空值合并运算符 (??) 只在值为 null 或 undefined 时返回右侧值。</p><pre><code>// 基本用法\nconst value1 = null ?? "default"      // "default"\nconst value2 = undefined ?? "default" // "default"\nconst value3 = 0 ?? "default"         // 0\nconst value4 = "" ?? "default"        // ""\nconst value5 = false ?? "default"     // false\n\n// 与 || 的区别\nconst count = 0\nconst orResult = count || 10    // 10（0 是 falsy）\nconst nullishResult = count ?? 10  // 0\n\n// 可选链配合\nconst user = { name: "", age: 0 }\nconst name = user?.name ?? "Anonymous"  // ""\n\n// 赋值操作符\nlet x = null\nx ??= "default"  // x = "default"\nlet y = 0\ny ??= 10  // y 仍然是 0</code></pre>',
    tags: ['空值合并', '??', 'ES2020']
  },
  'es11-bigint': {
    title: 'BigInt',
    body: '<p class="lead">BigInt 用于表示任意精度的整数，解决 Number 精度限制。</p><pre><code>// 创建 BigInt\nconst big1 = 12345678901234567890n  // 后缀 n\nconst big2 = BigInt(1234567890)\nconst big3 = BigInt("9007199254740991")\n\n// 运算\nconst sum = 10n + 20n  // 30n\nconst product = 5n * 6n  // 30n\nconst quotient = 10n / 3n  // 3n（向下取整）\n\n// 不能与 Number 混合运算\n// const result = 10n + 5  // 错误\nconst result = 10n + BigInt(5)  // 15n\n\n// 比较\nconsole.log(10n === 10)   // false\nconsole.log(10n == 10)    // true\nconsole.log(10n &gt; 5)      // true\n\n// 转换\nconst num = Number(100n)      // 100\nconst str = 100n.toString()   // "100"\n\n// 使用场景：时间戳、大整数 ID、加密算法</code></pre>',
    tags: ['BigInt', '大整数', 'ES2020']
  },
  'es11-globalThis': {
    title: 'globalThis',
    body: '<p class="lead">globalThis 提供跨平台的全局对象访问方式。</p><pre><code>// 传统方式（不同环境不同）\n// 浏览器: window, self, this\n// Node.js: global\n// Web Worker: self\n\n// globalThis 统一访问\nconsole.log(globalThis)\n\n// 设置全局变量\nvar myVar = "hello"\nconsole.log(globalThis.myVar)\n\n// 检测环境\nif (typeof globalThis.fetch === "function") {\n  // 浏览器环境\n}\n\n// 跨平台库示例\nfunction getGlobalThis() {\n  return globalThis\n}\n\n// 全局函数访问\nsetTimeout(() =&gt; console.log("done"), 1000)\n// 等价于\nglobalThis.setTimeout(() =&gt; console.log("done"), 1000)</code></pre>',
    tags: ['globalThis', '全局对象', 'ES2020']
  },
  'es12-logical': {
    title: '逻辑赋值运算符',
    body: '<p class="lead">ES12 引入逻辑赋值运算符，简化常见逻辑操作。</p><pre><code>// ||= - 逻辑或赋值\nlet a = 0\na ||= 10\nconsole.log(a)  // 10（因为 0 是 falsy）\n\nlet b = 5\nb ||= 10\nconsole.log(b)  // 5\n\n// &amp;&amp;= - 逻辑与赋值\nlet c = 5\nc &amp;&amp;= 10\nconsole.log(c)  // 10（因为 5 是 truthy）\n\nlet d = 0\nd &amp;&amp;= 10\nconsole.log(d)  // 0\n\n// ??= - 空值合并赋值\nlet e = null\ne ??= 10\nconsole.log(e)  // 10\n\nlet f = 0\nf ??= 10\nconsole.log(f)  // 0（0 不是 null/undefined）\n\n// 实际应用\n// 对象属性初始化\nconst config = {}\nconfig.timeout ??= 3000\nconfig.retry ??= 3\n\n// 变量默认值\nlet name\nname ??= "Anonymous"</code></pre>',
    tags: ['逻辑赋值', '||=', '??=', 'ES2021']
  },
  'es12-replaceAll': {
    title: 'String.replaceAll()',
    body: '<p class="lead">String.replaceAll() 替换字符串中所有匹配的内容。</p><pre><code>// 基本用法\nconst str = "hello world hello"\n\n// replace 只替换第一个\nconsole.log(str.replace("hello", "hi"))  // "hi world hello"\n\n// replaceAll 替换所有\nconsole.log(str.replaceAll("hello", "hi"))  // "hi world hi"\n\n// 使用正则表达式\nconsole.log(str.replaceAll(/hello/g, "hi"))  // "hi world hi"\n\n// 替换空格\nconst sentence = "a b c d"\nconsole.log(sentence.replaceAll(" ", ""))  // "abcd"\n\n// 使用函数处理\nconst prices = "1,2,3,4"\nconst doubled = prices.replaceAll(/\\d+/g, match =&gt; parseInt(match) * 2)\nconsole.log(doubled)  // "2,4,6,8"\n\n// 注意：replaceAll 的 pattern 必须是全局的\n// str.replaceAll(/hello/, "hi")  // 错误</code></pre>',
    tags: ['replaceAll', '字符串', 'ES2021']
  },
  'es13-top-await': {
    title: '顶层 await',
    body: '<p class="lead">顶层 await 允许在模块顶层使用 await，无需 async 函数包裹。</p><pre><code>// 模块中使用顶层 await\n// data.js\nconst response = await fetch("/api/data")\nconst data = await response.json()\nexport default data\n\n// 使用模块\nimport data from "./data.js"\nconsole.log(data)  // 等待加载完成\n\n// 动态加载\nconst module = await import("./module.js")\n\n// 多个顶层 await（并行）\nconst [user, posts] = await Promise.all([\n  fetch("/api/user").then(r =&gt; r.json()),\n  fetch("/api/posts").then(r =&gt; r.json())\n])\n\n// 依赖关系\n// 被依赖的模块会先执行 await\n// a.js\nexport const a = await Promise.resolve(1)\n\n// b.js\nimport { a } from "./a.js"\nexport const b = a + 1  // a 已经解析完成</code></pre>',
    tags: ['顶层await', '模块', 'ES2022']
  },
  'es13-class-fields': {
    title: '类私有字段 #',
    body: '<p class="lead">ES2022 引入类私有字段，使用 # 前缀声明私有成员。</p><pre><code>class Person {\n  // 私有字段\n  #name\n  #age\n  \n  // 公共字段\n  publicField = "public"\n  \n  // 静态公共字段\n  static staticField = "static"\n  \n  // 静态私有字段\n  static #staticPrivate = "private static"\n  \n  constructor(name, age) {\n    this.#name = name\n    this.#age = age\n  }\n  \n  // 私有方法\n  #validate() {\n    return this.#age &gt; 0\n  }\n  \n  getInfo() {\n    return `${this.#name} is ${this.#age} years old`\n  }\n  \n  // 私有方法访问\n  isValid() {\n    return this.#validate()\n  }\n  \n  // 静态方法访问静态私有字段\n  static getStaticPrivate() {\n    return this.#staticPrivate\n  }\n}\n\nconst person = new Person("Alice", 25)\nconsole.log(person.getInfo())\n// console.log(person.#name)  // 语法错误\n// console.log(person.#validate)  // 语法错误</code></pre>',
    tags: ['私有字段', '#', 'ES2022']
  },
  'es13-at': {
    title: 'Array.at()',
    body: '<p class="lead">Array.at() 方法支持负索引，从数组末尾开始访问。</p><pre><code>const arr = [10, 20, 30, 40, 50]\n\n// 正索引\nconsole.log(arr.at(0))   // 10\nconsole.log(arr.at(2))   // 30\n\n// 负索引（从末尾开始）\nconsole.log(arr.at(-1))  // 50\nconsole.log(arr.at(-2))  // 40\n\n// 等价于传统方式\nconsole.log(arr[arr.length - 1])  // 50\nconsole.log(arr.slice(-1)[0])     // 50\n\n// 字符串也支持\nconst str = "hello"\nconsole.log(str.at(0))   // "h"\nconsole.log(str.at(-1))  // "o"\n\n// 超出范围返回 undefined\nconsole.log(arr.at(10))   // undefined\nconsole.log(arr.at(-10))  // undefined</code></pre>',
    tags: ['Array.at', '负索引', 'ES2022']
  },
  'es14-findLast': {
    title: 'Array.findLast()',
    body: '<p class="lead">ES2023 引入 findLast() 和 findLastIndex() 从数组末尾开始查找。</p><pre><code>const arr = [5, 12, 8, 130, 44]\n\n// findLast - 从末尾查找第一个满足条件的元素\nconsole.log(arr.findLast(x =&gt; x &gt; 10))   // 44\nconsole.log(arr.findLast(x =&gt; x &lt; 10))   // 8\n\n// findLastIndex - 从末尾查找索引\nconsole.log(arr.findLastIndex(x =&gt; x &gt; 10))   // 4（44 的索引）\nconsole.log(arr.findLastIndex(x =&gt; x &lt; 10))   // 2（8 的索引）\n\n// 与传统 find 对比\nconsole.log(arr.find(x =&gt; x &gt; 10))   // 12（从开头找到）\nconsole.log(arr.findIndex(x =&gt; x &gt; 10))   // 1\n\n// 查找对象数组\nconst users = [\n  { name: "Alice", active: false },\n  { name: "Bob", active: true },\n  { name: "Charlie", active: true }\n]\nconsole.log(users.findLast(user =&gt; user.active))  // { name: "Charlie", active: true }</code></pre>',
    tags: ['findLast', 'findLastIndex', 'ES2023']
  },
  'es14-hashbang': {
    title: 'Hashbang 语法',
    body: '<p class="lead">ES2023 标准化了 Hashbang 语法，用于指定脚本解释器。</p><pre><code>#!/usr/bin/env node\n\n// 在文件开头使用 #! 指定解释器\n// 这行会被 JavaScript 引擎忽略\n\nconsole.log("Hello from Node.js")\n\n// 使用方式\n// 1. 给文件添加执行权限\n// chmod +x script.js\n\n// 2. 直接运行\n// ./script.js\n\n// 支持的场景\n// - CLI 工具\n// - npm 包的可执行文件\n// - 独立脚本\n\n// Hashbang 必须出现在文件第一行\n// 前面不能有任何空白字符或注释</code></pre>',
    tags: ['Hashbang', 'Shebang', 'ES2023']
  },
  'es15-promise': {
    title: 'Promise.withResolvers()',
    body: '<p class="lead">ES2024 引入 Promise.withResolvers()，简化 Promise 构造。</p><pre><code>// 传统方式\nlet resolve, reject\nconst promise1 = new Promise((res, rej) =&gt; {\n  resolve = res\n  reject = rej\n})\n\n// 新方式\nconst { promise, resolve, reject } = Promise.withResolvers()\n\n// 使用场景：需要外部控制 Promise 状态\nfunction createCancellablePromise() {\n  const { promise, resolve, reject } = Promise.withResolvers()\n  \n  let cancelled = false\n  const cancel = () =&gt; {\n    cancelled = true\n    reject(new Error("Cancelled"))\n  }\n  \n  return { promise, cancel }\n}\n\n// 事件监听场景\nconst { promise, resolve } = Promise.withResolvers()\nelement.addEventListener("click", resolve, { once: true })\nawait promise</code></pre>',
    tags: ['Promise.withResolvers', 'ES2024', 'Promise']
  },
  'es15-group': {
    title: 'Map.groupBy()',
    body: '<p class="lead">ES2024 引入 Map.groupBy() 和 Object.groupBy() 方法。</p><pre><code>// Map.groupBy() - 按条件分组，返回 Map\nconst inventory = [\n  { name: "apple", category: "fruit" },\n  { name: "banana", category: "fruit" },\n  { name: "carrot", category: "vegetable" },\n  { name: "broccoli", category: "vegetable" }\n]\n\nconst groupedByCategory = Map.groupBy(inventory, item =&gt; item.category)\nconsole.log(groupedByCategory.get("fruit"))\n// [{ name: "apple" }, { name: "banana" }]\n\n// Object.groupBy() - 返回对象\nconst groupedByCategoryObj = Object.groupBy(inventory, item =&gt; item.category)\n// {\n//   fruit: [{ name: "apple" }, { name: "banana" }],\n//   vegetable: [{ name: "carrot" }, { name: "broccoli" }]\n// }\n\n// 按数字范围分组\nconst numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]\nconst groupedByParity = Map.groupBy(numbers, n =&gt; n % 2 === 0 ? "even" : "odd")</code></pre>',
    tags: ['Map.groupBy', 'Object.groupBy', 'ES2024']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 ECMAScript 规范获取更多信息。</p>',
        tags: ['ES6+', 'JavaScript']
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

addLink('es6-let-const', 'es6-arrow')
addLink('es6-arrow', 'es6-destructuring')
addLink('es6-destructuring', 'es6-template')
addLink('es6-template', 'es6-spread-rest')
addLink('es6-spread-rest', 'es6-class')
addLink('es6-class', 'es6-module')
addLink('es6-promise', 'es6-map-set')
addLink('es6-map-set', 'es6-symbol')
addLink('es6-symbol', 'es6-iterator')
addLink('es6-iterator', 'es6-generator')
addLink('es7-includes', 'es7-exponent')
addLink('es8-async-await', 'es8-object-values')
addLink('es8-object-values', 'es9-rest-spread')
addLink('es9-rest-spread', 'es9-promise-finally')
addLink('es10-flat', 'es10-trim')
addLink('es11-optional', 'es11-nullish')
addLink('es11-nullish', 'es11-bigint')
addLink('es11-bigint', 'es11-globalThis')
addLink('es12-logical', 'es12-replaceAll')
addLink('es13-top-await', 'es13-class-fields')
addLink('es13-class-fields', 'es13-at')
addLink('es14-findLast', 'es14-hashbang')
addLink('es15-promise', 'es15-group')

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