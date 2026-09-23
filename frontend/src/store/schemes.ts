import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Scheme, SchemeParams } from '../types'

interface SchemesState {
  schemes: Scheme[]
  addScheme: (name: string, params: SchemeParams) => { ok: boolean; error?: string; id?: string }
  renameScheme: (id: string, name: string) => { ok: boolean; error?: string }
  removeScheme: (id: string) => void
}

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/** 名称校验：非空且不与其他方案重名；返回可读提醒 */
export function validateSchemeName(name: string, schemes: Scheme[], selfId?: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return '方案名称不能为空'
  const duplicated = schemes.some(s => s.id !== selfId && s.name === trimmed)
  if (duplicated) return `已存在名为「${trimmed}」的方案，请换一个名字`
  return null
}

export const useSchemesStore = create<SchemesState>()(
  persist(
    (set, get) => ({
      schemes: [],
      addScheme: (name, params) => {
        const trimmed = name.trim()
        const error = validateSchemeName(trimmed, get().schemes)
        if (error) return { ok: false, error }
        const scheme: Scheme = { id: genId(), name: trimmed, createdAt: Date.now(), ...params }
        set({ schemes: [...get().schemes, scheme] })
        return { ok: true, id: scheme.id }
      },
      renameScheme: (id, name) => {
        const trimmed = name.trim()
        const error = validateSchemeName(trimmed, get().schemes, id)
        if (error) return { ok: false, error }
        set({ schemes: get().schemes.map(s => (s.id === id ? { ...s, name: trimmed } : s)) })
        return { ok: true }
      },
      removeScheme: (id) => set({ schemes: get().schemes.filter(s => s.id !== id) }),
    }),
    { name: 'poster-schemes' }
  )
)
