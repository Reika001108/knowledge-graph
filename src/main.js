import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import pinia from './modules/pinia'
import router from './modules/router'



// 创建应用实例并挂载路由
const app = createApp(App)
app.use(router)
app.use(pinia)
app.mount('#app')