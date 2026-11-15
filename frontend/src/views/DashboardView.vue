<!-- frontend/src/views/DashboardView.vue -->
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

// ตัวกรองและค้นหา (Search & Filter)
const searchQuery = ref('')
const selectedCategory = ref('')

// การแบ่งหน้า (Pagination)
const currentPage = ref(1)
const pageSize = 5

// ฟอร์มเพิ่มรายการใหม่ (Create)
const newTitle = ref('')
const newDescription = ref('')
const newCategoryId = ref('')
const newFile = ref(null)
const createFileInput = ref(null)

// โหมดแก้ไขรายการ (Update)
const editingId = ref(null)
const editTitle = ref('')
const editDescription = ref('')
const editCategoryId = ref('')
const editCompleted = ref(false)
const editFile = ref(null)

// คำนวณรายการตามหน้าปัจจุบัน (Pagination)
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
    // 1. ดึงข้อมูลโปรไฟล์และสิทธิ์ผู้ใช้จาก Token
    const profRes = await fetch('http://localhost:3000/api/profile', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    const profJson = await profRes.json()
    if (!profRes.ok) throw new Error(profJson.message)
    profile.value = profJson.data

    // 2. ดึงรายการหมวดหมู่
    const catRes = await fetch('http://localhost:3000/api/categories', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    const catJson = await catRes.json()
    if (catRes.ok) categories.value = catJson.data

    // 3. ดึงรายการข้อมูล
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

function onCreateFileChange(event) {
  newFile.value = event.target.files[0] || null
}

function onEditFileChange(event) {
  editFile.value = event.target.files[0] || null
}

// เพิ่มรายการใหม่พร้อมไฟล์แนบ (Create)
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
    if (newFile.value) {
      formData.append('file', newFile.value)
    }

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

// แก้ไขข้อมูลและไฟล์แนบ (Update)
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
    if (editFile.value) {
      formData.append('file', editFile.value)
    }

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

// แจ้งเตือนและลบข้อมูล (Delete)
async function handleDelete(item) {
  if (!confirm(`ยืนยันการลบรายการ "${item.title}" ใช่หรือไม่?`)) {
    return
  }

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
  <div style="max-width: 960px; margin: 20px auto; padding: 0 16px; font-family: sans-serif">
    <!-- แถบหัวข้อและข้อมูลสิทธิ์ผู้ใช้ -->
    <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px; background: #f4f6f8; padding: 14px; border-radius: 8px">
      <div>
        <h2 style="margin: 0 0 4px 0">ระบบจัดการข้อมูล (Dashboard)</h2>
        <span v-if="profile">
          ผู้ใช้: <strong>{{ profile.username }}</strong> |
          ระดับสิทธิ์:
          <strong style="color: #0b5ed7; text-transform: uppercase">{{ profile.role }}</strong>
          <span v-if="profile.role === 'admin'"> (สิทธิ์ผู้ดูแลระบบ: ดูและจัดการได้ทุกรายการ)</span>
          <span v-else-if="profile.role === 'user2'"> (ผู้ใช้งานระดับ 2: เพิ่มและแก้ไขข้อมูลส่วนตัว)</span>
          <span v-else> (ผู้ใช้งานระดับ 1: จัดการข้อมูลส่วนตัว)</span>
        </span>
      </div>
      <button @click="handleLogout" style="padding: 8px 14px; cursor: pointer">ออกจากระบบ (Logout)</button>
    </div>

    <p v-if="successMessage" style="background: #d1e7dd; color: #0f5132; padding: 10px; border-radius: 6px">
      {{ successMessage }}
    </p>
    <p v-if="errorMessage" style="background: #f8d7da; color: #842029; padding: 10px; border-radius: 6px">
      {{ errorMessage }}
    </p>

    <!-- ฟอร์มเพิ่มข้อมูลใหม่ + แนบไฟล์ (Create) -->
    <div style="margin-top: 20px; padding: 16px; border: 1px solid #ddd; border-radius: 8px">
      <h3 style="margin-top: 0">เพิ่มข้อมูลใหม่</h3>
      <form @submit.prevent="handleCreate" style="display: grid; gap: 10px">
        <div style="display: flex; flex-wrap: wrap; gap: 10px">
          <input v-model="newTitle" type="text" placeholder="หัวข้อรายการ *" required style="flex: 2; min-width: 200px; padding: 8px" />
          <select v-model="newCategoryId" style="flex: 1; min-width: 150px; padding: 8px">
            <option value="">-- เลือกหมวดหมู่ --</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
        <input v-model="newDescription" type="text" placeholder="รายละเอียดเพิ่มเติม" style="padding: 8px" />
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px">
          <div>
            <label>แนบไฟล์ประกอบ: </label>
            <input ref="createFileInput" type="file" @change="onCreateFileChange" />
          </div>
          <button type="submit" style="padding: 8px 18px; cursor: pointer">บันทึกข้อมูล</button>
        </div>
      </form>
    </div>

    <!-- ช่องค้นหาและตัวกรองหมวดหมู่ (Search & Filter) -->
    <div style="margin-top: 20px; display: flex; flex-wrap: wrap; gap: 10px; align-items: center">
      <input
        v-model="searchQuery"
        @keyup.enter="fetchItems"
        type="text"
        placeholder="ค้นหาตามหัวข้อหรือรายละเอียด..."
        style="flex: 2; min-width: 200px; padding: 8px"
      />
      <select v-model="selectedCategory" @change="fetchItems" style="flex: 1; min-width: 150px; padding: 8px">
        <option value="">ทุกหมวดหมู่</option>
        <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
      </select>
      <button @click="fetchItems" style="padding: 8px 16px; cursor: pointer">ค้นหา</button>
    </div>

    <!-- ตารางแสดงผลข้อมูล (Read / Update / Delete) -->
    <div style="margin-top: 16px; overflow-x: auto">
      <p v-if="items.length === 0">ไม่พบข้อมูลรายการ</p>

      <table v-else border="1" cellpadding="8" cellspacing="0" style="width: 100%; border-collapse: collapse">
        <thead style="background: #f4f6f8">
          <tr>
            <th>สถานะ</th>
            <th>หมวดหมู่</th>
            <th>หัวข้อ</th>
            <th>รายละเอียด</th>
            <th>ไฟล์แนบ</th>
            <th v-if="profile?.role === 'admin'">เจ้าของข้อมูล</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in paginatedItems" :key="item.id">
            <!-- โหมดแก้ไข (Update) -->
            <template v-if="editingId === item.id">
              <td><input type="checkbox" v-model="editCompleted" /> เสร็จสิ้น</td>
              <td>
                <select v-model="editCategoryId">
                  <option value="">ไม่ระบุ</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                </select>
              </td>
              <td><input v-model="editTitle" type="text" required /></td>
              <td><input v-model="editDescription" type="text" /></td>
              <td><input type="file" @change="onEditFileChange" /></td>
              <td v-if="profile?.role === 'admin'">{{ item.owner_name }}</td>
              <td>
                <button @click="handleUpdate(item.id)" style="margin-right: 4px">บันทึก</button>
                <button @click="cancelEdit">ยกเลิก</button>
              </td>
            </template>

            <!-- โหมดแสดงผลปกติ (Read) -->
            <template v-else>
              <td>{{ item.completed ? 'เสร็จสิ้น' : 'รอดำเนินการ' }}</td>
              <td>{{ item.category_name || '-' }}</td>
              <td>{{ item.title }}</td>
              <td>{{ item.description || '-' }}</td>
              <td>
                <a v-if="item.file_path" :href="`http://localhost:3000${item.file_path}`" target="_blank">เปิดไฟล์</a>
                <span v-else>-</span>
              </td>
              <td v-if="profile?.role === 'admin'">{{ item.owner_name }}</td>
              <td>
                <button @click="startEdit(item)" style="margin-right: 4px">แก้ไข</button>
                <button v-if="profile?.role !== 'user2'" @click="handleDelete(item)">ลบ</button>
              </td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- แถบแบ่งหน้า (Pagination) -->
    <div v-if="items.length > 0" style="margin-top: 12px; display: flex; justify-content: space-between; align-items: center">
      <span>แสดงหน้า {{ currentPage }} จาก {{ totalPages }} (ทั้งหมด {{ items.length }} รายการ)</span>
      <div>
        <button :disabled="currentPage <= 1" @click="currentPage--" style="margin-right: 6px; padding: 6px 12px">ก่อนหน้า</button>
        <button :disabled="currentPage >= totalPages" @click="currentPage++" style="padding: 6px 12px">ถัดไป</button>
      </div>
    </div>
  </div>
</template>