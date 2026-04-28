<template>
  <div class="register-container">
    <!-- 注册盒子 -->
    <div class="register-box">
      <!-- 标题 -->
      <div class="title">注册账号</div>

      <!-- 表单项 -->
      <div class="form-item">
        <label>用户名：</label>
        <div class="input-wrapper">
          <input type="text" placeholder="请输入用户名" v-model="form.username" />
        </div>
      </div>

      <div class="form-item">
        <label>邮箱：</label>
        <div class="input-wrapper">
          <input type="email" placeholder="请输入邮箱地址" v-model="form.email" />
        </div>
      </div>

      <div class="form-item">
        <label>密码：</label>
        <div class="input-wrapper password-input-wrapper">
          <input :type="showPassword ? 'text' : 'password'" 
                 placeholder="请输入密码" 
                 v-model="form.password" />
          <span class="password-toggle" @click="showPassword = !showPassword">
            <!-- 睁开眼睛时显示明文，图标为睁眼 -->
            <svg v-if="showPassword" class="eye-icon" viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
            <!-- 闭上眼睛时隐藏密码，图标为闭眼 -->
            <svg v-else class="eye-icon" viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
            </svg>
          </span>
        </div>
      </div>

      <div class="form-item">
        <label>确认密码：</label>
        <div class="input-wrapper password-input-wrapper">
          <input :type="showConfirmPassword ? 'text' : 'password'" 
                 placeholder="请再次输入密码" 
                 v-model="form.confirmPassword" />
          <span class="password-toggle" @click="showConfirmPassword = !showConfirmPassword">
            <!-- 睁开眼睛时显示明文，图标为睁眼 -->
            <svg v-if="showConfirmPassword" class="eye-icon" viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
            <!-- 闭上眼睛时隐藏密码，图标为闭眼 -->
            <svg v-else class="eye-icon" viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
            </svg>
          </span>
        </div>
      </div>

      <!-- 注册按钮 -->
      <button class="register-btn" @click="handleRegister">立即注册</button>

      <!-- 底部链接区域 -->
      <div class="extra-links">
        <span>已有账号？</span>
        <span class="link-item" @click="goToLogin">去登录</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import axios from 'axios'

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// 密码可见性控制
const showPassword = ref(false)      // false: 隐藏密码(闭眼), true: 显示密码(睁眼)
const showConfirmPassword = ref(false)

// 常见邮箱后缀白名单
const validEmailDomains = [
  'qq.com', '163.com', '126.com', 'gmail.com', 'outlook.com', 
  'hotmail.com', 'foxmail.com', 'sina.com', 'sohu.com', 'yahoo.com',
  'aliyun.com', 'tom.com', '139.com', '189.com', 'live.com',
  'icloud.com', 'me.com', 'protonmail.com', 'yeah.net'
]

// 验证邮箱格式和域名
const validateEmail = (email) => {
  // 基础邮箱格式验证
  const emailRegex = /^[^\s@]+@([^\s@]+)$/
  const match = email.match(emailRegex)
  
  if (!match) return false
  
  const domain = match[1].toLowerCase()
  
  // 检查域名是否在白名单中
  return validEmailDomains.includes(domain)
}

// 验证密码复杂度（至少2种类型）
const validatePassword = (password) => {
  if (password.length < 6) {
    return { valid: false, message: '密码长度至少为6位' }
  }
  
  if (password.length > 20) {
    return { valid: false, message: '密码长度不能超过20位' }
  }
  
  let hasNumber = /\d/.test(password)
  let hasLower = /[a-z]/.test(password)
  let hasUpper = /[A-Z]/.test(password)
  let hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  
  // 至少包含两种类型
  const typeCount = [hasNumber, hasLower, hasUpper, hasSpecial].filter(Boolean).length
  
  if (typeCount < 2) {
    return { valid: false, message: '密码必须包含数字、字母、特殊字符中的至少两种' }
  }
  
  // 检查是否包含用户名（不区分大小写）
  if (form.username && password.toLowerCase().includes(form.username.toLowerCase())) {
    return { valid: false, message: '密码不能包含用户名' }
  }
  
  // 检查是否连续相同字符超过3个
  if (/(.)\1{3,}/.test(password)) {
    return { valid: false, message: '密码不能包含连续4个及以上相同字符' }
  }
  
  return { valid: true, message: '' }
}

// 注册逻辑
const handleRegister = async () => {
  // 用户名验证
  if (!form.username) {
    alert('请输入用户名！')
    return
  }
  
  if (form.username.length < 3 || form.username.length > 20) {
    alert('用户名长度应为3-20个字符！')
    return
  }
  
  if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(form.username)) {
    alert('用户名只能包含字母、数字、下划线和中文字符！')
    return
  }
  
  // 邮箱验证
  if (!form.email) {
    alert('请输入邮箱地址！')
    return
  }
  
  if (!validateEmail(form.email)) {
    const domains = validEmailDomains.slice(0, 8).join('、')
    alert(`请输入有效的邮箱地址！支持的邮箱后缀：${domains}等`)
    return
  }
  
  // 密码验证
  if (!form.password) {
    alert('请输入密码！')
    return
  }
  
  const passwordValidation = validatePassword(form.password)
  if (!passwordValidation.valid) {
    alert(passwordValidation.message)
    return
  }
  
  // 确认密码验证
  if (!form.confirmPassword) {
    alert('请确认密码！')
    return
  }
  
  if (form.password !== form.confirmPassword) {
    alert('两次密码输入不一致！')
    return
  }

  try {
    const response = await axios.post('http://localhost:3001/api/register', {
      username: form.username,
      email: form.email,
      password: form.password
    });

    // 清除旧数据，保持与登录逻辑一致
    localStorage.clear()
    
    // 统一使用 authToken 作为 token 键名
    const token = response.data?.token || response.token
    if (token) {
      localStorage.setItem('authToken', token)
      localStorage.setItem('userRole', 'user')

      // 存储用户信息
      if (response.data?.user) {
        localStorage.setItem('user_info', JSON.stringify(response.data.user))
      } else if (response.user) {
        localStorage.setItem('user_info', JSON.stringify(response.user))
      }
    } else {
      alert('注册成功，但未获取到认证信息！')
    }

    // 跳转到知识图谱页面
    window.location.href = 'http://localhost:5173/knowledge';

  } catch (error) {
    alert(error.response?.data?.error || '注册失败，请稍后重试');
  }
}

// 跳转登录
const goToLogin = () => {
  window.location.href = 'http://localhost:5173/';
}
</script>

<style scoped>
.register-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #FAF5FF;
  background-image: radial-gradient(#fff, #FAF5FF);
}

.register-box {
  width: 400px;
  padding: 40px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.09);
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 24px;
  font-weight: bold;
  color: #8B5CF6;
  margin-bottom: 30px;
  text-align: center;
}

.form-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

.form-item label {
  font-size: 14px;
  color: #374151;
  margin-bottom: 8px;
  font-weight: 500;
}

/* 统一的输入框容器样式 */
.input-wrapper {
  position: relative;
  width: 100%;
}

.input-wrapper input {
  width: 100%;
  height: 40px;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
  background-color: #ffffff;
}

.input-wrapper input:focus {
  border-color: #8B5CF6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.input-wrapper input:hover {
  border-color: #c4b5fd;
}

/* 密码输入框特殊处理（需要预留眼睛图标空间） */
.password-input-wrapper input {
  padding-right: 35px;
}

.password-toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  transition: color 0.2s ease;
}

.password-toggle:hover {
  color: #8B5CF6;
}

.eye-icon {
  display: block;
}

.register-btn {
  width: 100%;
  height: 40px;
  background-color: #8B5CF6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 10px;
  font-weight: 500;
}

.register-btn:hover {
  background-color: #A78BFA;
}

.extra-links {
  margin-top: auto;
  text-align: center;
  font-size: 14px;
  color: #6b7280;
  padding-top: 20px;
  border-top: 1px solid #f3e8ff;
}

.link-item {
  color: #8B5CF6;
  cursor: pointer;
  margin-left: 5px;
  transition: color 0.2s ease;
}

.link-item:hover {
  color: #A78BFA;
  text-decoration: underline;
}
</style>