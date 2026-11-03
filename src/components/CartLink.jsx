import { Link } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

// 헤더 오른쪽 위의 굿즈 장바구니 아이콘 (담은 개수 표시) — 굿즈샵(/shop)으로 간다
export default function CartLink() {
  const count = useAppStore((s) => s.cart.reduce((a, c) => a + c.qty, 0))
  return (
    <Link to="/shop" className="cart-link" aria-label={`굿즈 장바구니 ${count}개`} title="영등할망 굿즈샵">
      <i className="bi bi-bag-heart" />
      {count > 0 && <span className="count">{count}</span>}
    </Link>
  )
}
