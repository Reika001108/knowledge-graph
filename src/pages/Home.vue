<template style="height: 100vh;width: 100vw;">
  <!-- top -->
  <div style="width: 100vw;height: 10vh;background-color: #a89ef6;">
    <!-- logo -->
    <div style="width: 5vw;height: 10vh;float: left;display: flex;align-items: center;justify-content: center; ">
      <img src="./img/logo-w.png" style="max-width: 100%;max-height: 100%;padding: 20%;">
    </div>
    <div style="width: 10vw;float: left;display: flex;  align-items: center;justify-content: center;height: 10vh;color: white;font-size: 18px;">
      知识图谱管理系统
    </div>
  </div>

  <!-- buttom -->
  <div style="width: 100vw;height: 90vh;display: flex;">
    <!-- 左侧导航栏 -->
    <div style="width: 15vw;height: 90vh;background-color: white;float: left;">
        <!-- 知识图谱展示 -->
        <div style="width: 15vw;height: 10vh;display: flex;align-items: center;justify-content: center;font-size: 18px;background-color: #ebeaf0;">
          <i class="fa-solid fa-atom" style="color: rgb(177, 151, 252);"></i>&nbsp;&nbsp;
          知识图谱
        </div>
        <!-- 检索展示 -->
        <div style="width: 15vw;height: 10vh;display: flex;align-items: center;justify-content: center;font-size: 18px;">
          <i class="fa-solid fa-book-atlas" style="color: rgb(177, 151, 252);"></i>&nbsp;&nbsp;
          关联检索
        </div>
        <!-- 智能问答展示 -->
        <div style="width: 15vw;height: 10vh;display: flex;align-items: center;justify-content: center;font-size: 18px;">
          <i class="fa-solid fa-atom" style="color: rgb(177, 151, 252);"></i>&nbsp;&nbsp;
          智能问答
        </div>

    </div>



    <!-- 右侧展示 -->
    <div style="width: 85vw;height: 90vh;float: left;padding: 1vh;">
      <div class="graph-container">
        <!-- 图谱渲染容器 -->
        <div ref="chartRef" class="chart"></div>
      </div>



    </div>
  </div>
  
</template>

<script setup>
import { ref } from 'vue';
import { useCounterStore } from '../store/counter';
import {onMounted, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';
// 1. 初始化 Pinia Store
const counter = useCounterStore();

// 2. 定义响应式数据用于存储后端返回的消息
const message = ref('');

// 3. 定义异步函数获取后端数据
async function fetchHello() {
  try {
    const response = await await fetch('http://localhost:3001/api/hello');
    const data = await response.json();
    message.value = data.message; // 将后端返回的消息赋值给 message
    console.log('后端返回：', data.message);
  } catch (error) {
    //console.error('请求失败：', error);
    message.value = '请求失败，请检查后端服务是否启动';
  }
}

// 1. 定义图表容器的引用
const chartRef = ref(null);
let chartInstance = null;

// 2. 获取数据的函数
const fetchData = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/query');
    const graphData = await response.json();

    if (graphData.success) {
      // --- 1. 数据清洗与转换 ---
      const nodes = graphData.data.nodes.map(node => ({
        id: node.id,
        name: node.properties?.name || node.name || '未知节点',
        symbolSize: 60, // 节点圆圈大小
        category: node.label,
        // 携带跳转链接信息 (根据你的实际路由修改)
        linkUrl: `/node/${node.name}` 
      }));

      const links = graphData.data.links?.map(link => ({
        source: link.source,
        target: link.target,
        // 将关系的属性保留，供连线显示文字用
        properties: link.properties 
      })) || [];

      // 提取分类
      const categories = [...new Set(nodes.map(node => node.category))].map(name => ({ name }));

      // --- 2. 准备 ECharts 配置项 ---
      const option = {
        tooltip: {
          show: true,
          trigger: 'item',
          formatter: (params) => {
            if (params.dataType === 'node') {
              return `<div><strong>${params.data.name}</strong><br/>类型: ${params.data.category}</div>`;
            } else {
              // 连线提示
              return `<div>关系: ${params.data.properties?.name || '关联'}</div>`;
            }
          }
        },
        legend: {
          data: categories.map(cat => cat.name),
          top: 20
        },
        series: [
          {
            type: 'graph',
            layout: 'force',
            data: nodes,
            links: links,
            categories: categories,
            
            // 节点配置：文字在圆圈中间
            label: {
              show: true,
              position: 'inside', // 关键：文字在内部
              color: '#fff',      // 白色文字
              fontSize: 12
            },
            // --- 关键：添加箭头符号 ---
            edgeSymbol: ['none', 'arrow'], // 格式：[起点符号, 终点符号]
            edgeSymbolSize: [0, 10], // 对应上面，起点大小0，终点大小10
            
            // 连线配置：显示“样式”文字
            edgeLabel: {
              show: true,
              // 关键：从数据中取出关系名称
              formatter: (params) => params.data.properties?.name || '',
              fontSize: 12,
              color: '#333'
            },
            
            // 线条样式
            lineStyle: {
              color: '#999',
              width: 1.5,
              curveness: 0.2 // 线条微微弯曲
            },
            
            // 力引导布局配置 (让图更大更舒展)
            force: {
              edgeLength: 180, // 线条长度 (调大了)
              repulsion: 100,  // 节点斥力
              gravity: 0.1     // 重力
            },
            
            roam: true, // 允许拖拽缩放
          }
        ]
      };

      chartInstance.setOption(option);

      // --- 3. 事件监听 ---
      // 点击节点跳转页面
      chartInstance.on('click', (params) => {
        if (params.componentType === 'series' && params.data) {
          // 方式1: 新标签页打开 (推荐，不离开图谱)
          window.open(params.data.linkUrl, '_blank');
          
          // 方式2: 当前页跳转 (取消注释下面这行，注释上面一行)
          // window.location.href = params.data.linkUrl;
        }
      });

      // 鼠标悬停变小手
      chartInstance.on('mouseover', () => {
        chartInstance.getZr().setCursorStyle('pointer');
      });
    }
  } catch (error) {
    console.error('获取数据失败:', error);
  }
};

// 4. 生命周期钩子
onMounted(() => {
  chartInstance = echarts.init(chartRef.value);
  fetchData();
  window.addEventListener('resize', () => chartInstance.resize());
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', () => chartInstance.resize());
  chartInstance?.dispose();
});

// 4. 组件挂载时自动调用请求函数
fetchHello();
</script>

<style scoped>

@import './fontawesome-free-6.4.0-web/fontawesome-free-6.4.0-web/css/all.min.css'; 
/* div {
  padding: 20px;
  font-size: 18px;
  cursor: pointer;
  color: #333;
} */

 .graph-container {
  padding: 1vh; /* 更宽的容器 */
  width: 84vw;height:88vh;
  border-top:-1vh ;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
}

.chart {
  width: 83vw;
  height: 86vh; /* 增加高度 */
  border: 1px solid #eee;
  border-radius: 4px;
  background-color: #fafafa;
}
</style>