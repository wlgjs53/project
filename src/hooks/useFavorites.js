import { useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'

// 즐겨찾기를 쓰는 화면용: isFav(source, id) 로 저장 여부를 알고, toggle({source,id,title}) 로 저장·삭제한다.
// favorites 를 구독하므로 저장·삭제하면 별 모양이 바로 바뀐다.
export function useFavorites() {
  const favorites = useAppStore((s) => s.favorites)
  const toggle = useAppStore((s) => s.toggleFavorite)
  const isFav = useCallback((source, id) => favorites.some((f) => f.source === source && f.item_id === String(id)), [favorites])
  return { isFav, toggle }
}
