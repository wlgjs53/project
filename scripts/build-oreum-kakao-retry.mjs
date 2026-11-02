// build-oreum-kakao.mjs 에서 못 찾았거나(또는 검토에서 뺀) 오름을, 검색어를 바꿔 가며 다시 찾아 oreumPhotosKakao.json 에 더한다.
// 정확도보다 "사진이 있는 화면"을 우선하는 과제용 처리라서, 출처 표기와 함께 느슨한 기준으로 고른다.
// 실행: node scripts/build-oreum-kakao-retry.mjs   (.env.local 의 KAKAO_REST_KEY, DATA_GO_KR_KEY 사용)
import { readFileSync, writeFileSync } from 'node:fs'

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
  if (m && m[2] !== '') process.env[m[1]] = m[2].trim()
}
const { getOreums } = await import('../server/oreum.js')
const { listTour } = await import('../server/tour.js')
const dir = new URL('../src/data/', import.meta.url)
const official = JSON.parse(readFileSync(new URL('oreumPhotos.json', dir), 'utf8'))
const kakaoPath = new URL('oreumPhotosKakao.json', dir)
const kakao = JSON.parse(readFileSync(kakaoPath, 'utf8'))
const tour = (await listTour({ keyword: '오름', contentTypeId: '12' })).items

const rad = Math.PI / 180
const dist = (a, b) => {
  const x = (b.lat - a.lat) * rad, y = (b.lng - a.lng) * rad
  const h = Math.sin(x / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(y / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}
const norm = (t) => t.replace(/\(.*?\)/g, '').replace(/\s/g, '')
const has = (o) => official[o.id] || kakao[o.id] || tour.some((p) => norm(p.title) === norm(o.title) || dist(o, p) < 0.6)

async function search(q) {
  const r = await fetch(`https://dapi.kakao.com/v2/search/image?query=${encodeURIComponent(q)}&size=15&sort=accuracy`, { headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_KEY}` } })
  if (!r.ok) throw new Error(`카카오 검색 오류 ${r.status}`)
  return (await r.json()).documents ?? []
}

const used = new Set(Object.values(kakao).map((v) => v.url)) // 같은 사진이 여러 오름에 붙지 않게
const added = [], still = []
for (const o of await getOreums()) {
  if (has(o)) continue
  const base = o.title.replace(/\(.*?\)/g, '').trim()
  const name = /(오름|봉|악)$/.test(base) ? base : `${base}오름`
  let pick = null
  for (const q of [`제주 ${name} 풍경`, `${name} 제주 오름`, `제주도 ${name}`, `${name}`]) {
    const docs = (await search(q)).filter((d) => d.width >= 400 && d.height >= 250 && d.width >= d.height && !used.has(d.image_url))
    if (docs[0]) { pick = docs[0]; break }
    await new Promise((r) => setTimeout(r, 120))
  }
  if (pick) { used.add(pick.image_url); kakao[o.id] = { url: pick.image_url.replace(/^http:/, 'https:'), thumb: pick.thumbnail_url, site: pick.display_sitename, src: pick.doc_url }; added.push(o.title) }
  else still.push(o.title)
}
writeFileSync(kakaoPath, JSON.stringify(kakao, null, 1))
console.log(`추가 ${added.length}곳: ${added.join(' ')}\n여전히 없음 ${still.length}곳: ${still.join(' ')}`)
