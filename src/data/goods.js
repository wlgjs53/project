// 영등할망 굿즈 (모의 상품 — 실제로 판매하지 않는 상상 디자인 시안입니다. 가격은 임의로 정했습니다.)
export const GOODS = [
  { id: 'g-wind-keyring', art: 'keyring-wind', name: '영등할망 바람 키링', price: 8900, tag: 'BEST', desc: '바람의 신 영등할망의 바람 소용돌이를 새긴 투명 아크릴 키링.' },
  { id: 'g-teuak-keyring', art: 'keyring-teuak', name: '해녀 테왁 키링', price: 9900, tag: '', desc: '해녀가 바다에서 쓰는 테왁을 작게 만든 키링. 영등굿의 주인공, 해녀를 기억해요.' },
  { id: 'g-halmang-doll', art: 'doll-halmang', name: '영등할망 인형 (15cm)', price: 29000, tag: 'NEW', desc: '하얀 머리카락에 바람 머플러를 두른 영등할망 손바닥 인형.' },
  { id: 'g-dol-doll', art: 'doll-dol', name: '돌하르방 인형 (12cm)', price: 24000, tag: '', desc: '제주의 수호신 돌하르방을 포근한 솜 인형으로.' },
  { id: 'g-pinwheel-magnet', art: 'magnet-pinwheel', name: '바람개비 마그넷', price: 6500, tag: '', desc: '오늘의 바람을 따라 돌아가는 바람개비 모양 냉장고 자석.' },
  { id: 'g-talisman-sticker', art: 'sticker-talisman', name: '영등 바람 부적 스티커 세트', price: 4500, tag: '', desc: '한 해의 안전과 풍어를 비는 마음을 담은 방수 스티커 5종.' },
]

export const goodsById = Object.fromEntries(GOODS.map((g) => [g.id, g]))
export const won = (n) => `${n.toLocaleString('ko-KR')}원`
