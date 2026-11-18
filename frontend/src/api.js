const API_URL = 'http://localhost:3000/api'

export async function api(path, options = {}) {
  const token = localStorage.getItem('token')
  const headers = { ...options.headers }
  if (token) headers.Authorization = `Bearer ${token}`

  let body = options.body
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(body)
  }

  const res = await fetch(API_URL + path, { ...options, headers, body })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'เกิดข้อผิดพลาด')
  return data
}
