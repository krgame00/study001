<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const role = ref('user1')
const errorMessage = ref('')
const isLoading = ref(false)

const authStore = useAuthStore()
const router = useRouter()

async function handleRegister() {
  errorMessage.value = ''
  if (username.value.trim().length < 3) {
    errorMessage.value = 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร'
    return
  }
  if (password.value.length < 4) {
    errorMessage.value = 'รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน'
    return
  }

  isLoading.value = true
  try {
    await authStore.register(username.value.trim(), password.value, role.value)
    alert('สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ')
    router.push({ name: 'Login' })
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
      <h2 style="text-align: center; margin-top: 0; margin-bottom: 20px">สมัครสมาชิก</h2>
      <form @submit.prevent="handleRegister">
        <label for="reg-username">ชื่อผู้ใช้ (Username)</label>
        <input
          id="reg-username"
          v-model="username"
          class="input"
          type="text"
          placeholder="อย่างน้อย 3 ตัวอักษร"
          required
        />

        <label for="reg-password">รหัสผ่าน (Password)</label>
        <input
          id="reg-password"
          v-model="password"
          class="input"
          type="password"
          placeholder="อย่างน้อย 4 ตัวอักษร"
          required
        />

        <label for="reg-confirm">ยืนยันรหัสผ่าน</label>
        <input
          id="reg-confirm"
          v-model="confirmPassword"
          class="input"
          type="password"
          placeholder="กรอกรหัสผ่านอีกครั้ง"
          required
        />

        <label for="reg-role">ระดับผู้ใช้งาน (Role)</label>
        <select id="reg-role" v-model="role" class="input">
          <option value="user1">ผู้ใช้งานระดับ 1 (User 1)</option>
          <option value="user2">ผู้ใช้งานระดับ 2 (User 2)</option>
          <option value="admin">ผู้ดูแลระบบ (Admin)</option>
        </select>

        <div v-if="errorMessage" class="alert">{{ errorMessage }}</div>

        <button type="submit" class="btn" style="width: 100%; margin-top: 4px" :disabled="isLoading">
          {{ isLoading ? 'กำลังบันทึกข้อมูล...' : 'สมัครสมาชิก' }}
        </button>
      </form>

      <p style="text-align: center; margin-top: 20px; font-size: 14px; color: #64748b">
        มีบัญชีอยู่แล้ว? <RouterLink :to="{ name: 'Login' }">เข้าสู่ระบบ</RouterLink>
      </p>
    </div>
  </div>
</template>
