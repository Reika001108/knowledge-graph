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
          <!-- 仪表盘 -->
          <a href="#" class="nav-item" @click.prevent="goToDashboard">
            <i class="fas fa-tachometer-alt icon"></i>
            <span class="nav-text">主页</span>
          </a>
          <!-- 用户管理（当前页面高亮） -->
          <a href="#" class="nav-item active" @click.prevent="goToUserManage">
            <i class="fas fa-users icon"></i>
            <span class="nav-text">用户管理</span>
          </a>
          <!-- 图谱管理（带下拉子菜单） -->
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
            <a href="#" class="nav-item sub-nav-item" @click.prevent="goToRelationManage">
              <i class="fas fa-link icon" style="margin-left: 28px;"></i>
              <span class="nav-text">关系管理</span>
            </a>
          </div>
          <!-- 其他菜单 -->
          <a href="#" class="nav-item" @click.prevent="goToDataStats">
            <i class="fas fa-chart-bar icon"></i>
            <span class="nav-text">数据统计</span>
          </a>
          <a href="#" class="nav-item" @click.prevent="goToSystemLog">
            <i class="fas fa-history icon"></i>
            <span class="nav-text">反馈中心</span>
          </a>
        </nav>

        <!-- 底部管理员信息栏 -->
        <div class="admin-footer">
          <div class="divider"></div>
          <div class="admin-info">
            <i class="fas fa-user-shield"></i>
            <span>{{ adminDisplayName }}</span>
          </div>
        </div>
      </aside>

      <!-- 右侧主要内容区域：用户管理 -->
      <section class="content-section">
        <div class="user-management">
          <!-- 加载状态 -->
          <div v-if="loading" class="loading-overlay">
            <i class="fas fa-spinner fa-pulse"></i> 加载中...
          </div>

          <!-- 错误提示 -->
          <div v-if="error" class="error-message">
            {{ error }}
            <button @click="fetchUsers" class="retry-btn">重试</button>
          </div>

          <!-- 页面标题与操作栏 -->
          <div class="management-header">
            <h2><i class="fas fa-users"></i> 用户管理</h2>
            <button class="btn-primary" @click="openAddUserModal" :disabled="loading">
              <i class="fas fa-plus"></i> 新增用户
            </button>
          </div>

          <!-- 搜索与筛选 -->
          <div class="filter-bar">
            <div class="search-box">
              <i class="fas fa-search"></i>
              <input 
                type="text" 
                v-model="searchKeyword" 
                placeholder="搜索用户名、邮箱"
                @input="handleSearch"
                :disabled="loading"
              />
            </div>
            <div class="filter-actions">
              <select v-model="roleFilter" class="filter-select" :disabled="loading">
                <option value="">全部角色</option>
                <option value="admin">管理员</option>
                <option value="user">普通用户</option>
              </select>
              <select v-model="statusFilter" class="filter-select" :disabled="loading">
                <option value="">全部状态</option>
                <option value="active">启用</option>
                <option value="inactive">禁用</option>
              </select>
              <button class="btn-secondary" @click="resetFilters" :disabled="loading">
                <i class="fas fa-redo-alt"></i> 重置
              </button>
            </div>
          </div>

          <!-- 用户列表表格 -->
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>序号</th>
                  <th>用户名</th>
                  <th>邮箱</th>
                  <th>角色</th>
                  <th>状态</th>
                  <th>注册时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(user, index) in paginatedUsers" :key="user.id">
                  <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                  <td>{{ user.username }}</td>
                  <td>{{ user.email }}</td>
                  <td>
                    <span :class="['role-badge', user.role === 'admin' ? 'role-admin' : 'role-user']">
                      {{ user.role === 'admin' ? '管理员' : '普通用户' }}
                    </span>
                  </td>
                  <td>
                    <span :class="['status-badge', user.status === 'active' ? 'status-active' : 'status-inactive']">
                      {{ user.status === 'active' ? '启用' : '禁用' }}
                    </span>
                  </td>
                  <td>{{ formatDate(user.createdAt) }}</td>
                  <td class="actions">
                    <button class="icon-btn" @click="openEditModal(user)" title="编辑" :disabled="loading">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-btn" @click="toggleUserStatus(user)" 
                      :title="user.status === 'active' ? '禁用' : '启用'"
                      :disabled="loading">
                      <i :class="user.status === 'active' ? 'fas fa-ban' : 'fas fa-check-circle'"></i>
                    </button>
                    <button class="icon-btn delete-btn" @click="deleteUser(user)" title="删除" :disabled="loading">
                      <i class="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
                <tr v-if="!loading && filteredUsers.length === 0">
                  <td colspan="8" class="empty-message">暂无符合条件的用户</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 分页组件 -->
          <div v-if="!loading && filteredUsers.length > 0" class="pagination-container">
            <div class="pagination-info">
              显示 {{ (currentPage - 1) * pageSize + 1 }} 
              到 {{ Math.min(currentPage * pageSize, filteredUsers.length) }} 
              条，共 {{ filteredUsers.length }} 条记录
            </div>
            <div class="pagination">
              <button 
                class="pagination-btn" 
                @click="goToFirstPage" 
                :disabled="currentPage === 1 || loading"
                title="第一页"
              >
                <i class="fas fa-angle-double-left"></i>
              </button>
              <button 
                class="pagination-btn" 
                @click="prevPage" 
                :disabled="currentPage === 1 || loading"
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
                :disabled="page === '...' || loading"
              >
                {{ page }}
              </button>
              
              <button 
                class="pagination-btn" 
                @click="nextPage" 
                :disabled="currentPage === totalPages || loading"
                title="下一页"
              >
                <i class="fas fa-angle-right"></i>
              </button>
              <button 
                class="pagination-btn" 
                @click="goToLastPage" 
                :disabled="currentPage === totalPages || loading"
                title="最后一页"
              >
                <i class="fas fa-angle-double-right"></i>
              </button>
            </div>
            <div class="page-size-selector">
              <select v-model="pageSize" @change="handlePageSizeChange" :disabled="loading">
                <option :value="5">5条/页</option>
                <option :value="10">10条/页</option>
                <option :value="20">20条/页</option>
                <option :value="50">50条/页</option>
                <option :value="100">100条/页</option>
              </select>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 新增/编辑用户模态框 -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <h3>{{ modalMode === 'add' ? '新增用户' : '编辑用户' }}</h3>
        <form @submit.prevent="submitModal">
          <div class="form-group">
            <label>用户名</label>
            <input v-model="modalForm.username" required :disabled="loading" />
          </div>
          <div class="form-group">
            <label>邮箱</label>
            <input type="email" v-model="modalForm.email" required :disabled="loading" />
          </div>
          <div class="form-group" v-if="modalMode === 'add'">
            <label>密码</label>
            <div class="password-input-wrapper">
              <input 
                :type="showPassword ? 'text' : 'password'" 
                v-model="modalForm.password" 
                required 
                :disabled="loading" 
              />
              <button 
                type="button" 
                class="password-toggle-btn" 
                @click="togglePasswordVisibility"
                :disabled="loading"
              >
                <i :class="showPassword ? 'fas fa-eye' : 'fas fa-eye-slash'"></i>
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>角色</label>
            <select v-model="modalForm.role" :disabled="loading">
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model="modalForm.status" :disabled="loading">
              <option value="active">启用</option>
              <option value="inactive">禁用</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="closeModal" :disabled="loading">取消</button>
            <button type="submit" class="btn-primary" :disabled="loading">
              <i v-if="loading" class="fas fa-spinner fa-pulse"></i>
              {{ loading ? '处理中...' : '保存' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
  import { useRouter } from 'vue-router';

  const router = useRouter();

  // ---------- 状态定义 ----------
  const showDropdown = ref(false);
  const avatarWrapper = ref(null);
  const currentTime = ref(new Date().toLocaleTimeString());
  const isDark = ref(false);
  const graphMenuExpanded = ref(false);
  const adminName = ref('');

  // 用户管理相关状态
  const searchKeyword = ref('');
  const roleFilter = ref('');
  const statusFilter = ref('');
  const currentPage = ref(1);
  const pageSize = ref(10);
  const allUsers = ref([]);
  const loading = ref(false);
  const error = ref('');

  // 搜索防抖
  const searchTimeout = ref(null);

  // 模态框状态
  const showModal = ref(false);
  const modalMode = ref('add');
  const modalForm = ref({
    id: null,
    username: '',
    email: '',
    password: '',
    role: 'user',
    status: 'active'
  });
  
  // 密码显示状态
  const showPassword = ref(false);

  // ---------- 计算属性：筛选与分页 ----------
  const filteredUsers = computed(() => {
    let list = allUsers.value;

    if (searchKeyword.value.trim()) {
      const kw = searchKeyword.value.trim().toLowerCase();
      list = list.filter(user => 
        user.username.toLowerCase().includes(kw) ||
        user.email.toLowerCase().includes(kw)
      );
    }

    if (roleFilter.value) {
      list = list.filter(user => user.role === roleFilter.value);
    }

    if (statusFilter.value) {
      list = list.filter(user => user.status === statusFilter.value);
    }

    return list;
  });

  // 计算总页数
  const totalPages = computed(() => {
    return Math.ceil(filteredUsers.value.length / pageSize.value);
  });

  // 当前页显示的用户
  const paginatedUsers = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return filteredUsers.value.slice(start, end);
  });

  // 计算显示的页码（带省略号）
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

  // 监听搜索和筛选条件变化，重置到第一页
  watch([searchKeyword, roleFilter, statusFilter, pageSize], () => {
    currentPage.value = 1;
  });

  // 管理员显示名称
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

  // ---------- 工具函数 ----------
  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 切换密码可见性
  const togglePasswordVisibility = () => {
    showPassword.value = !showPassword.value;
  };

  // ---------- 主题切换 ----------
  const toggleTheme = () => {
    isDark.value = !isDark.value;
  };

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

  // ---------- 图谱菜单 ----------
  const toggleGraphMenu = () => {
    graphMenuExpanded.value = !graphMenuExpanded.value;
  };

  // ---------- 路由导航 ----------
  const goToDashboard = () => router.push('/admin/home');
  const goToUserManage = () => {};
  const goToGraphDisplay = () => router.push('/admin/graph/display');
  const goToNodeManage = () => router.push('/admin/graph/nodes');
  const goToRelationManage = () => router.push('/admin/graph/relations');
  const goToDataStats = () => router.push('/admin/stats');
  const goToSystemLog = () => router.push('/admin/logs');
  const goToProfile = () => router.push('/person');

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

  // ---------- 获取用户列表 ----------
  const fetchUsers = async () => {
    loading.value = true;
    error.value = '';
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('未授权，请重新登录');
        } else if (response.status === 403) {
          throw new Error('没有权限访问');
        } else {
          throw new Error(`获取用户列表失败 (${response.status})`);
        }
      }
      
      const result = await response.json();
      
      if (result.success) {
        allUsers.value = result.data.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt
        }));
      } else {
        throw new Error(result.error || '获取用户列表失败');
      }
    } catch (err) {
      console.error('fetchUsers error:', err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // 搜索处理（防抖）
  const handleSearch = () => {
    if (searchTimeout.value) {
      clearTimeout(searchTimeout.value);
    }
    searchTimeout.value = setTimeout(() => {
      currentPage.value = 1;
    }, 300);
  };

  // 重置筛选
  const resetFilters = () => {
    searchKeyword.value = '';
    roleFilter.value = '';
    statusFilter.value = '';
  };

  // 分页方法
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

  // 模态框操作
  const openAddUserModal = () => {
    modalMode.value = 'add';
    modalForm.value = { 
      id: null, 
      username: '', 
      email: '', 
      password: '', 
      role: 'user', 
      status: 'active' 
    };
    showPassword.value = false; // 重置密码显示状态
    showModal.value = true;
  };

  const openEditModal = (user) => {
    modalMode.value = 'edit';
    modalForm.value = { 
      ...user, 
      password: ''
    };
    showModal.value = true;
  };

  const closeModal = () => {
    showModal.value = false;
  };

  // 提交表单
  const submitModal = async () => {
    if (modalMode.value === 'add') {
      await createUser(modalForm.value);
    } else {
      await updateUser(modalForm.value);
    }
  };

  // 新增用户
  const createUser = async (userData) => {
    loading.value = true;
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('未授权，请重新登录');
        } else if (response.status === 400) {
          const result = await response.json();
          throw new Error(result.error || '输入数据有误');
        } else {
          throw new Error(`创建用户失败 (${response.status})`);
        }
      }
      
      const result = await response.json();
      
      if (result.success) {
        await fetchUsers();
        closeModal();
      } else {
        throw new Error(result.error || '创建用户失败');
      }
    } catch (err) {
      console.error('createUser error:', err);
      alert('创建用户失败：' + err.message);
    } finally {
      loading.value = false;
    }
  };

  // 更新用户
  const updateUser = async (userData) => {
    loading.value = true;
    try {
      const token = localStorage.getItem('authToken');
      console.log(userData.id);
      const response = await fetch(`${API_BASE}/api/admin/users/${userData.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: userData.username,
          email: userData.email,
          role: userData.role,
          status: userData.status
        })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('未授权，请重新登录');
        } else if (response.status === 404) {
          throw new Error('用户不存在');
        } else {
          throw new Error(`更新用户失败 (${response.status})`);
        }
      }
      
      const result = await response.json();
      
      if (result.success) {
        await fetchUsers();
        closeModal();
      } else {
        throw new Error(result.error || '更新用户失败');
      }
    } catch (err) {
      console.error('updateUser error:', err);
      alert('更新用户失败：' + err.message);
    } finally {
      loading.value = false;
    }
  };

  // 切换用户状态
  const toggleUserStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    if (!confirm(`确定${newStatus === 'active' ? '启用' : '禁用'}用户 ${user.username} 吗？`)) return;
    
    loading.value = true;
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE}/api/admin/users/${user.id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('未授权，请重新登录');
        } else if (response.status === 404) {
          throw new Error('用户不存在');
        } else {
          throw new Error(`更新状态失败 (${response.status})`);
        }
      }
      
      const result = await response.json();
      
      if (result.success) {
        // 更新本地数据
        const index = allUsers.value.findIndex(u => u.id === user.id);
        if (index !== -1) {
          allUsers.value[index].status = newStatus;
        }
      } else {
        throw new Error(result.error || '更新状态失败');
      }
    } catch (err) {
      console.error('toggleUserStatus error:', err);
      alert('操作失败：' + err.message);
    } finally {
      loading.value = false;
    }
  };

  // 删除用户
  const deleteUser = async (user) => {
    if (!confirm(`确定要删除用户 ${user.username} 吗？此操作不可撤销。`)) return;
    
    loading.value = true;
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE}/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('未授权，请重新登录');
        } else if (response.status === 404) {
          throw new Error('用户不存在');
        } else {
          throw new Error(`删除用户失败 (${response.status})`);
        }
      }
      
      const result = await response.json();
      
      if (result.success) {
        await fetchUsers();
      } else {
        throw new Error(result.error || '删除用户失败');
      }
    } catch (err) {
      console.error('deleteUser error:', err);
      alert('删除失败：' + err.message);
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

    fetchUsers();

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
  .app-container.dark .user-management {
    background-color: #2c2c3a;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  .app-container.dark .filter-bar {
    background-color: #3a3a4a;
  }
  .app-container.dark .table-container {
    background-color: #3a3a4a;
  }
  .app-container.dark .data-table th {
    background-color: #2c2c3a;
    color: #e0e0e0;
    border-bottom-color: #4a4a5a;
  }
  .app-container.dark .data-table td {
    border-bottom-color: #4a4a5a;
    color: #d0d0d0;
  }
  .app-container.dark .data-table tr:hover td {
    background-color: #4a4a5a;
  }
  .app-container.dark .btn-primary {
    background-color: #8B5CF6;
  }
  .app-container.dark .btn-primary:disabled {
    background-color: #4a4a5a;
  }
  .app-container.dark .btn-secondary {
    background-color: #4a4a5a;
    border-color: #5a5a6a;
    color: #e0e0e0;
  }
  .app-container.dark .btn-secondary:hover:not(:disabled) {
    background-color: #5a5a6a;
  }
  .app-container.dark .search-box {
    background-color: #2c2c3a;
    border-color: #4a4a5a;
  }
  .app-container.dark .search-box input {
    color: #e0e0e0;
  }
  .app-container.dark .search-box input:disabled {
    background-color: #3a3a4a;
  }
  .app-container.dark .filter-select {
    background-color: #2c2c3a;
    border-color: #4a4a5a;
    color: #e0e0e0;
  }
  .app-container.dark .filter-select:disabled {
    background-color: #3a3a4a;
  }
  .app-container.dark .pagination-btn {
    background-color: #2c2c3a;
    border-color: #4a4a5a;
    color: #e0e0e0;
  }
  .app-container.dark .pagination-btn:hover:not(:disabled):not(.dots) {
    background-color: #3a3a4a;
  }
  .app-container.dark .pagination-btn.active {
    background-color: #8B5CF6;
    color: white;
  }
  .app-container.dark .pagination-btn:disabled {
    background-color: #3a3a4a;
    color: #666;
  }
  .app-container.dark .page-size-selector select {
    background-color: #2c2c3a;
    border-color: #4a4a5a;
    color: #e0e0e0;
  }
  .app-container.dark .page-size-selector select:disabled {
    background-color: #3a3a4a;
  }
  .app-container.dark .modal-content {
    background-color: #2c2c3a;
    color: #e0e0e0;
  }
  .app-container.dark .modal-content input,
  .app-container.dark .modal-content select {
    background-color: #3a3a4a;
    border-color: #4a4a5a;
    color: #e0e0e0;
  }
  .app-container.dark .modal-content input:disabled,
  .app-container.dark .modal-content select:disabled {
    background-color: #4a4a5a;
  }
  .app-container.dark .status-active {
    background-color: #1e3a2f;
    color: #9fefb0;
  }
  .app-container.dark .status-inactive {
    background-color: #3f2a2c;
    color: #f9acac;
  }
  .app-container.dark .role-user {
    background-color: #4a4a5a;
    color: #e0e0e0;
  }
  .app-container.dark .loading-overlay {
    background: rgba(0, 0, 0, 0.7);
    color: #8B5CF6;
  }
  
  /* 暗色模式下密码切换按钮样式 */
  .app-container.dark .password-toggle-btn {
    color: #ccc;
  }
  .app-container.dark .password-toggle-btn:hover:not(:disabled) {
    color: #8B5CF6;
  }
  .app-container.dark .password-input-wrapper input:disabled + .password-toggle-btn {
    opacity: 0.5;
  }

  /* ========== 顶部导航 ========== */
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

  /* ========== 主体布局 ========== */
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

  /* 底部管理员信息 */
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

  /* ========== 右侧内容区域：用户管理 ========== */
  .content-section {
    flex: 1;
    padding: 2vh 20px;
    overflow-y: auto;
    position: relative;
  }
  .user-management {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 12px 0 rgba(139, 92, 246, 0.05);
    padding: 24px;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
    transition: background-color 0.3s;
    position: relative;
  }

  /* 加载状态 */
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: #8B5CF6;
    z-index: 10;
    border-radius: 12px;
  }

  /* 错误提示 */
  .error-message {
    background-color: #f8d7da;
    color: #721c24;
    padding: 12px 20px;
    border-radius: 6px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .retry-btn {
    background-color: #8B5CF6;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 6px 12px;
    cursor: pointer;
  }
  .retry-btn:hover {
    background-color: #7A4BDE;
  }

  /* 头部 */
  .management-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
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
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background-color 0.2s;
  }
  .btn-primary:hover:not(:disabled) {
    background-color: #7A4BDE;
  }
  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* 筛选栏 */
  .filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 15px;
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
  }
  .search-box {
    display: flex;
    align-items: center;
    background-color: white;
    border: 1px solid #e9ecef;
    border-radius: 20px;
    padding: 0 15px;
    width: 300px;
  }
  .search-box i {
    color: #999;
    margin-right: 8px;
  }
  .search-box input {
    border: none;
    outline: none;
    padding: 10px 0;
    width: 100%;
    font-size: 14px;
    background: transparent;
  }
  .search-box input:disabled {
    background-color: #f8f9fa;
    cursor: not-allowed;
  }
  .filter-actions {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .filter-select {
    padding: 8px 12px;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    background-color: white;
    font-size: 14px;
    outline: none;
    cursor: pointer;
  }
  .filter-select:disabled {
    background-color: #f8f9fa;
    cursor: not-allowed;
  }
  .btn-secondary {
    background-color: white;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 8px 16px;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
  }
  .btn-secondary:hover:not(:disabled) {
    border-color: #8B5CF6;
    color: #8B5CF6;
  }
  .btn-secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* 表格容器 */
  .table-container {
    background-color: #f8f9fa;
    border-radius: 8px;
    overflow-x: auto;
    padding: 0 1px;
  }
  .data-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 900px;
  }
  .data-table th {
    text-align: left;
    padding: 16px 12px;
    background-color: #fff;
    color: #333;
    font-weight: 600;
    font-size: 14px;
    border-bottom: 2px solid #e9ecef;
  }
  .data-table td {
    padding: 14px 12px;
    border-bottom: 1px solid #e9ecef;
    color: #555;
    font-size: 14px;
  }
  .data-table tr:hover td {
    background-color: #f1f3f5;
  }

  /* 角色与状态徽章 */
  .role-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }
  .role-admin {
    background-color: #8B5CF6;
    color: white;
  }
  .role-user {
    background-color: #e9ecef;
    color: #495057;
  }
  .status-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }
  .status-active {
    background-color: #d4edda;
    color: #155724;
  }
  .status-inactive {
    background-color: #f8d7da;
    color: #721c24;
  }

  /* 操作按钮 */
  .actions {
    display: flex;
    gap: 8px;
  }
  .icon-btn {
    background: none;
    border: none;
    font-size: 16px;
    color: #6c757d;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s;
  }
  .icon-btn:hover:not(:disabled) {
    color: #8B5CF6;
    background-color: rgba(139, 92, 246, 0.1);
  }
  .icon-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .delete-btn:hover:not(:disabled) {
    color: #dc3545;
  }
  .empty-message {
    text-align: center;
    color: #999;
    padding: 40px 0;
  }

  /* 分页 */
  .pagination-container {
    margin-top: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 15px;
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
    outline: none;
  }
  .page-size-selector select:hover:not(:disabled) {
    border-color: #8B5CF6;
  }
  .page-size-selector select:disabled {
    background-color: #f8f9fa;
    cursor: not-allowed;
  }

  /* 模态框 */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  }
  .modal-content {
    background: white;
    border-radius: 12px;
    padding: 24px;
    width: 400px;
    max-width: 90%;
  }
  .modal-content h3 {
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
  .form-group input,
  .form-group select {
    width: 100%;
    padding: 10px;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.2s;
  }
  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: #8B5CF6;
  }
  .form-group input:disabled,
  .form-group select:disabled {
    background-color: #f8f9fa;
    cursor: not-allowed;
  }
  
  /* 密码输入框容器样式 */
  .password-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  .password-input-wrapper input {
    flex: 1;
    padding-right: 40px;
  }
  .password-toggle-btn {
    position: absolute;
    right: 10px;
    background: none;
    border: none;
    color: #999;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    transition: color 0.2s;
  }
  .password-toggle-btn:hover:not(:disabled) {
    color: #8B5CF6;
  }
  .password-toggle-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
  }
</style>

<style>
  /* 全局字体图标引入 */
  @import '../pages/fontawesome-free-6.4.0-web/fontawesome-free-6.4.0-web/css/all.min.css';
</style>