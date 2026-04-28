<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">JSON 知识库</h1>
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
      <!-- 左侧导航 -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>📋 <span class="gradient-text">JSON 完全指南</span></h2>
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
          <p>📋 轻量级数据交换格式</p>
          <p>✨ 点击节点双向联动 | Web 数据标准</p>
        </div>
      </aside>

      <!-- 中间内容区 -->
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

      <!-- 右侧图谱 -->
      <aside class="graph-panel">
        <div class="graph-header">
          <h3>🔗 JSON 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'JSON用户'
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

// ========== JSON 导航数据 ==========
const navSections = ref([
  { title: '📖 JSON 基础', items: [
      { id: 'json-intro', label: 'JSON 简介', hot: true },
      { id: 'json-syntax', label: 'JSON 语法', hot: true },
      { id: 'json-data-types', label: 'JSON 数据类型', hot: true },
      { id: 'json-vs-xml', label: 'JSON vs XML', hot: true }
    ]},
  { title: '🔧 JavaScript 中使用', items: [
      { id: 'json-parse', label: 'JSON.parse()', hot: true },
      { id: 'json-stringify', label: 'JSON.stringify()', hot: true },
      { id: 'reviver-replacer', label: 'Reviver & Replacer', hot: true },
      { id: 'json-serialization', label: '序列化注意事项', hot: true }
    ]},
  { title: '📁 JSON Schema', items: [
      { id: 'json-schema-intro', label: 'Schema 简介', hot: true },
      { id: 'json-schema-validation', label: '数据验证', hot: true },
      { id: 'json-schema-types', label: '类型系统', hot: true }
    ]},
  { title: '🌐 JSON 在 Web 中', items: [
      { id: 'json-api', label: 'JSON API', hot: true },
      { id: 'jsonp', label: 'JSONP 跨域', hot: true },
      { id: 'json-localstorage', label: 'JSON 与存储', hot: true },
      { id: 'json-config', label: '配置文件', hot: true }
    ]},
  { title: '🛠️ 工具与生态', items: [
      { id: 'json-formatter', label: '格式化工具', hot: true },
      { id: 'json-validator', label: '验证器', hot: true },
      { id: 'json-path', label: 'JSONPath 查询', hot: true },
      { id: 'json-diff', label: 'JSON Diff' }
    ]},
  { title: '⚡ 高级特性', items: [
      { id: 'json-streaming', label: '流式解析', hot: true },
      { id: 'json-comments', label: 'JSON5 / 注释支持', hot: true },
      { id: 'json-binary', label: '二进制 JSON', hot: true },
      { id: 'json-ld', label: 'JSON-LD 语义网' }
    ]}
])

const selectedId = ref('json-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== JSON 内容映射表 ==========
const contentMap = {
  'json-intro': {
    title: 'JSON 简介',
    body: '<p class="lead">JSON（JavaScript Object Notation）是一种轻量级的数据交换格式，易于人阅读和编写，也易于机器解析和生成。</p><h3>核心特点</h3><ul><li><strong>轻量级</strong>：相比 XML 更简洁</li><li><strong>语言独立</strong>：虽然源于 JavaScript，但几乎所有语言都支持</li><li><strong>自描述</strong>：结构清晰，易于理解</li><li><strong>易于解析</strong>：原生支持 fast parsing</li></ul><div class="note">💡 JSON 由 Douglas Crockford 于 2001 年推广，现已成为 Web 数据交换的事实标准。</div>',
    tags: ['数据交换', '轻量级', 'JSON']
  },
  'json-syntax': {
    title: 'JSON 语法',
    body: '<p class="lead">JSON 语法是 JavaScript 对象语法的子集，由键值对和有序列表组成。</p><pre><code>{\n  "name": "John Doe",\n  "age": 30,\n  "isStudent": false,\n  "address": {\n    "street": "123 Main St",\n    "city": "New York",\n    "zipCode": "10001"\n  },\n  "phoneNumbers": [\n    "555-1234",\n    "555-5678"\n  ],\n  "email": null\n}</code></pre><h3>语法规则</h3><ul><li>数据以键值对形式存在</li><li>键必须使用双引号包裹</li><li>键值对之间用逗号分隔</li><li>对象用花括号 {} 包裹</li><li>数组用方括号 [] 包裹</li><li>不允许尾随逗号</li><li>不支持注释</li></ul>',
    tags: ['语法', '对象', '数组']
  },
  'json-data-types': {
    title: 'JSON 数据类型',
    body: '<p class="lead">JSON 支持 6 种基本数据类型。</p><pre><code>// 字符串（必须双引号）\n"name": "Hello World"\n\n// 数字（整数或浮点数）\n"age": 25\n"price": 19.99\n"negative": -10\n"exp": 2.5e5\n\n// 布尔值\n"isActive": true\n"isDeleted": false\n\n// null\n"middleName": null\n\n// 对象\n"user": { "id": 1, "name": "Alice" }\n\n// 数组\n"tags": ["json", "data", "format"]\n\n// 不支持的数据类型\n// - undefined\n// - 函数\n// - Date 对象（需转为字符串）\n// - RegExp\n// - NaN / Infinity</code></pre>',
    tags: ['数据类型', '字符串', '数字', '布尔']
  },
  'json-vs-xml': {
    title: 'JSON vs XML',
    body: '<p class="lead">JSON 和 XML 都是数据交换格式，但各有特点。</p><table class="mdn-table"><thead><tr><th>特性</th><th>JSON</th><th>XML</th></tr></thead><tbody><tr><td>可读性</td><td>高</td><td>中等</td></tr><tr><td>解析速度</td><td>快</td><td>慢</td></tr><tr><td>数据体积</td><td>小</td><td>大</td></tr><tr><td>数据类型</td><td>原生支持</td><td>都是文本</td></tr><tr><td>数组支持</td><td>原生</td><td>需自定义</td></tr><tr><td>注释</td><td>不支持</td><td>支持</td></tr><tr><td>命名空间</td><td>不支持</td><td>支持</td></tr></tbody></table><pre><code>&lt;!-- XML 示例 --&gt;\n&lt;person&gt;\n  &lt;name&gt;John&lt;/name&gt;\n  &lt;age&gt;30&lt;/age&gt;\n&lt;/person&gt;\n\n// JSON 示例\n{\n  "name": "John",\n  "age": 30\n}</code></pre><div class="note">🏆 对于 Web API，JSON 已成为首选格式，但 XML 在某些领域（如 SOAP、Office 文档）仍有应用。</div>',
    tags: ['XML', '对比', '数据交换']
  },
  'json-parse': {
    title: 'JSON.parse()',
    body: '<p class="lead">JSON.parse() 将 JSON 字符串解析为 JavaScript 对象或值。</p><pre><code>// 基本用法\nconst jsonString = \'{"name":"Alice","age":25}\'\nconst obj = JSON.parse(jsonString)\nconsole.log(obj.name)  // "Alice"\nconsole.log(obj.age)   // 25\n\n// 解析数组\nconst jsonArray = \'["apple","banana","orange"]\'\nconst arr = JSON.parse(jsonArray)\nconsole.log(arr[1])  // "banana"\n\n// 处理数字\nconst jsonNumber = \'123.45\'\nconst num = JSON.parse(jsonNumber)  // 123.45\n\n// 处理布尔值\nconst jsonBool = \'true\'\nconst bool = JSON.parse(jsonBool)  // true\n\n// 处理 null\nconst jsonNull = \'null\'\nconst n = JSON.parse(jsonNull)  // null\n\n// 错误处理\ntry {\n  const invalid = JSON.parse(\'{invalid json}\')\n} catch (error) {\n  console.error(\'JSON 解析错误:\', error.message)\n}</code></pre>',
    tags: ['JSON.parse', '解析', '反序列化']
  },
  'json-stringify': {
    title: 'JSON.stringify()',
    body: '<p class="lead">JSON.stringify() 将 JavaScript 值转换为 JSON 字符串。</p><pre><code>// 基本用法\nconst obj = { name: "Alice", age: 25 }\nconst jsonString = JSON.stringify(obj)\nconsole.log(jsonString)  // \'{"name":"Alice","age":25}\'\n\n// 处理数组\nconst arr = ["apple", "banana", "orange"]\nJSON.stringify(arr)  // \'["apple","banana","orange"]\'\n\n// 处理嵌套对象\nconst nested = {\n  user: { name: "Bob", details: { age: 30 } }\n}\nJSON.stringify(nested)  // \'{"user":{"name":"Bob","details":{"age":30}}}\'\n\n// 美化输出（缩进）\nJSON.stringify(obj, null, 2)\n// {\n//   "name": "Alice",\n//   "age": 25\n// }\n\n// 控制小数位数\nconst num = 123.456789\nJSON.stringify(num)  // "123.456789"\n\n// 特殊值处理\nJSON.stringify(undefined)  // undefined\nJSON.stringify(NaN)        // "null"\nJSON.stringify(Infinity)   // "null"\nJSON.stringify(function(){}) // undefined</code></pre>',
    tags: ['JSON.stringify', '序列化', '转换']
  },
  'reviver-replacer': {
    title: 'Reviver & Replacer',
    body: '<p class="lead">JSON.parse() 的 reviver 参数和 JSON.stringify() 的 replacer 参数提供自定义转换能力。</p><pre><code>// reviver - 在解析过程中转换值\nconst json = \'{"date":"2024-01-15","value":100}\'\nconst obj = JSON.parse(json, (key, value) =&gt; {\n  if (key === "date") {\n    return new Date(value)\n  }\n  return value\n})\nconsole.log(obj.date instanceof Date)  // true\n\n// replacer - 过滤或转换值\nconst data = {\n  name: "Alice",\n  password: "secret",\n  age: 25\n}\n\n// 数组形式 - 只包含指定属性\nJSON.stringify(data, ["name", "age"])\n// \'{"name":"Alice","age":25}\'\n\n// 函数形式 - 自定义转换\nJSON.stringify(data, (key, value) =&gt; {\n  if (key === "password") {\n    return undefined  // 排除密码\n  }\n  return value\n})\n// \'{"name":"Alice","age":25}\'\n\n// 格式化输出\nJSON.stringify(data, null, "  ")  // 2空格缩进\nJSON.stringify(data, null, "\\t")  // Tab缩进</code></pre>',
    tags: ['reviver', 'replacer', '自定义转换']
  },
  'json-serialization': {
    title: '序列化注意事项',
    body: '<p class="lead">JSON.stringify() 在处理特殊值时的注意事项。</p><pre><code>// toJSON 方法自定义序列化\nconst user = {\n  name: "Alice",\n  birthDate: new Date(1990, 0, 1),\n  toJSON() {\n    return {\n      name: this.name,\n      birthYear: this.birthDate.getFullYear()\n    }\n  }\n}\nJSON.stringify(user)\n// \'{"name":"Alice","birthYear":1990}\'\n\n// 循环引用会报错\nconst obj1 = {}\nconst obj2 = { ref: obj1 }\nobj1.ref = obj2\n// JSON.stringify(obj1)  // TypeError\n\n// 解决方案：使用第三方库或自定义 replacer\n\n// BigInt 不支持\n// JSON.stringify({ big: 123n })  // TypeError\n\n// Symbol 作为键会被忽略\nconst symObj = { [Symbol("key")]: "value", normal: "ok" }\nJSON.stringify(symObj)  // \'{"normal":"ok"}\'\n\n// 深拷贝（简单对象）\nconst deepCopy = JSON.parse(JSON.stringify(original))</code></pre>',
    tags: ['toJSON', '循环引用', '深拷贝']
  },
  'json-schema-intro': {
    title: 'JSON Schema 简介',
    body: '<p class="lead">JSON Schema 用于描述和验证 JSON 数据的结构。</p><pre><code>// Schema 示例\n{\n  "$schema": "https://json-schema.org/draft/2020-12/schema",\n  "title": "User",\n  "type": "object",\n  "properties": {\n    "id": { "type": "integer" },\n    "name": { "type": "string" },\n    "email": { "type": "string", "format": "email" },\n    "age": { "type": "integer", "minimum": 0, "maximum": 150 }\n  },\n  "required": ["id", "name"],\n  "additionalProperties": false\n}\n\n// 验证数据\nconst validator = new Ajv()  // 需要安装 ajv 库\nconst validate = validator.compile(schema)\nconst isValid = validate(data)</code></pre>',
    tags: ['JSON Schema', '验证', '数据结构']
  },
  'json-schema-validation': {
    title: '数据验证',
    body: '<p class="lead">JSON Schema 提供丰富的验证关键字。</p><pre><code>// 类型验证\n{ "type": "string" }\n{ "type": "number" }\n{ "type": "integer" }\n{ "type": "boolean" }\n{ "type": "array" }\n{ "type": "object" }\n{ "type": "null" }\n\n// 值约束\n{ "minimum": 0 }\n{ "maximum": 100 }\n{ "minLength": 3 }\n{ "maxLength": 20 }\n{ "pattern": "^[a-z]+$" }\n\n// 数组约束\n{\n  "type": "array",\n  "minItems": 1,\n  "maxItems": 10,\n  "uniqueItems": true,\n  "items": { "type": "string" }\n}\n\n// 枚举值\n{ "enum": ["red", "green", "blue"] }\n\n// 组合验证\n{\n  "anyOf": [\n    { "type": "string" },\n    { "type": "null" }\n  ]\n}</code></pre>',
    tags: ['验证', '约束', '关键字']
  },
  'json-schema-types': {
    title: '类型系统',
    body: '<p class="lead">JSON Schema 的类型系统和组合验证。</p><pre><code>// 对象属性验证\n{\n  "type": "object",\n  "properties": {\n    "name": { "type": "string" },\n    "age": { "type": "integer" }\n  },\n  "required": ["name"],\n  "additionalProperties": false,\n  "patternProperties": {\n    "^x_": { "type": "string" }\n  }\n}\n\n// 条件验证\n{\n  "if": {\n    "properties": { "isMember": { "const": true } }\n  },\n  "then": {\n    "required": ["memberId"]\n  }\n}\n\n// 嵌套 Schema\n{\n  "definitions": {\n    "address": {\n      "type": "object",\n      "properties": {\n        "street": { "type": "string" },\n        "city": { "type": "string" }\n      }\n    }\n  },\n  "$ref": "#/definitions/address"\n}</code></pre>',
    tags: ['类型系统', '条件验证', '引用']
  },
  'json-api': {
    title: 'JSON API',
    body: '<p class="lead">JSON API 规范定义了构建 Web API 的最佳实践。</p><pre><code>// JSON API 响应格式\n{\n  "data": {\n    "type": "articles",\n    "id": "1",\n    "attributes": {\n      "title": "JSON API 介绍",\n      "content": "内容...",\n      "createdAt": "2024-01-15T10:00:00Z"\n    },\n    "relationships": {\n      "author": {\n        "data": { "type": "users", "id": "42" }\n      }\n    }\n  },\n  "included": [\n    {\n      "type": "users",\n      "id": "42",\n      "attributes": {\n        "name": "John Doe",\n        "email": "john@example.com"\n      }\n    }\n  ],\n  "links": {\n    "self": "/articles/1"\n  }\n}\n\n// Fetch 请求示例\nfetch("/api/articles/1", {\n  headers: {\n    "Accept": "application/vnd.api+json"\n  }\n})</code></pre>',
    tags: ['JSON API', '规范', 'RESTful']
  },
  jsonp: {
    title: 'JSONP 跨域',
    body: '<p class="lead">JSONP（JSON with Padding）是一种解决跨域请求的古老方案。</p><pre><code>// 前端 JSONP 实现\nfunction jsonp(url, callbackName, callback) {\n  window[callbackName] = callback\n  const script = document.createElement("script")\n  script.src = `${url}?callback=${callbackName}`\n  document.body.appendChild(script)\n}\n\n// 使用示例\njsonp("https://api.example.com/data", "handleResponse", (data) => {\n  console.log("收到数据:", data)\n})\n\n// 服务端响应（返回函数调用）\nhandleResponse({\n  "name": "John",\n  "age": 30\n});\n\n// 现代方案：CORS\n// 推荐使用 CORS 替代 JSONP\nfetch(url, { mode: "cors" })</code></pre><div class="note">⚠️ JSONP 只支持 GET 请求，且存在安全风险，推荐使用 CORS。</div>',
    tags: ['JSONP', '跨域', 'CORS']
  },
  'json-localstorage': {
    title: 'JSON 与存储',
    body: '<p class="lead">JSON 配合 Web Storage 实现复杂数据存储。</p><pre><code>// 存储对象到 localStorage\nconst user = {\n  id: 1,\n  name: "Alice",\n  preferences: {\n    theme: "dark",\n    language: "zh-CN"\n  }\n}\nlocalStorage.setItem("user", JSON.stringify(user))\n\n// 读取并解析\nconst storedUser = JSON.parse(localStorage.getItem("user"))\nconsole.log(storedUser.preferences.theme)\n\n// 存储数组\nconst todos = [\n  { id: 1, text: "学习 JSON", completed: false },\n  { id: 2, text: "实践存储", completed: true }\n]\nlocalStorage.setItem("todos", JSON.stringify(todos))\n\n// 更新数组\nconst todosData = JSON.parse(localStorage.getItem("todos"))\ntodosData.push({ id: 3, text: "新任务", completed: false })\nlocalStorage.setItem("todos", JSON.stringify(todosData))</code></pre>',
    tags: ['localStorage', '存储', '持久化']
  },
  'json-config': {
    title: '配置文件',
    body: '<p class="lead">JSON 广泛应用于配置文件（package.json、tsconfig.json 等）。</p><pre><code>// package.json 示例\n{\n  "name": "my-project",\n  "version": "1.0.0",\n  "description": "项目描述",\n  "main": "index.js",\n  "scripts": {\n    "start": "node index.js",\n    "dev": "nodemon index.js",\n    "test": "jest"\n  },\n  "dependencies": {\n    "express": "^4.18.0",\n    "lodash": "^4.17.21"\n  },\n  "devDependencies": {\n    "jest": "^29.0.0",\n    "nodemon": "^3.0.0"\n  },\n  "engines": {\n    "node": ">=18.0.0"\n  }\n}\n\n// 读取配置文件\nconst config = require("./config.json")\n// 或使用 fs 模块\nimport fs from "fs"\nconst config = JSON.parse(fs.readFileSync("./config.json", "utf8"))</code></pre>',
    tags: ['配置文件', 'package.json', '配置管理']
  },
  'json-formatter': {
    title: '格式化工具',
    body: '<p class="lead">JSON 格式化工具帮助阅读和调试 JSON 数据。</p><pre><code>// 在线工具\n// - JSONLint (jsonlint.com)\n// - JSON Formatter (jsonformatter.org)\n// - JSON Editor Online (jsoneditoronline.org)\n\n// VS Code 插件\n// - Prettier - Code formatter\n// - JSON Tools\n// - JSON Crack\n\n// 命令行工具\n# 使用 jq 格式化\ncat data.json | jq \'.\'\n\n# 使用 python 格式化\npython -m json.tool data.json\n\n# 使用 node 格式化\nnode -e "console.log(JSON.stringify(JSON.parse(process.argv[1]), null, 2))" \'{"a":1,"b":2}\'\n\n// 代码中格式化\nfunction formatJSON(jsonString) {\n  try {\n    const obj = JSON.parse(jsonString)\n    return JSON.stringify(obj, null, 2)\n  } catch (e) {\n    return "无效 JSON"\n  }\n}</code></pre>',
    tags: ['格式化', '工具', '调试']
  },
  'json-validator': {
    title: '验证器',
    body: '<p class="lead">JSON 验证工具确保数据格式正确。</p><pre><code>// 在线验证器\n// - JSONLint - 语法验证\n// - JSON Schema Validator - 结构验证\n\n// 代码验证\nfunction isValidJSON(str) {\n  try {\n    JSON.parse(str)\n    return true\n  } catch (e) {\n    return false\n  }\n}\n\n// 验证并获取错误位置\nfunction validateJSONWithError(jsonString) {\n  try {\n    JSON.parse(jsonString)\n    return { valid: true }\n  } catch (error) {\n    const match = error.message.match(/position (\\d+)/)\n    const position = match ? parseInt(match[1]) : -1\n    return {\n      valid: false,\n      message: error.message,\n      position\n    }\n  }\n}\n\n// Schema 验证（使用 ajv）\nimport Ajv from "ajv"\nconst ajv = new Ajv()\nconst validate = ajv.compile(schema)\nif (validate(data)) {\n  console.log("验证通过")\n} else {\n  console.log("验证失败:", validate.errors)\n}</code></pre>',
    tags: ['验证', 'JSONLint', '语法检查']
  },
  'json-path': {
    title: 'JSONPath 查询',
    body: '<p class="lead">JSONPath 类似 XPath，用于查询 JSON 数据。</p><pre><code>// JSONPath 语法示例\nconst data = {\n  "store": {\n    "book": [\n      { "title": "Book 1", "price": 8.95 },\n      { "title": "Book 2", "price": 12.99 },\n      { "title": "Book 3", "price": 9.99 }\n    ],\n    "bicycle": { "color": "red", "price": 19.95 }\n  }\n}\n\n// 查询表达式\n$.store.book[*].title    // 所有书的标题\n$.store..price            // 所有价格\n$.store.book[0]           // 第一本书\n$.store.book[?(@.price &lt; 10)]  // 价格低于10的书\n\n// 使用 jsonpath 库\nimport jp from "jsonpath"\nconst titles = jp.query(data, "$.store.book[*].title")\nconst cheapBooks = jp.query(data, "$.store.book[?(@.price &lt; 10)]")</code></pre>',
    tags: ['JSONPath', '查询', 'XPath']
  },
  'json-diff': {
    title: 'JSON Diff',
    body: '<p class="lead">比较两个 JSON 对象的差异。</p><pre><code>// 简单递归比较\nfunction deepDiff(obj1, obj2, path = "") {\n  const differences = []\n  \n  const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)])\n  \n  for (const key of allKeys) {\n    const newPath = path ? `${path}.${key}` : key\n    const val1 = obj1[key]\n    const val2 = obj2[key]\n    \n    if (typeof val1 === "object" && typeof val2 === "object") {\n      differences.push(...deepDiff(val1, val2, newPath))\n    } else if (val1 !== val2) {\n      differences.push({\n        path: newPath,\n        oldValue: val1,\n        newValue: val2\n      })\n    }\n  }\n  return differences\n}\n\n// 使用 diff 库\nimport diff from "deep-diff"\nconst differences = diff(obj1, obj2)\nconsole.log(differences)\n// 输出: { kind: "E", path: ["age"], lhs: 25, rhs: 26 }</code></pre>',
    tags: ['diff', '比较', '差异']
  },
  'json-streaming': {
    title: '流式解析',
    body: '<p class="lead">流式解析大 JSON 文件，避免内存溢出。</p><pre><code>// Node.js 流式解析\nimport JSONStream from "JSONStream"\nimport fs from "fs"\n\nconst parser = JSONStream.parse("*")\nconst stream = fs.createReadStream("large-file.json")\n\nstream.pipe(parser)\nparser.on("data", (data) => {\n  console.log("处理数据块:", data)\n})\n\nparser.on("end", () => {\n  console.log("解析完成")\n})\n\n// 使用 oboe.js（浏览器）\nimport oboe from "oboe"\noboe("/api/large-data")\n  .node("items.*", (item) => {\n    console.log("处理项目:", item)\n    return oboe.drop  // 释放内存\n  })\n  .done(() => console.log("完成"))\n\n// NDJSON（每行一个 JSON）\n{\"id\":1,\"name\":\"Item1\"}\n{\"id\":2,\"name\":\"Item2\"}\n{\"id\":3,\"name\":\"Item3\"}</code></pre>',
    tags: ['流式解析', '大文件', 'NDJSON']
  },
  'json-comments': {
    title: 'JSON5 / 注释支持',
    body: '<p class="lead">JSON5 是 JSON 的超集，支持注释、尾随逗号等特性。</p><pre><code>// JSON5 示例\n{\n  // 这是单行注释\n  /* 这是多行注释 */\n  name: "Alice",  // 键可以不用引号\n  age: 25,\n  tags: ["json", "comment"],  // 允许尾随逗号\n  hex: 0xFF,  // 十六进制\n  inf: Infinity,\n  nan: NaN,\n}\n\n// 使用 JSON5\nimport JSON5 from "json5"\nconst config = JSON5.parse(fs.readFileSync("config.json5", "utf8"))\n\n// 常见配置文件使用注释\n// .eslintrc.json 支持注释（需配置）\n// tsconfig.json 不支持注释\n// 推荐使用 .json5 或 .config.js 格式</code></pre>',
    tags: ['JSON5', '注释', '超集']
  },
  'json-binary': {
    title: '二进制 JSON',
    body: '<p class="lead">二进制 JSON 格式（BSON、MessagePack、CBOR）用于高性能场景。</p><pre><code>// BSON（MongoDB 使用）\n// 支持更多数据类型：Date、Binary、ObjectId 等\n\n// MessagePack 示例\nimport msgpack from "msgpack-lite"\nconst data = { name: "Alice", age: 25 }\nconst binary = msgpack.encode(data)\nconst decoded = msgpack.decode(binary)\n\n// CBOR（Concise Binary Object Representation）\nimport cbor from "cbor"\nconst encoded = cbor.encode(data)\nconst decoded = cbor.decode(encoded)\n\n// 性能对比\n// JSON: 易读但体积大，解析慢\n// BSON: 体积略大，支持更多类型\n// MessagePack: 体积小，解析快\n// CBOR: IETF 标准，适合 IoT\n\n// 选择建议\n// - API 交互: JSON\n// - 数据库存储: BSON (MongoDB)\n// - 高性能 RPC: MessagePack\n// - 物联网: CBOR</code></pre>',
    tags: ['BSON', 'MessagePack', 'CBOR', '二进制']
  },
  'json-ld': {
    title: 'JSON-LD 语义网',
    body: '<p class="lead">JSON-LD（JSON for Linking Data）用于结构化数据标记。</p><pre><code>// JSON-LD 示例\n{\n  "@context": {\n    "name": "https://schema.org/name",\n    "image": "https://schema.org/image",\n    "Person": "https://schema.org/Person"\n  },\n  "@type": "Person",\n  "name": "John Doe",\n  "image": "https://example.com/photo.jpg"\n}\n\n// SEO 应用（Schema.org）\n&lt;script type="application/ld+json"&gt;\n{\n  "@context": "https://schema.org",\n  "@type": "Article",\n  "headline": "文章标题",\n  "author": {\n    "@type": "Person",\n    "name": "作者名"\n  },\n  "datePublished": "2024-01-15",\n  "description": "文章描述"\n}\n&lt;/script&gt;\n\n// 搜索引擎会使用 JSON-LD 数据生成丰富摘要</code></pre>',
    tags: ['JSON-LD', '语义网', 'Schema.org']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 JSON 官方文档获取更多信息。</p>',
        tags: ['JSON', '数据格式']
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

addLink('json-intro', 'json-syntax')
addLink('json-syntax', 'json-data-types')
addLink('json-intro', 'json-vs-xml')
addLink('json-parse', 'json-stringify')
addLink('json-parse', 'reviver-replacer')
addLink('json-stringify', 'json-serialization')
addLink('json-schema-intro', 'json-schema-validation')
addLink('json-schema-validation', 'json-schema-types')
addLink('json-api', 'jsonp')
addLink('json-localstorage', 'json-config')
addLink('json-formatter', 'json-validator')
addLink('json-validator', 'json-path')
addLink('json-path', 'json-diff')
addLink('json-streaming', 'json-comments')
addLink('json-comments', 'json-binary')
addLink('json-binary', 'json-ld')

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