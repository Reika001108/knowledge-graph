<template>
  <div class="login-container">
    <div class="login-box">
      <!-- 动态标题 -->
      <div class="title">
        {{ isAdminView ? '管理员登录' : '前端知识图谱系统' }}
      </div>

      <!-- 普通用户登录表单 -->
      <div v-if="!isAdminView" class="login-form">
        <div class="form-item">
          <label>邮箱：</label>
          <input 
            type="text" 
            placeholder="请输入注册邮箱" 
            v-model="email" 
            class="form-input"
          />
        </div>

        <div class="form-item">
          <label>密码：</label>
          <div class="password-input-wrapper">
            <input 
              :type="showPassword ? 'text' : 'password'" 
              placeholder="请输入登录密码" 
              v-model="password" 
              class="form-input"
            />
            <span class="password-toggle" @click="showPassword = !showPassword">
              <!-- 睁眼图标（显示密码） -->
              <svg v-if="showPassword" class="eye-icon" viewBox="0 0 24 24" width="18" height="18">
                <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
              <!-- 闭眼图标（隐藏密码） -->
              <svg v-else class="eye-icon" viewBox="0 0 24 24" width="18" height="18">
                <path fill="currentColor" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
              </svg>
            </span>
          </div>
        </div>

        <button class="login-btn" @click="handleLogin">登录</button>

        <div class="extra-links">
          <span class="link-item" @click="handleRegister">点击注册</span>
          <span class="link-item" @click="handleForgot">忘记密码</span>
        </div>

        <!-- 管理员登录入口 -->
        <div class="admin-switch">
          <span class="link-item admin-link" @click="switchToAdminView">
            管理员登录 →
          </span>
        </div>
      </div>

      <!-- 管理员登录表单 -->
      <div v-else class="admin-login-form">
        <div class="form-item">
          <label>管理员名称：</label>
          <input 
            type="text" 
            placeholder="请输入管理员名称" 
            v-model="adminName" 
            class="form-input"
          />
        </div>

        <div class="form-item">
          <label>管理员密码：</label>
          <div class="password-input-wrapper">
            <input 
              :type="showAdminPassword ? 'text' : 'password'" 
              placeholder="请输入管理员密码" 
              v-model="adminPassword" 
              class="form-input"
            />
            <span class="password-toggle" @click="showAdminPassword = !showAdminPassword">
              <!-- 睁眼图标（显示密码） -->
              <svg v-if="showAdminPassword" class="eye-icon" viewBox="0 0 24 24" width="18" height="18">
                <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
              <!-- 闭眼图标（隐藏密码） -->
              <svg v-else class="eye-icon" viewBox="0 0 24 24" width="18" height="18">
                <path fill="currentColor" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
              </svg>
            </span>
          </div>
        </div>

        <button class="login-btn" @click="handleAdminLogin">管理员登录</button>

        <!-- 返回普通用户登录 -->
        <div class="admin-switch">
          <span class="link-item admin-link" @click="switchToUserView">
            ← 返回普通用户登录
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

// ========== 状态定义 ==========
const email = ref('')
const password = ref('')
const adminName = ref('')
const adminPassword = ref('')
const isAdminView = ref(false)

// 密码可见性控制
const showPassword = ref(false)        // 普通用户密码可见性
const showAdminPassword = ref(false)   // 管理员密码可见性

// ========== 视图切换 ==========
const switchToAdminView = () => {
  isAdminView.value = true
  email.value = ''
  password.value = ''
  showPassword.value = false  // 重置密码可见性
}
const switchToUserView = () => {
  isAdminView.value = false
  adminName.value = ''
  adminPassword.value = ''
  showAdminPassword.value = false  // 重置密码可见性
}

// ========== Axios 实例 ==========
const request = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

request.interceptors.response.use(
  res => res.data,
  error => {
    console.error('请求失败：', error)
    throw error
  }
)

// ========== 普通用户登录 ==========
const handleLogin = async () => {
  if (!email.value || !password.value) {
    alert('请输入邮箱和密码！')
    return
  }

  try {
    localStorage.clear() // 清除旧数据

    const response = await request.post('/login', {
      email: email.value,
      password: password.value
    })

    // 统一使用 authToken 作为 token 键名
    const token = response.token || response.data?.token
    if (token) {
      localStorage.setItem('authToken', token)          // 统一键名
      localStorage.setItem('userRole', 'user')

      // 存储用户信息（假设后端返回 user 对象）
      if (response.user) {
        localStorage.setItem('user_info', JSON.stringify(response.user))
      } else if (response.data?.user) {
        localStorage.setItem('user_info', JSON.stringify(response.data.user))
      }
    } else {
      alert('登录成功，但未获取到认证信息！')
    }

    alert('普通用户登录成功！')
    router.push('/knowledge')

  } catch (error) {
    const errorMsg = error.response?.data?.error || '普通用户登录失败，请检查账号密码！'
    alert(errorMsg)
  }
}

// ========== 管理员登录 ==========
const handleAdminLogin = async () => {
  if (!adminName.value || !adminPassword.value) {
    alert('请输入管理员名称和密码！')
    return
  }

  try {
    localStorage.clear()

    const response = await request.post('/admin/login', {
      name: adminName.value,
      password: adminPassword.value
    })

    // 统一使用 authToken
    const token = response.token || response.data?.token
    if (token) {
      localStorage.setItem('authToken', token)          // 统一键名
      localStorage.setItem('userRole', 'admin')
      localStorage.setItem('adminName', adminName.value)

      // 也可存储管理员信息，按需
    } else {
      alert('登录成功，但未获取到认证信息！')
    }

    alert('管理员登录成功！')
    router.push('/admin/home')

  } catch (error) {
    const errorMsg = error.response?.data?.error || '管理员名称或密码错误！'
    alert(errorMsg)
  }
}

// ========== 其他跳转 ==========
const handleRegister = () => router.push('/register')
const handleForgot = () => router.push('/reset-password')
</script>

<style scoped>
/* 全局登录容器 */
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #FAF5FF 0%, #E8F4F8 100%);
}

/* 登录卡片 */
.login-box {
  width: 380px;
  padding: 45px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.1);
  display: flex;
  flex-direction: column;
  height: 480px;
}

/* 标题样式 */
.title {
  font-size: 26px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 35px;
  color: #8B5CF6;
  letter-spacing: 0.5px;
}

/* 表单项样式 */
.form-item {
  margin-bottom: 25px;
}

.form-item label {
  display: block;
  margin-bottom: 10px;
  color: #374151;
  font-weight: 500;
  font-size: 14px;
}

/* 密码输入框容器 */
.password-input-wrapper {
  position: relative;
  width: 100%;
}

/* 输入框样式 */
.form-input {
  width: 100%;
  padding: 14px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-sizing: border-box;
  transition: all 0.3s ease;
  font-size: 14px;
}

/* 密码输入框需要预留眼睛图标空间 */
.password-input-wrapper .form-input {
  padding-right: 40px;
}

.form-input:focus {
  outline: none;
  border-color: #8B5CF6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

/* 眼睛图标样式 */
.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  transition: color 0.2s ease;
  z-index: 1;
}

.password-toggle:hover {
  color: #8B5CF6;
}

.eye-icon {
  display: block;
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(90deg, #8B5CF6 0%, #A78BFA 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 25px;
  transition: all 0.3s ease;
}

.login-btn:hover {
  background: linear-gradient(90deg, #7C3AED 0%, #A78BFA 100%);
  transform: translateY(-2px);
}

/* 额外链接（注册/忘记密码） */
.extra-links {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-bottom: 20px;
}

.link-item {
  cursor: pointer;
  color: #8B5CF6;
  transition: color 0.2s ease;
}

.link-item:hover {
  color: #7C3AED;
  text-decoration: underline;
}

/* 管理员切换链接 */
.admin-switch {
  text-align: center;
  font-size: 14px; 
}

.admin-link {
  font-weight: 600;
}
</style>