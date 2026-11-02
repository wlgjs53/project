// 오름 90곳의 사진을 한국관광공사 관광사진정보(PhotoGalleryService1)에서 찾아 src/data/oreumPhotos.json 으로 저장한다.
// 오름 하나당 한 번씩 검색해야 해서(90회) 화면을 열 때마다 하지 않고, 이 스크립트로 미리 만들어 두는 방식이다.
// 실행: node scripts/build-oreum-photos.mjs   (.env.local 의 DATA_GO_KR_KEY 사용 — 키는 출력·저장하지 않는다)
import { readFileSync, writeFileSync } from 'node:fs'

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
  if (m && m[2] !== '') process.env[m[1]] = m[2]
}
const { getOreums } = await import('../server/oreum.js')
const key = encodeURIComponent(process.env.DATA_GO_KR_KEY)

async function search(kw) {
  const u = `https://apis.data.go.kr/B551011/PhotoGalleryService1/gallerySearchList1?serviceKey=${key}&numOfRows=10&pageNo=1&MobileOS=ETC&MobileApp=jeju-yeongdeung&_type=json&arrange=A&keyword=${encodeURIComponent(kw)}`
  const j = await (await fetch(u)).json()
  const it = j.response?.body?.items
  return it?.item ? [].concat(it.item) : []
}

const out = {}
for (const o of await getOreums()) {
  const base = o.title.replace(/\(.*?\)/g, '').trim()
  let items = await search(base)
  if (!items.length && !/(오름|봉|악)$/.test(base)) items = await search(base + '오름')
  const core = base.replace(/오름$/, '')
  // 제목·촬영지·검색어에 오름 이름이 들어 있는 사진만 (엉뚱한 사진 방지)
  const hit = items.find((i) => [i.galTitle, i.galPhotographyLocation, i.galSearchKeyword].some((t) => (t ?? '').includes(core)) && i.galWebImageUrl)
  if (hit) out[o.id] = { url: hit.galWebImageUrl.replace(/^http:/, 'https:'), title: hit.galTitle, by: hit.galPhotographer ?? '' }
}
writeFileSync(new URL('../src/data/oreumPhotos.json', import.meta.url), JSON.stringify(out, null, 1))
console.log(`사진 ${Object.keys(out).length}곳 저장`)
