<!-- frontend/src/views/RegisterView.vue -->
<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const role = ref('user1')
const errorMessage = ref('')

const authStore = useAuthStore()
const router = useRouter()

async function handleRegister() {
  errorMessage.value = ''

  // Validate ข้อมูลฝั่ง Frontend ก่อนส่งไปยัง Backend
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

  try {
    await authStore.register(username.value.trim(), password.value, role.value)
    alert('สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ')
    router.push({ name: 'Login' })
  } catch (err) {
    errorMessage.value = err.message
  }
}
</script>

<template>
  <div style="max-width: 400px; margin: 40px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; font-family: sans-serif">
    <h2>สมัครสมาชิก</h2>
    <form @submit.prevent="handleRegister">
      <div style="margin-bottom: 12px">
        <label>ชื่อผู้ใช้:</label><br />
        <input v-model="username" type="text" required style="width: 100%; padding: 8px; box-sizing: border-box" />
      </div>
      <div style="margin-bottom: 12px">
        <label>รหัสผ่าน:</label><br />
        <input v-model="password" type="password" required style="width: 100%; padding: 8px; box-sizing: border-box" />
      </div>
      <div style="margin-bottom: 12px">
        <label>ยืนยันรหัสผ่าน:</label><br />
        <input v-model="confirmPassword" type="password" required style="width: 100%; padding: 8px; box-sizing: border-box" />
      </div>
      <div style="margin-bottom: 12px">
        <label>ระดับผู้ใช้งาน (Role):</label><br />
        <select v-model="role" style="width: 100%; padding: 8px">
          <option value="user1">ผู้ใช้งานระดับ 1 (User 1)</option>
          <option value="user2">ผู้ใช้งานระดับ 2 (User 2)</option>
          <option value="admin">ผู้ดูแลระบบ (Admin)</option>
        </select>
      </div>
      <p v-if="errorMessage" style="color: red">{{ errorMessage }}</p>
      <button type="submit" style="width: 100%; padding: 10px; cursor: pointer">สมัครสมาชิก</button>
    </form>
    <p style="margin-top: 12px; text-align: center">
      มีบัญชีอยู่แล้ว? <RouterLink :to="{ name: 'Login' }">เข้าสู่ระบบ</RouterLink>
    </p>
  </div>
</template>