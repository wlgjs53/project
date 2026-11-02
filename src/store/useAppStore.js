import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import { askAgent } from '../api/client'

// ── 앱 전체가 함께 쓰는 상태(store) ──────────────────────
// 여러 페이지에서 같이 쓰는 데이터는 여기에 둡니다. (한 페이지에서만 쓰면 useState)
// 사용법:  const nickname = useAppStore((s) => s.nickname)
export const useAppStore = create(
  persist(
    (set, get) => ({
      // ① 사용자 — localStorage 에 저장되어 새로고침해도 유지
      nickname: '',
      setNickname: (nickname) => set({ nickname: nickname.trim() }),

      // ② 알림(토스트) — 어느 페이지에서든 get().toast('메시지')
      toasts: [],
      toast: (message, variant = 'success') => {
        const id = Date.now() + Math.random()
        set({ toasts: [...get().toasts, { id, message, variant }] })
        setTimeout(() => set({ toasts: get().toasts.filter((t) => t.id !== id) }), 2500)
      },

      // ③ 즐겨찾기 — Supabase favorites 테이블과 동기화 (STEP 5)
      favorites: [],
      favLoading: false,
      loadFavorites: async () => {
        if (!supabase) return get().toast('Supabase 설정(.env.local)이 필요해요', 'warning')
        set({ favLoading: true })
        const { data, error } = await supabase
          .from('favorites').select('*')
          .eq('nickname', get().nickname || '익명')
          .order('created_at', { ascending: false })
        set({ favLoading: false })
        if (error) return get().toast(error.message, 'danger')
        set({ favorites: data })
      },
      // 이 항목이 즐겨찾기에 있는지 (별 모양을 채울지 정할 때 씀)
      isFavorite: (source, id) => get().favorites.some((f) => f.source === source && f.item_id === String(id)),
      addFavorite: async ({ source, id, title }) => {
        if (!supabase) return get().toast('Supabase 설정(.env.local)이 필요해요', 'warning')
        const nickname = get().nickname || '익명'
        const itemId = String(id)
        // 같은 항목을 두 번 저장하지 않도록 서버에서도 확인 (다른 탭·기기에서 저장했거나 목록을 아직 안 불러왔을 수 있음)
        const dup = await supabase.from('favorites').select('id').eq('nickname', nickname).eq('source', source).eq('item_id', itemId).limit(1)
        if (dup.error) return get().toast(dup.error.message, 'danger')
        if (dup.data.length) {
          await get().loadFavorites()
          return get().toast('이미 즐겨찾기에 있어요', 'info')
        }
        const { data, error } = await supabase.from('favorites').insert({ nickname, source, item_id: itemId, title }).select().single()
        if (error) return get().toast(error.code === '23505' ? '이미 즐겨찾기에 있어요' : error.message, error.code === '23505' ? 'info' : 'danger')
        set({ favorites: [data, ...get().favorites] })
        get().toast('즐겨찾기에 저장했어요')
      },
      // 즐겨찾기에서 빼기. 테이블에 delete 정책이 없으면 행이 안 지워지므로(오류 없이 0건) 반환 행 수로 확인한다.
      removeFavorite: async (fav) => {
        if (!supabase) return get().toast('Supabase 설정(.env.local)이 필요해요', 'warning')
        const { data, error } = await supabase.from('favorites').delete().eq('id', fav.id).select()
        if (error) return get().toast(error.message, 'danger')
        if (!data?.length) return get().toast('삭제하지 못했어요 — Supabase 에 favorites delete 정책이 필요해요', 'danger')
        set({ favorites: get().favorites.filter((f) => f.id !== fav.id) })
        get().toast('즐겨찾기에서 뺐어요')
      },
      // 여러 개를 한 번에 빼기 (선택 삭제·전체 삭제). removeFavorite 와 같은 이유로 지워진 행 수를 확인한다.
      removeFavorites: async (favs) => {
        if (!supabase) return get().toast('Supabase 설정(.env.local)이 필요해요', 'warning')
        if (!favs.length) return
        const ids = favs.map((f) => f.id)
        const { data, error } = await supabase.from('favorites').delete().in('id', ids).select()
        if (error) return get().toast(error.message, 'danger')
        if (!data?.length) return get().toast('삭제하지 못했어요 — Supabase 에 favorites delete 정책이 필요해요', 'danger')
        const gone = new Set(data.map((r) => r.id))
        set({ favorites: get().favorites.filter((f) => !gone.has(f.id)) })
        get().toast(`즐겨찾기 ${data.length}곳을 뺐어요`)
      },
      // 가장 최근에 만든 바람따라 코스의 장소들 — 바람길 지도의 "동선 안내"가 이어서 보여 준다
      courseStops: [],
      setCourseStops: (courseStops) => set({ courseStops }),
      // 별을 누를 때: 이미 있으면 빼고, 없으면 저장
      toggleFavorite: async ({ source, id, title }) => {
        const found = get().favorites.find((f) => f.source === source && f.item_id === String(id))
        return found ? get().removeFavorite(found) : get().addFavorite({ source, id, title })
      },

      // ④ STEP 6: 에이전트 대화 — 페이지를 옮겨도 대화가 남도록 store 에 둡니다
      messages: [],          // { role: 'user' | 'assistant', text, steps }
      chatLoading: false,
      sendMessage: async (text) => {
        const history = get().messages.map((m) => ({ role: m.role, content: m.text }))  // Claude 형식
        set({ messages: [...get().messages, { role: 'user', text }], chatLoading: true })
        try {
          const { answer, steps } = await askAgent(text, history)
          set({ messages: [...get().messages, { role: 'assistant', text: answer, steps }] })
        } catch (e) {
          get().toast(e.message, 'danger')
        } finally {
          set({ chatLoading: false })
        }
      },
    }),
    {
      name: 'jeju-ip-store',                          // localStorage 키 이름
      partialize: (s) => ({ nickname: s.nickname, courseStops: s.courseStops }),  // 저장할 항목만 고르기
    },
  ),
)
