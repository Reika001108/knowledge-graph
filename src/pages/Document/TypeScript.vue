<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">TypeScript 知识库</h1>
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
          <h2>📘 <span class="gradient-text">TypeScript 完全指南</span></h2>
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
          <p>📘 JavaScript 的超集 | 静态类型检查</p>
          <p>✨ 点击节点双向联动 | 提升代码质量</p>
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
          <h3>🔗 TypeScript 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'TS学习者'
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

// ========== TypeScript 导航数据 ==========
const navSections = ref([
  { title: '📖 基础入门', items: [
      { id: 'ts-intro', label: 'TypeScript 简介', hot: true },
      { id: 'ts-setup', label: '安装与配置', hot: true },
      { id: 'ts-basics', label: '基础类型', hot: true },
      { id: 'ts-type-annotations', label: '类型注解', hot: true }
    ]},
  { title: '🔧 类型系统', items: [
      { id: 'ts-primitive', label: '原始类型', hot: true },
      { id: 'ts-array-tuple', label: '数组与元组', hot: true },
      { id: 'ts-object', label: '对象类型', hot: true },
      { id: 'ts-union-intersection', label: '联合与交叉类型', hot: true },
      { id: 'ts-literal', label: '字面量类型', hot: true },
      { id: 'ts-enum', label: '枚举', hot: true }
    ]},
  { title: '🎯 高级类型', items: [
      { id: 'ts-generics', label: '泛型', hot: true },
      { id: 'ts-utility', label: '工具类型', hot: true },
      { id: 'ts-mapped', label: '映射类型', hot: true },
      { id: 'ts-conditional', label: '条件类型', hot: true },
      { id: 'ts-template-literal', label: '模板字面量类型', hot: true }
    ]},
  { title: '🔄 函数与类', items: [
      { id: 'ts-functions', label: '函数类型', hot: true },
      { id: 'ts-classes', label: '类与继承', hot: true },
      { id: 'ts-interface', label: '接口', hot: true },
      { id: 'ts-modifiers', label: '访问修饰符', hot: true }
    ]},
  { title: '📦 模块与声明', items: [
      { id: 'ts-modules', label: '模块系统', hot: true },
      { id: 'ts-declaration', label: '声明文件', hot: true },
      { id: 'ts-namespaces', label: '命名空间' }
    ]},
  { title: '⚙️ 配置与工具', items: [
      { id: 'ts-config', label: 'tsconfig.json', hot: true },
      { id: 'ts-compiler', label: '编译器选项', hot: true },
      { id: 'ts-decorators', label: '装饰器', hot: true }
    ]}
])

const selectedId = ref('ts-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== TypeScript 内容映射表 ==========
const contentMap = {
  'ts-intro': {
    title: 'TypeScript 简介',
    body: '<p class="lead">TypeScript 是 JavaScript 的超集，添加了静态类型系统，编译后生成纯 JavaScript，可以在任何运行 JavaScript 的环境中执行。</p><h3>核心特性</h3><ul><li><strong>静态类型检查</strong>：在编译时发现类型错误</li><li><strong>更好的 IDE 支持</strong>：代码补全、重构、导航</li><li><strong>最新 ECMAScript 特性</strong>：支持 ES Next 语法</li><li><strong>渐进式采用</strong>：可以逐步将 JS 项目迁移到 TS</li></ul><div class="note">💡 TypeScript 由微软开发，于 2012 年首次发布，现已成为前端开发的主流选择。</div>',
    tags: ['TypeScript', 'JavaScript超集', '静态类型']
  },
  'ts-setup': {
    title: '安装与配置',
    body: '<p class="lead">TypeScript 可以通过 npm 安装，并提供编译器进行类型检查和转换。</p><pre><code># 全局安装\nnpm install -g typescript\n\n# 项目安装\nnpm install --save-dev typescript\n\n# 初始化配置文件\nnpx tsc --init\n\n# 编译 TypeScript 文件\nnpx tsc index.ts\n\n# 监听模式\nnpx tsc --watch\n\n# 使用 ts-node 直接运行\nnpm install --save-dev ts-node\nnpx ts-node index.ts\n\n# 使用 Node.js 原生运行（需要 --loader）\nnode --loader ts-node/esm index.ts</code></pre>',
    tags: ['安装', 'tsc', '编译']
  },
  'ts-basics': {
    title: '基础类型',
    body: '<p class="lead">TypeScript 提供了丰富的基础类型来描述数据形状。</p><pre><code>// 基础类型示例\nlet isDone: boolean = false\nlet decimal: number = 6\nlet hex: number = 0xf00d\nlet binary: number = 0b1010\nlet octal: number = 0o744\nlet color: string = "blue"\nlet list: number[] = [1, 2, 3]\nlet list2: Array&lt;number&gt; = [1, 2, 3]\n\n// 元组 Tuple\nlet x: [string, number] = ["hello", 10]\n\n// 枚举 Enum\nenum Color { Red, Green, Blue }\nlet c: Color = Color.Green\n\n// Any（不推荐滥用）\nlet notSure: any = 4\nnotSure = "maybe a string"\n\n// Void\nfunction warnUser(): void {\n  console.log("This is a warning")\n}\n\n// Null 和 Undefined\nlet u: undefined = undefined\nlet n: null = null\n\n// Never（永不返回的函数）\nfunction error(message: string): never {\n  throw new Error(message)\n}\n\n// Unknown（安全的 any）\nlet userInput: unknown = 4\nif (typeof userInput === "number") {\n  console.log(userInput.toFixed())\n}</code></pre>',
    tags: ['类型', 'any', 'unknown', 'void']
  },
  'ts-type-annotations': {
    title: '类型注解',
    body: '<p class="lead">类型注解为变量、函数参数和返回值指定类型。</p><pre><code>// 变量类型注解\nlet myName: string = "Alice"\nlet myAge: number = 30\nlet isActive: boolean = true\n\n// 函数参数和返回值类型注解\nfunction greet(name: string): string {\n  return `Hello, ${name}!`\n}\n\n// 箭头函数\nconst add = (a: number, b: number): number =&gt; a + b\n\n// 可选参数\nfunction buildName(firstName: string, lastName?: string): string {\n  return lastName ? `${firstName} ${lastName}` : firstName\n}\n\n// 默认参数\nfunction multiply(a: number, b: number = 1): number {\n  return a * b\n}\n\n// 剩余参数\nfunction sum(...numbers: number[]): number {\n  return numbers.reduce((acc, n) =&gt; acc + n, 0)\n}</code></pre>',
    tags: ['类型注解', '参数', '返回值']
  },
  'ts-primitive': {
    title: '原始类型',
    body: '<p class="lead">TypeScript 支持 JavaScript 的所有原始类型。</p><pre><code>// string\nlet str: string = "Hello"\nlet template: string = `Hello ${str}`\n\n// number（整数和浮点数）\nlet int: number = 42\nlet float: number = 3.14\nlet hex: number = 0xff\nlet binary: number = 0b1010\nlet octal: number = 0o744\n\n// boolean\nlet isTrue: boolean = true\nlet isFalse: boolean = false\n\n// symbol\nconst sym: symbol = Symbol("unique")\n\n// bigint\nlet big: bigint = 100n\n\n// null 和 undefined\nlet n: null = null\nlet u: undefined = undefined\n\n// 严格空值检查\n// 在 tsconfig.json 中启用 strictNullChecks\nlet maybeString: string | null = null\n// maybeString.toUpperCase() // 错误：对象可能为 null</code></pre>',
    tags: ['string', 'number', 'boolean', '原始类型']
  },
  'ts-array-tuple': {
    title: '数组与元组',
    body: '<p class="lead">数组和元组用于表示有序的数据集合。</p><pre><code>// 数组定义方式\nlet list1: number[] = [1, 2, 3]\nlet list2: Array&lt;number&gt; = [1, 2, 3]\nlet list3: readonly number[] = [1, 2, 3]  // 只读数组\nlet list4: ReadonlyArray&lt;number&gt; = [1, 2, 3]\n\n// 数组方法类型安全\nconst arr: number[] = [1, 2, 3]\narr.push(4)      // OK\n// arr.push("5")  // 错误：参数不能是 string\n\n// 元组（固定长度和类型）\nlet tuple: [string, number] = ["Alice", 25]\nlet [name, age] = tuple  // 解构\nconsole.log(name, age)\n\n// 可选元组元素\nlet optionalTuple: [string, number?] = ["Bob"]\n\n// 剩余元素\nlet restTuple: [string, ...number[]] = ["start", 1, 2, 3]\n\n// 只读元组\nlet readonlyTuple: readonly [string, number] = ["Alice", 25]\n// readonlyTuple[0] = "Bob"  // 错误：只读</code></pre>',
    tags: ['数组', '元组', '只读']
  },
  'ts-object': {
    title: '对象类型',
    body: '<p class="lead">对象类型用于描述对象的形状。</p><pre><code>// 内联对象类型\nlet person: { name: string; age: number } = {\n  name: "Alice",\n  age: 25\n}\n\n// 可选属性\nlet config: { url: string; timeout?: number } = {\n  url: "https://api.example.com"\n}\n\n// 只读属性\nlet point: { readonly x: number; readonly y: number } = { x: 10, y: 20 }\n// point.x = 15  // 错误：只读属性\n\n// 索引签名\ninterface StringArray {\n  [index: number]: string\n}\nlet myArray: StringArray = ["Alice", "Bob"]\n\n// 索引签名（动态属性）\ninterface DynamicObject {\n  [key: string]: number\n}\nlet scores: DynamicObject = {\n  math: 90,\n  english: 85\n}\n\n// 类型别名\ntype Person = {\n  name: string\n  age: number\n}\nlet user: Person = { name: "Bob", age: 30 }</code></pre>',
    tags: ['对象', '接口', '类型别名']
  },
  'ts-union-intersection': {
    title: '联合与交叉类型',
    body: '<p class="lead">联合类型表示值可以是多种类型之一，交叉类型组合多个类型。</p><pre><code>// 联合类型（|）\nlet id: string | number\nid = "abc123"   // OK\nid = 12345      // OK\n// id = true    // 错误\n\n// 类型守卫\nfunction printId(id: string | number) {\n  if (typeof id === "string") {\n    console.log(id.toUpperCase())\n  } else {\n    console.log(id.toFixed(2))\n  }\n}\n\n// 联合类型与数组\nlet arr: (string | number)[] = [1, "two", 3]\n\n// 交叉类型（&）\ninterface Colorful {\n  color: string\n}\ninterface Circle {\n  radius: number\n}\ntype ColorfulCircle = Colorful & Circle\n\nlet shape: ColorfulCircle = {\n  color: "red",\n  radius: 10\n}\n\n// 交叉类型合并冲突\ninterface A { a: string }\ninterface B { a: number }\ntype C = A & B  // a 类型为 never（不可能同时满足）</code></pre>',
    tags: ['联合类型', '交叉类型', '类型守卫']
  },
  'ts-literal': {
    title: '字面量类型',
    body: '<p class="lead">字面量类型限制变量只能取特定的值。</p><pre><code>// 字符串字面量类型\nlet direction: "left" | "right" | "up" | "down"\ndirection = "left"   // OK\n// direction = "forward"  // 错误\n\n// 数字字面量类型\nlet statusCode: 200 | 404 | 500\nstatusCode = 200\n// statusCode = 400  // 错误\n\n// 布尔字面量类型\nlet isTrue: true\nisTrue = true\n// isTrue = false  // 错误\n\n// 字面量类型在实际函数中的应用\nfunction setAlignment(align: "left" | "center" | "right") {\n  console.log(`Align: ${align}`)\n}\n\n// 常量断言（as const）\nconst colors = ["red", "green", "blue"] as const\ntype Color = typeof colors[number]  // "red" | "green" | "blue"\n\nconst config = {\n  theme: "dark",\n  size: "large"\n} as const\n// config.theme = "light"  // 错误：只读</code></pre>',
    tags: ['字面量类型', 'as const', '常量断言']
  },
  'ts-enum': {
    title: '枚举',
    body: '<p class="lead">枚举用于定义一组命名常量。</p><pre><code>// 数字枚举\nenum Direction {\n  Up,      // 0\n  Down,    // 1\n  Left,    // 2\n  Right    // 3\n}\nconsole.log(Direction.Up)      // 0\nconsole.log(Direction[0])      // "Up"\n\n// 自定义起始值\nenum StatusCode {\n  NotFound = 404,\n  InternalError = 500\n}\n\n// 字符串枚举\nenum Color {\n  Red = "RED",\n  Green = "GREEN",\n  Blue = "BLUE"\n}\n\n// 异构枚举（混合）\nenum BooleanLikeHeterogeneousEnum {\n  No = 0,\n  Yes = "YES"\n}\n\n// const 枚举（编译时内联，减少代码量）\nconst enum LogLevel {\n  Info,\n  Warning,\n  Error\n}\nlet level = LogLevel.Info  // 编译后直接替换为 0\n\n// 枚举成员作为类型\nenum ShapeKind {\n  Circle,\n  Square\n}\ninterface Circle {\n  kind: ShapeKind.Circle\n  radius: number\n}</code></pre>',
    tags: ['枚举', 'enum', '常量枚举']
  },
  'ts-generics': {
    title: '泛型',
    body: '<p class="lead">泛型允许创建可重用的组件，支持多种类型。</p><pre><code>// 基本泛型函数\nfunction identity&lt;T&gt;(arg: T): T {\n  return arg\n}\nlet output1 = identity&lt;string&gt;("hello")\nlet output2 = identity(42)  // 类型推断\n\n// 泛型接口\ninterface GenericIdentityFn&lt;T&gt; {\n  (arg: T): T\n}\n\n// 泛型类\nclass GenericNumber&lt;T&gt; {\n  zeroValue: T\n  add: (x: T, y: T) =&gt; T\n}\nlet myGeneric = new GenericNumber&lt;number&gt;()\n\n// 泛型约束\ninterface Lengthwise {\n  length: number\n}\nfunction loggingIdentity&lt;T extends Lengthwise&gt;(arg: T): T {\n  console.log(arg.length)\n  return arg\n}\nloggingIdentity({ length: 10, value: 3 })\n\n// 多个泛型参数\nfunction pair&lt;K, V&gt;(key: K, value: V): [K, V] {\n  return [key, value]\n}\n\n// 泛型默认类型\nfunction createArray&lt;T = string&gt;(length: number, value: T): T[] {\n  return Array(length).fill(value)\n}</code></pre>',
    tags: ['泛型', '泛型约束', '类型参数']
  },
  'ts-utility': {
    title: '工具类型',
    body: '<p class="lead">TypeScript 内置了多种实用工具类型。</p><pre><code>interface User {\n  id: number\n  name: string\n  email: string\n  age?: number\n}\n\n// Partial&lt;T&gt; - 所有属性可选\ntype PartialUser = Partial&lt;User&gt;\n// { id?: number; name?: string; email?: string; age?: number }\n\n// Required&lt;T&gt; - 所有属性必选\ntype RequiredUser = Required&lt;User&gt;\n// { id: number; name: string; email: string; age: number }\n\n// Readonly&lt;T&gt; - 所有属性只读\ntype ReadonlyUser = Readonly&lt;User&gt;\n\n// Pick&lt;T, K&gt; - 选择指定属性\ntype UserName = Pick&lt;User, "name" | "id"&gt;\n// { name: string; id: number }\n\n// Omit&lt;T, K&gt; - 排除指定属性\ntype UserWithoutEmail = Omit&lt;User, "email"&gt;\n// { id: number; name: string; age?: number }\n\n// Record&lt;K, T&gt; - 创建键值对类型\ntype PageInfo = Record&lt;"home" | "about" | "contact", { title: string }&gt;\n\n// Exclude&lt;T, U&gt; - 从联合类型中排除\ntype T = Exclude&lt;"a" | "b" | "c", "a"&gt;  // "b" | "c"\n\n// Extract&lt;T, U&gt; - 从联合类型中提取\ntype U = Extract&lt;"a" | "b" | "c", "a" | "f"&gt;  // "a"\n\n// NonNullable&lt;T&gt; - 排除 null 和 undefined\ntype NonNull = NonNullable&lt;string | null | undefined&gt;  // string\n\n// ReturnType&lt;T&gt; - 获取函数返回类型\nfunction getUser() { return { name: "Alice", age: 25 } }\ntype UserType = ReturnType&lt;typeof getUser&gt;\n\n// Parameters&lt;T&gt; - 获取函数参数类型\ntype UserParams = Parameters&lt;typeof getUser&gt;</code></pre>',
    tags: ['工具类型', 'Partial', 'Pick', 'Omit', 'Record']
  },
  'ts-mapped': {
    title: '映射类型',
    body: '<p class="lead">映射类型基于旧类型创建新类型。</p><pre><code>// 基本映射类型\ninterface Person {\n  name: string\n  age: number\n}\n\ntype ReadonlyPerson = {\n  readonly [P in keyof Person]: Person[P]\n}\n// { readonly name: string; readonly age: number }\n\n// 内置映射类型实现\ntype MyPartial&lt;T&gt; = {\n  [P in keyof T]?: T[P]\n}\n\ntype MyReadonly&lt;T&gt; = {\n  readonly [P in keyof T]: T[P]\n}\n\n// 键重映射（TypeScript 4.1+）\ntype Getters&lt;T&gt; = {\n  [K in keyof T as `get${Capitalize&lt;string &amp; K&gt;}`]: () =&gt; T[K]\n}\ninterface User {\n  name: string\n  age: number\n}\ntype UserGetters = Getters&lt;User&gt;\n// { getName: () =&gt; string; getAge: () =&gt; number }\n\n// 过滤属性\ntype OnlyStringKeys&lt;T&gt; = {\n  [K in keyof T as T[K] extends string ? K : never]: T[K]\n}\n\n// 添加修饰符\ntype Mutable&lt;T&gt; = {\n  -readonly [P in keyof T]: T[P]\n}\n\ntype RequiredPartial&lt;T&gt; = {\n  [P in keyof T]-?: T[P]\n}</code></pre>',
    tags: ['映射类型', '键重映射', '修饰符']
  },
  'ts-conditional': {
    title: '条件类型',
    body: '<p class="lead">条件类型根据类型关系选择不同的类型。</p><pre><code>// 基本条件类型\nT extends U ? X : Y\n\n// 示例：类型判断\ntype IsString&lt;T&gt; = T extends string ? true : false\ntype A = IsString&lt;"hello"&gt;  // true\ntype B = IsString&lt;42&gt;       // false\n\n// 条件类型与泛型结合\ntype TypeName&lt;T&gt; =\n  T extends string ? "string" :\n  T extends number ? "number" :\n  T extends boolean ? "boolean" :\n  T extends undefined ? "undefined" :\n  T extends null ? "null" :\n  "object"\n\ntype T1 = TypeName&lt;string&gt;  // "string"\ntype T2 = TypeName&lt;42&gt;      // "number"\n\n// 分布式条件类型（联合类型自动分发）\ntype ToArray&lt;T&gt; = T extends any ? T[] : never\ntype StrArrOrNumArr = ToArray&lt;string | number&gt;  // string[] | number[]\n\n// 类型推断（infer）\ntype ReturnType&lt;T&gt; = T extends (...args: any[]) =&gt; infer R ? R : never\ntype GetPromiseType&lt;T&gt; = T extends Promise&lt;infer U&gt; ? U : never\n\n// 递归条件类型\ntype JsonType&lt;T&gt; = T extends object\n  ? { [K in keyof T]: JsonType&lt;T[K]&gt; }\n  : T</code></pre>',
    tags: ['条件类型', 'infer', '分布式']
  },
  'ts-template-literal': {
    title: '模板字面量类型',
    body: '<p class="lead">模板字面量类型基于字符串字面量创建新类型。</p><pre><code>// 基本模板字面量类型\ntype World = "world"\ntype Greeting = `hello ${World}`  // "hello world"\n\n// 联合类型展开\ntype Vertical = "top" | "bottom"\ntype Horizontal = "left" | "right"\ntype Corner = `${Vertical}-${Horizontal}`\n// "top-left" | "top-right" | "bottom-left" | "bottom-right"\n\n// 内置字符串操作类型\n// Uppercase&lt;T&gt; - 转大写\ntype UppercaseGreeting = Uppercase&lt;"hello"&gt;  // "HELLO"\n\n// Lowercase&lt;T&gt; - 转小写\ntype LowercaseGreeting = Lowercase&lt;"HELLO"&gt;  // "hello"\n\n// Capitalize&lt;T&gt; - 首字母大写\ntype Capitalized = Capitalize&lt;"hello"&gt;  // "Hello"\n\n// Uncapitalize&lt;T&gt; - 首字母小写\ntype Uncapitalized = Uncapitalize&lt;"Hello"&gt;  // "hello"\n\n// 实际应用：CSS 类名生成器\ntype CSSClass&lt;T extends string&gt; = `btn-${T}`\ntype ButtonType = CSSClass&lt;"primary" | "secondary" | "danger"&gt;\n// "btn-primary" | "btn-secondary" | "btn-danger"</code></pre>',
    tags: ['模板字面量类型', '字符串操作', 'Uppercase']
  },
  'ts-functions': {
    title: '函数类型',
    body: '<p class="lead">TypeScript 函数类型包括参数类型、返回值类型和重载。</p><pre><code>// 函数类型表达式\ntype GreetFunction = (name: string) =&gt; string\nconst greet: GreetFunction = (name) =&gt; `Hello ${name}`\n\n// 调用签名\ninterface Callable {\n  (x: number, y: number): number\n  description: string\n}\nconst add: Callable = (x, y) =&gt; x + y\nadd.description = "加法函数"\n\n// 构造签名\ninterface Constructor {\n  new (name: string, age: number): Person\n}\n\n// 函数重载\nfunction makeDate(timestamp: number): Date\nfunction makeDate(year: number, month: number, day: number): Date\nfunction makeDate(yearOrTimestamp: number, month?: number, day?: number): Date {\n  if (month !== undefined &amp;&amp; day !== undefined) {\n    return new Date(yearOrTimestamp, month, day)\n  }\n  return new Date(yearOrTimestamp)\n}\nconst d1 = makeDate(1234567890)\nconst d2 = makeDate(2024, 1, 15)\n\n// this 参数\ntype User = { name: string }\nfunction greet(this: User) {\n  console.log(`Hello ${this.name}`)\n}\ngreet.call({ name: "Alice" })</code></pre>',
    tags: ['函数类型', '重载', 'this']
  },
  'ts-classes': {
    title: '类与继承',
    body: '<p class="lead">TypeScript 类支持继承、抽象类等面向对象特性。</p><pre><code>// 基本类\nclass Animal {\n  name: string\n  constructor(name: string) {\n    this.name = name\n  }\n  speak(): void {\n    console.log(`${this.name} makes a sound`)\n  }\n}\n\n// 继承\nclass Dog extends Animal {\n  breed: string\n  constructor(name: string, breed: string) {\n    super(name)\n    this.breed = breed\n  }\n  speak(): void {\n    console.log(`${this.name} barks`)\n  }\n  wagTail(): void {\n    console.log(`${this.name} wags tail`)\n  }\n}\n\n// 抽象类\nabstract class Shape {\n  abstract getArea(): number\n  printArea(): void {\n    console.log(`Area: ${this.getArea()}`)\n  }\n}\nclass Circle extends Shape {\n  constructor(public radius: number) {\n    super()\n  }\n  getArea(): number {\n    return Math.PI * this.radius ** 2\n  }\n}\n\n// 属性初始化\nclass Person {\n  name: string\n  age: number = 0\n  email?: string  // 可选属性\n  constructor(name: string) {\n    this.name = name\n  }\n}</code></pre>',
    tags: ['类', '继承', '抽象类']
  },
  'ts-interface': {
    title: '接口',
    body: '<p class="lead">接口定义对象的结构，支持扩展和实现。</p><pre><code>// 基本接口\ninterface Person {\n  name: string\n  age: number\n  greet(): void\n}\n\n// 实现接口\nclass Student implements Person {\n  name: string\n  age: number\n  grade: number\n  constructor(name: string, age: number, grade: number) {\n    this.name = name\n    this.age = age\n    this.grade = grade\n  }\n  greet(): void {\n    console.log(`Hi, I\'m ${this.name}`)\n  }\n}\n\n// 接口扩展\ninterface Employee extends Person {\n  employeeId: number\n}\n\n// 合并声明（同名接口自动合并）\ninterface Box {\n  height: number\n}\ninterface Box {\n  width: number\n}\n// 最终 Box 有 height 和 width\n\n// 函数类型接口\ninterface SearchFunc {\n  (source: string, subString: string): boolean\n}\nconst mySearch: SearchFunc = (src, sub) =&gt; src.includes(sub)\n\n// 索引类型接口\ninterface StringArray {\n  [index: number]: string\n}\n\n// 接口与类型别名区别\n// - 接口可以合并，类型别名不能\n// - 接口只能描述对象，类型别名可以描述任何类型</code></pre>',
    tags: ['接口', 'implements', 'extends']
  },
  'ts-modifiers': {
    title: '访问修饰符',
    body: '<p class="lead">访问修饰符控制类成员的可访问性。</p><pre><code>class Base {\n  public publicField: string = "public"      // 默认，任意访问\n  private privateField: string = "private"   // 仅类内部\n  protected protectedField: string = "protected"  // 类内部和子类\n  readonly readOnlyField: string = "readonly"     // 只读\n  \n  // 参数属性（简写）\n  constructor(public name: string, private age: number) {}\n  \n  public getAge(): number {\n    return this.age\n  }\n}\n\nclass Derived extends Base {\n  showFields(): void {\n    console.log(this.publicField)      // OK\n    console.log(this.protectedField)   // OK\n    // console.log(this.privateField)  // 错误\n    console.log(this.readOnlyField)    // OK\n    // this.readOnlyField = "new"      // 错误\n  }\n}\n\n// 私有字段（ES2022 私有字段语法）\nclass PrivateField {\n  #privateField = 42\n  getPrivate() {\n    return this.#privateField\n  }\n}\n\n// 静态成员\nclass StaticClass {\n  static staticProperty: string = "static"\n  static staticMethod(): void {\n    console.log("static method")\n  }\n}\nconsole.log(StaticClass.staticProperty)\nStaticClass.staticMethod()</code></pre>',
    tags: ['public', 'private', 'protected', 'readonly']
  },
  'ts-modules': {
    title: '模块系统',
    body: '<p class="lead">TypeScript 支持 ES 模块和 CommonJS 模块。</p><pre><code>// math.ts\nexport function add(a: number, b: number): number {\n  return a + b\n}\nexport const PI = 3.14159\nexport default class Calculator {\n  multiply(a: number, b: number): number {\n    return a * b\n  }\n}\n\n// app.ts\nimport Calculator, { add, PI as piValue } from "./math.js"\nimport * as math from "./math.js"\n\nconst result = add(5, 3)\nconst calc = new Calculator()\n\n// 类型导出\n// types.ts\nexport interface User {\n  id: number\n  name: string\n}\nexport type Status = "active" | "inactive"\n\n// 重新导出\nexport { add } from "./math.js"\nexport * from "./types.js"\n\n// 三斜线指令（声明文件依赖）\n/// &lt;reference types="node" /&gt;</code></pre>',
    tags: ['模块', 'export', 'import']
  },
  'ts-declaration': {
    title: '声明文件',
    body: '<p class="lead">声明文件为 JavaScript 库提供类型信息。</p><pre><code>// lodash.d.ts（手动声明）\ndeclare module "lodash" {\n  export function chunk&lt;T&gt;(array: T[], size: number): T[][]\n  export function cloneDeep&lt;T&gt;(value: T): T\n  export function debounce&lt;F extends (...args: any[]) =&gt; any&gt;(\n    func: F,\n    wait?: number,\n    options?: { leading?: boolean; trailing?: boolean }\n  ): F\n}\n\n// 全局类型声明\ndeclare global {\n  interface Window {\n    myGlobalFunction: () =&gt; void\n  }\n}\n\n// 声明模块\n/// &lt;reference types="node" /&gt;\ndeclare module "*.jpg" {\n  const src: string\n  export default src\n}\n\n// 声明命名空间\ndeclare namespace MyLib {\n  function doSomething(): void\n  namespace inner {\n    const value: number\n  }\n}\n\n// 环境变量声明\ndeclare const process: {\n  env: {\n    NODE_ENV: "development" | "production"\n    API_KEY: string\n  }\n}</code></pre>',
    tags: ['声明文件', '.d.ts', '类型定义']
  },
  'ts-namespaces': {
    title: '命名空间',
    body: '<p class="lead">命名空间用于组织代码，避免命名冲突（旧特性，推荐使用模块）。</p><pre><code>// 命名空间定义\nnamespace Validation {\n  export interface StringValidator {\n    isAcceptable(s: string): boolean\n  }\n  \n  export class LettersOnlyValidator implements StringValidator {\n    isAcceptable(s: string): boolean {\n      return /^[A-Za-z]+$/.test(s)\n    }\n  }\n  \n  export class ZipCodeValidator implements StringValidator {\n    isAcceptable(s: string): boolean {\n      return s.length === 5 && /^\\d+$/.test(s)\n    }\n  }\n}\n\n// 使用命名空间\nconst validator = new Validation.LettersOnlyValidator()\nconsole.log(validator.isAcceptable("Hello"))\n\n// 分离命名空间（同名自动合并）\n// shapes.ts\nnamespace Shapes {\n  export class Circle {}\n}\n\n// shapes-extended.ts\nnamespace Shapes {\n  export class Square {}\n}\n// Shapes 包含 Circle 和 Square\n\n// 三斜线指令引用\n/// &lt;reference path="validation.ts" /&gt;\n\n// 导入命名空间\nimport LettersOnlyValidator = Validation.LettersOnlyValidator</code></pre>',
    tags: ['命名空间', 'namespace', '组织代码']
  },
  'ts-config': {
    title: 'tsconfig.json',
    body: '<p class="lead">tsconfig.json 是 TypeScript 项目的配置文件。</p><pre><code>{\n  "compilerOptions": {\n    // 语言和环境\n    "target": "ES2020",\n    "lib": ["ES2020", "DOM"],\n    "jsx": "react-jsx",\n    "experimentalDecorators": true,\n    \n    // 模块解析\n    "module": "ESNext",\n    "moduleResolution": "bundler",\n    "baseUrl": ".",\n    "paths": {\n      "@/*": ["src/*"]\n    },\n    "resolveJsonModule": true,\n    \n    // 输出\n    "outDir": "./dist",\n    "rootDir": "./src",\n    "declaration": true,\n    "declarationMap": true,\n    "sourceMap": true,\n    \n    // 类型检查\n    "strict": true,\n    "noImplicitAny": true,\n    "strictNullChecks": true,\n    "noUnusedLocals": true,\n    "noUnusedParameters": true,\n    "noImplicitReturns": true,\n    "noFallthroughCasesInSwitch": true,\n    \n    // 其他\n    "allowSyntheticDefaultImports": true,\n    "esModuleInterop": true,\n    "skipLibCheck": true,\n    "forceConsistentCasingInFileNames": true\n  },\n  "include": ["src/**/*"],\n  "exclude": ["node_modules", "dist"]\n}</code></pre>',
    tags: ['tsconfig', '配置', 'compilerOptions']
  },
  'ts-compiler': {
    title: '编译器选项',
    body: '<p class="lead">TypeScript 编译器提供丰富的命令行选项。</p><pre><code># 基本命令\nnpx tsc                           # 编译项目\nnpx tsc --watch                   # 监听模式\nnpx tsc --noEmit                  # 只检查类型，不生成文件\nnpx tsc --declaration             # 生成 .d.ts 文件\nnpx tsc --sourceMap               # 生成 source map\nnpx tsc --outDir ./dist           # 指定输出目录\nnpx tsc --target ES2020           # 指定目标版本\n\n# 严格检查选项\n--strict                          # 启用所有严格检查\n--noImplicitAny                   # 禁止隐式 any\n--strictNullChecks                # 严格空值检查\n--noUnusedLocals                  # 检查未使用变量\n--noUnusedParameters              # 检查未使用参数\n\n# 模块相关\n--module CommonJS                 # 模块格式\n--esModuleInterop                 # ES 模块互操作\n--resolveJsonModule               # 支持导入 JSON\n\n# 输出控制\n--outFile bundle.js               # 合并输出\n--removeComments                  # 移除注释\n--pretty                          # 美化输出</code></pre>',
    tags: ['编译器', 'tsc', '命令行']
  },
  'ts-decorators': {
    title: '装饰器',
    body: '<p class="lead">装饰器提供元编程能力，需要在 tsconfig.json 中启用 experimentalDecorators。</p><pre><code>// 类装饰器\nfunction sealed(constructor: Function) {\n  Object.seal(constructor)\n  Object.seal(constructor.prototype)\n}\n\n@sealed\nclass Greeter {\n  greeting: string\n  constructor(message: string) {\n    this.greeting = message\n  }\n  greet() {\n    return this.greeting\n  }\n}\n\n// 方法装饰器\nfunction log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {\n  const original = descriptor.value\n  descriptor.value = function(...args: any[]) {\n    console.log(`Calling ${propertyKey} with`, args)\n    return original.apply(this, args)\n  }\n}\n\nclass Calculator {\n  @log\n  add(a: number, b: number): number {\n    return a + b\n  }\n}\n\n// 属性装饰器\nfunction defaultValue(value: any) {\n  return function(target: any, propertyKey: string) {\n    let val = value\n    Object.defineProperty(target, propertyKey, {\n      get: () =&gt; val,\n      set: (newVal) =&gt; { val = newVal }\n    })\n  }\n}\n\nclass User {\n  @defaultValue("Anonymous")\n  name: string\n}\n\n// 参数装饰器\nfunction required(target: any, propertyKey: string, parameterIndex: number) {\n  console.log(`Parameter ${parameterIndex} of ${propertyKey} is required`)\n}</code></pre>',
    tags: ['装饰器', 'experimentalDecorators', '元编程']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 TypeScript 官方文档获取更多信息。</p>',
        tags: ['TypeScript', '类型系统']
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

addLink('ts-intro', 'ts-setup')
addLink('ts-setup', 'ts-basics')
addLink('ts-basics', 'ts-type-annotations')
addLink('ts-type-annotations', 'ts-primitive')
addLink('ts-type-annotations', 'ts-array-tuple')
addLink('ts-type-annotations', 'ts-object')
addLink('ts-type-annotations', 'ts-union-intersection')
addLink('ts-type-annotations', 'ts-literal')
addLink('ts-type-annotations', 'ts-enum')
addLink('ts-generics', 'ts-utility')
addLink('ts-utility', 'ts-mapped')
addLink('ts-utility', 'ts-conditional')
addLink('ts-conditional', 'ts-template-literal')
addLink('ts-functions', 'ts-classes')
addLink('ts-classes', 'ts-interface')
addLink('ts-classes', 'ts-modifiers')
addLink('ts-modules', 'ts-declaration')
addLink('ts-modules', 'ts-namespaces')
addLink('ts-config', 'ts-compiler')
addLink('ts-compiler', 'ts-decorators')

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