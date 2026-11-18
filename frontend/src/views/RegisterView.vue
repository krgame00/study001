<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const form = ref({ username: '', password: '', confirm: '', role: 'user1' })
const errorMessage = ref('')
const isLoading = ref(false)

const authStore = useAuthStore()
const router = useRouter()

async function handleRegister() {
  errorMessage.value = ''
  const { username, password, confirm, role } = form.value
  if (username.trim().length < 3) return (errorMessage.value = 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร')
  if (password.length < 4) return (errorMessage.value = 'รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร')
  if (password !== confirm) return (errorMessage.value = 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน')

  isLoading.value = true
  try {
    await authStore.register(username.trim(), password, role)
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
      <h2 style="text-align: center; margin-top: 0">สมัครสมาชิก</h2>
      <form @submit.prevent="handleRegister">
        <label>ชื่อผู้ใช้ (Username)</label>
        <input v-model="form.username" class="input" type="text" placeholder="อย่างน้อย 3 ตัวอักษร" required />

        <label>รหัสผ่าน (Password)</label>
        <input v-model="form.password" class="input" type="password" placeholder="อย่างน้อย 4 ตัวอักษร" required />

        <label>ยืนยันรหัสผ่าน</label>
        <input v-model="form.confirm" class="input" type="password" placeholder="กรอกรหัสผ่านอีกครั้ง" required />

        <label>ระดับผู้ใช้งาน (Role)</label>
        <select v-model="form.role" class="input">
          <option value="user1">ผู้ใช้งานระดับ 1 (User 1)</option>
          <option value="user2">ผู้ใช้งานระดับ 2 (User 2)</option>
          <option value="admin">ผู้ดูแลระบบ (Admin)</option>
        </select>

        <div v-if="errorMessage" class="alert">{{ errorMessage }}</div>
        <button type="submit" class="btn" style="width: 100%" :disabled="isLoading">
          {{ isLoading ? 'กำลังบันทึก...' : 'สมัครสมาชิก' }}
        </button>
      </form>
      <p style="text-align: center; margin-bottom: 0">
        มีบัญชีอยู่แล้ว? <RouterLink :to="{ name: 'Login' }">เข้าสู่ระบบ</RouterLink>
      </p>
    </div>
  </div>
</template>
