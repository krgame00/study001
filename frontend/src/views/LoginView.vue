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
    errorMessage.value = 'กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน'
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
      <h2 style="text-align: center; margin-top: 0; margin-bottom: 20px">เข้าสู่ระบบ</h2>
      <form @submit.prevent="handleLogin">
        <label for="username">ชื่อผู้ใช้ (Username)</label>
        <input
          id="username"
          v-model="username"
          class="input"
          type="text"
          placeholder="กรอกชื่อผู้ใช้"
          required
        />

        <label for="password">รหัสผ่าน (Password)</label>
        <div class="row" style="margin-bottom: 14px; gap: 8px">
          <input
            id="password"
            v-model="password"
            class="input"
            style="flex: 1; margin-bottom: 0"
            :type="showPassword ? 'text' : 'password'"
            placeholder="กรอกรหัสผ่าน"
            required
          />
          <button type="button" class="btn btn-gray" @click="showPassword = !showPassword">
            {{ showPassword ? 'ซ่อน' : 'แสดง' }}
          </button>
        </div>

        <div v-if="errorMessage" class="alert">{{ errorMessage }}</div>

        <button type="submit" class="btn" style="width: 100%; margin-top: 4px" :disabled="isLoading">
          {{ isLoading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ (Login)' }}
        </button>
      </form>

      <p style="text-align: center; margin-top: 20px; font-size: 14px; color: #64748b">
        ยังไม่มีบัญชีผู้ใช้? <RouterLink :to="{ name: 'Register' }">สมัครสมาชิก</RouterLink>
      </p>
    </div>
  </div>
</template>
