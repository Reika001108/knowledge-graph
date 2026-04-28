<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶部导航栏 -->
    <header class="header">
      <div class="logo-section">
        <img src="../pages/img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">知识图谱管理系统</h1>
      </div>
      <div class="user-section">
        <div class="current-time">{{ currentTime }}</div>
        <button class="theme-toggle" @click="toggleTheme" :title="isDark ? '切换到亮色模式' : '切换到暗色模式'">
          <i :class="isDark ? 'fas fa-sun' : 'fas fa-moon'"></i>
        </button>
        <div class="avatar-wrapper" ref="avatarWrapper">
          <div class="avatar" @click.stop="toggleDropdown">
            <i class="fas fa-user-circle"></i>
          </div>
          <div v-if="showDropdown" class="dropdown-menu">
            <a href="#" class="dropdown-item" @click.prevent="logout" style="text-align: center;">退出登录</a>
          </div>
        </div>
      </div>
    </header>

    <main class="main-content">
      <!-- 左侧导航栏 -->
      <aside class="sidebar">
        <nav class="nav-menu">
          <a href="#" class="nav-item" @click.prevent="goToDashboard">
            <i class="fas fa-tachometer-alt icon"></i>
            <span class="nav-text">主页</span>
          </a>
          <a href="#" class="nav-item" @click.prevent="goToUserManage">
            <i class="fas fa-users icon"></i>
            <span class="nav-text">用户管理</span>
          </a>
          <div class="nav-item" @click="toggleGraphMenu">
            <i class="fas fa-project-diagram icon"></i>
            <span class="nav-text">图谱管理</span>
            <i class="fas" :class="graphMenuExpanded ? 'fa-chevron-down' : 'fa-chevron-right'" style="margin-left: auto;"></i>
          </div>
          <div v-if="graphMenuExpanded" class="sub-nav">
            <a href="#" class="nav-item sub-nav-item" @click.prevent="goToGraphDisplay">
              <i class="fas fa-eye icon" style="margin-left: 28px;"></i>
              <span class="nav-text">图谱展示</span>
            </a>
            <a href="#" class="nav-item sub-nav-item" @click.prevent="goToNodeManage">
              <i class="fas fa-cube icon" style="margin-left: 28px;"></i>
              <span class="nav-text">节点管理</span>
            </a>
            <a href="#" class="nav-item sub-nav-item active" @click.prevent="goToRelationManage">
              <i class="fas fa-link icon" style="margin-left: 28px;"></i>
              <span class="nav-text">关系管理</span>
            </a>
          </div>
          <a href="#" class="nav-item" @click.prevent="goToDataStats">
            <i class="fas fa-chart-bar icon"></i>
            <span class="nav-text">数据统计</span>
          </a>
          <a href="#" class="nav-item" @click.prevent="goToSystemLog">
            <i class="fas fa-history icon"></i>
            <span class="nav-text">反馈中心</span>
          </a>
        </nav>

        <div class="admin-footer">
          <div class="divider"></div>
          <div class="admin-info">
            <i class="fas fa-user-shield"></i>
            <span>{{ adminDisplayName }}</span>
          </div>
        </div>
      </aside>

      <!-- 右侧主要内容区域 -->
      <section class="content-section">
        <div class="relation-management">
          <!-- 头部标题和新增按钮 -->
          <div class="management-header">
            <h2><i class="fas fa-link"></i> 关系管理</h2>
            <button class="btn-primary" @click="openCreateForm">
              <i class="fas fa-plus"></i> 新增关系
            </button>
          </div>

          <!-- 搜索区域 -->
          <div class="search-section">
            <div class="search-wrapper">
              <i class="fas fa-search search-icon"></i>
              <input 
                type="text" 
                v-model="searchQuery" 
                placeholder="搜索关系类型、描述或节点..." 
                class="search-input"
                @input="handleSearch"
              />
            </div>
            <button v-if="searchQuery" class="btn-clear" @click="clearSearch">
              <i class="fas fa-times"></i> 清除
            </button>
            <div class="total-count">
              共 <span class="count-number">{{ filteredRelations.length }}</span> 个关系
            </div>
          </div>

          <!-- 关系列表表格 -->
          <div class="relation-table-wrapper">
            <table class="relation-table">
              <thead>
                <tr>
                  <th>序号</th>
                  <th>源节点</th>
                  <th>目标节点</th>
                  <th>关系类型</th>
                  <th>描述</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="paginatedRelations.length === 0 && !loading">
                  <td colspan="7" class="text-center">暂无关系数据</td>
                </tr>
                <tr v-for="(rel, idx) in paginatedRelations" :key="rel.id">
                  <td class="serial-number">{{ (currentPage - 1) * pageSize + idx + 1 }}</td>
                  <td>{{ getNodeName(rel.source) }}</td>
                  <td>{{ getNodeName(rel.target) }}</td>
                  <td>{{ rel.type }}</td>
                  <td>
                    <div class="description-preview">{{ rel.description || '' }}</div>
                  </td>
                  <td>
                    <button class="btn-icon" @click="editRelation(rel)" title="编辑">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" @click="deleteRelation(rel.id)" title="删除">
                      <i class="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 分页组件 -->
          <div v-if="filteredRelations.length > 0" class="pagination-container">
            <div class="pagination-info">
              显示 {{ (currentPage - 1) * pageSize + 1 }} 
              到 {{ Math.min(currentPage * pageSize, filteredRelations.length) }} 
              条，共 {{ filteredRelations.length }} 条记录
            </div>
            <div class="pagination">
              <button 
                class="pagination-btn" 
                @click="goToFirstPage" 
                :disabled="currentPage === 1"
                title="第一页"
              >
                <i class="fas fa-angle-double-left"></i>
              </button>
              <button 
                class="pagination-btn" 
                @click="prevPage" 
                :disabled="currentPage === 1"
                title="上一页"
              >
                <i class="fas fa-angle-left"></i>
              </button>
              
              <button 
                v-for="page in displayedPages" 
                :key="page"
                class="pagination-btn" 
                :class="{ 
                  active: page === currentPage,
                  dots: page === '...'
                }"
                @click="page !== '...' && changePage(page)"
                :disabled="page === '...'"
              >
                {{ page }}
              </button>
              
              <button 
                class="pagination-btn" 
                @click="nextPage" 
                :disabled="currentPage === totalPages"
                title="下一页"
              >
                <i class="fas fa-angle-right"></i>
              </button>
              <button 
                class="pagination-btn" 
                @click="goToLastPage" 
                :disabled="currentPage === totalPages"
                title="最后一页"
              >
                <i class="fas fa-angle-double-right"></i>
              </button>
            </div>
            <div class="page-size-selector">
              <select v-model="pageSize" @change="handlePageSizeChange">
                <option :value="5">5条/页</option>
                <option :value="10">10条/页</option>
                <option :value="20">20条/页</option>
                <option :value="50">50条/页</option>
                <option :value="100">100条/页</option>
              </select>
            </div>
          </div>

          <!-- 新增/编辑关系表单 -->
          <div v-if="showForm" class="relation-form-panel">
            <h3>{{ formMode === 'create' ? '新增关系' : '编辑关系' }}</h3>
            
            <!-- 源节点 -->
            <div class="form-group">
              <label>源节点 <span v-if="formMode === 'edit'" class="readonly-tip">(不可修改)</span></label>
              <select v-model="formData.source" required :disabled="formMode === 'edit'" @change="handleSourceChange">
                <option value="" disabled>请选择源节点</option>
                <option v-for="node in nodesList" :key="node.id" :value="node.id">
                  {{ node.name }} ({{ node.id }})
                </option>
              </select>
            </div>
            
            <!-- 目标节点 -->
            <div class="form-group">
              <label>目标节点 <span v-if="formMode === 'edit'" class="readonly-tip">(不可修改)</span></label>
              <select v-model="formData.target" required :disabled="formMode === 'edit'" @change="handleTargetChange">
                <option value="" disabled>请选择目标节点</option>
                <option 
                  v-for="node in filteredTargetNodes" 
                  :key="node.id" 
                  :value="node.id"
                >
                  {{ node.name }} ({{ node.id }})
                </option>
              </select>
              <div v-if="formData.source && formData.target === formData.source" class="error-tip">
                <i class="fas fa-exclamation-circle"></i> 目标节点不能与源节点相同
              </div>
            </div>
            
            <!-- 关系类型 -->
            <div class="form-group">
              <label>关系类型 <span v-if="formMode === 'edit'" class="readonly-tip">(不可修改)</span></label>
              <input type="text" v-model="formData.type" placeholder="例如: 属于" :disabled="formMode === 'edit'" />
            </div>
            
            <!-- 描述 -->
            <div class="form-group">
              <label>描述</label>
              <textarea v-model="formData.description" rows="4" placeholder="请输入关系的描述信息..."></textarea>
            </div>
            
            <!-- 重复关系提示 -->
            <div v-if="duplicateWarning" class="duplicate-warning">
              <i class="fas fa-exclamation-triangle"></i>
              {{ duplicateWarning }}
            </div>
            
            <div class="form-actions">
              <button class="btn-secondary" @click="closeForm">取消</button>
              <button class="btn-primary" @click="saveRelation" :disabled="!isFormValid">
                {{ formMode === 'create' ? '创建' : '更新' }}
              </button>
            </div>
          </div>

          <!-- 加载与错误提示 -->
          <div v-if="loading" class="loading-overlay">
            <i class="fas fa-spinner fa-pulse"></i> 加载中...
          </div>
          <div v-if="error" class="error-message">
            {{ error }}
            <button @click="loadRelations" class="retry-btn">重试</button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// ---------- 状态 ----------
const showDropdown = ref(false);
const avatarWrapper = ref(null);
const currentTime = ref(new Date().toLocaleTimeString());
const isDark = ref(false);
const graphMenuExpanded = ref(true);
const adminName = ref('');

// 关系数据
const relations = ref([]);
const nodesList = ref([]);
const loading = ref(false);
const error = ref('');

// 搜索相关
const searchQuery = ref('');
const searchTimeout = ref(null);

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);

// 表单相关
const showForm = ref(false);
const formMode = ref('create');
const formData = ref({
  id: null,
  source: '',
  target: '',
  type: '',
  description: ''
});

// 重复关系警告
const duplicateWarning = ref('');

// 计算管理员显示名称
const adminDisplayName = computed(() => {
  if (adminName.value) return adminName.value;
  const userInfoStr = localStorage.getItem('user_info');
  if (userInfoStr) {
    try {
      const userInfo = JSON.parse(userInfoStr);
      return userInfo.username || userInfo.email?.split('@')[0] || '管理员';
    } catch {
      return '管理员';
    }
  }
  return '管理员';
});

// 节点名称映射
const nodeMap = computed(() => {
  const map = {};
  nodesList.value.forEach(node => {
    map[node.id] = node.name;
  });
  return map;
});

// 过滤后的目标节点（排除源节点）
const filteredTargetNodes = computed(() => {
  if (!formData.value.source) {
    return nodesList.value;
  }
  return nodesList.value.filter(node => node.id !== formData.value.source);
});

// 检查是否已存在相同源节点和目标节点的关系
const checkDuplicateRelation = () => {
  if (formMode.value !== 'create') {
    duplicateWarning.value = '';
    return;
  }
  
  if (!formData.value.source || !formData.value.target) {
    duplicateWarning.value = '';
    return;
  }
  
  const existingRelation = relations.value.find(rel => 
    rel.source === formData.value.source && 
    rel.target === formData.value.target
  );
  
  if (existingRelation) {
    const sourceName = getNodeName(existingRelation.source);
    const targetName = getNodeName(existingRelation.target);
    duplicateWarning.value = `⚠️ 关系已存在：节点"${sourceName}"和"${targetName}"之间已存在关系类型为"${existingRelation.type}"的关系，不能重复添加。`;
  } else {
    duplicateWarning.value = '';
  }
};

// 监听源节点和目标节点变化，实时检查重复
watch([() => formData.value.source, () => formData.value.target], () => {
  checkDuplicateRelation();
});

// 表单验证
const isFormValid = computed(() => {
  if (formMode.value === 'create') {
    return formData.value.source && 
           formData.value.target && 
           formData.value.target !== formData.value.source &&
           formData.value.type && 
           formData.value.type.trim() &&
           !duplicateWarning.value;
  }
  return true;
});

// 处理源节点变化
const handleSourceChange = () => {
  if (formData.value.target === formData.value.source) {
    formData.value.target = '';
  }
  checkDuplicateRelation();
};

// 处理目标节点变化
const handleTargetChange = () => {
  if (formData.value.target === formData.value.source) {
    alert('目标节点不能与源节点相同');
    formData.value.target = '';
  }
  checkDuplicateRelation();
};

// 获取节点名称
const getNodeName = (id) => {
  return nodeMap.value[id] || '未知节点';
};

// 过滤后的关系
const filteredRelations = computed(() => {
  if (!searchQuery.value.trim()) {
    return relations.value;
  }
  
  const query = searchQuery.value.toLowerCase().trim();
  return relations.value.filter(rel => {
    if (rel.type.toLowerCase().includes(query)) return true;
    const description = (rel.description || rel.properties?.description || '').toLowerCase();
    if (description.includes(query)) return true;
    const sourceName = getNodeName(rel.source).toLowerCase();
    if (sourceName.includes(query)) return true;
    const targetName = getNodeName(rel.target).toLowerCase();
    if (targetName.includes(query)) return true;
    return false;
  });
});

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(filteredRelations.value.length / pageSize.value);
});

// 当前页显示的关系
const paginatedRelations = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredRelations.value.slice(start, end);
});

// 计算显示的页码
const displayedPages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const delta = 2;
  const range = [];
  const rangeWithDots = [];
  let l;

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i);
    }
  }

  range.forEach((i) => {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l !== 1) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(i);
    l = i;
  });

  return rangeWithDots;
});

// ---------- 主题切换 ----------
const toggleTheme = () => {
  isDark.value = !isDark.value;
};

// ---------- 时间更新 ----------
let timer = null;
const updateTime = () => {
  currentTime.value = new Date().toLocaleTimeString();
};

// ---------- 下拉菜单 ----------
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

const handleClickOutside = (event) => {
  if (avatarWrapper.value && !avatarWrapper.value.contains(event.target)) {
    showDropdown.value = false;
  }
};

// ---------- 图谱菜单展开/折叠 ----------
const toggleGraphMenu = () => {
  graphMenuExpanded.value = !graphMenuExpanded.value;
};

// ---------- 路由导航 ----------
const goToDashboard = () => router.push('/admin/home');
const goToUserManage = () => router.push('/admin/users');
const goToGraphDisplay = () => router.push('/admin/graph/display');
const goToNodeManage = () => router.push('/admin/graph/nodes');
const goToRelationManage = () => {};
const goToDataStats = () => router.push('/admin/stats');
const goToSystemLog = () => router.push('/admin/logs');

// ---------- 退出登录 ----------
const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user_info');
  localStorage.removeItem('userRole');
  localStorage.removeItem('adminName');
  router.push('/');
  showDropdown.value = false;
};

// ---------- API 基础路径 ----------
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

// ---------- 加载节点列表 ----------
const loadNodes = async () => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE}/api/admin/nodes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('获取节点列表失败');
    const result = await response.json();
    if (!result.success) throw new Error(result.error || '未知错误');
    nodesList.value = result.data || [];
  } catch (err) {
    console.error('加载节点失败:', err);
  }
};

// ---------- 加载关系列表 ----------
const loadRelations = async () => {
  loading.value = true;
  error.value = '';
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE}/api/admin/relations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('获取关系列表失败');
    const result = await response.json();
    if (!result.success) throw new Error(result.error || '未知错误');
    relations.value = result.data || [];
    currentPage.value = 1;
  } catch (err) {
    console.error('加载关系失败:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

// ---------- 搜索处理 ----------
const handleSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  searchTimeout.value = setTimeout(() => {
    currentPage.value = 1;
  }, 300);
};

// ---------- 清除搜索 ----------
const clearSearch = () => {
  searchQuery.value = '';
  currentPage.value = 1;
};

// ---------- 分页方法 ----------
const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const goToFirstPage = () => {
  currentPage.value = 1;
};

const goToLastPage = () => {
  currentPage.value = totalPages.value;
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const handlePageSizeChange = () => {
  currentPage.value = 1;
};

// ---------- 打开新增表单 ----------
const openCreateForm = () => {
  formMode.value = 'create';
  formData.value = {
    id: null,
    source: '',
    target: '',
    type: '',
    description: ''
  };
  duplicateWarning.value = '';
  showForm.value = true;
};

// ---------- 编辑关系 ----------
const editRelation = (rel) => {
  formMode.value = 'edit';
  formData.value = {
    id: rel.id,
    source: rel.source,
    target: rel.target,
    type: rel.type,
    description: rel.description || rel.properties?.description || ''
  };
  duplicateWarning.value = '';
  showForm.value = true;
};

// ---------- 关闭表单 ----------
const closeForm = () => {
  showForm.value = false;
  duplicateWarning.value = '';
};

// ---------- 保存关系 ----------
const saveRelation = async () => {
  if (formMode.value === 'create') {
    // 新增模式验证
    if (!formData.value.source) {
      alert('请选择源节点');
      return;
    }
    if (!formData.value.target) {
      alert('请选择目标节点');
      return;
    }
    if (formData.value.target === formData.value.source) {
      alert('目标节点不能与源节点相同');
      return;
    }
    if (!formData.value.type || !formData.value.type.trim()) {
      alert('请输入关系类型');
      return;
    }
    
    // 检查重复关系
    if (duplicateWarning.value) {
      alert(duplicateWarning.value);
      return;
    }
  }

  loading.value = true;
  error.value = '';

  try {
    const token = localStorage.getItem('authToken');
    let url, method, requestBody;

    if (formMode.value === 'create') {
      url = `${API_BASE}/api/admin/relations`;
      method = 'POST';
      requestBody = {
        source: formData.value.source,
        target: formData.value.target,
        type: formData.value.type,
        description: formData.value.description || ''
      };
    } else {
      // 编辑模式：只更新描述
      url = `${API_BASE}/api/admin/relations/${formData.value.id}`;
      method = 'PUT';
      requestBody = {
        description: formData.value.description || ''
      };
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();
    
    if (!response.ok) {
      // 处理重复关系的错误
      if (response.status === 409) {
        const sourceName = getNodeName(formData.value.source);
        const targetName = getNodeName(formData.value.target);
        alert(`❌ 创建失败：节点"${sourceName}"和"${targetName}"之间已存在关系，不能重复添加。`);
      } else {
        throw new Error(result.error || result.message || '保存失败');
      }
      return;
    }
    
    if (!result.success) {
      throw new Error(result.error || '保存失败');
    }

    await loadRelations();
    closeForm();
    alert(formMode.value === 'create' ? '关系创建成功！' : '关系更新成功！');
  } catch (err) {
    console.error('保存关系失败:', err);
    error.value = err.message;
    alert(err.message);
  } finally {
    loading.value = false;
  }
};

// ---------- 删除关系 ----------
const deleteRelation = async (id) => {
  if (!confirm('确定要删除该关系吗？')) return;

  loading.value = true;
  error.value = '';

  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE}/api/admin/relations/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('删除失败');
    const result = await response.json();
    if (!result.success) throw new Error(result.error || '删除失败');

    await loadRelations();
    alert('关系删除成功！');
  } catch (err) {
    console.error('删除关系失败:', err);
    error.value = err.message;
    alert(err.message);
  } finally {
    loading.value = false;
  }
};

// ---------- 生命周期 ----------
onMounted(() => {
  const token = localStorage.getItem('authToken');
  const role = localStorage.getItem('userRole');

  if (!token || role !== 'admin') {
    alert('无权限访问，请以管理员身份登录');
    router.push('/');
    return;
  }

  Promise.all([loadNodes(), loadRelations()]).catch(console.error);

  document.addEventListener('click', handleClickOutside);
  timer = setInterval(updateTime, 1000);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  if (timer) clearInterval(timer);
  if (searchTimeout.value) clearTimeout(searchTimeout.value);
});
</script>

<style scoped>
/* 重复警告样式 */
.duplicate-warning {
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 6px;
  padding: 10px 12px;
  margin: 12px 0;
  color: #856404;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.duplicate-warning i {
  font-size: 16px;
  color: #ffc107;
}

.app-container.dark .duplicate-warning {
  background-color: #2c2c3a;
  border-color: #ffc107;
  color: #ffd966;
}

/* 错误提示样式 */
.error-tip {
  margin-top: 5px;
  font-size: 12px;
  color: #dc3545;
  display: flex;
  align-items: center;
  gap: 5px;
}

.readonly-tip {
  font-size: 12px;
  font-weight: normal;
  color: #999;
}

/* 按钮禁用样式 */
.btn-primary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.app-container.dark .btn-primary:disabled {
  background-color: #4a4a5a;
  opacity: 0.6;
}

/* 表格样式 */
.relation-table-wrapper {
  overflow-x: auto;
}
.relation-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.relation-table th {
  text-align: left;
  padding: 16px 12px;
  background-color: #f8f9fa;
  color: #333;
  font-weight: 600;
  border-bottom: 2px solid #e9ecef;
}
.relation-table td {
  padding: 12px;
  border-bottom: 1px solid #e9ecef;
  color: #555;
}
.description-preview {
  white-space: pre-wrap;
  word-break: break-word;
  max-width: 300px;
  line-height: 1.4;
}
.serial-number {
  text-align: center;
  font-weight: 500;
  color: #666;
  width: 60px;
}
.text-center {
  text-align: center;
}

/* 其他样式保持不变 */
/* ... 其他原有样式 ... */
</style>



<style scoped>
  /* 保留原有所有样式，并添加重复警告样式 */

  /* 重复警告样式 */
  .duplicate-warning {
    background-color: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 6px;
    padding: 10px 12px;
    margin: 12px 0;
    color: #856404;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .duplicate-warning i {
    font-size: 16px;
    color: #ffc107;
  }

  .app-container.dark .duplicate-warning {
    background-color: #2c2c3a;
    border-color: #ffc107;
    color: #ffd966;
  }

  /* 错误提示样式 */
  .error-tip {
    margin-top: 5px;
    font-size: 12px;
    color: #dc3545;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .readonly-tip {
    font-size: 12px;
    font-weight: normal;
    color: #999;
  }

  /* 按钮禁用样式 */
  .btn-primary:disabled {
    background-color: #ccc;
    cursor: not-allowed;
    opacity: 0.6;
  }

  .app-container.dark .btn-primary:disabled {
    background-color: #4a4a5a;
    opacity: 0.6;
  }


</style>

<style scoped>
  /* ========== 全局样式 ========== */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .app-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
      'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
    background-color: #FAF5FF;
    transition: background-color 0.3s, color 0.3s;
  }

  /* 暗色模式 */
  .app-container.dark {
    background-color: #1e1e2f;
    color: #e0e0e0;
  }
  .app-container.dark .header {
    background-color: #2c2c3a;
  }
  .app-container.dark .sidebar {
    background-color: #2c2c3a;
    color: #e0e0e0;
  }
  .app-container.dark .nav-item {
    color: #e0e0e0;
  }
  .app-container.dark .nav-item:hover {
    background-color: #3a3a4a;
    color: #A78BFA;
  }
  .app-container.dark .nav-item.active {
    background-color: #3a3a4a;
    color: #8B5CF6;
  }
  .app-container.dark .relation-management {
    background-color: #2c2c3a;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  .app-container.dark .relation-table {
    background-color: #2c2c3a;
    color: #e0e0e0;
  }
  .app-container.dark .relation-table th {
    background-color: #3a3a4a;
    color: #e0e0e0;
  }
  .app-container.dark .relation-table td {
    border-bottom-color: #4a4a5a;
  }
  .app-container.dark .relation-form-panel {
    background-color: #3a3a4a;
    border-color: #4a4a5a;
    color: #e0e0e0;
  }
  .app-container.dark .relation-form-panel input:disabled,
  .app-container.dark .relation-form-panel select:disabled {
    background-color: #1e1e2f;
    color: #888;
    cursor: not-allowed;
  }
  .app-container.dark .btn-primary {
    background-color: #6d4c9e;
  }
  .app-container.dark .btn-primary:hover {
    background-color: #8B5CF6;
  }
  .app-container.dark .btn-primary:disabled {
    background-color: #4a4a5a;
    cursor: not-allowed;
  }
  .app-container.dark .btn-secondary {
    background-color: #4a4a5a;
    color: #e0e0e0;
  }
  .app-container.dark .search-input {
    background-color: #2c2c3a;
    border-color: #4a4a5a;
    color: #e0e0e0;
  }
  .app-container.dark .pagination-btn {
    background-color: #2c2c3a;
    border-color: #4a4a5a;
    color: #e0e0e0;
  }
  .app-container.dark .pagination-btn.active {
    background-color: #8B5CF6;
    color: white;
  }

  /* 顶部导航 */
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
    cursor: pointer;
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
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* 主体布局 */
  .main-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  /* 左侧导航 */
  .sidebar {
    width: 15vw;
    background-color: #ffffff;
    box-shadow: 2px 0 6px rgba(139, 92, 246, 0.05);
    overflow-y: auto;
    transition: background-color 0.3s;
    display: flex;
    flex-direction: column;
  }
  .nav-menu {
    flex: 1;
    padding-top: 0px;
  }
  .nav-item {
    display: flex;
    align-items: center;
    padding: 20px 30px;
    color: #333;
    text-decoration: none;
    font-size: 16px;
    transition: all 0.3s ease;
    border-left: 4px solid transparent;
    cursor: pointer;
  }
  .nav-item:hover {
    background-color: #f1f1f1;
    color: #8B5CF6;
  }
  .nav-item.active {
    background-color: #FAF5FF;
    color: #8B5CF6;
    font-weight: bold;
    border-left-color: #8B5CF6;
  }
  .icon {
    margin-right: 12px;
    width: 20px;
    text-align: center;
  }
  .nav-text {
    flex: 1;
  }
  .sub-nav-item {
    padding-left: 30px !important;
  }

  .admin-footer {
    padding: 20px 0;
  }
  .divider {
    height: 1px;
    background-color: #e0e0e0;
    margin: 0 20px 15px 20px;
  }
  .admin-info {
    display: flex;
    align-items: center;
    padding: 0 30px;
    color: #333;
    font-size: 14px;
    gap: 10px;
  }
  .admin-info i {
    color: #8B5CF6;
    font-size: 18px;
  }

  /* 右侧内容区域 */
  .content-section {
    flex: 1;
    padding: 2vh 20px;
    overflow-y: auto;
  }
  .relation-management {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 12px 0 rgba(139, 92, 246, 0.05);
    padding: 24px;
    min-height: 100%;
    position: relative;
    transition: background-color 0.3s;
  }

  .management-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  .management-header h2 {
    font-size: 22px;
    color: #333;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .btn-primary {
    background-color: #8B5CF6;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 10px 20px;
    font-size: 14px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: background-color 0.2s;
  }
  .btn-primary:hover {
    background-color: #7A4BDE;
  }
  .btn-primary:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  .btn-secondary {
    background-color: #e9ecef;
    color: #333;
    border: none;
    border-radius: 6px;
    padding: 10px 20px;
    font-size: 14px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: background-color 0.2s;
  }
  .btn-secondary:hover {
    background-color: #dde2e6;
  }
  .btn-icon {
    background: none;
    border: none;
    color: #8B5CF6;
    font-size: 16px;
    cursor: pointer;
    padding: 4px 8px;
    margin: 0 4px;
    transition: color 0.2s;
  }
  .btn-icon:hover {
    color: #6d4c9e;
  }

  /* 搜索区域 */
  .search-section {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    padding: 16px;
    background-color: #f8f9fa;
    border-radius: 8px;
  }
  .search-wrapper {
    flex: 1;
    position: relative;
  }
  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #999;
    font-size: 14px;
  }
  .search-input {
    width: 100%;
    padding: 10px 10px 10px 35px;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.2s;
  }
  .search-input:focus {
    outline: none;
    border-color: #8B5CF6;
  }
  .btn-clear {
    background-color: #e9ecef;
    color: #333;
    border: none;
    border-radius: 6px;
    padding: 10px 20px;
    font-size: 14px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .total-count {
    color: #666;
    font-size: 14px;
    padding: 0 10px;
  }
  .count-number {
    font-weight: 600;
    color: #8B5CF6;
    font-size: 16px;
  }

  /* 表格样式 */
  .relation-table-wrapper {
    overflow-x: auto;
  }
  .relation-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  .relation-table th {
    text-align: left;
    padding: 16px 12px;
    background-color: #f8f9fa;
    color: #333;
    font-weight: 600;
    border-bottom: 2px solid #e9ecef;
  }
  .relation-table td {
    padding: 12px;
    border-bottom: 1px solid #e9ecef;
    color: #555;
  }
  .description-preview {
    white-space: pre-wrap;
    word-break: break-word;
    max-width: 300px;
    line-height: 1.4;
  }
  .serial-number {
    text-align: center;
    font-weight: 500;
    color: #666;
    width: 60px;
  }
  .app-container.dark .serial-number {
    background-color: #2f2f3a;
    color: #ccc;
  }
  .text-center {
    text-align: center;
  }

  /* 分页样式 */
  .pagination-container {
    margin-top: 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
  }
  .pagination-info {
    color: #666;
    font-size: 14px;
  }
  .pagination {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .pagination-btn {
    min-width: 36px;
    height: 36px;
    padding: 0 6px;
    border: 1px solid #e9ecef;
    background-color: #fff;
    color: #333;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .pagination-btn:hover:not(:disabled):not(.dots) {
    background-color: #f1f1f1;
    border-color: #8B5CF6;
    color: #8B5CF6;
  }
  .pagination-btn.active {
    background-color: #8B5CF6;
    border-color: #8B5CF6;
    color: white;
  }
  .pagination-btn.dots {
    cursor: default;
    background-color: transparent;
    border-color: transparent;
  }
  .pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .page-size-selector select {
    padding: 8px 12px;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    font-size: 14px;
    color: #333;
    background-color: #fff;
    cursor: pointer;
  }

  /* 表单浮动面板 */
  .relation-form-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 450px;
    max-width: 90vw;
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    z-index: 2000;
  }
  .relation-form-panel h3 {
    margin-bottom: 20px;
    color: #333;
  }
  .form-group {
    margin-bottom: 16px;
  }
  .form-group label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: #555;
    font-size: 14px;
  }
  .readonly-tip {
    font-size: 12px;
    font-weight: normal;
    color: #999;
  }
  .disabled-tip {
    font-size: 12px;
    color: #999;
    margin-left: 5px;
  }
  .error-tip {
    margin-top: 5px;
    font-size: 12px;
    color: #dc3545;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .form-group input:disabled,
  .form-group select:disabled {
    background-color: #f5f5f5;
    color: #999;
    cursor: not-allowed;
  }
  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.2s;
    background-color: white;
  }
  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #8B5CF6;
  }
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
  }

  /* 加载与错误提示 */
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255,255,255,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    color: #8B5CF6;
    z-index: 100;
  }
  .error-message {
    padding: 20px;
    text-align: center;
    color: #dc3545;
  }
  .retry-btn {
    margin-left: 10px;
    padding: 4px 8px;
    background-color: #8B5CF6;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
</style>

<style>
@import '../pages/fontawesome-free-6.4.0-web/fontawesome-free-6.4.0-web/css/all.min.css';
</style>