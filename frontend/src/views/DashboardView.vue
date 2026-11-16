<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const profile = ref(null)
const categories = ref([])
const items = ref([])
const errorMessage = ref('')
const successMessage = ref('')

// ค้นหาและแบ่งหน้า
const searchQuery = ref('')
const selectedCategory = ref('')
const currentPage = ref(1)
const pageSize = 5

// ฟอร์มเพิ่มข้อมูล
const newTitle = ref('')
const newDescription = ref('')
const newCategoryId = ref('')
const newFile = ref(null)
const createFileInput = ref(null)

// โหมดแก้ไขข้อมูล
const editingId = ref(null)
const editTitle = ref('')
const editDescription = ref('')
const editCategoryId = ref('')
const editCompleted = ref(false)
const editFile = ref(null)

const totalPages = computed(() => Math.max(1, Math.ceil(items.value.length / pageSize)))
const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return items.value.slice(start, start + pageSize)
})

function showSuccess(msg) {
  successMessage.value = msg
  setTimeout(() => (successMessage.value = ''), 3000)
}

async function loadInitialData() {
  errorMessage.value = ''
  try {
    const profRes = await fetch('http://localhost:3000/api/profile', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    const profJson = await profRes.json()
    if (!profRes.ok) throw new Error(profJson.message)
    profile.value = profJson.data

    const catRes = await fetch('http://localhost:3000/api/categories', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    const catJson = await catRes.json()
    if (catRes.ok) categories.value = catJson.data

    await fetchItems()
  } catch (err) {
    errorMessage.value = err.message
  }
}

async function fetchItems() {
  errorMessage.value = ''
  try {
    const params = new URLSearchParams()
    if (searchQuery.value.trim()) params.append('search', searchQuery.value.trim())
    if (selectedCategory.value) params.append('category_id', selectedCategory.value)

    const response = await fetch(`http://localhost:3000/api/items?${params.toString()}`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.message || 'ไม่สามารถโหลดข้อมูลได้')

    items.value = result.data
    currentPage.value = 1
  } catch (err) {
    errorMessage.value = err.message
  }
}

onMounted(loadInitialData)

async function handleCreate() {
  errorMessage.value = ''
  if (!newTitle.value.trim()) {
    errorMessage.value = 'กรุณากรอกหัวข้อรายการก่อนบันทึก'
    return
  }

  try {
    const formData = new FormData()
    formData.append('title', newTitle.value.trim())
    formData.append('description', newDescription.value)
    formData.append('category_id', newCategoryId.value)
    if (newFile.value) formData.append('file', newFile.value)

    const response = await fetch('http://localhost:3000/api/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authStore.token}` },
      body: formData
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.message || 'บันทึกข้อมูลไม่สำเร็จ')

    newTitle.value = ''
    newDescription.value = ''
    newCategoryId.value = ''
    newFile.value = null
    if (createFileInput.value) createFileInput.value.value = ''

    showSuccess(result.message || 'บันทึกข้อมูลสำเร็จ')
    await fetchItems()
  } catch (err) {
    errorMessage.value = err.message
  }
}

function startEdit(item) {
  editingId.value = item.id
  editTitle.value = item.title
  editDescription.value = item.description || ''
  editCategoryId.value = item.category_id || ''
  editCompleted.value = Boolean(item.completed)
  editFile.value = null
}

function cancelEdit() {
  editingId.value = null
  editFile.value = null
}

async function handleUpdate(id) {
  errorMessage.value = ''
  if (!editTitle.value.trim()) {
    errorMessage.value = 'หัวข้อรายการต้องไม่เป็นค่าว่าง'
    return
  }

  try {
    const formData = new FormData()
    formData.append('title', editTitle.value.trim())
    formData.append('description', editDescription.value)
    formData.append('category_id', editCategoryId.value)
    formData.append('completed', editCompleted.value)
    if (editFile.value) formData.append('file', editFile.value)

    const response = await fetch(`http://localhost:3000/api/items/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authStore.token}` },
      body: formData
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.message || 'แก้ไขข้อมูลไม่สำเร็จ')

    editingId.value = null
    editFile.value = null
    showSuccess(result.message || 'อัปเดตรายการสำเร็จ')
    await fetchItems()
  } catch (err) {
    errorMessage.value = err.message
  }
}

async function handleDelete(item) {
  if (!confirm(`ยืนยันการลบรายการ "${item.title}" ใช่หรือไม่?`)) return

  errorMessage.value = ''
  try {
    const response = await fetch(`http://localhost:3000/api/items/${item.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.message || 'ลบรายการไม่สำเร็จ')

    showSuccess(result.message || 'ลบรายการสำเร็จ')
    await fetchItems()
  } catch (err) {
    errorMessage.value = err.message
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
        <h2 style="margin: 0 0 6px 0">ระบบจัดการข้อมูล (Dashboard)</h2>
        <div v-if="profile" style="font-size: 14px; color: #475569">
          ผู้ใช้งาน: <strong>{{ profile.username }}</strong>
          <span style="margin: 0 8px">•</span>
          สิทธิ์การใช้งาน: <span class="badge">{{ profile.role.toUpperCase() }}</span>
        </div>
      </div>
      <button class="btn btn-red" @click="handleLogout">ออกจากระบบ (Logout)</button>
    </div>

    <div v-if="successMessage" class="alert alert-ok">{{ successMessage }}</div>
    <div v-if="errorMessage" class="alert">{{ errorMessage }}</div>

    <!-- ฟอร์มเพิ่มข้อมูลใหม่ + แนบไฟล์ -->
    <div class="card">
      <h3 style="margin-top: 0; margin-bottom: 16px">เพิ่มข้อมูลใหม่</h3>
      <form @submit.prevent="handleCreate">
        <div class="row">
          <input
            v-model="newTitle"
            type="text"
            class="input"
            placeholder="หัวข้อรายการ *"
            style="flex: 2"
            required
          />
          <select v-model="newCategoryId" class="input" style="flex: 1">
            <option value="">-- เลือกหมวดหมู่ --</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
        <input
          v-model="newDescription"
          type="text"
          class="input"
          placeholder="รายละเอียดเพิ่มเติม"
        />
        <div class="row between" style="margin-top: 4px">
          <div style="font-size: 14px; color: #475569">
            <label style="display: inline; margin-right: 8px">แนบไฟล์ประกอบ:</label>
            <input
              ref="createFileInput"
              type="file"
              @change="(e) => (newFile = e.target.files[0] || null)"
            />
          </div>
          <button type="submit" class="btn">บันทึกข้อมูล</button>
        </div>
      </form>
    </div>

    <!-- ค้นหาและตารางข้อมูล -->
    <div class="card">
      <h3 style="margin-top: 0; margin-bottom: 16px">รายการข้อมูลทั้งหมด</h3>
      <div class="row" style="margin-bottom: 14px">
        <input
          v-model="searchQuery"
          type="text"
          class="input"
          placeholder="ค้นหาตามหัวข้อหรือรายละเอียด..."
          style="flex: 2; margin-bottom: 0"
          @keyup.enter="fetchItems"
        />
        <select
          v-model="selectedCategory"
          class="input"
          style="flex: 1; margin-bottom: 0"
          @change="fetchItems"
        >
          <option value="">ทุกหมวดหมู่</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
        <button class="btn btn-gray" @click="fetchItems">ค้นหา</button>
      </div>

      <p v-if="items.length === 0" style="text-align: center; color: #94a3b8; padding: 32px 0">
        ไม่พบข้อมูลรายการ
      </p>

      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>สถานะ</th>
              <th>หมวดหมู่</th>
              <th>หัวข้อ</th>
              <th>รายละเอียด</th>
              <th>ไฟล์แนบ</th>
              <th v-if="profile?.role === 'admin'">เจ้าของข้อมูล</th>
              <th style="min-width: 140px">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in paginatedItems" :key="item.id">
              <template v-if="editingId === item.id">
                <td>
                  <label style="display: flex; align-items: center; gap: 6px; margin-bottom: 0; cursor: pointer">
                    <input v-model="editCompleted" type="checkbox" /> เสร็จสิ้น
                  </label>
                </td>
                <td>
                  <select v-model="editCategoryId" class="input" style="margin-bottom: 0">
                    <option value="">ไม่ระบุ</option>
                    <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                  </select>
                </td>
                <td>
                  <input v-model="editTitle" type="text" class="input" style="margin-bottom: 0" required />
                </td>
                <td>
                  <input v-model="editDescription" type="text" class="input" style="margin-bottom: 0" />
                </td>
                <td>
                  <input type="file" @change="(e) => (editFile = e.target.files[0] || null)" />
                </td>
                <td v-if="profile?.role === 'admin'">{{ item.owner_name }}</td>
                <td>
                  <button class="btn btn-green" style="margin-right: 6px; padding: 6px 12px; font-size: 13px" @click="handleUpdate(item.id)">บันทึก</button>
                  <button class="btn btn-gray" style="padding: 6px 12px; font-size: 13px" @click="cancelEdit">ยกเลิก</button>
                </td>
              </template>

              <template v-else>
                <td>{{ item.completed ? '✅ เสร็จสิ้น' : '⏳ รอดำเนินการ' }}</td>
                <td>{{ item.category_name || '-' }}</td>
                <td><strong>{{ item.title }}</strong></td>
                <td>{{ item.description || '-' }}</td>
                <td>
                  <a v-if="item.file_path" :href="`http://localhost:3000${item.file_path}`" target="_blank">เปิดไฟล์แนบ</a>
                  <span v-else style="color: #94a3b8">-</span>
                </td>
                <td v-if="profile?.role === 'admin'">{{ item.owner_name }}</td>
                <td>
                  <button class="btn btn-gray" style="margin-right: 6px; padding: 6px 12px; font-size: 13px" @click="startEdit(item)">แก้ไข</button>
                  <button v-if="profile?.role !== 'user2'" class="btn btn-red" style="padding: 6px 12px; font-size: 13px" @click="handleDelete(item)">ลบ</button>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="items.length > 0" class="row between" style="margin-top: 16px; font-size: 14px; color: #475569">
        <span>แสดงหน้า {{ currentPage }} จาก {{ totalPages }} (ทั้งหมด {{ items.length }} รายการ)</span>
        <div class="row" style="gap: 6px">
          <button :disabled="currentPage <= 1" class="btn btn-gray" style="padding: 6px 14px; font-size: 13px" @click="currentPage--">ก่อนหน้า</button>
          <button :disabled="currentPage >= totalPages" class="btn btn-gray" style="padding: 6px 14px; font-size: 13px" @click="currentPage++">ถัดไป</button>
        </div>
      </div>
    </div>
  </div>
</template>
