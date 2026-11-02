// 공식 자료(관광사진정보·TourAPI)에 사진이 없는 오름을 카카오(다음) 이미지 검색으로 찾아 src/data/oreumPhotosKakao.json 에 저장한다.
// 검색 결과 사진은 블로그·뉴스 등 원 저작자가 있는 사진이라, 출처 사이트 이름과 원문 링크를 함께 저장해 화면에 표시한다.
// 실행: node scripts/build-oreum-kakao.mjs   (.env.local 의 KAKAO_REST_KEY, DATA_GO_KR_KEY 사용 — 키는 출력·저장하지 않는다)
import { readFileSync, writeFileSync } from 'node:fs'

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
  if (m && m[2] !== '') process.env[m[1]] = m[2].trim()
}
const { getOreums } = await import('../server/oreum.js')
const { listTour } = await import('../server/tour.js')
const official = JSON.parse(readFileSync(new URL('../src/data/oreumPhotos.json', import.meta.url), 'utf8'))
const tour = (await listTour({ keyword: '오름', contentTypeId: '12' })).items

const rad = Math.PI / 180
const dist = (a, b) => {
  const x = (b.lat - a.lat) * rad, y = (b.lng - a.lng) * rad
  const h = Math.sin(x / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(y / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}
const norm = (t) => t.replace(/\(.*?\)/g, '').replace(/\s/g, '')
const hasOfficial = (o) => official[o.id] || tour.some((p) => norm(p.title) === norm(o.title) || dist(o, p) < 0.6)

async function search(q) {
  const r = await fetch(`https://dapi.kakao.com/v2/search/image?query=${encodeURIComponent(q)}&size=10&sort=accuracy`, { headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_KEY}` } })
  if (!r.ok) throw new Error(`카카오 검색 오류 ${r.status}`)
  return (await r.json()).documents ?? []
}

// 사람이 사진을 직접 훑어 보고 오름과 무관한 사진(걸음수 앱 화면, 음식, 꽃 클로즈업, 인물 등)으로 판단해 뺀 오름 id — 다시 실행해도 제외한다
const REJECT = new Set(["o:ansemi","o:daesusanbong","o:docheong","o:dokjabong","o:eodo","o:eunwolbong","o:geolli","o:geuglak","o:gungdaeak","o:injeong","o:jeseok","o:muak","o:myosanbong","o:sammaebong","o:sengili","o:sesin","o:yeongjusan"])
const out = {}
const missing = []
for (const o of await getOreums()) {
  if (hasOfficial(o) || REJECT.has(o.id)) continue
  const base = o.title.replace(/\(.*?\)/g, '').trim()
  const name = /(오름|봉|악)$/.test(base) ? base : `${base}오름`
  // 가로로 넓고 충분히 큰 사진 중 가장 정확도 높은 것
  const docs = (await search(`제주 ${name}`)).filter((d) => d.width >= 500 && d.height >= 300 && d.width >= d.height)
  const d = docs[0]
  if (d) out[o.id] = { url: d.image_url.replace(/^http:/, 'https:'), thumb: d.thumbnail_url, site: d.display_sitename, src: d.doc_url }
  else missing.push(o.title)
  await new Promise((r) => setTimeout(r, 150))
}
writeFileSync(new URL('../src/data/oreumPhotosKakao.json', import.meta.url), JSON.stringify(out, null, 1))
console.log(`카카오 사진 ${Object.keys(out).length}곳 저장, 못 찾은 곳 ${missing.length}: ${missing.join(' ')}`)
