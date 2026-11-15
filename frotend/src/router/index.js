import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import DashboardView from '../views/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'Login', component: LoginView },
    { path: '/register', name: 'Register', component: RegisterView },
    { path: '/dashboard', name: 'Dashboard', component: DashboardView, meta: { requiresAuth: true } },
    { path: '/', redirect: '/dashboard' }
  ]
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // หากหน้าปลายทางต้องล็อกอิน แต่ผู้ใช้ยังไม่ล็อกอิน ให้ส่งไปหน้า Login
  if (to.meta.requiresAuth && !authStore.isAuthenticated && to.name !== 'Login') {
    return { name: 'Login' }
  }

  // หากล็อกอินอยู่แล้ว ไม่ให้เข้าหน้า Login หรือ Register ซ้ำ
  if ((to.name === 'Login' || to.name === 'Register') && authStore.isAuthenticated) {
    return { name: 'Dashboard' }
  }
})

export default router