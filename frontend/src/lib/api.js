const BASE = (import.meta.env.VITE_API_URL || '') + '/api'

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function signup(email, password) {
  const res = await fetch(`${BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Signup failed')
  return data
}

export async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Login failed')
  return data
}

export async function myVideos(token) {
  const res = await fetch(`${BASE}/videos`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Could not load your videos')
  return res.json()
}

export async function getTrends(token) {
  const res = await fetch(`${BASE}/trends`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Could not load trends')
  return res.json()
}

export async function uploadVideo(file, token) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/upload`, { method: 'POST', headers: authHeaders(token), body: form })
  if (!res.ok) throw new Error((await res.json()).detail || 'Upload failed')
  return res.json()
}

export async function startAnalysis(videoId, token, conf) {
  const query = conf != null ? `?conf=${conf}` : ''
  const res = await fetch(`${BASE}/analyze/${videoId}${query}`, { method: 'POST', headers: authHeaders(token) })
  if (!res.ok) throw new Error('Could not start analysis')
  return res.json()
}

export async function getStatus(videoId, token) {
  const res = await fetch(`${BASE}/status/${videoId}`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Status check failed')
  return res.json()
}

export async function getResults(videoId, token) {
  const res = await fetch(`${BASE}/results/${videoId}`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Results not ready')
  return res.json()
}

export function annotatedVideoUrl(videoId, token) {
  return `${BASE}/video/${videoId}/annotated?t=${encodeURIComponent(token || '')}`
}

export function pdfReportUrl(videoId, token) {
  return `${BASE}/report/${videoId}/pdf?t=${encodeURIComponent(token || '')}`
}

export async function sendChat(videoId, message, history, token) {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ video_id: videoId, message, history }),
  })
  if (!res.ok) throw new Error((await res.json()).detail || 'Chat failed')
  return res.json()
}

export async function generalUpload(file, token) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/general/upload`, { method: 'POST', headers: authHeaders(token), body: form })
  if (!res.ok) throw new Error('Upload failed')
  return res.json()
}

export async function generalAnalyze(jobId, token) {
  const res = await fetch(`${BASE}/general/analyze/${jobId}`, { method: 'POST', headers: authHeaders(token) })
  if (!res.ok) throw new Error('Could not start analysis')
  return res.json()
}

export async function generalStatus(jobId, token) {
  const res = await fetch(`${BASE}/general/status/${jobId}`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Status check failed')
  return res.json()
}

export async function generalResults(jobId, token) {
  const res = await fetch(`${BASE}/general/results/${jobId}`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Results not ready')
  return res.json()
}

export async function generalHistory(token) {
  const res = await fetch(`${BASE}/general/history`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Could not load history')
  return res.json()
}

export function generalPdfUrl(jobId, token) {
  return `${BASE}/general/report/${jobId}/pdf?t=${encodeURIComponent(token || '')}`
}

export async function generalChat(jobId, message, history, token) {
  const res = await fetch(`${BASE}/general/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ job_id: jobId, message, history }),
  })
  if (!res.ok) throw new Error((await res.json()).detail || 'Chat failed')
  return res.json()
}

export async function getSettings(token) {
  const res = await fetch(`${BASE}/settings`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Could not load settings')
  return res.json()
}

export async function saveSettings(managerEmail, token) {
  const res = await fetch(`${BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ manager_email: managerEmail }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Could not save settings')
  return data
}