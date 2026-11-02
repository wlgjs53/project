// 음력 2월 초하루(영등 시즌 시작)까지 남은 날 계산
function lunar(d) {
  const p = new Intl.DateTimeFormat('en-u-ca-chinese', { month: 'numeric', day: 'numeric' }).formatToParts(d)
  return { m: p.find((x) => x.type === 'month').value, d: +p.find((x) => x.type === 'day').value }
}

export function nextYeongdeung(now = new Date()) {
  try {
    const l0 = lunar(now)
    if (l0.m === '2' && l0.d <= 15) {
      return {
        season: true,
        big: `${l0.d}일째`,
        sub: '지금은 영등 시즌입니다. 할망이 제주에 머무는 중입니다.',
        intro: '지금, 영등할망이 제주에 계십니다.',
      }
    }
    for (let k = 1; k < 430; k++) {
      const d = new Date(now.getTime() + k * 864e5)
      const l = lunar(d)
      if (l.m === '2' && l.d === 1) {
        const ds = d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
        return {
          season: false,
          big: `D-${k}`,
          sub: `음력 2월 초하루 · ${ds}부터 영등 시즌이 시작됩니다.`,
          intro: `다음 영등까지 D-${k}`,
        }
      }
    }
  } catch { /* Intl 중국력 미지원 환경 */ }
  return { season: false, big: 'D-?', sub: '음력 2월 초하루(양력 2~3월경)에 영등 시즌이 시작됩니다.', intro: '' }
}
