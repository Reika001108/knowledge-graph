<template>
  <div class="reset-container">
    <!-- 表单卡片 -->
    <div class="reset-card">
      <h2>修改密码</h2>
      <p class="tip">为了账户安全，请定期更换密码</p>

      <!-- 表单区域 -->
      <form @submit.prevent="handleSubmit">
        <!-- 邮箱输入项 -->
        <div class="form-item">
          <label for="email">邮箱：</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="请输入邮箱地址"
            :class="{ 'input-error': errors.email }"
          />
          <span v-if="errors.email" class="error-text">{{ errors.email }}</span>
        </div>

        <!-- 新密码输入项 -->
        <div class="form-item">
          <label for="password">新密码：</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="请输入新密码"
            :class="{ 'input-error': errors.password }"
          />
          <span v-if="errors.password" class="error-text">{{ errors.password }}</span>
        </div>

        <!-- 确认密码输入项 -->
        <div class="form-item">
          <label for="confirmPassword">确认密码：</label>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            :class="{ 'input-error': errors.confirmPassword }"
          />
          <span v-if="errors.confirmPassword" class="error-text">{{ errors.confirmPassword }}</span>
        </div>

        <!-- 按钮区域 -->
        <div class="button-group">
          <button type="submit" class="submit-btn" >确认修改</button>
          <a class="back-login-btn" @click="goToLogin">返回登录</a>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import axios from 'axios'; // 引入 axios

// 表单数据
const form = reactive({
  email: '',
  password: '',
  confirmPassword: ''
});

// 错误信息对象
const errors = reactive({
  email: '',
  password: '',
  confirmPassword: ''
});

// 验证逻辑
const validate = () => {
  let isValid = true;

  // 清空之前的错误
  errors.email = '';
  errors.password = '';
  errors.confirmPassword = '';

  // 邮箱验证
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{6,}$/;
  if (!form.email) {
    errors.email = '邮箱不能为空';
    isValid = false;
  } else if (!emailPattern.test(form.email)) {
    errors.email = '邮箱格式不正确';
    isValid = false;
  }

  // 新密码验证
  if (!form.password) {
    errors.password = '新密码不能为空';
    isValid = false;
  } else if (!passwordRegex.test(form.password)) {
    errors.password = '密码需至少6位，且包含字母和数字';
    isValid = false;
  }

  // 确认密码验证
  if (!form.confirmPassword) {
    errors.confirmPassword = '请再次输入密码';
    isValid = false;
  } else if (form.confirmPassword !== form.password) {
    errors.confirmPassword = '两次输入的密码不一致';
    isValid = false;
  }

  return isValid;
};

// 提交处理
const handleSubmit = async () => {
  if (!validate()) return; // 先同步验证

  try {
    const response = await axios.put('http://localhost:3001/api/reset-password', {
      email: form.email,
      password: form.password // 这里是新密码
    });

    alert(response.data.message);
    // 可以选择清空表单或跳转
    form.password = '';
    form.confirmPassword = '';
    window.location.href = 'http://localhost:5173/';
    
  } catch (error) {
    alert(error.response?.data?.error || '修改失败，请重试');
  }
};

// 重置表单（可选）
const resetForm = () => {
  form.email = '';
  form.password = '';
  form.confirmPassword = '';
};

// 跳转登录
const goToLogin = () => {
  window.location.href = 'http://localhost:5173/';
}
</script>

<style scoped>
/* 全局容器样式：纯紫调背景，和登录/注册页统一 */
.reset-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #FAF5FF; /* 纯紫调浅背景 */
  padding: 20px;
  /* 紫调渐变，提升高级感 */
  background-image: radial-gradient(#fff, #FAF5FF);
}

.reset-card {
  background-color: #fff;
  width: 100%;
  max-width: 400px;
  padding: 30px;
  border-radius: 12px; /* 统一圆角，和登录/注册页一致 */
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.09); /* 纯紫调阴影 */
  text-align: center;
}

.reset-card h2 {
  margin-bottom: 10px;
  color: #8B5CF6; /* 纯紫主色，突出标题 */
  font-weight: bold;
}

.reset-card .tip {
  color: #6b7280; /* 适配紫调的辅助文字色 */
  font-size: 14px;
  margin-bottom: 30px;
}

/* 表单布局 */
.form-item {
  display: flex;
  align-items: flex-start; /* 调整对齐方式，适配错误提示位置 */
  margin-bottom: 20px;
  position: relative;
  flex-direction: row;
}

.form-item label {
  width: 80px; /* 标签宽度 */
  text-align: right;
  margin-right: 15px;
  color: #374151; /* 沉稳文字色，适配紫调 */
  font-weight: 500;
  padding-top: 8px; /* 对齐输入框文字 */
}

.form-item input {
  flex: 1;
  height: 40px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb; /* 柔和边框色 */
  border-radius: 8px; /* 统一圆角 */
  outline: none;
  transition: border-color 0.3s, box-shadow 0.3s;
  font-size: 14px;
}

/* 输入框聚焦：纯紫主色强化 */
.form-item input:focus {
  border-color: #8B5CF6;
  box-shadow: 0 0 5px rgba(139, 92, 246, 0.2);
}

/* 错误样式：保留红色（通用错误色，无需修改） */
.input-error {
  border-color: #f56c6c !important;
}

.error-text {
  position: absolute;
  top: 100%;
  left: 95px; /* 与标签宽度+间距对齐 */
  font-size: 12px;
  color: #f56c6c;
  margin-top: 5px;
}

/* 按钮组 */
.button-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 10px;
}

.submit-btn {
  width: 100%;
  height: 45px;
  background-color: #8B5CF6; /* 替换原蓝色为纯紫主色 */
  color: white;
  border: none;
  border-radius: 8px; /* 统一圆角 */
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-weight: 500;
}

.submit-btn:hover {
  background-color: #A78BFA; /* 纯紫亮版hover色 */
}

/* 返回登录按钮：适配紫调风格 */
.back-login-btn {
  width: 100%;
  height: 45px;
  line-height: 45px;
  background-color: transparent;
  color: #8B5CF6; /* 纯紫主色 */
  border: 1px solid #8B5CF6;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
}

.back-login-btn:hover {
  background-color: #F5F3FF; /* 浅紫hover背景 */
  color: #8B5CF6;
}
</style>