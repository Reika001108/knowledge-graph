import axios from 'axios'

// 创建Axios实例
const request = axios.create({
  baseURL: '/api', // 配合 Vite 代理转发到后端 3001 端口
  timeout: 10000,
  // 新增默认请求头，与后端接收格式匹配
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

// 请求拦截器：统一添加Token（修复键名不统一问题）
request.interceptors.request.use(
  (config) => {
    // 统一读取authToken（和后端/登录页存储的键名保持一致）
    const token = localStorage.getItem('authToken')
    if (token) {
      // 严格按照Bearer + 空格 + Token的格式（后端校验要求）
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('请求拦截器错误：', error)
    return Promise.reject(error)
  }
)

// 响应拦截器：完善错误处理逻辑，统一响应格式
request.interceptors.response.use(
  (res) => {
    // 统一返回data，兼容后端{success, data/error}格式
    return res.data || res
  },
  (error) => {
    // 1. 处理网络错误（无响应）
    if (!error.response) {
      console.error('网络错误：', error.message)
      alert('网络异常，请检查后端服务是否启动！')
      return Promise.reject(new Error('网络异常，请稍后重试'))
    }

    const { status, data } = error.response
    // 2. 处理401未授权（Token失效/缺失）
    if (status === 401) {
      // 清空所有认证相关存储（避免残留）
      localStorage.removeItem('authToken')
      localStorage.removeItem('userRole')
      localStorage.removeItem('adminName')
      
      // 友好提示 + 跳回登录页
      const errorMsg = data?.error || '登录状态已失效，请重新登录'
      alert(errorMsg)
      // 避免重复跳转
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      return Promise.reject(new Error(errorMsg))
    }

    // 3. 处理403权限不足
    if (status === 403) {
      const errorMsg = data?.error || '您无权限访问该功能'
      alert(errorMsg)
      return Promise.reject(new Error(errorMsg))
    }

    // 4. 处理404请求不存在
    if (status === 404) {
      const errorMsg = `接口不存在：${error.config.url}`
      console.error(errorMsg)
      alert('请求的接口不存在，请检查后端路由配置！')
      return Promise.reject(new Error(errorMsg))
    }

    // 5. 处理500服务器错误
    if (status >= 500) {
      const errorMsg = data?.error || '服务器内部错误，请稍后重试'
      console.error('服务器错误：', errorMsg)
      alert(errorMsg)
      return Promise.reject(new Error(errorMsg))
    }

    // 其他错误统一处理
    const errorMsg = data?.error || `请求失败（${status}）`
    console.error('请求错误：', errorMsg)
    return Promise.reject(new Error(errorMsg))
  }
)

export default request