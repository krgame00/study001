<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const username = ref('')
const password = ref('')
const errorMessage = ref('')

const authStore = useAuthStore()
const router = useRouter()

async function handleLogin() {
  errorMessage.value = ''
  try {
    await authStore.login(username.value, password.value)
    router.push({ name: 'Dashboard' })
  } catch (err) {
    errorMessage.value = err.message
  }
}
</script>

<template>
  <form @submit.prevent="handleLogin">
    <h2>เข้าสู่ระบบ</h2>
    <div>
      <label>ชื่อผู้ใช้:</label>
      <input v-model="username" type="text" required />
    </div>
    <div>
      <label>รหัสผ่าน:</label>
      <input v-model="password" type="password" required />
    </div>
    <p v-if="errorMessage" style="color: red">{{ errorMessage }}</p>
    <button type="submit">Login</button>
    <p>ยังไม่มีบัญชีผู้ใช้? <RouterLink :to="{ name: 'Register' }">สมัครสมาชิก</RouterLink></p>
  </form>
</template>