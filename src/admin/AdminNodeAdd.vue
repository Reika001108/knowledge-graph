<template>
  <div class="node-management">
    <!-- 一行表单 -->
    <div class="form-row">
      <div class="form-group">
        <input
          type="text"
          v-model="nodeForm.name"
          placeholder="节点名称（必填）"
          class="form-input"
          :class="{ 'error': nodeErrors.name }"
        />
      </div>
      <div class="form-group">
        <input
          type="text"
          v-model="nodeForm.label"
          placeholder="节点类型（默认 Entity）"
          class="form-input"
        />
      </div>
      <button class="submit-btn" @click="handleAddNode" :disabled="nodeSubmitting">
        <i v-if="nodeSubmitting" class="fas fa-spinner fa-spin"></i>
        {{ nodeSubmitting ? '添加中...' : '添加节点' }}
      </button>
    </div>
    <!-- 提示信息 -->
    <div v-if="nodeResult" class="result-message" :class="nodeResultType">
      <i :class="nodeResultType === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
      {{ nodeResult }}
    </div>
    <!-- 图谱容器 -->
    <div class="graph-container">
      <div ref="chartRef" class="chart-wrapper"></div>
      <div class="graph-controls">
        <button class="control-btn" @click="zoomOut" title="缩小"><i class="fas fa-search-minus"></i></button>
        <button class="control-btn" @click="fitToView" title="适应页面"><i class="fas fa-arrows-alt"></i></button>
        <button class="control-btn" @click="zoomIn" title="放大"><i class="fas fa-search-plus"></i></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';

// 表单状态（同前）
const nodeForm = ref({ name: '', label: '' });
const nodeErrors = ref({ name: '' });
const nodeSubmitting = ref(false);
const nodeResult = ref('');
const nodeResultType = ref('');

// 图谱实例
const chartRef = ref(null);
let chartInstance = null;
let shouldFitAfterRender = false;

const defaultForce = { /* 同前 */ };

const fetchGraphData = async () => {
  // 同 GraphOverview 的 fetchGraphData，但使用 chartInstance
  // ... 代码复用
};

const handleAddNode = async () => {
  // 表单验证
  if (!nodeForm.value.name.trim()) {
    nodeErrors.value.name = '节点名称不能为空';
    return;
  }
  nodeSubmitting.value = true;
  try {
    const token = localStorage.getItem('authToken');
    const res = await fetch('http://localhost:3001/api/node/add', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: nodeForm.value.name.trim(),
        label: nodeForm.value.label.trim() || 'Entity'
      })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      nodeResult.value = `节点创建成功！ID: ${data.data.id}`;
      nodeResultType.value = 'success';
      nodeForm.value.name = '';
      nodeForm.value.label = '';
      fetchGraphData(); // 刷新图谱
    } else {
      nodeResult.value = data.error || '创建失败';
      nodeResultType.value = 'error';
    }
  } catch (error) {
    nodeResult.value = '网络错误';
    nodeResultType.value = 'error';
  } finally {
    nodeSubmitting.value = false;
  }
};

// 缩放控制（同前）
const zoomIn = () => { /* ... */ };
const zoomOut = () => { /* ... */ };
const fitToView = () => { /* ... */ };

onMounted(() => {
  chartInstance = echarts.init(chartRef.value);
  // 绑定渲染事件等
  fetchGraphData();
  window.addEventListener('resize', () => chartInstance.resize());
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', () => chartInstance.resize());
  chartInstance.dispose();
});
</script>

<style scoped>
.node-management {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}
.form-row {
  display: flex;
  gap: 12px;
  background: #fff;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(139,92,246,0.05);
}
.form-group { flex: 1; }
.form-input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; }
.form-input.error { border-color: #e74c3c; }
.submit-btn {
  padding: 12px 24px;
  background: #8B5CF6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
}
.submit-btn:hover { background: #A78BFA; }
.submit-btn:disabled { opacity: 0.6; }
.result-message {
  padding: 10px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.result-message.success { background: #d4edda; color: #155724; }
.result-message.error { background: #f8d7da; color: #721c24; }
.graph-container {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  position: relative;
  min-height: 400px;
}
.chart-wrapper { width: 100%; height: 100%; }
.graph-controls {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 8px;
  background: rgba(255,255,255,0.9);
  border-radius: 30px;
  padding: 8px 12px;
}
.control-btn {
  width: 36px; height: 36px; border-radius: 50%; border: none;
  background: #8B5CF6; color: white; cursor: pointer;
}
.control-btn:hover { background: #A78BFA; }
</style>



<style>
@import '../pages/fontawesome-free-6.4.0-web/fontawesome-free-6.4.0-web/css/all.min.css';
</style>