// src/services/userService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api'; // 根据您的后端地址调整

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 统一错误处理
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // 服务器返回错误状态码
      if (error.response.status === 401) {
        // Token 过期或无效，清除本地存储并跳转到登录页
        localStorage.removeItem('authToken');
        localStorage.removeItem('user_info');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const userService = {
  /**
   * 获取用户信息
   * @returns {Promise} 用户信息
   */
  async getUserInfo() {
    try {
      const response = await apiClient.get('/user/profile');
      return response.data;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      throw error;
    }
  },

  /**
   * 更新用户个人资料
   * @param {Object} userData - 用户数据 { username, email }
   * @returns {Promise} 更新结果
   */
  async updateUserProfile(userData) {
    try {
      const response = await apiClient.put('/user/profile', userData);
      return response.data;
    } catch (error) {
      console.error('更新用户资料失败:', error);
      throw error;
    }
  },

  /**
   * 获取用户的收藏夹
   * @returns {Promise} 收藏夹数据 { collection: [], details: [] }
   */
  async getFavorites() {
    try {
      const response = await apiClient.get('/user/favorites');
      return response.data;
    } catch (error) {
      console.error('获取收藏夹失败:', error);
      throw error;
    }
  },

  /**
   * 更新用户的收藏夹
   * @param {Array} favorites - 收藏的知识点ID数组
   * @returns {Promise} 更新结果
   */
  async updateFavorites(favorites) {
    try {
      const response = await apiClient.put('/user/favorites', { 
        collection: favorites 
      });
      return response.data;
    } catch (error) {
      console.error('更新收藏夹失败:', error);
      throw error;
    }
  },

  /**
   * 批量获取节点详情
   * @param {Array} nodeIds - 节点ID数组
   * @returns {Promise} 节点详情列表
   */
  async getNodesBatch(nodeIds) {
    try {
      const response = await apiClient.post('/nodes/batch', { nodeIds });
      return response.data;
    } catch (error) {
      console.error('批量获取节点失败:', error);
      throw error;
    }
  },

  /**
   * 用户登录
   * @param {string} email - 邮箱
   * @param {string} password - 密码
   * @returns {Promise} 登录结果
   */
  async login(email, password) {
    try {
      const response = await apiClient.post('/login', { email, password });
      const { token, user } = response.data;
      
      if (token) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('user_info', JSON.stringify(user));
      }
      
      return response.data;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  },

  /**
   * 用户注册
   * @param {Object} userData - 注册数据 { username, email, password }
   * @returns {Promise} 注册结果
   */
  async register(userData) {
    try {
      const response = await apiClient.post('/register', userData);
      const { token, user } = response.data;
      
      if (token) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('user_info', JSON.stringify(user));
      }
      
      return response.data;
    } catch (error) {
      console.error('注册失败:', error);
      throw error;
    }
  },

  /**
   * 重置密码
   * @param {string} email - 邮箱
   * @param {string} password - 新密码
   * @returns {Promise} 重置结果
   */
  async resetPassword(email, password) {
    try {
      const response = await apiClient.put('/reset-password', { email, password });
      return response.data;
    } catch (error) {
      console.error('重置密码失败:', error);
      throw error;
    }
  },

  /**
   * 用户登出
   */
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user_info');
    localStorage.removeItem('html_favorites');
    localStorage.removeItem('html_favorites_details');
    window.location.href = '/login';
  },

  /**
   * 检查用户是否已登录
   * @returns {boolean} 是否已登录
   */
  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  },

  /**
   * 获取当前登录用户信息
   * @returns {Object|null} 用户信息
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('user_info');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  }
};