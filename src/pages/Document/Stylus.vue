<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">Stylus 知识库</h1>
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
          <h2>✨ <span class="gradient-text">Stylus 完全指南</span></h2>
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
          <p>✨ 富有表现力的 CSS 预处理器</p>
          <p>✨ 点击节点双向联动 | 可选冒号、分号、花括号</p>
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
          <h3>🔗 Stylus 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'Stylus用户'
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

// ========== Stylus 导航数据 ==========
const navSections = ref([
  { title: '🚀 快速入门', items: [
      { id: 'stylus-intro', label: 'Stylus 简介', hot: true },
      { id: 'stylus-install', label: '安装与编译', hot: true },
      { id: 'stylus-syntax', label: '语法特性', hot: true },
      { id: 'stylus-variables', label: '变量', hot: true }
    ]},
  { title: '📝 基础语法', items: [
      { id: 'stylus-nesting', label: '嵌套规则', hot: true },
      { id: 'stylus-mixins', label: '混合 Mixin', hot: true },
      { id: 'stylus-extend', label: '继承 @extend', hot: true },
      { id: 'stylus-interpolation', label: '插值', hot: true }
    ]},
  { title: '🔧 运算符与函数', items: [
      { id: 'stylus-operators', label: '运算符', hot: true },
      { id: 'stylus-builtin-functions', label: '内置函数', hot: true },
      { id: 'stylus-color-functions', label: '颜色函数', hot: true },
      { id: 'stylus-custom-functions', label: '自定义函数', hot: true }
    ]},
  { title: '⚙️ 控制流', items: [
      { id: 'stylus-conditionals', label: '条件语句', hot: true },
      { id: 'stylus-loops', label: '循环语句', hot: true },
      { id: 'stylus-iteration', label: '迭代', hot: true }
    ]},
  { title: '📦 模块化', items: [
      { id: 'stylus-import', label: '@import 导入', hot: true },
      { id: 'stylus-lookup', label: '查找向上', hot: true },
      { id: 'stylus-rest-params', label: '剩余参数', hot: true }
    ]}
])

const selectedId = ref('stylus-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== Stylus 内容映射表 ==========
const contentMap = {
  'stylus-intro': {
    title: 'Stylus 简介',
    body: '<p class="lead">Stylus 是一个富有表现力的、动态的、健壮的 CSS 预处理器，提供更简洁的语法和强大的功能。</p><h3>核心特点</h3><ul><li><strong>极简语法</strong>：可选冒号、分号、花括号</li><li><strong>变量</strong>：$ 前缀或无前缀</li><li><strong>混合</strong>：可复用的代码块</li><li><strong>函数</strong>：内置和自定义函数</li><li><strong>插值</strong>：字符串插值 #{}</li><li><strong>运算符</strong>：丰富的运算符支持</li></ul><div class="note">💡 Stylus 由 TJ Holowaychuk 开发，以简洁灵活著称，语法接近 Python 风格。</div>',
    tags: ['CSS预处理器', 'Stylus', '简洁语法']
  },
  'stylus-install': {
    title: '安装与编译',
    body: '<p class="lead">Stylus 可以通过 npm 安装，支持多种编译方式。</p><pre><code>// npm 安装\nnpm install -g stylus\n\n// 命令行编译\nstylus styles.styl -o styles.css\nstylus --watch styles.styl -o styles.css\nstylus --compress styles.styl -o styles.min.css\n\n// 压缩输出\nstylus -c styles.styl\n\n// 导入目录\nstylus --out css styl\n\n// 在 Node.js 中使用\nconst stylus = require("stylus")\nconst str = "body\n  color red"\nstylus.render(str, (err, css) => {\n  console.log(css)\n})\n\n// 在 Vue/React 中使用\nnpm install -D stylus stylus-loader</code></pre>',
    tags: ['安装', '编译', '命令行']
  },
  'stylus-syntax': {
    title: '语法特性',
    body: '<p class="lead">Stylus 支持极简语法，冒号、分号、花括号都是可选的。</p><pre><code>// 标准 CSS 语法\nbody {\n  background: #f0f0f0;\n  color: #333;\n}\n\n// Stylus 简化语法\nbody\n  background #f0f0f0\n  color #333\n\n// 完全省略\nbody\n  background #f0f0f0\n  color #333\n\n// 单行样式\nbody { background #f0f0f0; color #333 }\n\n// 混合风格\nbody\n  background #f0f0f0\n  color #333\n\n// 省略冒号\nbody\n  background #f0f0f0\n  color #333\n\n// 空行分隔\nbody\n  background #f0f0f0\n  color #333</code></pre>',
    tags: ['语法', '简洁', '可选符号']
  },
  'stylus-variables': {
    title: '变量',
    body: '<p class="lead">Stylus 变量可以使用 $ 前缀，也可以省略。</p><pre><code>// 使用 $ 前缀\n$primary-color = #3498db\n$font-stack = "Helvetica", sans-serif\n$border-radius = 4px\n\n.button\n  background $primary-color\n  font-family $font-stack\n  border-radius $border-radius\n\n// 省略 $ 前缀\nprimary = #3498db\nsize = 16px\n\n.text\n  color primary\n  font-size size\n\n// 属性值作为变量\n$width = 100px\n.container\n  width $width\n  height $width / 2\n\n// 变量插值\n$selector = ".container"\n{$selector}\n  width 100%\n\n// 变量查找向上\n$color = red\nbody\n  $color = blue\n  p\n    color $color  // blue</code></pre>',
    tags: ['变量', '$', '插值']
  },
  'stylus-nesting': {
    title: '嵌套规则',
    body: '<p class="lead">Stylus 支持嵌套语法，反映 HTML 结构。</p><pre><code>// 基本嵌套\nnav\n  ul\n    margin 0\n    li\n      display inline-block\n      a\n        text-decoration none\n        &:hover\n          text-decoration underline\n\n// 父选择器 &\n.button\n  background blue\n  &--large\n    font-size 20px\n  &__icon\n    margin-right 8px\n  &:hover\n    background darkblue\n\n// 嵌套属性\nfont\n  family "Inter", sans-serif\n  size 16px\n  weight bold\n\n// 编译后\nfont-family "Inter", sans-serif\nfont-size 16px\nfont-weight bold</code></pre>',
    tags: ['嵌套', '父选择器', '&']
  },
  'stylus-mixins': {
    title: '混合 Mixin',
    body: '<p class="lead">Mixin 是可复用的代码块，支持参数。</p><pre><code>// 无参数 Mixin\nflex-center()\n  display flex\n  justify-content center\n  align-items center\n\n// 带参数 Mixin\nborder-radius(radius = 4px)\n  border-radius radius\n\n// 带多个参数\nbox(width, height = auto, color = blue)\n  width width\n  height height\n  background color\n\n// 使用 Mixin\n.button\n  flex-center()\n  border-radius(8px)\n  box(100px, 200px, red)\n\n// 命名参数\n.avatar\n  box(width 50px, color green)\n\n// 内容块传递\nhover()\n  &:hover\n    {block}\n\n.card\n  +hover()\n    box-shadow 0 2px 4px rgba(0,0,0,0.1)</code></pre>',
    tags: ['Mixin', '混合', '参数']
  },
  'stylus-extend': {
    title: '继承 @extend',
    body: '<p class="lead">@extend 让一个选择器继承另一个选择器的样式。</p><pre><code>// 基础样式\n.button-base\n  padding 10px 20px\n  border none\n  cursor pointer\n\n.button-primary\n  @extend .button-base\n  background blue\n  color white\n\n.button-secondary\n  @extend .button-base\n  background gray\n\n// 占位符（不输出）\n$clearfix\n  &:after\n    content ""\n    display table\n    clear both\n\n.container\n  @extend $clearfix\n\n// 继承多个\n.element\n  @extend .class1, .class2</code></pre>',
    tags: ['@extend', '继承', '占位符']
  },
  'stylus-interpolation': {
    title: '插值',
    body: '<p class="lead">使用 {} 进行字符串插值。</p><pre><code>// 选择器插值\n$prefix = "btn"\n.{$prefix}\n  background blue\n.{$prefix}-primary\n  background darkblue\n\n// 属性名插值\n$side = "left"\n.element\n  border-{$side} 1px solid #ccc\n\n// 变量插值\n$size = 16\n.font\n  font-size unit($size, px)\n\n// 注释插值\n$version = "1.0.0"\n/* 版本: {$version} */\n\n// 媒体查询插值\n$device = "screen"\n@media {$device}\n  .responsive\n    width 100%\n\n// 条件插值\n$theme = "dark"\nbody\n  {$theme}-mode\n    background #333</code></pre>',
    tags: ['插值', '{}', '字符串']
  },
  'stylus-operators': {
    title: '运算符',
    body: '<p class="lead">Stylus 支持丰富的运算符。</p><pre><code>// 数学运算\n$width = 100px\n.container\n  width $width / 2\n  padding 10px + 5px\n  margin 20px - 5px\n  transform rotate(15deg * 2)\n\n// 颜色运算\n$color = #ff0000\n.darken\n  color $color + #333333\n\n// 关系运算符\n$size = 16px\nif $size > 12px\n  .large\n    font-size $size\n\n// 逻辑运算符\nif $width > 50px and $width < 200px\n  .middle\n    width $width\n\n// 存在运算符\n$value = 10px\nif $value\n  .has-value\n    width $value\n\n// 赋值运算符\n$count = 0\n$count += 1</code></pre>',
    tags: ['运算符', '数学', '逻辑']
  },
  'stylus-builtin-functions': {
    title: '内置函数',
    body: '<p class="lead">Stylus 提供丰富的内置函数。</p><pre><code>// 数学函数\n.math\n  width ceil(10.2px)\n  height floor(10.8px)\n  margin round(10.5px)\n  opacity percentage(0.5)\n\n// 字符串函数\n$str = "Hello World"\n.str\n  content quote($str)\n  length length($str)\n  replace replace($str, "World", "Stylus")\n\n// 类型函数\n$value = 16px\n.type\n  is-number: type($value) == "unit"\n  is-pixel: unit($value) == "px"\n\n// 单位转换\n.convert\n  width convert(1in, mm)\n\n// push/pop\n$list = 10px 20px 30px\n$list = push($list, 40px)\n$value = pop($list)</code></pre>',
    tags: ['函数', '数学', '字符串']
  },
  'stylus-color-functions': {
    title: '颜色函数',
    body: '<p class="lead">Stylus 提供强大的颜色处理函数。</p><pre><code>$color = #3498db\n\n// 颜色调整\n.light\n  background lighten($color, 20%)\n  color darken($color, 20%)\n  border saturate($color, 50%)\n  box-shadow desaturate($color, 30%)\n\n// 颜色混合\n.mix\n  color mix($color, #e74c3c, 50%)\n\n// 透明度\n.alpha\n  color rgba($color, 0.5)\n  background fade($color, 50%)\n\n// 颜色提取\n.extract\n  red red($color)\n  green green($color)\n  blue blue($color)\n  hue hue($color)\n  saturation saturation($color)\n  lightness lightness($color)\n\n// 互补色\n.complement\n  color complement($color)\n\n// 反色\n.invert\n  color invert($color)</code></pre>',
    tags: ['颜色函数', 'lighten', 'darken', 'mix']
  },
  'stylus-custom-functions': {
    title: '自定义函数',
    body: '<p class="lead">使用 @function 或函数定义创建自定义函数。</p><pre><code>// 使用 @function\n@function px-to-rem($px, $base = 16px)\n  return unit($px / $base, "rem")\n\n// 使用函数定义\nstrip-unit($value)\n  return $value / ($value * 0 + 1)\n\n// 带条件判断的函数\nfont-size($size)\n  if $size == large\n    return 18px\n  else if $size == small\n    return 12px\n  else\n    return 14px\n\n// 使用\n.container\n  font-size px-to-rem(16px)\n  margin strip-unit(16px)\n  padding font-size(large)</code></pre>',
    tags: ['自定义函数', '@function', 'return']
  },
  'stylus-conditionals': {
    title: '条件语句',
    body: '<p class="lead">Stylus 支持 if/else 条件判断。</p><pre><code>// if/else\n$theme = "dark"\n\nbody\n  if $theme == "dark"\n    background #333\n    color white\n  else if $theme == "light"\n    background #fff\n    color #333\n  else\n    background gray\n\n// unless（相反条件）\n$is-mobile = false\n\n.container\n  unless $is-mobile\n    width 1200px\n\n// 后缀条件\n.button\n  background blue if $primary\n  color white unless $is-dark\n\n// 三元运算符\n$size = $is-large ? 20px : 14px\n\n.font\n  font-size $size</code></pre>',
    tags: ['if', 'else', 'unless']
  },
  'stylus-loops': {
    title: '循环语句',
    body: '<p class="lead">Stylus 支持 for 循环。</p><pre><code>// for in 循环\nfor $i in 1 2 3\n  .item-{$i}\n    width $i * 10px\n\n// range 函数\nfor $i in 1..5\n  .col-{$i}\n    width percentage($i / 12)\n\n// 遍历列表\n$colors = red, green, blue\nfor $color in $colors\n  .btn-{$color}\n    background $color\n\n// 遍历对象\n$sizes = {\n  small: 12px,\n  medium: 16px,\n  large: 20px\n}\n\nfor $name, $size in $sizes\n  .text-{$name}\n    font-size $size\n\n// 循环索引\nfor $i in 1..5\n  .item-{$i}\n    transition-delay unit($i * 0.1, s)</code></pre>',
    tags: ['for', '循环', 'range']
  },
  'stylus-iteration': {
    title: '迭代',
    body: '<p class="lead">Stylus 支持 @while 循环。</p><pre><code>// while 循环\n$i = 6\nwhile $i > 0\n  .item-{$i}\n    z-index $i\n  $i = $i - 1\n\n// 生成网格\n$columns = 12\n$i = 1\nwhile $i <= $columns\n  .col-{$i}\n    width ($i / $columns) * 100%\n  $i = $i + 1\n\n// 条件循环\n$size = 10px\nwhile $size < 50px\n  .size-{$size}\n    font-size $size\n  $size = $size + 10px\n\n// 注意：@while 不如 for 常用\n// 大多数情况使用 for 循环更清晰</code></pre>',
    tags: ['@while', '迭代', '循环']
  },
  'stylus-import': {
    title: '@import 导入',
    body: '<p class="lead">@import 用于导入其他 Stylus 文件。</p><pre><code>// 导入 Stylus 文件（可省略扩展名）\n@import "variables"\n@import "mixins"\n@import "reset"\n\n// 导入 CSS 文件\n@import "normalize.css"\n\n// 通配符导入\n@import "components/*"\n\n// 内联导入\n@import "ie-fix.css" inline\n\n// 可选导入\n@import "custom-theme" optional\n\n// 导入并执行\n@import "theme" once\n\n// 嵌套导入\n.container\n  @import "container-theme"</code></pre>',
    tags: ['@import', '导入', '模块化']
  },
  'stylus-lookup': {
    title: '查找向上',
    body: '<p class="lead">Stylus 支持查找父级作用域中的变量。</p><pre><code>// 向上查找变量\n$color = red\n\nbody\n  $color = blue\n  p\n    color lookup("$color")  // blue\n\n// 使用 @ 查找\n$size = 16px\n\n.container\n  $size = 20px\n  .item\n    font-size @$size  // 20px\n\n// 查找属性\n.element\n  width 100px\n  height @width  // 100px\n\n// 父级选择器\n.parent\n  color blue\n  .child\n    color @color  // blue（父级的 color）</code></pre>',
    tags: ['lookup', '向上查找', '@']
  },
  'stylus-rest-params': {
    title: '剩余参数',
    body: '<p class="lead">Stylus 支持剩余参数 ... 收集多个参数。</p><pre><code>// 可变参数 Mixin\nbox-shadow(...$shadows)\n  box-shadow $shadows\n\n// 使用\n.card\n  box-shadow(0 1px 2px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.1))\n\n// 剩余参数与普通参数组合\nmargin($value, ...$rest)\n  margin $value\n  if length($rest) > 0\n    margin-bottom $rest[0]\n\n// 传递剩余参数\nshadow($args...)\n  box-shadow $args\n\n.element\n  shadow(0 1px 2px #ccc, 0 2px 4px #ddd)</code></pre>',
    tags: ['剩余参数', '...', '可变参数']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 Stylus 官方文档获取更多信息。</p>',
        tags: ['Stylus', 'CSS预处理器']
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

addLink('stylus-intro', 'stylus-install')
addLink('stylus-install', 'stylus-syntax')
addLink('stylus-syntax', 'stylus-variables')
addLink('stylus-variables', 'stylus-nesting')
addLink('stylus-nesting', 'stylus-mixins')
addLink('stylus-mixins', 'stylus-extend')
addLink('stylus-extend', 'stylus-interpolation')
addLink('stylus-operators', 'stylus-builtin-functions')
addLink('stylus-builtin-functions', 'stylus-color-functions')
addLink('stylus-color-functions', 'stylus-custom-functions')
addLink('stylus-conditionals', 'stylus-loops')
addLink('stylus-loops', 'stylus-iteration')
addLink('stylus-import', 'stylus-lookup')
addLink('stylus-lookup', 'stylus-rest-params')

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