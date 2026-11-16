import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css' // <-- เพิ่มบรรทัดนี้เพื่อเรียกใช้ CSS ทุกหน้า

createApp(App).use(createPinia()).use(router).mount('#app')
