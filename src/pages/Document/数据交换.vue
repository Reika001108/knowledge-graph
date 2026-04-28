<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">数据交换知识库</h1>
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
          <h2>🔄 <span class="gradient-text">数据交换完全指南</span></h2>
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
          <p>🔄 数据交换格式 | 序列化与反序列化</p>
          <p>✨ 点击节点双向联动 | 选择最佳数据格式</p>
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
          <h3>🔗 数据交换知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || '数据开发者'
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

// ========== 数据交换导航数据 ==========
const navSections = ref([
  { title: '📖 数据交换概述', items: [
      { id: 'data-exchange-intro', label: '数据交换简介', hot: true },
      { id: 'data-serialization', label: '序列化与反序列化', hot: true },
      { id: 'format-comparison', label: '格式对比', hot: true }
    ]},
  { title: '📋 JSON', items: [
      { id: 'json-intro', label: 'JSON 简介', hot: true },
      { id: 'json-syntax', label: 'JSON 语法', hot: true },
      { id: 'json-schema', label: 'JSON Schema', hot: true },
      { id: 'json-parse-stringify', label: '解析与序列化', hot: true },
      { id: 'json-vs-xml', label: 'JSON vs XML', hot: true }
    ]},
  { title: '📄 XML', items: [
      { id: 'xml-intro', label: 'XML 简介', hot: true },
      { id: 'xml-syntax', label: 'XML 语法', hot: true },
      { id: 'xml-parsing', label: 'XML 解析', hot: true },
      { id: 'xml-schema', label: 'XML Schema', hot: true },
      { id: 'xpath', label: 'XPath 查询', hot: true }
    ]},
  { title: '⚡ 二进制格式', items: [
      { id: 'protobuf-intro', label: 'Protocol Buffers', hot: true },
      { id: 'msgpack-intro', label: 'MessagePack', hot: true },
      { id: 'bson-intro', label: 'BSON', hot: true },
      { id: 'cbor-intro', label: 'CBOR', hot: true },
      { id: 'avro-intro', label: 'Avro', hot: true }
    ]},
  { title: '🔧 其他格式', items: [
      { id: 'yaml-intro', label: 'YAML', hot: true },
      { id: 'toml-intro', label: 'TOML', hot: true },
      { id: 'csv-intro', label: 'CSV', hot: true },
      { id: 'form-urlencoded', label: 'URL 编码', hot: true }
    ]},
  { title: '🎯 应用场景', items: [
      { id: 'api-data', label: 'API 数据交换', hot: true },
      { id: 'config-files', label: '配置文件', hot: true },
      { id: 'database-storage', label: '数据库存储', hot: true },
      { id: 'message-queue', label: '消息队列', hot: true }
    ]}
])

const selectedId = ref('data-exchange-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== 数据交换内容映射表 ==========
const contentMap = {
  'data-exchange-intro': {
    title: '数据交换简介',
    body: '<p class="lead">数据交换是在不同系统、应用或组件之间传输和共享数据的过程，数据交换格式定义了数据的结构和编码方式。</p><h3>核心概念</h3><ul><li><strong>序列化</strong>：将内存中的数据结构转换为可传输的格式</li><li><strong>反序列化</strong>：将传输格式还原为内存中的数据结构</li><li><strong>格式</strong>：文本格式（JSON、XML、YAML）和二进制格式（Protobuf、MsgPack）</li><li><strong>互操作性</strong>：不同语言和平台间的数据交换能力</li></ul><div class="note">💡 选择合适的数据交换格式取决于性能要求、可读性、兼容性等因素。</div>',
    tags: ['数据交换', '序列化', '互操作性']
  },
  'data-serialization': {
    title: '序列化与反序列化',
    body: '<p class="lead">序列化是将对象转换为可存储或传输的格式，反序列化是逆过程。</p><pre><code>// JSON 序列化示例\nconst user = { name: "Alice", age: 25 }\nconst json = JSON.stringify(user)  // 序列化\nconst obj = JSON.parse(json)       // 反序列化\n\n// Protocol Buffers 示例\nconst message = User.encode(user)  // 序列化\nconst decoded = User.decode(message) // 反序列化\n\n// 序列化的作用\n// 1. 网络传输\n// 2. 持久化存储\n// 3. 进程间通信\n// 4. 跨语言交互</code></pre>',
    tags: ['序列化', '反序列化', '编码']
  },
  'format-comparison': {
    title: '格式对比',
    body: '<p class="lead">主流数据交换格式对比。</p><table class="mdn-table"><thead><tr><th>格式</th><th>类型</th><th>可读性</th><th>体积</th><th>速度</th><th>Schema</th></tr></thead><tbody><tr><td>JSON</th><td>文本</th><td>高</th><td>中</th><td>快</th><td>部分</th></tr><tr><td>XML</th><td>文本</th><td>中</th><td>大</th><td>慢</th><td>完整</th></tr><tr><td>YAML</th><td>文本</th><td>高</th><td>中</th><td>中</th><td>无</th></tr><tr><td>Protobuf</th><td>二进制</th><td>无</th><td>小</th><td>极快</th><td>完整</th></tr><tr><td>MessagePack</th><td>二进制</th><td>无</th><td>小</th><td>快</th><td>无</th></tr><tr><td>BSON</th><td>二进制</th><td>无</th><td>中</th><td>快</th><td>无</th></tr></tbody></table>',
    tags: ['对比', '选型', '性能']
  },
  'json-intro': {
    title: 'JSON 简介',
    body: '<p class="lead">JSON（JavaScript Object Notation）是一种轻量级的数据交换格式，易于人阅读和编写，也易于机器解析和生成。</p><h3>核心特点</h3><ul><li><strong>轻量级</strong>：语法简洁</li><li><strong>语言独立</strong>：几乎所有语言都支持</li><li><strong>易于解析</strong>：原生支持 JavaScript</li><li><strong>自描述</strong>：结构清晰</li></ul><div class="note">💡 JSON 是目前 Web API 最流行的数据交换格式。</div>',
    tags: ['JSON', '轻量级', 'Web标准']
  },
  'json-syntax': {
    title: 'JSON 语法',
    body: '<p class="lead">JSON 语法规则。</p><pre><code>{\n  "string": "Hello",\n  "number": 123.45,\n  "boolean": true,\n  "null": null,\n  "array": [1, 2, 3],\n  "object": {\n    "key": "value"\n  }\n}\n\n// 语法规则\n// 1. 键必须使用双引号\n// 2. 字符串使用双引号\n// 3. 不支持注释\n// 4. 不支持尾随逗号</code></pre>',
    tags: ['JSON语法', '数据类型', '规则']
  },
  'json-schema': {
    title: 'JSON Schema',
    body: '<p class="lead">JSON Schema 用于描述和验证 JSON 数据的结构。</p><pre><code>{\n  "$schema": "https://json-schema.org/draft/2020-12/schema",\n  "type": "object",\n  "properties": {\n    "name": { "type": "string" },\n    "age": { "type": "integer", "minimum": 0 },\n    "email": { "type": "string", "format": "email" }\n  },\n  "required": ["name", "email"]\n}</code></pre>',
    tags: ['JSON Schema', '验证', '结构']
  },
  'json-parse-stringify': {
    title: '解析与序列化',
    body: '<p class="lead">JSON 的解析和序列化方法。</p><pre><code>// 解析 JSON 字符串\nconst jsonString = \'{"name":"Alice","age":25}\'\nconst obj = JSON.parse(jsonString)\n\n// 序列化对象\nconst user = { name: "Bob", age: 30 }\nconst json = JSON.stringify(user)\n\n// 带参数序列化\nJSON.stringify(user, null, 2)  // 格式化输出\n\n// reviver 函数\nJSON.parse(jsonString, (key, value) => {\n  if (key === "date") return new Date(value)\n  return value\n})</code></pre>',
    tags: ['JSON.parse', 'JSON.stringify', '序列化']
  },
  'json-vs-xml': {
    title: 'JSON vs XML',
    body: '<p class="lead">JSON 和 XML 的对比。</p><pre><code>&lt;!-- XML 示例 --&gt;\n&lt;person&gt;\n  &lt;name&gt;Alice&lt;/name&gt;\n  &lt;age&gt;25&lt;/age&gt;\n&lt;/person&gt;\n\n// JSON 示例\n{\n  "name": "Alice",\n  "age": 25\n}\n\n// JSON 优势\n// 1. 更简洁\n// 2. 解析更快\n// 3. 数据体积更小</code></pre>',
    tags: ['JSON', 'XML', '对比']
  },
  'xml-intro': {
    title: 'XML 简介',
    body: '<p class="lead">XML（eXtensible Markup Language）是一种可扩展标记语言，用于描述和传输结构化数据。</p><h3>核心特点</h3><ul><li><strong>可扩展</strong>：自定义标签</li><li><strong>自描述</strong>：标签说明数据含义</li><li><strong>层次结构</strong>：树形结构</li><li><strong>Schema 支持</strong>：严格的数据验证</li></ul><div class="note">💡 XML 在 SOAP、Office 文档、配置文件等领域仍有广泛应用。</div>',
    tags: ['XML', '标记语言', '结构化数据']
  },
  'xml-syntax': {
    title: 'XML 语法',
    body: '<p class="lead">XML 语法规则。</p><pre><code>&lt;?xml version="1.0" encoding="UTF-8"?&gt;\n&lt;bookstore&gt;\n  &lt;book category="fiction"&gt;\n    &lt;title lang="en"&gt;Harry Potter&lt;/title&gt;\n    &lt;author&gt;J.K. Rowling&lt;/author&gt;\n    &lt;price&gt;29.99&lt;/price&gt;\n  &lt;/book&gt;\n&lt;/bookstore&gt;\n\n// 语法规则\n// 1. 必须有根元素\n// 2. 标签必须正确闭合\n// 3. 属性值必须加引号\n// 4. 区分大小写</code></pre>',
    tags: ['XML语法', '标签', '属性']
  },
  'xml-parsing': {
    title: 'XML 解析',
    body: '<p class="lead">XML 的解析方法。</p><pre><code>// DOMParser（浏览器）\nconst parser = new DOMParser()\nconst xmlDoc = parser.parseFromString(xmlString, "text/xml")\nconst title = xmlDoc.getElementsByTagName("title")[0].textContent\n\n// 使用 xml2js（Node.js）\nconst xml2js = require("xml2js")\nxml2js.parseString(xmlString, (err, result) => {\n  console.log(result)\n})\n\n// 使用 fast-xml-parser\nconst XMLParser = require("fast-xml-parser")\nconst parser = new XMLParser()\nconst json = parser.parse(xmlString)</code></pre>',
    tags: ['XML解析', 'DOMParser', 'xml2js']
  },
  'xml-schema': {
    title: 'XML Schema',
    body: '<p class="lead">XML Schema（XSD）定义 XML 文档的结构和数据类型。</p><pre><code>&lt;xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"&gt;\n  &lt;xs:element name="person"&gt;\n    &lt;xs:complexType&gt;\n      &lt;xs:sequence&gt;\n        &lt;xs:element name="name" type="xs:string"/&gt;\n        &lt;xs:element name="age" type="xs:integer"/&gt;\n      &lt;/xs:sequence&gt;\n    &lt;/xs:complexType&gt;\n  &lt;/xs:element&gt;\n&lt;/xs:schema&gt;</code></pre>',
    tags: ['XML Schema', 'XSD', '验证']
  },
  xpath: {
    title: 'XPath 查询',
    body: '<p class="lead">XPath 用于在 XML 文档中查询节点。</p><pre><code>const xpath = require("xpath")\nconst dom = require("xmldom").DOMParser\n\nconst doc = new dom().parseFromString(xml)\n\n// 查询表达式\nconst nodes = xpath.select("//book[@category=\'fiction\']/title", doc)\n\n// 常用表达式\n// /bookstore/book[1]        - 第一个 book\n// //title[@lang="en"]       - lang=en 的 title\n// /bookstore/book/price/text() - price 文本</code></pre>',
    tags: ['XPath', '查询', 'XML']
  },
  'protobuf-intro': {
    title: 'Protocol Buffers',
    body: '<p class="lead">Protocol Buffers 是 Google 开发的高效二进制序列化格式。</p><pre><code>// person.proto\nsyntax = "proto3";\n\nmessage Person {\n  string name = 1;\n  int32 age = 2;\n  string email = 3;\n}\n\n// 使用\nconst protobuf = require("protobufjs")\nconst Person = await protobuf.load("person.proto")\nconst buffer = Person.encode({ name: "Alice", age: 25 }).finish()\nconst decoded = Person.decode(buffer)\n\n// 特点\n// 1. 体积小（比 JSON 小 3-10 倍）\n// 2. 速度快\n// 3. 强类型\n// 4. 向后兼容</code></pre>',
    tags: ['Protobuf', '二进制', '高效']
  },
  'msgpack-intro': {
    title: 'MessagePack',
    body: '<p class="lead">MessagePack 是一种高效的二进制序列化格式，类似 JSON 但更小更快。</p><pre><code>// 安装\nnpm install msgpack-lite\n\n// 使用\nconst msgpack = require("msgpack-lite")\n\nconst data = { name: "Alice", age: 25, scores: [85, 90, 88] }\nconst binary = msgpack.encode(data)   // 序列化\nconst decoded = msgpack.decode(binary) // 反序列化\n\n// 特点\n// 1. 保持 JSON 数据结构\n// 2. 体积比 JSON 小约 30%\n// 3. 支持多种语言</code></pre>',
    tags: ['MessagePack', '二进制', '高效']
  },
  'bson-intro': {
    title: 'BSON',
    body: '<p class="lead">BSON（Binary JSON）是 MongoDB 使用的二进制序列化格式，扩展了 JSON 类型。</p><pre><code>// BSON 支持的类型\n// - Date\n// - Binary\n// - ObjectId\n// - Regular Expression\n// - Int32 / Int64\n\n// 使用 js-bson\nconst BSON = require("bson")\nconst bson = new BSON()\n\nconst data = {\n  name: "Alice",\n  createdAt: new Date(),\n  tags: ["user", "admin"]\n}\n\nconst buffer = bson.serialize(data)\nconst doc = bson.deserialize(buffer)</code></pre>',
    tags: ['BSON', 'MongoDB', '二进制']
  },
  'cbor-intro': {
    title: 'CBOR',
    body: '<p class="lead">CBOR（Concise Binary Object Representation）是 IETF 标准的二进制数据格式。</p><pre><code>// 安装\nnpm install cbor\n\n// 使用\nconst cbor = require("cbor")\n\nconst data = { name: "Alice", age: 25 }\nconst encoded = cbor.encode(data)    // 序列化\nconst decoded = cbor.decode(encoded) // 反序列化\n\n// 特点\n// 1. IETF 标准（RFC 8949）\n// 2. 流式解析支持\n// 3. 适合 IoT 场景</code></pre>',
    tags: ['CBOR', 'IETF标准', 'IoT']
  },
  'avro-intro': {
    title: 'Avro',
    body: '<p class="lead">Avro 是 Apache 开发的二进制序列化系统，依赖 Schema 进行序列化。</p><pre><code>// Schema 定义\n{\n  "type": "record",\n  "name": "User",\n  "fields": [\n    { "name": "name", "type": "string" },\n    { "name": "age", "type": "int" }\n  ]\n}\n\n// 使用\nconst avro = require("avsc")\nconst type = avro.Type.forSchema(schema)\nconst buffer = type.toBuffer({ name: "Alice", age: 25 })\nconst user = type.fromBuffer(buffer)</code></pre>',
    tags: ['Avro', 'Apache', 'Schema']
  },
  'yaml-intro': {
    title: 'YAML',
    body: '<p class="lead">YAML 是一种人类友好的数据序列化格式，常用于配置文件。</p><pre><code># YAML 示例\nname: Alice\nage: 25\naddress:\n  city: Beijing\n  street: Main St\nhobbies:\n  - reading\n  - coding\n\n// 解析 YAML\nconst yaml = require("js-yaml")\nconst obj = yaml.load(yamlString)\nconst yamlString = yaml.dump(obj)</code></pre>',
    tags: ['YAML', '配置文件', '可读性']
  },
  'toml-intro': {
    title: 'TOML',
    body: '<p class="lead">TOML 是一种旨在成为最小化配置文件的格式。</p><pre><code># TOML 示例\ntitle = "TOML Example"\n\nowner = {\n  name = "Tom Preston-Werner",\n  dob = 1979-05-27T07:32:00Z\n}\n\n[database]\nserver = "192.168.1.1"\nports = [8001, 8001, 8002]\n\n// 解析 TOML\nconst toml = require("@iarna/toml")\nconst obj = toml.parse(tomlString)</code></pre>',
    tags: ['TOML', '配置文件', '简洁']
  },
  'csv-intro': {
    title: 'CSV',
    body: '<p class="lead">CSV（Comma-Separated Values）是一种简单的表格数据格式。</p><pre><code>// CSV 示例\nname,age,city\nAlice,25,Beijing\nBob,30,Shanghai\n\n// 解析 CSV\nconst Papa = require("papaparse")\nconst result = Papa.parse(csvString, { header: true })\n\n// 生成 CSV\nconst csv = Papa.unparse(data)\n\n// 特点\n// 1. 简单直观\n// 2. Excel 兼容\n// 3. 适合表格数据</code></pre>',
    tags: ['CSV', '表格数据', 'Excel']
  },
  'form-urlencoded': {
    title: 'URL 编码',
    body: '<p class="lead">application/x-www-form-urlencoded 是 HTML 表单的默认编码格式。</p><pre><code>// 编码格式\nname=Alice&age=25&city=Beijing\n\n// JavaScript 编码\nconst params = new URLSearchParams({\n  name: "Alice",\n  age: 25,\n  city: "Beijing"\n})\nconst encoded = params.toString()\n\n// 解码\nconst decoded = new URLSearchParams(encoded)\nconsole.log(decoded.get("name"))\n\n// fetch 中使用\nfetch("/api/submit", {\n  method: "POST",\n  headers: { "Content-Type": "application/x-www-form-urlencoded" },\n  body: new URLSearchParams(data)\n})</code></pre>',
    tags: ['URL编码', '表单', 'POST']
  },
  'api-data': {
    title: 'API 数据交换',
    body: '<p class="lead">不同场景下的 API 数据交换格式选择。</p><pre><code>// REST API（JSON）\nGET /api/users\n{\n  "users": [\n    { "id": 1, "name": "Alice" }\n  ]\n}\n\n// GraphQL\nquery {\n  user(id: 1) {\n    name\n    email\n  }\n}\n\n// gRPC（Protobuf）\nrpc GetUser (UserRequest) returns (UserResponse)\n\n// 选择建议\n// - 浏览器端 API: JSON\n// - 内部服务通信: Protobuf/gRPC\n// - 实时数据: MessagePack\n// - 复杂查询: GraphQL</code></pre>',
    tags: ['API', 'REST', 'gRPC']
  },
  'config-files': {
    title: '配置文件',
    body: '<p class="lead">不同配置文件格式的选择。</p><pre><code>// package.json（JSON）\n{\n  "name": "my-app",\n  "version": "1.0.0"\n}\n\n// .prettierrc（JSON5/JSON）\n{\n  "semi": false,\n  "singleQuote": true\n}\n\n// docker-compose.yml（YAML）\nversion: "3"\nservices:\n  web:\n    image: nginx\n\n// Cargo.toml（TOML）\n[package]\nname = "my-app"\nversion = "0.1.0"</code></pre>',
    tags: ['配置文件', 'JSON', 'YAML']
  },
  'database-storage': {
    title: '数据库存储',
    body: '<p class="lead">不同数据库使用的数据格式。</p><pre><code>// MongoDB（BSON）\ndb.users.insertOne({\n  name: "Alice",\n  createdAt: new Date()\n})\n\n// PostgreSQL（JSONB）\nCREATE TABLE users (\n  data JSONB\n)\nINSERT INTO users VALUES (\'{"name": "Alice"}\')\n\n// Redis（MessagePack）\nredis.set("user:1", msgpack.encode(user))\n\n// 选择建议\n// - 文档数据库: BSON / JSON\n// - 关系数据库 JSON 列: JSONB\n// - 缓存: MessagePack / Protobuf</code></pre>',
    tags: ['数据库', '存储', 'BSON']
  },
  'message-queue': {
    title: '消息队列',
    body: '<p class="lead">消息队列中的数据序列化格式选择。</p><pre><code>// Kafka（Avro / Protobuf）\n// 使用 Schema Registry\n\n// RabbitMQ（JSON / MessagePack）\nchannel.sendToQueue(queue, Buffer.from(JSON.stringify(msg)))\n\n// 选择建议\n// - 高性能场景: Protobuf / Avro\n// - 跨语言: JSON\n// - 实时性要求高: MessagePack\n// - 需要 Schema 演化: Avro</code></pre>',
    tags: ['消息队列', 'Kafka', 'RabbitMQ']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考相关数据交换规范获取更多信息。</p>',
        tags: ['数据交换', '格式']
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

addLink('data-exchange-intro', 'data-serialization')
addLink('data-serialization', 'format-comparison')
addLink('json-intro', 'json-syntax')
addLink('json-syntax', 'json-schema')
addLink('json-schema', 'json-parse-stringify')
addLink('json-parse-stringify', 'json-vs-xml')
addLink('xml-intro', 'xml-syntax')
addLink('xml-syntax', 'xml-parsing')
addLink('xml-parsing', 'xml-schema')
addLink('xml-schema', 'xpath')
addLink('protobuf-intro', 'msgpack-intro')
addLink('msgpack-intro', 'bson-intro')
addLink('bson-intro', 'cbor-intro')
addLink('cbor-intro', 'avro-intro')
addLink('yaml-intro', 'toml-intro')
addLink('toml-intro', 'csv-intro')
addLink('csv-intro', 'form-urlencoded')
addLink('api-data', 'config-files')
addLink('config-files', 'database-storage')
addLink('database-storage', 'message-queue')

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