<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">Ant Design 知识库</h1>
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
          <h2>🐜 <span class="gradient-text">Ant Design 完全指南</span></h2>
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
          <p>🐜 企业级 UI 设计语言 | React 组件库</p>
          <p>✨ 点击节点双向联动 | 开箱即用</p>
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
          <h3>🔗 Ant Design 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'AntD用户'
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

// ========== Ant Design 导航数据 ==========
const navSections = ref([
  { title: '🚀 快速入门', items: [
      { id: 'antd-intro', label: 'Ant Design 简介', hot: true },
      { id: 'antd-install', label: '安装与配置', hot: true },
      { id: 'antd-import', label: '按需导入', hot: true },
      { id: 'antd-theme', label: '主题定制', hot: true }
    ]},
  { title: '🎨 通用组件', items: [
      { id: 'antd-button', label: 'Button 按钮', hot: true },
      { id: 'antd-icon', label: 'Icon 图标', hot: true },
      { id: 'antd-typography', label: 'Typography 排版', hot: true },
      { id: 'antd-divider', label: 'Divider 分割线', hot: true },
      { id: 'antd-space', label: 'Space 间距', hot: true }
    ]},
  { title: '📋 布局组件', items: [
      { id: 'antd-grid', label: 'Grid 栅格', hot: true },
      { id: 'antd-layout', label: 'Layout 布局', hot: true },
      { id: 'antd-card', label: 'Card 卡片', hot: true },
      { id: 'antd-tabs', label: 'Tabs 标签页', hot: true }
    ]},
  { title: '🔧 导航组件', items: [
      { id: 'antd-menu', label: 'Menu 菜单', hot: true },
      { id: 'antd-dropdown', label: 'Dropdown 下拉菜单', hot: true },
      { id: 'antd-breadcrumb', label: 'Breadcrumb 面包屑', hot: true },
      { id: 'antd-pagination', label: 'Pagination 分页', hot: true }
    ]},
  { title: '📊 数据展示', items: [
      { id: 'antd-table', label: 'Table 表格', hot: true },
      { id: 'antd-list', label: 'List 列表', hot: true },
      { id: 'antd-tree', label: 'Tree 树形控件', hot: true },
      { id: 'antd-avatar', label: 'Avatar 头像', hot: true },
      { id: 'antd-badge', label: 'Badge 徽标', hot: true },
      { id: 'antd-tag', label: 'Tag 标签', hot: true }
    ]},
  { title: '📝 数据录入', items: [
      { id: 'antd-form', label: 'Form 表单', hot: true },
      { id: 'antd-input', label: 'Input 输入框', hot: true },
      { id: 'antd-select', label: 'Select 选择器', hot: true },
      { id: 'antd-datepicker', label: 'DatePicker 日期选择', hot: true },
      { id: 'antd-upload', label: 'Upload 上传', hot: true }
    ]},
  { title: '💬 反馈组件', items: [
      { id: 'antd-modal', label: 'Modal 对话框', hot: true },
      { id: 'antd-message', label: 'Message 全局提示', hot: true },
      { id: 'antd-notification', label: 'Notification 通知', hot: true },
      { id: 'antd-popconfirm', label: 'Popconfirm 气泡确认', hot: true },
      { id: 'antd-spin', label: 'Spin 加载中', hot: true }
    ]}
])

const selectedId = ref('antd-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== Ant Design 内容映射表 ==========
const contentMap = {
  'antd-intro': {
    title: 'Ant Design 简介',
    body: '<p class="lead">Ant Design 是蚂蚁集团出品的企业级 UI 设计语言和 React 组件库，用于研发企业级中后台产品。</p><h3>核心特点</h3><ul><li><strong>企业级</strong>：专为中后台产品设计</li><li><strong>开箱即用</strong>：高质量 React 组件</li><li><strong>主题定制</strong>：支持 Less 变量和动态主题</li><li><strong>国际化</strong>：多语言支持</li><li><strong>TypeScript</strong>：完整的类型定义</li></ul><div class="note">💡 Ant Design 由蚂蚁集团体验技术部开发，是目前最流行的 React UI 框架之一。</div>',
    tags: ['React', 'UI组件库', '企业级']
  },
  'antd-install': {
    title: '安装与配置',
    body: '<p class="lead">Ant Design 可以通过 npm 或 yarn 安装。</p><pre><code>// npm 安装\nnpm install antd\n\n// yarn 安装\nyarn add antd\n\n// 在 React 中引入\nimport { Button, DatePicker } from "antd"\nimport "antd/dist/reset.css"\n\n// 完整引入样式\nimport "antd/dist/antd.css"\n\n// 使用\nconst App = () =&gt; (\n  &lt;Button type="primary"&gt;按钮&lt;/Button&gt;\n)</code></pre>',
    tags: ['安装', 'npm', 'React']
  },
  'antd-import': {
    title: '按需导入',
    body: '<p class="lead">按需导入可以减少打包体积。</p><pre><code>// 手动按需导入\nimport Button from "antd/lib/button"\nimport "antd/lib/button/style/css"\n\n// 使用 babel-plugin-import（推荐）\n// .babelrc 或 babel.config.js\n{\n  "plugins": [\n    ["import", {\n      "libraryName": "antd",\n      "libraryDirectory": "es",\n      "style": "css"\n    }]\n  ]\n}\n\n// 然后在代码中直接导入\nimport { Button, Table, Form } from "antd"\n\n// Vite 中使用\n// vite.config.js\nimport Components from "unplugin-vue-components/vite"\nimport { AntDesignVueResolver } from "unplugin-vue-components/resolvers"\n\n// Next.js 中使用\n// next.config.js\nconst withAntd = require("next-plugin-antd-less")</code></pre>',
    tags: ['按需导入', 'babel-plugin-import', '优化']
  },
  'antd-theme': {
    title: '主题定制',
    body: '<p class="lead">Ant Design 支持主题定制，可以修改 Less 变量。</p><pre><code>// 方式一：修改 Less 变量\n// 创建 theme.less\n@import "~antd/lib/style/themes/default.less";\n@primary-color: #8B5CF6;  // 自定义主题色\n\n// webpack.config.js\nmodule.exports = {\n  module: {\n    rules: [{\n      test: /\\.less$/,\n      use: [\n        "style-loader",\n        "css-loader",\n        {\n          loader: "less-loader",\n          options: {\n            lessOptions: {\n              modifyVars: {\n                "@primary-color": "#8B5CF6"\n              },\n              javascriptEnabled: true\n            }\n          }\n        }\n      ]\n    }]\n  }\n}\n\n// 方式二：ConfigProvider 动态主题（5.0+）\nimport { ConfigProvider, Button } from "antd"\n\nconst App = () =&gt; (\n  &lt;ConfigProvider theme={{\n    token: {\n      colorPrimary: "#8B5CF6",\n      borderRadius: 6\n    }\n  }}&gt;\n    &lt;Button type="primary"&gt;按钮&lt;/Button&gt;\n  &lt;/ConfigProvider&gt;\n)</code></pre>',
    tags: ['主题定制', 'ConfigProvider', 'Less变量']
  },
  'antd-button': {
    title: 'Button 按钮',
    body: '<p class="lead">按钮用于开始一个即时操作。</p><pre><code>import { Button } from "antd"\n\n// 按钮类型\n&lt;Button type="primary"&gt;主要按钮&lt;/Button&gt;\n&lt;Button&gt;默认按钮&lt;/Button&gt;\n&lt;Button type="dashed"&gt;虚线按钮&lt;/Button&gt;\n&lt;Button type="text"&gt;文本按钮&lt;/Button&gt;\n&lt;Button type="link"&gt;链接按钮&lt;/Button&gt;\n\n// 按钮状态\n&lt;Button disabled&gt;禁用状态&lt;/Button&gt;\n&lt;Button loading&gt;加载中&lt;/Button&gt;\n\n// 按钮尺寸\n&lt;Button size="large"&gt;大按钮&lt;/Button&gt;\n&lt;Button size="middle"&gt;中按钮&lt;/Button&gt;\n&lt;Button size="small"&gt;小按钮&lt;/Button&gt;\n\n// 按钮形状\n&lt;Button shape="circle" icon={&lt;SearchOutlined /&gt;} /&gt;\n&lt;Button shape="round"&gt;圆角按钮&lt;/Button&gt;</code></pre>',
    tags: ['Button', '按钮', '组件']
  },
  'antd-icon': {
    title: 'Icon 图标',
    body: '<p class="lead">Ant Design 提供丰富的 SVG 图标。</p><pre><code>import { HomeOutlined, UserOutlined, SettingOutlined } from "@ant-design/icons"\n\n// 使用图标\n&lt;HomeOutlined /&gt;\n&lt;UserOutlined style={{ fontSize: "20px", color: "#1890ff" }} /&gt;\n&lt;SettingOutlined spin /&gt;\n\n// 按钮中的图标\n&lt;Button type="primary" icon={&lt;SearchOutlined /&gt;}&gt;搜索&lt;/Button&gt;\n\n// 自定义图标\nimport Icon from "@ant-design/icons"\nconst HeartSvg = () =&gt; (\n  &lt;svg width="1em" height="1em" viewBox="0 0 24 24"&gt;\n    &lt;path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/&gt;\n  &lt;/svg&gt;\n)\nconst HeartIcon = (props) =&gt; &lt;Icon component={HeartSvg} {...props} /&gt;</code></pre>',
    tags: ['Icon', '图标', '@ant-design/icons']
  },
  'antd-typography': {
    title: 'Typography 排版',
    body: '<p class="lead">排版组件用于展示标题、段落、文本等内容。</p><pre><code>import { Typography } from "antd"\nconst { Title, Paragraph, Text, Link } = Typography\n\n&lt;Title&gt;h1 标题&lt;/Title&gt;\n&lt;Title level={2}&gt;h2 标题&lt;/Title&gt;\n&lt;Title level={3}&gt;h3 标题&lt;/Title&gt;\n\n&lt;Paragraph&gt;这是一段文本内容。&lt;/Paragraph&gt;\n&lt;Paragraph copyable&gt;可复制的文本&lt;/Paragraph&gt;\n&lt;Paragraph ellipsis&gt;超出省略的文本内容...&lt;/Paragraph&gt;\n\n&lt;Text type="secondary"&gt;次要文本&lt;/Text&gt;\n&lt;Text type="success"&gt;成功文本&lt;/Text&gt;\n&lt;Text type="danger"&gt;危险文本&lt;/Text&gt;\n&lt;Text mark&gt;标记文本&lt;/Text&gt;\n&lt;Text code&gt;代码文本&lt;/Text&gt;\n\n&lt;Link href="https://ant.design" target="_blank"&gt;Ant Design 链接&lt;/Link&gt;</code></pre>',
    tags: ['Typography', '排版', '文本']
  },
  'antd-divider': {
    title: 'Divider 分割线',
    body: '<p class="lead">分割线用于分隔内容。</p><pre><code>import { Divider } from "antd"\n\n&lt;Divider /&gt;\n&lt;Divider dashed /&gt;\n&lt;Divider orientation="left"&gt;左侧文字&lt;/Divider&gt;\n&lt;Divider orientation="right"&gt;右侧文字&lt;/Divider&gt;\n&lt;Divider orientation="center"&gt;居中文字&lt;/Divider&gt;\n\n&lt;Divider plain&gt;普通分割线&lt;/Divider&gt;\n\n&lt;Divider&gt;\n  &lt;PlusOutlined /&gt; 自定义内容\n&lt;/Divider&gt;</code></pre>',
    tags: ['Divider', '分割线', '分隔符']
  },
  'antd-space': {
    title: 'Space 间距',
    body: '<p class="lead">Space 用于设置组件之间的间距。</p><pre><code>import { Space, Button, Tag } from "antd"\n\n&lt;Space&gt;\n  &lt;Button&gt;按钮1&lt;/Button&gt;\n  &lt;Button&gt;按钮2&lt;/Button&gt;\n  &lt;Button&gt;按钮3&lt;/Button&gt;\n&lt;/Space&gt;\n\n&lt;Space size="large"&gt;\n  &lt;Tag&gt;标签1&lt;/Tag&gt;\n  &lt;Tag&gt;标签2&lt;/Tag&gt;\n&lt;/Space&gt;\n\n&lt;Space direction="vertical"&gt;\n  &lt;Button&gt;垂直按钮1&lt;/Button&gt;\n  &lt;Button&gt;垂直按钮2&lt;/Button&gt;\n&lt;/Space&gt;\n\n&lt;Space wrap&gt;\n  &lt;Button&gt;自动换行1&lt;/Button&gt;\n  &lt;Button&gt;自动换行2&lt;/Button&gt;\n&lt;/Space&gt;</code></pre>',
    tags: ['Space', '间距', '布局']
  },
  'antd-grid': {
    title: 'Grid 栅格',
    body: '<p class="lead">Grid 栅格系统用于布局，基于 24 列。</p><pre><code>import { Row, Col } from "antd"\n\n&lt;Row&gt;\n  &lt;Col span={12}&gt;col-12&lt;/Col&gt;\n  &lt;Col span={12}&gt;col-12&lt;/Col&gt;\n&lt;/Row&gt;\n\n&lt;Row gutter={16}&gt;\n  &lt;Col span={8}&gt;col-8&lt;/Col&gt;\n  &lt;Col span={8}&gt;col-8&lt;/Col&gt;\n  &lt;Col span={8}&gt;col-8&lt;/Col&gt;\n&lt;/Row&gt;\n\n&lt;Row justify="center" align="middle"&gt;\n  &lt;Col span={6}&gt;居中&lt;/Col&gt;\n&lt;/Row&gt;\n\n&lt;Row&gt;\n  &lt;Col xs={24} sm={12} md={8} lg={6} xl={4}&gt;响应式列&lt;/Col&gt;\n&lt;/Row&gt;</code></pre>',
    tags: ['Grid', '栅格', 'Row/Col']
  },
  'antd-layout': {
    title: 'Layout 布局',
    body: '<p class="lead">Layout 组件用于搭建页面基本结构。</p><pre><code>import { Layout, Menu } from "antd"\nconst { Header, Sider, Content, Footer } = Layout\n\n&lt;Layout&gt;\n  &lt;Header&gt;Header&lt;/Header&gt;\n  &lt;Layout&gt;\n    &lt;Sider&gt;Sider&lt;/Sider&gt;\n    &lt;Content&gt;Content&lt;/Content&gt;\n  &lt;/Layout&gt;\n  &lt;Footer&gt;Footer&lt;/Footer&gt;\n&lt;/Layout&gt;\n\n// 侧边栏布局\n&lt;Layout hasSider&gt;\n  &lt;Sider collapsible&gt;可折叠侧边栏&lt;/Sider&gt;\n  &lt;Content&gt;主内容区&lt;/Content&gt;\n&lt;/Layout&gt;</code></pre>',
    tags: ['Layout', '布局', 'Header/Sider']
  },
  'antd-card': {
    title: 'Card 卡片',
    body: '<p class="lead">卡片用于承载内容。</p><pre><code>import { Card } from "antd"\n\n&lt;Card title="卡片标题" extra={&lt;a href="#"&gt;更多&lt;/a&gt;} style={{ width: 300 }}&gt;\n  &lt;p&gt;卡片内容&lt;/p&gt;\n  &lt;p&gt;这里是卡片的内容区域&lt;/p&gt;\n&lt;/Card&gt;\n\n&lt;Card hoverable&gt;可悬浮卡片&lt;/Card&gt;\n\n&lt;Card loading&gt;加载中...&lt;/Card&gt;\n\n&lt;Card\n  cover={&lt;img alt="example" src="image.jpg" /&gt;}\n  actions={[&lt;EditOutlined /&gt;, &lt;DeleteOutlined /&gt;]}\n&gt;\n  &lt;Card.Meta title="卡片标题" description="卡片描述" /&gt;\n&lt;/Card&gt;</code></pre>',
    tags: ['Card', '卡片', '容器']
  },
  'antd-tabs': {
    title: 'Tabs 标签页',
    body: '<p class="lead">Tabs 用于切换不同视图。</p><pre><code>import { Tabs } from "antd"\n\n&lt;Tabs&gt;\n  &lt;Tabs.TabPane tab="标签1" key="1"&gt;内容1&lt;/Tabs.TabPane&gt;\n  &lt;Tabs.TabPane tab="标签2" key="2"&gt;内容2&lt;/Tabs.TabPane&gt;\n  &lt;Tabs.TabPane tab="标签3" key="3"&gt;内容3&lt;/Tabs.TabPane&gt;\n&lt;/Tabs&gt;\n\n&lt;Tabs type="card"&gt;\n  &lt;Tabs.TabPane tab="卡片标签1" key="1"&gt;内容1&lt;/Tabs.TabPane&gt;\n  &lt;Tabs.TabPane tab="卡片标签2" key="2"&gt;内容2&lt;/Tabs.TabPane&gt;\n&lt;/Tabs&gt;\n\n&lt;Tabs tabPosition="left"&gt;\n  &lt;Tabs.TabPane tab="左侧标签1" key="1"&gt;内容1&lt;/Tabs.TabPane&gt;\n&lt;/Tabs&gt;</code></pre>',
    tags: ['Tabs', '标签页', 'TabPane']
  },
  'antd-menu': {
    title: 'Menu 菜单',
    body: '<p class="lead">Menu 用于页面导航。</p><pre><code>import { Menu } from "antd"\n\n&lt;Menu mode="horizontal"&gt;\n  &lt;Menu.Item key="home"&gt;首页&lt;/Menu.Item&gt;\n  &lt;Menu.Item key="about"&gt;关于&lt;/Menu.Item&gt;\n  &lt;Menu.Item key="contact"&gt;联系&lt;/Menu.Item&gt;\n&lt;/Menu&gt;\n\n&lt;Menu mode="inline"&gt;\n  &lt;Menu.SubMenu key="sub1" title="导航一"&gt;\n    &lt;Menu.Item key="1"&gt;选项1&lt;/Menu.Item&gt;\n    &lt;Menu.Item key="2"&gt;选项2&lt;/Menu.Item&gt;\n  &lt;/Menu.SubMenu&gt;\n  &lt;Menu.SubMenu key="sub2" title="导航二"&gt;\n    &lt;Menu.Item key="3"&gt;选项3&lt;/Menu.Item&gt;\n    &lt;Menu.Item key="4"&gt;选项4&lt;/Menu.Item&gt;\n  &lt;/Menu.SubMenu&gt;\n&lt;/Menu&gt;</code></pre>',
    tags: ['Menu', '菜单', '导航']
  },
  'antd-dropdown': {
    title: 'Dropdown 下拉菜单',
    body: '<p class="lead">Dropdown 用于触发下拉菜单。</p><pre><code>import { Dropdown, Menu, Button } from "antd"\n\nconst menu = (\n  &lt;Menu&gt;\n    &lt;Menu.Item&gt;选项1&lt;/Menu.Item&gt;\n    &lt;Menu.Item&gt;选项2&lt;/Menu.Item&gt;\n    &lt;Menu.Divider /&gt;\n    &lt;Menu.Item&gt;选项3&lt;/Menu.Item&gt;\n  &lt;/Menu&gt;\n)\n\n&lt;Dropdown overlay={menu}&gt;\n  &lt;Button&gt;下拉菜单&lt;/Button&gt;\n&lt;/Dropdown&gt;\n\n&lt;Dropdown overlay={menu} placement="topLeft"&gt;\n  &lt;Button&gt;向上展开&lt;/Button&gt;\n&lt;/Dropdown&gt;\n\n&lt;Dropdown overlay={menu} disabled&gt;\n  &lt;Button&gt;禁用状态&lt;/Button&gt;\n&lt;/Dropdown&gt;</code></pre>',
    tags: ['Dropdown', '下拉菜单', '菜单']
  },
  'antd-breadcrumb': {
    title: 'Breadcrumb 面包屑',
    body: '<p class="lead">面包屑用于显示当前页面路径。</p><pre><code>import { Breadcrumb } from "antd"\n\n&lt;Breadcrumb&gt;\n  &lt;Breadcrumb.Item&gt;首页&lt;/Breadcrumb.Item&gt;\n  &lt;Breadcrumb.Item&gt;列表页&lt;/Breadcrumb.Item&gt;\n  &lt;Breadcrumb.Item&gt;详情页&lt;/Breadcrumb.Item&gt;\n&lt;/Breadcrumb&gt;\n\n&lt;Breadcrumb separator="&gt;"&gt;\n  &lt;Breadcrumb.Item&gt;首页&lt;/Breadcrumb.Item&gt;\n  &lt;Breadcrumb.Item&gt;用户管理&lt;/Breadcrumb.Item&gt;\n&lt;/Breadcrumb&gt;\n\n&lt;Breadcrumb&gt;\n  &lt;Breadcrumb.Item&gt;\n    &lt;HomeOutlined /&gt; &lt;span&gt;首页&lt;/span&gt;\n  &lt;/Breadcrumb.Item&gt;\n  &lt;Breadcrumb.Item&gt;\n    &lt;UserOutlined /&gt; &lt;span&gt;用户中心&lt;/span&gt;\n  &lt;/Breadcrumb.Item&gt;\n&lt;/Breadcrumb&gt;</code></pre>',
    tags: ['Breadcrumb', '面包屑', '导航']
  },
  'antd-pagination': {
    title: 'Pagination 分页',
    body: '<p class="lead">分页用于数据分页展示。</p><pre><code>import { Pagination } from "antd"\n\n&lt;Pagination defaultCurrent={1} total={50} /&gt;\n\n&lt;Pagination\n  showSizeChanger\n  showQuickJumper\n  defaultCurrent={1}\n  total={100}\n  onChange={(page, pageSize) =&gt; console.log(page, pageSize)}\n/&gt;\n\n&lt;Pagination simple defaultCurrent={1} total={50} /&gt;\n\n&lt;Pagination\n  total={500}\n  showTotal={(total, range) =&gt; `${range[0]}-${range[1]} of ${total} items`}\n  defaultPageSize={20}\n/&gt;</code></pre>',
    tags: ['Pagination', '分页', '翻页']
  },
  'antd-table': {
    title: 'Table 表格',
    body: '<p class="lead">表格用于展示数据。</p><pre><code>import { Table } from "antd"\n\nconst columns = [\n  { title: "姓名", dataIndex: "name", key: "name" },\n  { title: "年龄", dataIndex: "age", key: "age" },\n  { title: "地址", dataIndex: "address", key: "address" },\n]\n\nconst data = [\n  { key: "1", name: "张三", age: 32, address: "北京" },\n  { key: "2", name: "李四", age: 28, address: "上海" },\n]\n\n&lt;Table columns={columns} dataSource={data} /&gt;\n\n&lt;Table\n  columns={columns}\n  dataSource={data}\n  pagination={{ pageSize: 10 }}\n  rowSelection={{ type: "checkbox" }}\n/&gt;</code></pre>',
    tags: ['Table', '表格', '数据展示']
  },
  'antd-list': {
    title: 'List 列表',
    body: '<p class="lead">列表用于展示数据列表。</p><pre><code>import { List, Avatar } from "antd"\n\nconst data = [\n  { title: "标题1", description: "描述1" },\n  { title: "标题2", description: "描述2" },\n]\n\n&lt;List\n  header={&lt;div&gt;头部&lt;/div&gt;}\n  footer={&lt;div&gt;底部&lt;/div&gt;}\n  bordered\n  dataSource={data}\n  renderItem={(item) =&gt; (\n    &lt;List.Item&gt;\n      &lt;List.Item.Meta\n        avatar={&lt;Avatar src="avatar.jpg" /&gt;}\n        title={item.title}\n        description={item.description}\n      /&gt;\n    &lt;/List.Item&gt;\n  )}\n/&gt;</code></pre>',
    tags: ['List', '列表', '数据展示']
  },
  'antd-tree': {
    title: 'Tree 树形控件',
    body: '<p class="lead">树形控件用于展示层级数据。</p><pre><code>import { Tree } from "antd"\n\nconst treeData = [\n  {\n    title: "父节点1",\n    key: "0-0",\n    children: [\n      { title: "子节点1-1", key: "0-0-0" },\n      { title: "子节点1-2", key: "0-0-1" },\n    ],\n  },\n  {\n    title: "父节点2",\n    key: "0-1",\n    children: [{ title: "子节点2-1", key: "0-1-0" }],\n  },\n]\n\n&lt;Tree\n  treeData={treeData}\n  defaultExpandAll\n  onSelect={(keys, info) =&gt; console.log(keys, info)}\n/&gt;</code></pre>',
    tags: ['Tree', '树形控件', '层级']
  },
  'antd-avatar': {
    title: 'Avatar 头像',
    body: '<p class="lead">头像用于展示用户头像。</p><pre><code>import { Avatar } from "antd"\n\n&lt;Avatar src="avatar.jpg" /&gt;\n&lt;Avatar size={64} icon={&lt;UserOutlined /&gt;} /&gt;\n&lt;Avatar size="large"&gt;U&lt;/Avatar&gt;\n&lt;Avatar shape="square"&gt;A&lt;/Avatar&gt;\n\n&lt;Avatar.Group maxCount={2}&gt;\n  &lt;Avatar src="avatar1.jpg" /&gt;\n  &lt;Avatar src="avatar2.jpg" /&gt;\n  &lt;Avatar src="avatar3.jpg" /&gt;\n&lt;/Avatar.Group&gt;</code></pre>',
    tags: ['Avatar', '头像', '用户']
  },
  'antd-badge': {
    title: 'Badge 徽标',
    body: '<p class="lead">徽标用于显示通知数量。</p><pre><code>import { Badge, Avatar } from "antd"\n\n&lt;Badge count={5}&gt;\n  &lt;Avatar shape="square" size="large" /&gt;\n&lt;/Badge&gt;\n\n&lt;Badge dot&gt;\n  &lt;Avatar shape="square" size="large" /&gt;\n&lt;/Badge&gt;\n\n&lt;Badge count={100} overflowCount={99}&gt;\n  &lt;Avatar shape="square" size="large" /&gt;\n&lt;/Badge&gt;\n\n&lt;Badge status="success" /&gt;\n&lt;Badge status="error" /&gt;\n&lt;Badge status="warning" /&gt;\n&lt;Badge status="processing" /&gt;</code></pre>',
    tags: ['Badge', '徽标', '通知']
  },
  'antd-tag': {
    title: 'Tag 标签',
    body: '<p class="lead">标签用于标记和分类。</p><pre><code>import { Tag } from "antd"\n\n&lt;Tag&gt;标签&lt;/Tag&gt;\n&lt;Tag closable&gt;可关闭&lt;/Tag&gt;\n&lt;Tag color="red"&gt;红色标签&lt;/Tag&gt;\n&lt;Tag color="blue"&gt;蓝色标签&lt;/Tag&gt;\n&lt;Tag color="green"&gt;绿色标签&lt;/Tag&gt;\n\n&lt;Tag.CheckableTag checked&gt;可选择标签&lt;/Tag.CheckableTag&gt;</code></pre>',
    tags: ['Tag', '标签', '标记']
  },
  'antd-form': {
    title: 'Form 表单',
    body: '<p class="lead">表单用于数据收集和提交。</p><pre><code>import { Form, Input, Button } from "antd"\n\nconst onFinish = (values) =&gt; console.log(values)\n\n&lt;Form name="basic" onFinish={onFinish}&gt;\n  &lt;Form.Item\n    label="用户名"\n    name="username"\n    rules={[{ required: true, message: "请输入用户名" }]}\n  &gt;\n    &lt;Input /&gt;\n  &lt;/Form.Item&gt;\n\n  &lt;Form.Item\n    label="密码"\n    name="password"\n    rules={[{ required: true, message: "请输入密码" }]}\n  &gt;\n    &lt;Input.Password /&gt;\n  &lt;/Form.Item&gt;\n\n  &lt;Form.Item&gt;\n    &lt;Button type="primary" htmlType="submit"&gt;提交&lt;/Button&gt;\n  &lt;/Form.Item&gt;\n&lt;/Form&gt;</code></pre>',
    tags: ['Form', '表单', '验证']
  },
  'antd-input': {
    title: 'Input 输入框',
    body: '<p class="lead">输入框用于用户输入。</p><pre><code>import { Input } from "antd"\n\n&lt;Input placeholder="请输入" /&gt;\n&lt;Input.Password placeholder="请输入密码" /&gt;\n&lt;Input.TextArea rows={4} placeholder="请输入多行文本" /&gt;\n&lt;Input.Search placeholder="搜索" onSearch={(value) =&gt; console.log(value)} /&gt;\n\n&lt;Input addonBefore="https://" addonAfter=".com" defaultValue="mysite" /&gt;\n\n&lt;Input allowClear showCount maxLength={20} /&gt;</code></pre>',
    tags: ['Input', '输入框', '文本']
  },
  'antd-select': {
    title: 'Select 选择器',
    body: '<p class="lead">选择器用于选择选项。</p><pre><code>import { Select } from "antd"\n\n&lt;Select defaultValue="lucy" style={{ width: 120 }}&gt;\n  &lt;Select.Option value="jack"&gt;Jack&lt;/Select.Option&gt;\n  &lt;Select.Option value="lucy"&gt;Lucy&lt;/Select.Option&gt;\n  &lt;Select.Option value="tom"&gt;Tom&lt;/Select.Option&gt;\n&lt;/Select&gt;\n\n&lt;Select\n  mode="multiple"\n  placeholder="多选"\n  defaultValue={["a", "b"]}\n  style={{ width: 200 }}\n&gt;\n  &lt;Select.Option value="a"&gt;选项A&lt;/Select.Option&gt;\n  &lt;Select.Option value="b"&gt;选项B&lt;/Select.Option&gt;\n&lt;/Select&gt;</code></pre>',
    tags: ['Select', '选择器', '下拉']
  },
  'antd-datepicker': {
    title: 'DatePicker 日期选择',
    body: '<p class="lead">日期选择器用于选择日期。</p><pre><code>import { DatePicker, Space } from "antd"\n\n&lt;DatePicker /&gt;\n&lt;DatePicker picker="week" /&gt;\n&lt;DatePicker picker="month" /&gt;\n&lt;DatePicker picker="quarter" /&gt;\n&lt;DatePicker picker="year" /&gt;\n\n&lt;DatePicker.RangePicker /&gt;\n&lt;DatePicker.RangePicker picker="month" /&gt;</code></pre>',
    tags: ['DatePicker', '日期选择', '时间']
  },
  'antd-upload': {
    title: 'Upload 上传',
    body: '<p class="lead">上传组件用于文件上传。</p><pre><code>import { Upload, Button } from "antd"\n\n&lt;Upload action="/upload"&gt;\n  &lt;Button&gt;点击上传&lt;/Button&gt;\n&lt;/Upload&gt;\n\n&lt;Upload\n  action="/upload"\n  listType="picture-card"\n  defaultFileList={[\n    { uid: "1", name: "image.jpg", url: "image.jpg" },\n  ]}\n&gt;\n  &lt;div&gt;+ 上传&lt;/div&gt;\n&lt;/Upload&gt;</code></pre>',
    tags: ['Upload', '上传', '文件']
  },
  'antd-modal': {
    title: 'Modal 对话框',
    body: '<p class="lead">模态对话框用于重要信息确认。</p><pre><code>import { Modal, Button } from "antd"\n\nconst [isModalOpen, setIsModalOpen] = useState(false)\n\n&lt;Button type="primary" onClick={() =&gt; setIsModalOpen(true)}&gt;打开对话框&lt;/Button&gt;\n\n&lt;Modal\n  title="对话框标题"\n  open={isModalOpen}\n  onOk={() =&gt; setIsModalOpen(false)}\n  onCancel={() =&gt; setIsModalOpen(false)}\n&gt;\n  &lt;p&gt;对话框内容&lt;/p&gt;\n&lt;/Modal&gt;\n\n// 确认对话框\nModal.confirm({\n  title: "确认删除",\n  content: "确定要删除吗？",\n  onOk() { console.log("删除") },\n})</code></pre>',
    tags: ['Modal', '对话框', '弹窗']
  },
  'antd-message': {
    title: 'Message 全局提示',
    body: '<p class="lead">全局提示用于轻量级反馈。</p><pre><code>import { message, Button } from "antd"\n\nmessage.success("操作成功！")\nmessage.error("操作失败！")\nmessage.warning("警告信息！")\nmessage.info("提示信息！")\nmessage.loading("加载中...", 2)\n\n&lt;Button onClick={() =&gt; message.success("成功")}&gt;显示成功&lt;/Button&gt;</code></pre>',
    tags: ['Message', '提示', '反馈']
  },
  'antd-notification': {
    title: 'Notification 通知',
    body: '<p class="lead">通知用于全局提醒。</p><pre><code>import { notification, Button } from "antd"\n\nnotification.open({\n  message: "通知标题",\n  description: "这是通知的详细内容",\n  onClick: () =&gt; console.log("点击通知"),\n})\n\nnotification.success({\n  message: "成功",\n  description: "操作成功！",\n})\n\nnotification.error({\n  message: "错误",\n  description: "操作失败！",\n})</code></pre>',
    tags: ['Notification', '通知', '提醒']
  },
  'antd-popconfirm': {
    title: 'Popconfirm 气泡确认',
    body: '<p class="lead">气泡确认用于删除等危险操作。</p><pre><code>import { Popconfirm, Button } from "antd"\n\n&lt;Popconfirm\n  title="确定要删除吗？"\n  onConfirm={() =&gt; console.log("确认删除")}\n  onCancel={() =&gt; console.log("取消删除")}\n&gt;\n  &lt;Button danger&gt;删除&lt;/Button&gt;\n&lt;/Popconfirm&gt;</code></pre>',
    tags: ['Popconfirm', '确认', '删除']
  },
  'antd-spin': {
    title: 'Spin 加载中',
    body: '<p class="lead">加载中用于数据加载状态。</p><pre><code>import { Spin } from "antd"\n\n&lt;Spin /&gt;\n&lt;Spin size="small" /&gt;\n&lt;Spin size="large" /&gt;\n\n&lt;Spin spinning={true}&gt;\n  &lt;div&gt;内容区域&lt;/div&gt;\n&lt;/Spin&gt;\n\n&lt;Spin tip="加载中..."&gt;\n  &lt;div&gt;内容区域&lt;/div&gt;\n&lt;/Spin&gt;</code></pre>',
    tags: ['Spin', '加载', 'Loading']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 Ant Design 官方文档获取更多信息。</p>',
        tags: ['Ant Design', 'UI组件']
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

addLink('antd-intro', 'antd-install')
addLink('antd-install', 'antd-import')
addLink('antd-import', 'antd-theme')
addLink('antd-button', 'antd-icon')
addLink('antd-icon', 'antd-typography')
addLink('antd-typography', 'antd-divider')
addLink('antd-divider', 'antd-space')
addLink('antd-grid', 'antd-layout')
addLink('antd-layout', 'antd-card')
addLink('antd-card', 'antd-tabs')
addLink('antd-menu', 'antd-dropdown')
addLink('antd-dropdown', 'antd-breadcrumb')
addLink('antd-breadcrumb', 'antd-pagination')
addLink('antd-table', 'antd-list')
addLink('antd-list', 'antd-tree')
addLink('antd-tree', 'antd-avatar')
addLink('antd-avatar', 'antd-badge')
addLink('antd-badge', 'antd-tag')
addLink('antd-form', 'antd-input')
addLink('antd-input', 'antd-select')
addLink('antd-select', 'antd-datepicker')
addLink('antd-datepicker', 'antd-upload')
addLink('antd-modal', 'antd-message')
addLink('antd-message', 'antd-notification')
addLink('antd-notification', 'antd-popconfirm')
addLink('antd-popconfirm', 'antd-spin')

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