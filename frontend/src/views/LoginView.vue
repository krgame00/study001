<script setup>
import { ref } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMessage = ref('')
const isLoading = ref(false)

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

async function handleLogin() {
  errorMessage.value = ''
  if (!username.value.trim() || !password.value) {
    errorMessage.value = 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'
    return
  }

  isLoading.value = true
  try {
    await authStore.login(username.value.trim(), password.value)
    router.push(route.query.redirect || '/dashboard')
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-box">
    <div class="card">
      <h2 style="text-align: center; margin-top: 0">เข้าสู่ระบบ</h2>
      <form @submit.prevent="handleLogin">
        <label>ชื่อผู้ใช้ (Username)</label>
        <input id="username" v-model="username" class="input" type="text" placeholder="กรอกชื่อผู้ใช้" />

        <label>รหัสผ่าน (Password)</label>
        <div class="row" style="margin-bottom: 10px">
          <input
            id="password"
            v-model="password"
            class="input"
            :type="showPassword ? 'text' : 'password'"
            placeholder="กรอกรหัสผ่าน"
            style="flex: 1; margin-bottom: 0"
          />
          <button type="button" class="btn btn-gray" @click="showPassword = !showPassword">
            {{ showPassword ? 'ซ่อน' : 'แสดง' }}
          </button>
        </div>

        <div v-if="errorMessage" class="alert">{{ errorMessage }}</div>
        <button type="submit" class="btn" style="width: 100%" :disabled="isLoading">
          {{ isLoading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ (Login)' }}
        </button>
      </form>
      <p style="text-align: center; margin-bottom: 0">
        ยังไม่มีบัญชี? <RouterLink :to="{ name: 'Register' }">สมัครสมาชิกที่นี่</RouterLink>
      </p>
    </div>
  </div>
</template>
