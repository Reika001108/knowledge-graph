<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">ES5 知识库</h1>
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
          <h2>📜 <span class="gradient-text">ES5 完全指南</span></h2>
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
          <p>📜 ECMAScript 5 | 现代 JavaScript 的基石</p>
          <p>✨ 点击节点双向联动 | 兼容性最好的版本</p>
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
          <h3>🔗 ES5 知识图谱 <span class="graph-badge">ECharts</span></h3>
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

// ========== ES5 导航数据 ==========
const navSections = ref([
  { title: '📖 基础语法', items: [
      { id: 'es5-intro', label: 'ES5 简介', hot: true },
      { id: 'es5-var', label: 'var 声明', hot: true },
      { id: 'es5-hoisting', label: '变量提升', hot: true },
      { id: 'es5-scope', label: '作用域', hot: true },
      { id: 'es5-closure', label: '闭包', hot: true }
    ]},
  { title: '🔧 函数', items: [
      { id: 'es5-function', label: '函数定义', hot: true },
      { id: 'es5-arguments', label: 'arguments 对象', hot: true },
      { id: 'es5-call-apply', label: 'call/apply/bind', hot: true },
      { id: 'es5-iife', label: 'IIFE 立即执行函数', hot: true }
    ]},
  { title: '📊 数组方法', items: [
      { id: 'es5-array-foreach', label: 'forEach', hot: true },
      { id: 'es5-array-map', label: 'map', hot: true },
      { id: 'es5-array-filter', label: 'filter', hot: true },
      { id: 'es5-array-reduce', label: 'reduce', hot: true },
      { id: 'es5-array-some-every', label: 'some / every', hot: true },
      { id: 'es5-array-indexof', label: 'indexOf / lastIndexOf', hot: true }
    ]},
  { title: '🔐 严格模式', items: [
      { id: 'es5-strict', label: '严格模式简介', hot: true },
      { id: 'es5-strict-rules', label: '严格模式规则', hot: true }
    ]},
  { title: '🏗️ 对象与属性', items: [
      { id: 'es5-object-create', label: 'Object.create', hot: true },
      { id: 'es5-define-property', label: '属性描述符', hot: true },
      { id: 'es5-getter-setter', label: 'Getter / Setter', hot: true },
      { id: 'es5-object-methods', label: 'Object 静态方法', hot: true }
    ]},
  { title: '📅 JSON 与日期', items: [
      { id: 'es5-json', label: 'JSON 解析与序列化', hot: true },
      { id: 'es5-date', label: 'Date 增强', hot: true }
    ]}
])

const selectedId = ref('es5-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== ES5 内容映射表 ==========
const contentMap = {
  // 基础语法
  'es5-intro': {
    title: 'ES5 简介',
    body: '<p class="lead">ES5（ECMAScript 5）是 JavaScript 语言的第五个版本，于 2009 年发布，是现代 JavaScript 的重要基石，为后续版本奠定了基础。</p><h3>核心特性</h3><ul><li><strong>严格模式</strong>：更严格的语法检查，提升代码质量</li><li><strong>数组方法</strong>：forEach、map、filter、reduce 等高阶函数</li><li><strong>对象增强</strong>：属性描述符、getter/setter、Object.create</li><li><strong>JSON 支持</strong>：原生 JSON.parse 和 JSON.stringify</li><li><strong>bind 方法</strong>：函数绑定，固定 this 指向</li></ul><div class="note">💡 ES5 是所有现代浏览器都支持的版本，是 Web 开发的兼容性基线。</div>',
    tags: ['ECMAScript', 'JavaScript', '语言规范']
  },
  'es5-var': {
    title: 'var 声明',
    body: '<p class="lead">var 是 ES5 及之前版本声明变量的唯一方式。</p><pre><code>// 基本用法\nvar name = "Alice"\nvar age = 25\nvar isActive = true\n\n// 变量提升\nconsole.log(message)  // undefined（不会报错）\nvar message = "Hello"\n\n// 重复声明允许\nvar count = 1\nvar count = 2  // 覆盖\n\n// 函数作用域\nfunction test() {\n  var x = 10\n  if (true) {\n    var y = 20  // 函数作用域，不是块作用域\n  }\n  console.log(y)  // 20\n}\n\n// 全局变量挂载到 window\nvar globalVar = "global"\nconsole.log(window.globalVar)  // "global"\n\n// 未使用 var 声明的变量成为全局变量（不推荐）\nfunction bad() {\n  leak = "I become global"\n}\nbad()\nconsole.log(leak)  // "I become global"</code></pre>',
    tags: ['var', '变量声明', '函数作用域']
  },
  'es5-hoisting': {
    title: '变量提升',
    body: '<p class="lead">变量提升是 JavaScript 将声明移到作用域顶部的行为。</p><pre><code>// var 的提升\nconsole.log(a)  // undefined（不是 ReferenceError）\nvar a = 5\n// 等价于\nvar a\nconsole.log(a)\na = 5\n\n// 函数声明提升\nsayHello()  // "Hello"\nfunction sayHello() {\n  console.log("Hello")\n}\n\n// 函数表达式不提升\n// sayHi()  // TypeError: sayHi is not a function\nvar sayHi = function() {\n  console.log("Hi")\n}\n\n// 提升优先级（函数声明优先于变量声明）\nvar test = "variable"\nfunction test() {}\nconsole.log(typeof test)  // "string"\n\n// 实际应用：在声明前使用函数\nfunction processData(data) {\n  validate(data)\n  function validate(d) {\n    if (!d) throw new Error("Invalid")\n  }\n}</code></pre>',
    tags: ['提升', 'hoisting', '函数提升']
  },
  'es5-scope': {
    title: '作用域',
    body: '<p class="lead">JavaScript 作用域决定了变量的可访问范围。ES5 只有全局作用域和函数作用域，没有块级作用域。</p><pre><code>// 全局作用域\nvar globalVar = "全局"\n\n// 函数作用域\nfunction outer() {\n  var funcVar = "函数内部"\n  \n  function inner() {\n    var innerVar = "内部函数"\n    console.log(funcVar)  // 可访问外部变量\n  }\n  // console.log(innerVar)  // 错误：innerVar 不可访问\n}\n\n// 没有块级作用域（重要区别）\nif (true) {\n  var blockScoped = "var 在块中也是函数作用域"\n}\nconsole.log(blockScoped)  // 可访问！\n\nfor (var i = 0; i &lt; 3; i++) {\n  // i 在循环外可访问\n}\nconsole.log(i)  // 3\n\n// 词法作用域（静态作用域）\nvar value = "global"\nfunction print() {\n  console.log(value)\n}\nfunction run() {\n  var value = "local"\n  print()  // "global"（取决于定义位置，不是调用位置）\n}\n\n// 作用域链\nvar a = 1\nfunction outer() {\n  var b = 2\n  function inner() {\n    var c = 3\n    console.log(a + b + c)  // 沿着作用域链查找\n  }\n  inner()\n}\nouter()  // 6</code></pre>',
    tags: ['作用域', '函数作用域', '词法作用域']
  },
  'es5-closure': {
    title: '闭包',
    body: '<p class="lead">闭包是指函数能够记住并访问它的词法作用域，即使该函数在作用域之外执行。</p><pre><code>// 基本闭包\nfunction createCounter() {\n  var count = 0\n  return function() {\n    count++\n    return count\n  }\n}\n\nvar counter = createCounter()\nconsole.log(counter())  // 1\nconsole.log(counter())  // 2\nconsole.log(counter())  // 3\n\n// 工厂函数\nfunction createGreeting(greeting) {\n  return function(name) {\n    return greeting + ", " + name\n  }\n}\n\nvar sayHello = createGreeting("Hello")\nvar sayHi = createGreeting("Hi")\nconsole.log(sayHello("Alice"))  // "Hello, Alice"\nconsole.log(sayHi("Bob"))       // "Hi, Bob"\n\n// 闭包在循环中的问题\nfor (var i = 0; i &lt; 3; i++) {\n  setTimeout(function() {\n    console.log(i)  // 输出 3,3,3（闭包共享同一个 i）\n  }, 100)\n}\n\n// 解决方案：使用 IIFE 创建新作用域\nfor (var i = 0; i &lt; 3; i++) {\n  (function(j) {\n    setTimeout(function() {\n      console.log(j)  // 输出 0,1,2\n    }, 100)\n  })(i)\n}\n\n// 模块模式（利用闭包实现私有变量）\nvar Module = (function() {\n  var privateVar = "private"\n  \n  function privateMethod() {\n    return "private method"\n  }\n  \n  return {\n    publicVar: "public",\n    publicMethod: function() {\n      return privateVar + " " + privateMethod()\n    }\n  }\n})()\n\nconsole.log(Module.publicMethod())  // "private private method"\n// console.log(Module.privateVar)    // undefined</code></pre>',
    tags: ['闭包', '词法作用域', '模块模式']
  },
  // 函数
  'es5-function': {
    title: '函数定义',
    body: '<p class="lead">ES5 中定义函数的多种方式。</p><pre><code>// 函数声明\nfunction add(a, b) {\n  return a + b\n}\n\n// 函数表达式\nvar multiply = function(a, b) {\n  return a * b\n}\n\n// 命名函数表达式（调试时有用）\nvar factorial = function fact(n) {\n  return n &lt;= 1 ? 1 : n * fact(n - 1)\n}\n\n// 函数作为参数\nfunction execute(fn, value) {\n  return fn(value)\n}\n\nvar double = function(x) { return x * 2 }\nconsole.log(execute(double, 5))  // 10\n\n// 函数作为返回值\nfunction getMultiplier(factor) {\n  return function(x) {\n    return x * factor\n  }\n}\n\nvar times2 = getMultiplier(2)\nconsole.log(times2(5))  // 10\n\n// 自执行函数（IIFE）\n(function() {\n  console.log("立即执行")\n})()\n\n// 函数属性\nfunction greet(name) {\n  return "Hello " + name\n}\ngreet.language = "English"\nconsole.log(greet.language)  // "English"</code></pre>',
    tags: ['函数声明', '函数表达式', 'IIFE']
  },
  'es5-arguments': {
    title: 'arguments 对象',
    body: '<p class="lead">arguments 对象是函数内部可访问的类数组对象，包含传入的所有参数。</p><pre><code>// 基本用法\nfunction sum() {\n  var total = 0\n  for (var i = 0; i &lt; arguments.length; i++) {\n    total += arguments[i]\n  }\n  return total\n}\n\nconsole.log(sum(1, 2, 3))        // 6\nconsole.log(sum(1, 2, 3, 4, 5))  // 15\n\n// arguments 不是真正的数组\nfunction test() {\n  console.log(Array.isArray(arguments))  // false\n  console.log(arguments instanceof Array) // false\n  \n  // 转换为数组\n  var args = Array.prototype.slice.call(arguments)\n  console.log(Array.isArray(args))  // true\n}\n\n// callee 属性（递归时使用）\nfunction factorial(n) {\n  if (n &lt;= 1) return 1\n  return n * arguments.callee(n - 1)\n}\nconsole.log(factorial(5))  // 120\n\n// 严格模式下 arguments 行为不同\nfunction modify(a) {\n  "use strict"\n  arguments[0] = 100\n  console.log(a)  // 原始值，不受影响（非严格模式下会同步）\n}\nmodify(10)\n\n// 默认值模拟（ES5 没有默认参数）\nfunction greet(name) {\n  name = name || "Guest"\n  return "Hello, " + name\n}</code></pre>',
    tags: ['arguments', '类数组', 'callee']
  },
  'es5-call-apply': {
    title: 'call / apply / bind',
    body: '<p class="lead">call、apply 和 bind 用于显式绑定函数的 this 指向。</p><pre><code>// call - 逐个传递参数\nfunction introduce(age, city) {\n  return "I am " + this.name + ", " + age + " years old from " + city\n}\n\nvar person = { name: "Alice" }\nconsole.log(introduce.call(person, 25, "Beijing"))\n// "I am Alice, 25 years old from Beijing"\n\n// apply - 参数以数组形式传递\nconsole.log(introduce.apply(person, [25, "Beijing"]))\n\n// 借用数组方法\nfunction myFunction() {\n  var args = Array.prototype.slice.call(arguments)\n  console.log(args)\n}\n\n// 求最大值\nvar numbers = [5, 2, 8, 1, 9]\nvar max = Math.max.apply(null, numbers)\nconsole.log(max)  // 9\n\n// bind - 返回新函数，永久绑定 this\nvar bound = introduce.bind(person, 25)\nconsole.log(bound("Beijing"))  // "I am Alice, 25 years old from Beijing"\n\n// 函数柯里化\nfunction multiply(a, b) {\n  return a * b\n}\nvar double = multiply.bind(null, 2)\nconsole.log(double(5))  // 10\n\n// 事件处理中的 this\nfunction Button(text) {\n  this.text = text\n  this.element = document.createElement("button")\n  this.element.textContent = text\n  this.element.onclick = this.handleClick.bind(this)\n}\n\nButton.prototype.handleClick = function() {\n  console.log(this.text + " clicked")\n}</code></pre>',
    tags: ['call', 'apply', 'bind', 'this']
  },
  'es5-iife': {
    title: 'IIFE 立即执行函数',
    body: '<p class="lead">IIFE（Immediately Invoked Function Expression）定义后立即执行，常用于创建独立作用域。</p><pre><code>// 基本语法\n(function() {\n  console.log("立即执行")\n})()\n\n// 带参数\n(function(name) {\n  console.log("Hello, " + name)\n})("Alice")\n\n// 返回值\nvar result = (function(a, b) {\n  return a + b\n})(5, 3)\nconsole.log(result)  // 8\n\n// 创建私有作用域\n(function() {\n  var privateVar = "只能在此作用域内访问"\n  // 避免污染全局\n})()\n\n// 模块模式\nvar MyModule = (function() {\n  var privateData = []\n  \n  function privateMethod() {\n    return "private"\n  }\n  \n  return {\n    add: function(item) {\n      privateData.push(item)\n    },\n    getAll: function() {\n      return privateData.slice()\n    }\n  }\n})()\n\nMyModule.add("item1")\nconsole.log(MyModule.getAll())  // ["item1"]\n\n// 循环问题解决方案\nfor (var i = 0; i &lt; 3; i++) {\n  (function(j) {\n    setTimeout(function() {\n      console.log(j)  // 0,1,2\n    }, 100)\n  })(i)\n}\n\n// 防止变量提升污染\n(function() {\n  var tmp = "临时变量"\n  // 使用 tmp\n})()\n// tmp 在此处不可访问</code></pre>',
    tags: ['IIFE', '立即执行函数', '模块模式']
  },
  // 数组方法
  'es5-array-foreach': {
    title: 'forEach',
    body: '<p class="lead">forEach 方法遍历数组，对每个元素执行回调函数。</p><pre><code>var arr = [1, 2, 3, 4, 5]\n\n// 基本用法\narr.forEach(function(item) {\n  console.log(item)\n})\n\n// 带索引\narr.forEach(function(item, index) {\n  console.log(index + ": " + item)\n})\n\n// 带 this 参数\nvar obj = { multiplier: 2 }\narr.forEach(function(item) {\n  console.log(item * this.multiplier)\n}, obj)\n\n// 修改原数组（不推荐）\narr.forEach(function(item, index, array) {\n  array[index] = item * 2\n})\nconsole.log(arr)  // [2,4,6,8,10]\n\n// 模拟 forEach 实现\nfunction myForEach(arr, callback, thisArg) {\n  for (var i = 0; i &lt; arr.length; i++) {\n    callback.call(thisArg, arr[i], i, arr)\n  }\n}\n\n// 注意：forEach 不能中途跳出\n// 无法使用 break 或 return 终止</code></pre>',
    tags: ['forEach', '遍历', '数组方法']
  },
  'es5-array-map': {
    title: 'map',
    body: '<p class="lead">map 方法创建新数组，每个元素是回调函数的返回值。</p><pre><code>var numbers = [1, 2, 3, 4, 5]\n\n// 基本用法\nvar doubled = numbers.map(function(n) {\n  return n * 2\n})\nconsole.log(doubled)  // [2,4,6,8,10]\n\n// 对象数组转换\nvar users = [\n  { name: "Alice", age: 25 },\n  { name: "Bob", age: 30 }\n]\nvar names = users.map(function(user) {\n  return user.name\n})\nconsole.log(names)  // ["Alice", "Bob"]\n\n// 提取属性并格式化\nvar prices = [10, 20, 30]\nvar formatted = prices.map(function(price) {\n  return "$" + price.toFixed(2)\n})\nconsole.log(formatted)  // ["$10.00", "$20.00", "$30.00"]\n\n// 链式调用\nvar result = numbers\n  .map(function(n) { return n * 2 })\n  .map(function(n) { return n + 1 })\nconsole.log(result)  // [3,5,7,9,11]\n\n// 模拟 map 实现\nfunction myMap(arr, callback, thisArg) {\n  var result = []\n  for (var i = 0; i &lt; arr.length; i++) {\n    result.push(callback.call(thisArg, arr[i], i, arr))\n  }\n  return result\n}</code></pre>',
    tags: ['map', '映射', '数组方法']
  },
  'es5-array-filter': {
    title: 'filter',
    body: '<p class="lead">filter 方法创建新数组，包含所有通过测试的元素。</p><pre><code>var numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]\n\n// 基本用法\nvar evens = numbers.filter(function(n) {\n  return n % 2 === 0\n})\nconsole.log(evens)  // [2,4,6,8,10]\n\n// 过滤对象数组\nvar users = [\n  { name: "Alice", active: true },\n  { name: "Bob", active: false },\n  { name: "Charlie", active: true }\n]\nvar activeUsers = users.filter(function(user) {\n  return user.active\n})\nconsole.log(activeUsers)  // [{name:"Alice",active:true}, {name:"Charlie",active:true}]\n\n// 去除 falsy 值\nvar mixed = [0, "hello", false, 42, "", null, "world", undefined]\nvar truthy = mixed.filter(function(item) {\n  return item\n})\nconsole.log(truthy)  // ["hello",42,"world"]\n\n// 去重\nvar duplicates = [1, 2, 2, 3, 3, 4, 5, 5]\nvar unique = duplicates.filter(function(item, index, arr) {\n  return arr.indexOf(item) === index\n})\nconsole.log(unique)  // [1,2,3,4,5]\n\n// 模拟 filter 实现\nfunction myFilter(arr, callback, thisArg) {\n  var result = []\n  for (var i = 0; i &lt; arr.length; i++) {\n    if (callback.call(thisArg, arr[i], i, arr)) {\n      result.push(arr[i])\n    }\n  }\n  return result\n}</code></pre>',
    tags: ['filter', '过滤', '数组方法']
  },
  'es5-array-reduce': {
    title: 'reduce',
    body: '<p class="lead">reduce 方法将数组元素累积为单个值。</p><pre><code>var numbers = [1, 2, 3, 4, 5]\n\n// 求和\nvar sum = numbers.reduce(function(acc, curr) {\n  return acc + curr\n}, 0)\nconsole.log(sum)  // 15\n\n// 求积\nvar product = numbers.reduce(function(acc, curr) {\n  return acc * curr\n}, 1)\nconsole.log(product)  // 120\n\n// 找最大值\nvar max = numbers.reduce(function(acc, curr) {\n  return curr > acc ? curr : acc\n}, numbers[0])\nconsole.log(max)  // 5\n\n// 数组扁平化\nvar nested = [[1, 2], [3, 4], [5, 6]]\nvar flat = nested.reduce(function(acc, curr) {\n  return acc.concat(curr)\n}, [])\nconsole.log(flat)  // [1,2,3,4,5,6]\n\n// 分组计数\nvar fruits = ["apple", "banana", "apple", "orange", "banana", "apple"]\nvar count = fruits.reduce(function(acc, fruit) {\n  acc[fruit] = (acc[fruit] || 0) + 1\n  return acc\n}, {})\nconsole.log(count)  // {apple:3, banana:2, orange:1}\n\n// 模拟 reduce 实现\nfunction myReduce(arr, callback, initialValue) {\n  var accumulator = initialValue !== undefined ? initialValue : arr[0]\n  var startIndex = initialValue !== undefined ? 0 : 1\n  \n  for (var i = startIndex; i &lt; arr.length; i++) {\n    accumulator = callback(accumulator, arr[i], i, arr)\n  }\n  return accumulator\n}</code></pre>',
    tags: ['reduce', '累积', '数组方法']
  },
  'es5-array-some-every': {
    title: 'some / every',
    body: '<p class="lead">some 检查是否有元素通过测试，every 检查是否所有元素都通过测试。</p><pre><code>var numbers = [1, 2, 3, 4, 5]\n\n// some - 至少一个满足\nvar hasEven = numbers.some(function(n) {\n  return n % 2 === 0\n})\nconsole.log(hasEven)  // true\n\nvar hasNegative = numbers.some(function(n) {\n  return n &lt; 0\n})\nconsole.log(hasNegative)  // false\n\n// every - 所有都满足\nvar allPositive = numbers.every(function(n) {\n  return n > 0\n})\nconsole.log(allPositive)  // true\n\nvar allEven = numbers.every(function(n) {\n  return n % 2 === 0\n})\nconsole.log(allEven)  // false\n\n// 实际应用\nvar users = [\n  { name: "Alice", age: 18 },\n  { name: "Bob", age: 21 },\n  { name: "Charlie", age: 16 }\n]\n\nvar hasMinor = users.some(function(user) {\n  return user.age &lt; 18\n})\nconsole.log(hasMinor)  // true\n\nvar allAdult = users.every(function(user) {\n  return user.age >= 18\n})\nconsole.log(allAdult)  // false\n\n// 模拟实现\nfunction mySome(arr, callback, thisArg) {\n  for (var i = 0; i &lt; arr.length; i++) {\n    if (callback.call(thisArg, arr[i], i, arr)) return true\n  }\n  return false\n}\n\nfunction myEvery(arr, callback, thisArg) {\n  for (var i = 0; i &lt; arr.length; i++) {\n    if (!callback.call(thisArg, arr[i], i, arr)) return false\n  }\n  return true\n}</code></pre>',
    tags: ['some', 'every', '数组方法']
  },
  'es5-array-indexof': {
    title: 'indexOf / lastIndexOf',
    body: '<p class="lead">indexOf 返回元素首次出现的索引，lastIndexOf 返回最后一次出现的索引。</p><pre><code>var arr = [1, 2, 3, 2, 1, 4, 5]\n\n// indexOf\nconsole.log(arr.indexOf(2))     // 1\nconsole.log(arr.indexOf(6))     // -1（未找到）\nconsole.log(arr.indexOf(2, 2))  // 3（从索引2开始查找）\n\n// lastIndexOf\nconsole.log(arr.lastIndexOf(2))  // 3\nconsole.log(arr.lastIndexOf(1))  // 4\nconsole.log(arr.lastIndexOf(1, 3))  // 0（从索引3向前查找）\n\n// 检查元素是否存在\nfunction contains(arr, item) {\n  return arr.indexOf(item) !== -1\n}\n\n// 数组去重（使用 indexOf）\nfunction unique(arr) {\n  var result = []\n  for (var i = 0; i &lt; arr.length; i++) {\n    if (result.indexOf(arr[i]) === -1) {\n      result.push(arr[i])\n    }\n  }\n  return result\n}\n\n// 查找所有匹配索引\nfunction findAllIndices(arr, item) {\n  var indices = []\n  var i = arr.indexOf(item)\n  while (i !== -1) {\n    indices.push(i)\n    i = arr.indexOf(item, i + 1)\n  }\n  return indices\n}\n\n// 字符串也支持\nvar str = "hello world hello"\nconsole.log(str.indexOf("hello"))     // 0\nconsole.log(str.lastIndexOf("hello")) // 12</code></pre>',
    tags: ['indexOf', 'lastIndexOf', '数组查找']
  },
  // 严格模式
  'es5-strict': {
    title: '严格模式简介',
    body: '<p class="lead">严格模式是 ES5 引入的一种更严格的 JavaScript 解析和执行模式。</p><pre><code>// 全局严格模式\n"use strict"\n// 整个文件在严格模式下执行\n\n// 函数级严格模式\nfunction strictFunction() {\n  "use strict"\n  // 该函数在严格模式下执行\n}\n\n// 优势\n// 1. 消除 JavaScript 语法的一些不合理、不严谨之处\n// 2. 提高编译器效率，增加运行速度\n// 3. 禁用一些可能在未来版本中定义的语法\n\n// 推荐做法：在文件开头或函数开头添加 "use strict"</code></pre>',
    tags: ['严格模式', 'use strict', 'ES5']
  },
  'es5-strict-rules': {
    title: '严格模式规则',
    body: '<p class="lead">严格模式引入了多项限制和变化。</p><pre><code>"use strict"\n\n// 1. 变量必须先声明再使用\n// x = 10  // ReferenceError\nvar x = 10  // OK\n\n// 2. 禁止删除变量\nvar y = 5\n// delete y  // SyntaxError\n\n// 3. 函数参数名不能重复\n// function sum(a, a, b) { }  // SyntaxError\n\n// 4. 禁止使用 with 语句\n// with(obj) { }  // SyntaxError\n\n// 5. eval 有自己的作用域\neval("var z = 100")\n// console.log(z)  // ReferenceError\n\n// 6. 禁止八进制字面量\n// var num = 010  // SyntaxError\n\n// 7. arguments 不会随参数改变\nfunction test(a) {\n  "use strict"\n  arguments[0] = 100\n  console.log(a)  // 原始值，不受影响\n}\ntest(10)\n\n// 8. 禁止给只读属性赋值\nvar obj = {}\nObject.defineProperty(obj, "readOnly", { value: 1, writable: false })\n// obj.readOnly = 2  // TypeError\n\n// 9. 禁止删除不可配置属性\n// delete Object.prototype  // TypeError\n\n// 10. 函数中的 this 不再指向全局\nfunction showThis() {\n  "use strict"\n  console.log(this)  // undefined\n}\nshowThis()</code></pre>',
    tags: ['严格模式规则', 'use strict', 'ES5']
  },
  // 对象与属性
  'es5-object-create': {
    title: 'Object.create',
    body: '<p class="lead">Object.create 创建新对象，并指定其原型对象。</p><pre><code>// 创建以指定对象为原型的对象\nvar animal = {\n  speak: function() {\n    console.log(this.name + " makes a sound")\n  }\n}\n\nvar dog = Object.create(animal)\ndog.name = "Rex"\ndog.speak()  // "Rex makes a sound"\n\n// 检查原型关系\nconsole.log(Object.getPrototypeOf(dog) === animal)  // true\nconsole.log(animal.isPrototypeOf(dog))  // true\n\n// 创建纯净对象（无原型）\nvar pure = Object.create(null)\nconsole.log(pure.toString)  // undefined\n\n// 带属性描述符的创建\nvar person = Object.create(Object.prototype, {\n  name: {\n    value: "Alice",\n    writable: true,\n    enumerable: true,\n    configurable: true\n  },\n  age: {\n    value: 25,\n    writable: false,\n    enumerable: true\n  }\n})\n\n// 实现继承\nfunction Parent(name) {\n  this.name = name\n}\nParent.prototype.greet = function() {\n  return "Hello, " + this.name\n}\n\nfunction Child(name, age) {\n  Parent.call(this, name)\n  this.age = age\n}\nChild.prototype = Object.create(Parent.prototype)\nChild.prototype.constructor = Child\n\nvar child = new Child("Bob", 10)\nconsole.log(child.greet())  // "Hello, Bob"</code></pre>',
    tags: ['Object.create', '原型', '继承']
  },
  'es5-define-property': {
    title: '属性描述符',
    body: '<p class="lead">属性描述符定义对象属性的行为特征。</p><pre><code>var obj = {}\n\n// 数据属性描述符\nObject.defineProperty(obj, "name", {\n  value: "Alice",\n  writable: true,      // 是否可修改\n  enumerable: true,    // 是否可枚举\n  configurable: true   // 是否可删除/修改描述符\n})\n\n// 读取属性描述符\nvar descriptor = Object.getOwnPropertyDescriptor(obj, "name")\nconsole.log(descriptor)\n// { value: "Alice", writable: true, enumerable: true, configurable: true }\n\n// 访问器属性描述符\nvar person = {\n  firstName: "John",\n  lastName: "Doe"\n}\n\nObject.defineProperty(person, "fullName", {\n  get: function() {\n    return this.firstName + " " + this.lastName\n  },\n  set: function(value) {\n    var parts = value.split(" ")\n    this.firstName = parts[0]\n    this.lastName = parts[1]\n  },\n  enumerable: true,\n  configurable: true\n})\n\nconsole.log(person.fullName)  // "John Doe"\nperson.fullName = "Jane Smith"\nconsole.log(person.firstName)  // "Jane"\n\n// 定义多个属性\nObject.defineProperties(obj, {\n  age: { value: 25, writable: true },\n  city: { value: "Beijing", writable: false }\n})\n\n// 冻结对象\nvar frozen = { value: 1 }\nObject.freeze(frozen)\n// frozen.value = 2  // 静默失败或报错（严格模式）\n\n// 密封对象\nvar sealed = { value: 1 }\nObject.seal(sealed)\n// delete sealed.value  // 静默失败\nsealed.value = 2  // 可修改\n\n// 阻止扩展\nvar nonExtensible = { value: 1 }\nObject.preventExtensions(nonExtensible)\n// nonExtensible.newProp = 2  // 静默失败</code></pre>',
    tags: ['defineProperty', '属性描述符', 'getter/setter']
  },
  'es5-getter-setter': {
    title: 'Getter / Setter',
    body: '<p class="lead">Getter 和 Setter 提供对对象属性的自定义访问方式。</p><pre><code>// 对象字面量中的 getter/setter\nvar person = {\n  firstName: "John",\n  lastName: "Doe",\n  \n  get fullName() {\n    return this.firstName + " " + this.lastName\n  },\n  \n  set fullName(value) {\n    var parts = value.split(" ")\n    this.firstName = parts[0]\n    this.lastName = parts[1]\n  }\n}\n\nconsole.log(person.fullName)  // "John Doe"\nperson.fullName = "Jane Smith"\nconsole.log(person.firstName)  // "Jane"\n\n// 使用 defineProperty 定义\nvar product = {\n  _price: 100\n}\n\nObject.defineProperty(product, "price", {\n  get: function() {\n    return this._price\n  },\n  set: function(value) {\n    if (value &lt; 0) {\n      throw new Error("Price cannot be negative")\n    }\n    this._price = value\n  }\n})\n\n// 计算属性\nvar circle = {\n  radius: 5,\n  get area() {\n    return Math.PI * this.radius * this.radius\n  },\n  get circumference() {\n    return 2 * Math.PI * this.radius\n  }\n}\n\nconsole.log(circle.area)  // 78.5398...\n\n// 验证器\nvar user = {\n  _age: 0,\n  get age() {\n    return this._age\n  },\n  set age(value) {\n    if (typeof value !== "number") {\n      throw new Error("Age must be a number")\n    }\n    if (value &lt; 0 || value > 150) {\n      throw new Error("Invalid age")\n    }\n    this._age = value\n  }\n}\n\nuser.age = 25\nconsole.log(user.age)  // 25\n// user.age = -5  // 错误</code></pre>',
    tags: ['getter', 'setter', '访问器']
  },
  'es5-object-methods': {
    title: 'Object 静态方法',
    body: '<p class="lead">ES5 新增了多个 Object 静态方法。</p><pre><code>var obj = { a: 1, b: 2, c: 3 }\n\n// Object.keys - 获取可枚举属性名数组\nvar keys = Object.keys(obj)\nconsole.log(keys)  // ["a", "b", "c"]\n\n// Object.getOwnPropertyNames - 获取所有属性名（包括不可枚举）\nvar allNames = Object.getOwnPropertyNames(obj)\nconsole.log(allNames)  // ["a", "b", "c"]\n\n// Object.getPrototypeOf - 获取原型\nvar proto = Object.getPrototypeOf(obj)\nconsole.log(proto === Object.prototype)  // true\n\n// Object.getOwnPropertyDescriptor - 获取属性描述符\nvar desc = Object.getOwnPropertyDescriptor(obj, "a")\nconsole.log(desc)  // { value:1, writable:true, enumerable:true, configurable:true }\n\n// Object.preventExtensions - 阻止扩展\nvar nonExt = { x: 1 }\nObject.preventExtensions(nonExt)\nconsole.log(Object.isExtensible(nonExt))  // false\n\n// Object.seal - 密封\nvar sealed = { y: 2 }\nObject.seal(sealed)\nconsole.log(Object.isSealed(sealed))  // true\n\n// Object.freeze - 冻结\nvar frozen = { z: 3 }\nObject.freeze(frozen)\nconsole.log(Object.isFrozen(frozen))  // true\n\n// 遍历对象属性\nfunction iterateProperties(obj) {\n  var keys = Object.keys(obj)\n  for (var i = 0; i &lt; keys.length; i++) {\n    console.log(keys[i] + ": " + obj[keys[i]])\n  }\n}</code></pre>',
    tags: ['Object.keys', 'Object.freeze', 'Object.seal']
  },
  // JSON 与日期
  'es5-json': {
    title: 'JSON 解析与序列化',
    body: '<p class="lead">ES5 原生支持 JSON 解析和序列化。</p><pre><code>var obj = {\n  name: "Alice",\n  age: 25,\n  city: "Beijing",\n  active: true,\n  scores: [85, 90, 88]\n}\n\n// 序列化\nvar jsonString = JSON.stringify(obj)\nconsole.log(jsonString)\n// {"name":"Alice","age":25,"city":"Beijing","active":true,"scores":[85,90,88]}\n\n// 格式化输出（缩进）\nvar pretty = JSON.stringify(obj, null, 2)\nconsole.log(pretty)\n\n// 解析\nvar parsed = JSON.parse(jsonString)\nconsole.log(parsed.name)  // "Alice"\n\n// 处理循环引用（会报错）\nvar circular = {}\ncircular.self = circular\n// JSON.stringify(circular)  // TypeError\n\n// reviver 函数（在解析过程中转换）\nvar jsonDate = \'{"date":"2024-01-15T00:00:00.000Z"}\'\nvar withDate = JSON.parse(jsonDate, function(key, value) {\n  if (key === "date") return new Date(value)\n  return value\n})\nconsole.log(withDate.date instanceof Date)  // true\n\n// replacer 函数（过滤或转换）\nvar data = {\n  name: "Alice",\n  password: "secret",\n  age: 25\n}\n\nvar filtered = JSON.stringify(data, function(key, value) {\n  if (key === "password") return undefined\n  return value\n})\nconsole.log(filtered)  // {"name":"Alice","age":25}\n\n// 深拷贝（局限性：无法复制函数、undefined、Symbol）\nvar original = { a: 1, b: { c: 2 } }\nvar copy = JSON.parse(JSON.stringify(original))\ncopy.b.c = 3\nconsole.log(original.b.c)  // 2（未受影响）</code></pre>',
    tags: ['JSON', 'stringify', 'parse']
  },
  'es5-date': {
    title: 'Date 增强',
    body: '<p class="lead">ES5 增强了 Date 对象的功能。</p><pre><code>// ISO 日期格式解析\nvar date1 = new Date("2024-01-15T10:30:00Z")\nconsole.log(date1.toISOString())  // "2024-01-15T10:30:00.000Z"\n\n// Date.now() - 当前时间戳（毫秒）\nvar now = Date.now()\nconsole.log(now)\n\n// 等价于\nvar now2 = new Date().getTime()\n\n// 日期比较\nvar d1 = new Date(2024, 0, 15)\nvar d2 = new Date(2024, 0, 20)\nconsole.log(d1 &lt; d2)  // true\n\n// 日期计算\nvar tomorrow = new Date()\ntomorrow.setDate(tomorrow.getDate() + 1)\n\n// 获取年/月/日\nvar d = new Date()\nvar year = d.getFullYear()\nvar month = d.getMonth()      // 0-11\nvar day = d.getDate()\nvar hours = d.getHours()\nvar minutes = d.getMinutes()\nvar seconds = d.getSeconds()\n\n// UTC 版本\nyear = d.getUTCFullYear()\n\n// 日期格式化\nfunction formatDate(date) {\n  return date.getFullYear() + "-" +\n    String(date.getMonth() + 1).padStart(2, "0") + "-" +\n    String(date.getDate()).padStart(2, "0")\n}\n\n// 性能测量\nvar start = Date.now()\n// 执行操作\nfor (var i = 0; i &lt; 1000000; i++) {}\nvar end = Date.now()\nconsole.log("耗时: " + (end - start) + "ms")</code></pre>',
    tags: ['Date', 'ISO格式', '时间戳']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 ECMAScript 5 规范获取更多信息。</p>',
        tags: ['ES5', 'JavaScript']
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

addLink('es5-intro', 'es5-var')
addLink('es5-var', 'es5-hoisting')
addLink('es5-hoisting', 'es5-scope')
addLink('es5-scope', 'es5-closure')
addLink('es5-function', 'es5-arguments')
addLink('es5-arguments', 'es5-call-apply')
addLink('es5-call-apply', 'es5-iife')
addLink('es5-array-foreach', 'es5-array-map')
addLink('es5-array-map', 'es5-array-filter')
addLink('es5-array-filter', 'es5-array-reduce')
addLink('es5-array-reduce', 'es5-array-some-every')
addLink('es5-array-some-every', 'es5-array-indexof')
addLink('es5-strict', 'es5-strict-rules')
addLink('es5-object-create', 'es5-define-property')
addLink('es5-define-property', 'es5-getter-setter')
addLink('es5-getter-setter', 'es5-object-methods')
addLink('es5-json', 'es5-date')

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