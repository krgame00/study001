<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { api } from '../api'

const authStore = useAuthStore()
const router = useRouter()

const roleLabels = {
  admin: 'ผู้ดูแลระบบ (Admin)',
  user1: 'เจ้าหน้าที่ปฏิบัติการ (Officer)',
  user2: 'พนักงานทั่วไป (Staff)'
}

const profile = ref(null)
const categories = ref([])
const items = ref([])
const msg = ref({ error: '', ok: '' })

// ค้นหาและแบ่งหน้า
const search = ref('')
const filterCat = ref('')
const page = ref(1)
const pageSize = 5

// ฟอร์มเพิ่มและแก้ไข (รวมเป็น Object เพื่อให้จำง่าย)
const emptyForm = () => ({ title: '', description: '', category_id: '', file: null })
const form = ref(emptyForm())
const edit = ref(null)
const fileInput = ref(null)

const totalPages = computed(() => Math.max(1, Math.ceil(items.value.length / pageSize)))
const pagedItems = computed(() => items.value.slice((page.value - 1) * pageSize, page.value * pageSize))

function notify(okText) {
  msg.value = { error: '', ok: okText }
  setTimeout(() => (msg.value.ok = ''), 3000)
}

function toFormData(obj) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(obj)) {
    if (v !== null && v !== undefined) fd.append(k, v)
  }
  return fd
}

async function fetchItems() {
  msg.value.error = ''
  try {
    const q = new URLSearchParams()
    if (search.value.trim()) q.append('search', search.value.trim())
    if (filterCat.value) q.append('category_id', filterCat.value)
    items.value = (await api(`/items?${q}`)).data
    page.value = 1
  } catch (err) {
    msg.value.error = err.message
  }
}

onMounted(async () => {
  try {
    profile.value = (await api('/profile')).data
    categories.value = (await api('/categories')).data
    await fetchItems()
  } catch (err) {
    msg.value.error = err.message
  }
})

async function handleCreate() {
  if (!form.value.title.trim()) return (msg.value.error = 'กรุณากรอกหัวข้อรายการก่อนบันทึก')
  try {
    const res = await api('/items', { method: 'POST', body: toFormData(form.value) })
    form.value = emptyForm()
    if (fileInput.value) fileInput.value.value = ''
    notify(res.message || 'บันทึกข้อมูลสำเร็จ')
    await fetchItems()
  } catch (err) {
    msg.value.error = err.message
  }
}

function startEdit(item) {
  edit.value = {
    id: item.id,
    title: item.title,
    description: item.description || '',
    category_id: item.category_id || '',
    completed: Boolean(item.completed),
    file: null
  }
}

async function handleUpdate() {
  if (!edit.value.title.trim()) return (msg.value.error = 'หัวข้อรายการต้องไม่เป็นค่าว่าง')
  try {
    const { id, ...payload } = edit.value
    const res = await api(`/items/${id}`, { method: 'PUT', body: toFormData(payload) })
    edit.value = null
    notify(res.message || 'อัปเดตรายการสำเร็จ')
    await fetchItems()
  } catch (err) {
    msg.value.error = err.message
  }
}

async function handleDelete(item) {
  if (!confirm(`ยืนยันการลบรายการ "${item.title}" ใช่หรือไม่?`)) return
  try {
    const res = await api(`/items/${item.id}`, { method: 'DELETE' })
    notify(res.message || 'ลบรายการสำเร็จ')
    await fetchItems()
  } catch (err) {
    msg.value.error = err.message
  }
}

function handleLogout() {
  authStore.logout()
  router.push({ name: 'Login' })
}
</script>

<template>
  <div class="container">
    <!-- แถบผู้ใช้ด้านบน -->
    <div class="card row between">
      <div>
        <h2 style="margin: 0 0 4px 0">ระบบจัดการข้อมูล (Dashboard)</h2>
        <div v-if="profile" style="font-size: 14px">
          ผู้ใช้: <strong>{{ profile.username }}</strong> |
          สิทธิ์: <span class="badge">{{ roleLabels[profile.role] || profile.role.toUpperCase() }}</span>
        </div>
      </div>
      <button class="btn btn-red" @click="handleLogout">ออกจากระบบ (Logout)</button>
    </div>

    <div v-if="msg.ok" class="alert alert-ok">{{ msg.ok }}</div>
    <div v-if="msg.error" class="alert">{{ msg.error }}</div>

    <!-- ฟอร์มเพิ่มข้อมูลใหม่ + แนบไฟล์ -->
    <div class="card">
      <h3 style="margin-top: 0">เพิ่มข้อมูลใหม่</h3>
      <form @submit.prevent="handleCreate">
        <div class="row">
          <input v-model="form.title" type="text" class="input" placeholder="หัวข้อรายการ *" style="flex: 2" required />
          <select v-model="form.category_id" class="input" style="flex: 1">
            <option value="">-- เลือกหมวดหมู่ --</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
        <input v-model="form.description" type="text" class="input" placeholder="รายละเอียดเพิ่มเติม" />
        <div class="row between">
          <div>
            <label style="font-size: 14px">แนบไฟล์ประกอบ: </label>
            <input ref="fileInput" type="file" @change="(e) => (form.file = e.target.files[0] || null)" />
          </div>
          <button type="submit" class="btn">บันทึกข้อมูล</button>
        </div>
      </form>
    </div>

    <!-- ค้นหาและตารางข้อมูล -->
    <div class="card">
      <h3 style="margin-top: 0">รายการข้อมูลทั้งหมด</h3>
      <div class="row" style="margin-bottom: 12px">
        <input
          v-model="search"
          type="text"
          class="input"
          placeholder="ค้นหาตามหัวข้อหรือรายละเอียด..."
          style="flex: 2; margin-bottom: 0"
          @keyup.enter="fetchItems"
        />
        <select v-model="filterCat" class="input" style="flex: 1; margin-bottom: 0" @change="fetchItems">
          <option value="">ทุกหมวดหมู่</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
        <button class="btn btn-gray" @click="fetchItems">ค้นหา</button>
      </div>

      <p v-if="items.length === 0" style="text-align: center; color: #666">ไม่พบข้อมูลรายการ</p>

      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>สถานะ</th>
              <th>หมวดหมู่</th>
              <th>หัวข้อ</th>
              <th>รายละเอียด</th>
              <th>ไฟล์แนบ</th>
              <th>เจ้าของข้อมูล</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in pagedItems" :key="item.id">
              <template v-if="edit?.id === item.id">
                <td><label><input v-model="edit.completed" type="checkbox" /> เสร็จสิ้น</label></td>
                <td>
                  <select v-model="edit.category_id" class="input" style="margin-bottom: 0">
                    <option value="">ไม่ระบุ</option>
                    <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                  </select>
                </td>
                <td><input v-model="edit.title" type="text" class="input" style="margin-bottom: 0" required /></td>
                <td><input v-model="edit.description" type="text" class="input" style="margin-bottom: 0" /></td>
                <td><input type="file" @change="(e) => (edit.file = e.target.files[0] || null)" /></td>
                <td>{{ item.owner_name || '-' }}</td>
                <td>
                  <button class="btn btn-green" style="margin-right: 4px" @click="handleUpdate">บันทึก</button>
                  <button class="btn btn-gray" @click="edit = null">ยกเลิก</button>
                </td>
              </template>

              <template v-else>
                <td>{{ item.completed ? '✅ เสร็จสิ้น' : '⏳ รอดำเนินการ' }}</td>
                <td>{{ item.category_name || '-' }}</td>
                <td><strong>{{ item.title }}</strong></td>
                <td>{{ item.description || '-' }}</td>
                <td>
                  <a v-if="item.file_path" :href="`http://localhost:3000${item.file_path}`" target="_blank">เปิดไฟล์</a>
                  <span v-else>-</span>
                </td>
                <td>{{ item.owner_name || '-' }}</td>
                <td>
                  <template v-if="profile?.role === 'admin' || item.user_id === profile?.id">
                    <button class="btn btn-gray" style="margin-right: 4px" @click="startEdit(item)">แก้ไข</button>
                    <button v-if="profile?.role !== 'user2'" class="btn btn-red" @click="handleDelete(item)">ลบ</button>
                  </template>
                  <span v-else style="color: #888; font-size: 13px">ดูได้อย่างเดียว</span>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="items.length > 0" class="row between" style="margin-top: 12px; font-size: 14px">
        <span>แสดงหน้า {{ page }} จาก {{ totalPages }} (ทั้งหมด {{ items.length }} รายการ)</span>
        <div class="row">
          <button :disabled="page <= 1" class="btn btn-gray" @click="page--">ก่อนหน้า</button>
          <button :disabled="page >= totalPages" class="btn btn-gray" @click="page++">ถัดไป</button>
        </div>
      </div>
    </div>
  </div>
</template>
