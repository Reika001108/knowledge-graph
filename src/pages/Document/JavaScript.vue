<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏 -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">JavaScript 知识库</h1>
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
      <!-- 左侧导航（锚点链接） -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>📘 <span class="gradient-text">JavaScript 文档</span></h2>
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
              <span v-if="item.hot" class="hot-badge">HOT</span>
            </a>
          </div>
        </div>

        <div class="sidebar-footer">
          <p>🔖 基于 ECMAScript 2024 标准</p>
          <p>✨ 点击节点可双向联动</p>
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
                <span class="tag-label">🔗 关联知识点</span>
                <div class="tag-list">
                  <span class="tag" v-for="tag in contentMap[item.id].tags" :key="tag">{{ tag }}</span>
                </div>
              </div>
            </div>
            <div v-else class="content-card placeholder">
              <h2>{{ item.label }} 的详细内容正在整理中...</h2>
            </div>
          </div>
        </div>
      </section>

      <!-- 右侧图谱 -->
      <aside class="graph-panel">
        <div class="graph-header">
          <h3>🔗 知识关系图 <span class="graph-badge">ECharts</span></h3>
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

  // ---------- 用户及主题相关 ----------
  const showDropdown = ref(false);
  const avatarWrapper = ref(null);
  const userInfo = ref(null);
  const currentTime = ref(new Date().toLocaleTimeString());
  const isDark = ref(false);

  const displayName = computed(() => {
    if (!userInfo.value) return '';
    return userInfo.value.username || userInfo.value.email?.split('@')[0] || '用户';
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

  const goToProfile = () => alert('跳转到个人中心');
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user_info');
    showDropdown.value = false;
    window.location.href = 'http://localhost:5173/';
  };

  // ========== 导航数据（JavaScript 知识体系）==========
  const navSections = ref([
    { title: '📘 语言基础', items: [
        { id: 'js_intro', label: 'JavaScript 简介' },
        { id: 'variables', label: '变量声明 (var, let, const)' },
        { id: 'data_types', label: '数据类型 & typeof' },
        { id: 'type_conversion', label: '类型转换' },
        { id: 'operators', label: '运算符' },
    ]},
    { title: '⚙️ 流程控制', items: [
        { id: 'conditionals', label: '条件语句 (if/else, switch)' },
        { id: 'loops', label: '循环 (for, while, do...while)' },
        { id: 'break_continue', label: 'break / continue' },
    ]},
    { title: '🧩 函数与作用域', items: [
        { id: 'functions', label: '函数定义 & 表达式' },
        { id: 'arrow_func', label: '箭头函数' },
        { id: 'scope_closures', label: '作用域 & 闭包' },
        { id: 'parameters', label: '参数 (默认/剩余/解构)' },
    ]},
    { title: '📦 对象与原型', items: [
        { id: 'objects', label: '对象字面量 & 属性' },
        { id: 'prototypes', label: '原型与继承' },
        { id: 'classes', label: 'ES6 Class' },
        { id: 'this_keyword', label: 'this 绑定' },
    ]},
    { title: '📊 数组与集合', items: [
        { id: 'arrays', label: '数组方法 (map/filter/reduce)' },
        { id: 'array_iter', label: '迭代方法 (forEach, some...)' },
        { id: 'set_map', label: 'Set & Map' },
    ]},
    { title: '🔄 异步编程', items: [
        { id: 'callbacks', label: '回调函数' },
        { id: 'promises', label: 'Promise' },
        { id: 'async_await', label: 'Async/Await' },
        { id: 'event_loop', label: '事件循环' },
    ]},
    { title: '🌐 浏览器API', items: [
        { id: 'dom_manip', label: 'DOM 操作' },
        { id: 'events', label: '事件处理' },
        { id: 'storage', label: 'localStorage/sessionStorage' },
        { id: 'fetch_api', label: 'Fetch API' },
    ]},
    { title: '🧰 现代特性', items: [
        { id: 'destructuring', label: '解构赋值' },
        { id: 'spread_rest', label: '展开/剩余运算符' },
        { id: 'modules', label: 'ES模块 (import/export)' },
        { id: 'optional_chaining', label: '可选链 & 空值合并' },
    ]},
  ]);

  const selectedId = ref('js_intro');

  // 扁平化所有知识点
  const allFlatItems = computed(() => {
    const flat = [];
    navSections.value.forEach(section => {
      section.items.forEach(item => {
        flat.push(item);
      });
    });
    return flat;
  });

  // ========== 内容映射表（JavaScript 详细文档）==========
  const contentMap = {
    // ----- 语言基础 -----
    js_intro: {
      title: 'JavaScript 简介',
      body: `<p class="lead">JavaScript 是一种轻量级、解释型或即时编译型的脚本语言，主要用于为网页添加交互行为。作为 Web 三大核心技术之一，与 HTML 和 CSS 协同工作。</p>
      <h3>历史与标准</h3>
      <p>由 Brendan Eich 在 1995 年创造，现基于 ECMAScript 标准演化。现代 JavaScript 支持模块化、异步编程、丰富的 API。</p>
      <pre><code>// 第一个JS程序
  console.log("Hello, JavaScript!");</code></pre>
      <div class="note">💡 提示：JavaScript 不仅可以运行在浏览器中，还可以通过 Node.js 运行在服务器端。</div>`,
      tags: ['历史', 'ECMAScript', '脚本语言']
    },
    variables: {
      title: '变量声明: var, let, const',
      body: `<p class="lead">变量用于存储数据值。ES6 引入 <code>let</code> 和 <code>const</code> 解决 <code>var</code> 的作用域问题。</p>
      <ul><li><code>var</code>：函数作用域，存在变量提升。</li><li><code>let</code>：块级作用域，不可重复声明。</li><li><code>const</code>：块级作用域，声明常量（引用不可变）。</li></ul>
      <pre><code>let name = "JS";  
  const PI = 3.1415;  
  var old = "obsolete";</code></pre>
      <div class="note">⚠️ 建议：优先使用 const，需要重新赋值时使用 let，避免使用 var。</div>`,
      tags: ['变量', 'let', 'const', '作用域']
    },
    data_types: {
      title: '数据类型 & typeof',
      body: `<p class="lead">JavaScript 有 8 种基本数据类型: <strong>String, Number, BigInt, Boolean, undefined, null, Symbol, Object</strong>。</p>
      <pre><code>typeof "hello";   // "string"
  typeof 42;        // "number"
  typeof true;      // "boolean"
  typeof undefined; // "undefined"
  typeof null;      // "object" (历史遗留)
  typeof Symbol();  // "symbol"</code></pre>`,
      tags: ['类型', 'typeof', '动态类型']
    },
    type_conversion: {
      title: '类型转换',
      body: `<p class="lead">显式或隐式地将值从一种类型转换为另一种。</p>
      <pre><code>// 显式转换
  Number("123");   // 123
  String(456);     // "456"
  Boolean(0);      // false

  // 隐式转换 (常见坑)
  "5" + 3;   // "53"
  "5" - 3;   // 2
  !!"hello"; // true</code></pre>`,
      tags: ['转换', '强制类型']
    },
    operators: {
      title: '运算符',
      body: `<p class="lead">算术、赋值、比较、逻辑、位运算符等。</p>
      <pre><code>let x = 10, y = 3;
  console.log(x + y, x % y);  // 13, 1
  console.log(x > y && y > 0); // true
  // 三元运算符
  let age = 20;
  let status = age >= 18 ? "成人" : "未成年";</code></pre>`,
      tags: ['运算符', '表达式']
    },
    // 流程控制
    conditionals: {
      title: '条件语句',
      body: `<p class="lead">根据条件执行代码块。</p>
      <pre><code>if (score >= 90) {
    grade = 'A';
  } else if (score >= 70) {
    grade = 'B';
  } else {
    grade = 'C';
  }

  switch(day) {
    case 1: console.log("周一"); break;
    case 2: console.log("周二"); break;
    default: console.log("其他");
  }</code></pre>`,
      tags: ['if', 'switch', '分支']
    },
    loops: {
      title: '循环',
      body: `<p class="lead">重复执行代码块: for, while, do...while。</p>
      <pre><code>for (let i = 0; i < 5; i++) { console.log(i); }
  let arr = [1,2,3];
  for (let val of arr) { console.log(val); }
  let i = 0;
  while (i < 3) { console.log(i); i++; }</code></pre>`,
      tags: ['for', 'while', '迭代']
    },
    break_continue: {
      title: 'break / continue',
      body: `<p class="lead">控制循环流程: <code>break</code> 终止循环，<code>continue</code> 跳过当前迭代。</p>
      <pre><code>for(let i=0;i<10;i++){
    if(i===5) break;    // 停止
    if(i%2===0) continue; // 跳过偶数
    console.log(i); // 1,3
  }</code></pre>`,
      tags: ['循环控制']
    },
    // 函数
    functions: {
      title: '函数定义与表达式',
      body: `<p class="lead">函数是一段可复用的代码块，支持参数和返回值。</p>
      <pre><code>// 函数声明
  function sum(a, b) { return a + b; }
  // 函数表达式
  const multiply = function(a, b) { return a * b; };
  // 立即执行函数(IIFE)
  (function(){ console.log("IIFE"); })();</code></pre>`,
      tags: ['函数', '声明']
    },
    arrow_func: {
      title: '箭头函数',
      body: `<p class="lead">简洁语法，不绑定自己的 <code>this</code>。</p>
      <pre><code>const add = (x, y) => x + y;
  const square = n => n * n;
  // 返回对象需括号包裹
  const getObj = id => ({ id: id, name: "demo" });</code></pre>`,
      tags: ['箭头函数', 'ES6']
    },
    scope_closures: {
      title: '作用域 & 闭包',
      body: `<p class="lead">作用域决定了变量的可访问性。闭包使得函数可以记住其词法作用域。</p>
      <pre><code>function outer() {
    let count = 0;
    return function inner() {
      count++;
      return count;
    };
  }
  const counter = outer();
  console.log(counter()); // 1
  console.log(counter()); // 2</code></pre>`,
      tags: ['闭包', '词法作用域']
    },
    parameters: {
      title: '参数高级特性',
      body: `<p class="lead">默认参数、剩余参数、解构参数。</p>
      <pre><code>function greet(name = "Guest") { return "Hi " + name; }
  function sumAll(...nums) { return nums.reduce((a,b)=>a+b,0); }
  function logUser({name, age}) { console.log(name, age); }</code></pre>`,
      tags: ['参数', '默认值', '剩余参数']
    },
    // 对象与原型
    objects: {
      title: '对象字面量 & 属性',
      body: `<p class="lead">对象是一组键值对的集合，可通过点语法或方括号访问。</p>
      <pre><code>const person = {
    name: "Alice",
    age: 25,
    greet() { console.log("Hello"); }
  };
  person.age = 26;
  console.log(person["name"]);</code></pre>`,
      tags: ['对象', '属性']
    },
    prototypes: {
      title: '原型与继承',
      body: `<p class="lead">JavaScript 基于原型链实现继承。</p>
      <pre><code>function Animal(name) { this.name = name; }
  Animal.prototype.speak = function() { console.log(this.name); };
  const dog = new Animal("Buddy");
  dog.speak();</code></pre>`,
      tags: ['原型', '继承']
    },
    classes: {
      title: 'ES6 Class',
      body: `<p class="lead">class 语法糖使面向对象更清晰。</p>
      <pre><code>class Rectangle {
    constructor(width, height) {
      this.width = width;
      this.height = height;
    }
    area() { return this.width * this.height; }
  }
  const rect = new Rectangle(10,5);
  console.log(rect.area()); // 50</code></pre>`,
      tags: ['class', 'OOP']
    },
    this_keyword: {
      title: 'this 绑定',
      body: `<p class="lead">this 的值取决于调用上下文。箭头函数不会绑定自己的this。</p>
      <pre><code>const obj = {
    name: "obj",
    regular: function() { console.log(this.name); },
    arrow: () => console.log(this.name)
  };
  obj.regular(); // "obj"
  obj.arrow();   // undefined (全局/外层)</code></pre>`,
      tags: ['this', '上下文']
    },
    // 数组与集合
    arrays: {
      title: '数组方法 (map/filter/reduce)',
      body: `<p class="lead">函数式编程核心方法。</p>
      <pre><code>const nums = [1,2,3,4];
  const doubled = nums.map(n => n*2);   // [2,4,6,8]
  const evens = nums.filter(n => n%2===0); // [2,4]
  const sum = nums.reduce((acc,cur)=> acc+cur, 0); // 10</code></pre>`,
      tags: ['map', 'filter', 'reduce', '高阶函数']
    },
    array_iter: {
      title: '迭代方法',
      body: `<p class="lead">forEach, every, some, find 等。</p>
      <pre><code>[1,2,3].forEach(v => console.log(v));
  const hasLarge = [5,8,12].some(v => v > 10); // true
  const found = [10,20,30].find(v => v > 15);  // 20</code></pre>`,
      tags: ['迭代', '遍历']
    },
    set_map: {
      title: 'Set & Map',
      body: `<p class="lead">Set 存储唯一值，Map 存储键值对（键可为任意类型）。</p>
      <pre><code>const set = new Set([1,2,2,3]); // {1,2,3}
  const map = new Map();
  map.set('key', 'value');
  map.get('key'); // 'value'</code></pre>`,
      tags: ['Set', 'Map', '集合']
    },
    // 异步
    callbacks: {
      title: '回调函数',
      body: `<p class="lead">作为参数传递给其他函数，在异步操作完成后执行。</p>
      <pre><code>function fetchData(callback) {
    setTimeout(() => { callback("data"); }, 1000);
  }
  fetchData((data) => console.log(data));</code></pre>`,
      tags: ['回调', '异步']
    },
    promises: {
      title: 'Promise',
      body: `<p class="lead">表示异步操作的最终完成或失败，支持链式调用。</p>
      <pre><code>const p = new Promise((resolve, reject) => {
    setTimeout(() => resolve("成功"), 500);
  });
  p.then(data => console.log(data)).catch(err => console.error(err));</code></pre>`,
      tags: ['Promise', '异步']
    },
    async_await: {
      title: 'Async/Await',
      body: `<p class="lead">基于 Promise 的语法糖，使异步代码像同步一样。</p>
      <pre><code>async function getData() {
    try {
      const response = await fetch('https://api.example.com');
      const json = await response.json();
      console.log(json);
    } catch(err) { console.error(err); }
  }</code></pre>`,
      tags: ['async', 'await', '异步']
    },
    event_loop: {
      title: '事件循环',
      body: `<p class="lead">JavaScript 的单线程非阻塞模型，通过任务队列和事件循环处理异步。</p>
      <pre><code>console.log("1");
  setTimeout(() => console.log("2"), 0);
  Promise.resolve().then(() => console.log("3"));
  console.log("4");
  // 输出顺序: 1,4,3,2 (微任务先于宏任务)</code></pre>`,
      tags: ['Event Loop', '微任务', '宏任务']
    },
    // 浏览器API
    dom_manip: {
      title: 'DOM 操作',
      body: `<p class="lead">通过 document 对象操作 HTML 元素。</p>
      <pre><code>const el = document.getElementById("app");
  el.textContent = "Hello";
  const newDiv = document.createElement("div");
  newDiv.className = "box";
  document.body.appendChild(newDiv);</code></pre>`,
      tags: ['DOM', '元素']
    },
    events: {
      title: '事件处理',
      body: `<p class="lead">监听用户交互，如 click, input 等。</p>
      <pre><code>const btn = document.querySelector("button");
  btn.addEventListener("click", (e) => {
    console.log("点击了", e.target);
  });</code></pre>`,
      tags: ['事件', '监听器']
    },
    storage: {
      title: 'localStorage / sessionStorage',
      body: `<p class="lead">Web 存储 API，持久化键值对数据。</p>
      <pre><code>localStorage.setItem("theme", "dark");
  const theme = localStorage.getItem("theme");
  sessionStorage.setItem("token", "abc123");</code></pre>`,
      tags: ['存储', 'localStorage']
    },
    fetch_api: {
      title: 'Fetch API',
      body: `<p class="lead">现代网络请求接口，基于 Promise。</p>
      <pre><code>fetch('https://jsonplaceholder.typicode.com/posts/1')
    .then(res => res.json())
    .then(data => console.log(data))
    .catch(err => console.error(err));</code></pre>`,
      tags: ['fetch', '网络请求']
    },
    // 现代特性
    destructuring: {
      title: '解构赋值',
      body: `<p class="lead">从数组或对象快速提取值。</p>
      <pre><code>const [a, b] = [10, 20];
  const {name, age} = {name: "Tom", age: 30};
  console.log(name); // Tom</code></pre>`,
      tags: ['解构', 'ES6']
    },
    spread_rest: {
      title: '展开/剩余运算符',
      body: `<p class="lead">... 用于展开数组/对象或收集剩余参数。</p>
      <pre><code>const arr = [1,2,3];
  const newArr = [...arr, 4];
  const obj = {x:1, y:2};
  const merged = {...obj, z:3};
  function log(...args) { console.log(args); }</code></pre>`,
      tags: ['spread', 'rest']
    },
    modules: {
      title: 'ES模块',
      body: `<p class="lead">使用 import/export 组织代码。</p>
      <pre><code>// math.js
  export const add = (a,b) => a+b;
  // main.js
  import { add } from './math.js';
  console.log(add(2,3));</code></pre>`,
      tags: ['模块化', 'import', 'export']
    },
    optional_chaining: {
      title: '可选链 & 空值合并',
      body: `<p class="lead">安全访问深层属性 (<code>?.</code>) 和默认值 (<code>??</code>)。</p>
      <pre><code>const user = { profile: { name: "John" } };
  console.log(user?.profile?.name);  // John
  console.log(user?.address?.city ?? "未知城市"); // 未知城市</code></pre>`,
      tags: ['可选链', '空值合并']
    }
  };

  // 为所有导航项补充默认内容（确保每个 id 都有内容）
  navSections.value.forEach(section => {
    section.items.forEach(item => {
      if (!contentMap[item.id]) {
        contentMap[item.id] = {
          title: item.label,
          body: `<p class="lead">这是关于 <strong>${item.label}</strong> 的详细介绍。请参考 MDN 文档。</p><pre><code>// ${item.id} 示例代码\nconsole.log("学习 ${item.label}");</code></pre>`,
          tags: ['JavaScript', '核心概念']
        };
      }
    });
  });

  // ========== 图谱数据 ==========
  const graphNodes = ref(
    navSections.value.flatMap(section =>
      section.items.map(item => ({
        id: item.id,
        name: item.label,
        category: navSections.value.indexOf(section),
      }))
    )
  );

  const graphLinks = ref([]);

  const addLink = (source, target) => {
    if (source && target && graphNodes.value.some(n => n.id === source) && graphNodes.value.some(n => n.id === target)) {
      graphLinks.value.push({ source, target });
    }
  };

  // 构建关系图谱
  addLink('js_intro', 'variables');
  addLink('variables', 'data_types');
  addLink('data_types', 'type_conversion');
  addLink('operators', 'conditionals');
  addLink('conditionals', 'loops');
  addLink('functions', 'arrow_func');
  addLink('functions', 'scope_closures');
  addLink('objects', 'prototypes');
  addLink('prototypes', 'classes');
  addLink('arrays', 'array_iter');
  addLink('callbacks', 'promises');
  addLink('promises', 'async_await');
  addLink('event_loop', 'promises');
  addLink('dom_manip', 'events');
  addLink('fetch_api', 'promises');
  addLink('destructuring', 'spread_rest');
  addLink('spread_rest', 'optional_chaining');
  addLink('scope_closures', 'this_keyword');
  addLink('parameters', 'destructuring');

  // 去重
  graphLinks.value = graphLinks.value.filter((link, index, self) =>
    index === self.findIndex(l => l.source === link.source && l.target === link.target)
  );

  const categories = ref(navSections.value.map(s => ({ name: s.title })));

  // ========== ECharts 初始化与控制 ==========
  const chartRef = ref(null);
  let chartInstance = ref(null);

  const initChart = () => {
    if (!chartRef.value) return;
    if (chartInstance.value) chartInstance.value.dispose();

    chartInstance.value = echarts.init(chartRef.value, isDark.value ? 'dark' : null);

    const option = {
      title: { show: false },
      tooltip: { show: true },
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
        lineStyle: { color: 'source', curveness: 0.3, width: 2 },
        force: { repulsion: 400, edgeLength: 120 },
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
          const targetElement = document.getElementById('content-' + nodeId);
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    });
  };

  const zoomIn = () => {
    if (!chartInstance.value) return;
    const option = chartInstance.value.getOption();
    option.series[0].zoom = (option.series[0].zoom || 1) * 1.2;
    chartInstance.value.setOption(option);
  };

  const zoomOut = () => {
    if (!chartInstance.value) return;
    const option = chartInstance.value.getOption();
    option.series[0].zoom = (option.series[0].zoom || 1) * 0.8;
    chartInstance.value.setOption(option);
  };

  const fitToView = () => {
    if (!chartInstance.value) return;
    chartInstance.value.dispatchAction({ type: 'restore' });
  };

  // ========== 滚动监听，更新左侧导航高亮 ==========
  const contentAreaRef = ref(null);
  let scrollHandler = null;

  const updateActiveOnScroll = () => {
    if (!contentAreaRef.value) return;
    const contentArea = contentAreaRef.value;
    const blocks = contentArea.querySelectorAll('.content-block');
    const scrollTop = contentArea.scrollTop;
    const areaHeight = contentArea.clientHeight;

    let bestBlock = null;
    let maxVisibleHeight = 0;

    blocks.forEach(block => {
      const rect = block.getBoundingClientRect();
      const areaRect = contentArea.getBoundingClientRect();
      const visibleTop = Math.max(rect.top, areaRect.top);
      const visibleBottom = Math.min(rect.bottom, areaRect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);

      if (visibleHeight > maxVisibleHeight) {
        maxVisibleHeight = visibleHeight;
        bestBlock = block;
      }
    });

    if (bestBlock) {
      const id = bestBlock.id.replace('content-', '');
      if (id !== selectedId.value) {
        selectedId.value = id;
      }
    }
  };

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
    if (timer) clearInterval(timer);
    document.removeEventListener('click', handleClickOutside);
    if (contentAreaRef.value && scrollHandler) {
      contentAreaRef.value.removeEventListener('scroll', scrollHandler);
    }
    window.removeEventListener('resize', () => {});
    if (chartInstance.value) {
      chartInstance.value.dispose();
      chartInstance.value = null;
    }
  });
</script>

<style scoped>
@import '../fontawesome-free-6.4.0-web/fontawesome-free-6.4.0-web/css/all.min.css';
  /* ===== 全局设计令牌 ===== */
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

  /* 顶栏样式 */
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

  /* 主内容区域 */
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
    backdrop-filter: none;
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

  .app-container.dark .content-header {
    border-bottom-color: rgba(139, 92, 246, 0.3);
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
  /* 全局表格样式 */
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