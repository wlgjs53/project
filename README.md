# 영등할망의 바람길

> 음력 2월, 바람의 신 **영등할망**이 제주에 머무는 보름 동안 — **오늘의 실제 바람**을 따라 3D 제주 위를 걸으며, 영등굿의 이야기와 그 길목의 **명소·맛집**을 만나는 제주 문화 IP 웹 서비스입니다.

|  |  |
|---|---|
| 배포 주소 | https://project-red-gamma-91.vercel.app |
| GitHub | https://github.com/wlgjs53/project |
| 주제 | 제주 문화 IP — **영등할망 / 칠머리당영등굿** |
| 사용한 공공데이터 | 한국관광공사 TourAPI · 기상청 단기예보 · 국가유산청 국가유산 오픈API · 제주오름요약설명(공공데이터포털) · 한국관광공사 관광사진정보 · (보조) OSRM 도로 경로 |

## 1. 기획 의도

**어떤 IP인가.** 영등할망은 음력 2월에 바람을 몰고 제주에 들어와(입도: 한림 한수리) 머물며 해녀와 어부의 바다를 돌보고(맞이: 건입동 칠머리당의 영등굿) 보름 무렵 우도 쪽으로 떠난다고 전해지는 제주의 바람의 신입니다. 칠머리당영등굿은 국가무형유산이며, 2009년 유네스코 인류무형문화유산으로 등재되었습니다.

**누구를 위한 서비스인가.** 제주를 여행하려는 사람, 특히 바람이 센 영등철(양력 2~3월경)에 일정을 짜는 여행객과 제주 문화에 처음 다가가는 사람.

**어떤 가치를 주는가.**
- 글과 사진으로만 접하던 전승을 **오늘의 실제 바람**과 연결해 "지금 제주에 영등할망이 계신다"는 감각으로 체험하게 합니다.
- 전설에 그치지 않고, 그 길목(입도·맞이·퇴도)의 **명소와 맛집**을 바람 세기와 방향에 맞춰 추천합니다. 바람이 센 날은 바람을 비껴가는 곳과 실내(식당·전시) 위주로, 잔잔한 날은 해안 명소 위주로 안내합니다.
- 바람이라는 불편함을 문화 콘텐츠로 바꿔서 보여 줍니다.

## 2. 주요 기능

| 기능 | 설명 |
|---|---|
| **영등할망의 바람길** (홈) | 스크롤하면 3D 제주 위를 카메라가 날며 입도 → 맞이 → 퇴도 → 영등굿 4단계를 소개합니다. 흐르는 선은 바람의 방향과 세기를 나타내고, 마우스로 휘저으면 바람이 밀립니다. |
| 실제 지형 | 실제 고도 데이터로 만든 제주의 해안선·한라산·오름 (높이는 과장). |
| 오늘의 바람 | 기상청 단기예보의 **제주시·서귀포시** 풍속·풍향을 반영(두 곳의 실제 값으로 바람장을 만듦). 슬라이더·프리셋으로 다른 날의 바람을 체험할 수도 있습니다. |
| 주변 명소·맛집 | 영등 여정 3곳 주변을 **사진 카드**로 보여 주고, 바람 세기·방향에 따라 순서와 "바람 맞는 쪽 / 바람 비낀 쪽" 표시가 달라집니다. |
| 장소 상세 | 카드나 **지도의 빛**을 누르면 사진 갤러리·소개·이용 정보·**"왜 이곳을 추천했나요?"**·길찾기·출처가 열리고, 3D 카메라가 그 장소를 비춥니다. |
| 시점 조작 | 지도에서 마우스 왼쪽 드래그로 시점 회전, 더블클릭으로 복귀 (스크롤하면 자동 복귀). |
| **영등할망이란?** (홈의 두 번째 장면) | 영등할망이 누구인지(언제·어디서·무엇을) 세 줄로 소개하고, 국가유산청의 영등굿 사진 갤러리와 **유네스코 공식 영상**(썸네일을 눌러야 창에서 재생)을 보여 줍니다. "영등굿 자세히 보기"로 아래 페이지에 연결됩니다. |
| 영등굿·국가유산 | 국가유산청 자료의 대표 사진·공식 설명·사진 갤러리·지정일. |
| 명소·맛집 | `명소 / 맛집 / 문화시설` 탭, 지역(전체·제주시·서귀포시) 칩, 추천 검색어 칩(해녀의집·흑돼지 등), 이름 검색. **사진이 있는 곳만** 보여 주고(맛집 388곳 중 356곳), 24곳씩 "더 보기"로 이어서 불러옵니다. 조건에 맞는 전체 수와 사진이 없어 뺀 수도 표시합니다. |
| 즐겨찾기 | 닉네임별로 Supabase에 저장·삭제. 별 모양으로 저장 여부를 보여 주고(다시 누르면 빼기), 같은 항목은 중복 저장되지 않으며, `/my`에서 삭제할 수 있습니다. 새로고침 후에도 유지됩니다. |
| **바람따라 오름** (`/oreum`) | 제주오름요약설명 90곳을 **오늘의 풍속·풍향**으로 견줘 "오늘 오르기 좋은 오름" 순으로 보여 줍니다. 정상 바람은 표고와 한라산 기준 방향으로 어림한 단순 계산(오르기 좋아요/바람 적당/바람 조심)이며, 지역·표고·바람 맞는 쪽 필터, 사진이 있는 오름은 사진(TourAPI와 이름·거리로 맞춤, 없으면 표고를 그린 그림), 상세(설명·근처 맛집), "바람길 지도에서 보기"를 제공합니다. |
| **할망따라** (하루 코스 + 길안내) | **내 즐겨찾기로**(최대 6곳) 또는 **오늘의 추천**(즐겨찾기 없이 오늘 바람에 맞는 명소·문화시설·해녀의집을 자동 선택, **"오름 코스"**를 고르면 사진이 있는 오름 위주로 구성, "다른 코스"로 바꿔 보기)으로 **시간대별 풍속 예보**에 맞춘 하루 코스를 만듭니다. 바람 맞는 해안은 바람이 약한 시간에, 바람을 비껴가는 곳·실내는 센 시간에, 식당은 점심·오후에 배치합니다. 실제 도로 기준 이동 시간·거리, 지도 위 경로선(번호 핀), 구간별 카카오맵 길찾기 링크(자동차·대중교통·도보), "내 위치에서 길찾기", 코스 근처 맛집 추천("코스에 추가"), 코스 복사, 즐겨찾기 선택 삭제·전체 삭제(확인 한 번 더)를 제공합니다. **바람길 지도(홈)의 "동선 안내"**에서는 영등 여정(한수리→칠머리당→우도) 또는 방금 만든 내 코스를 3D 지형 위에 도로 경로선·번호로 그려 보여 주고, 구간별 이동 시간과 카카오맵 길찾기 링크를 함께 제공합니다. 내 즐겨찾기 화면에도 전체 삭제 버튼이 있습니다. (규칙 기반 — AI 키 없이 동작) |
| 영등할망 가이드 | 공공데이터 API를 도구로 호출해 답하는 AI 에이전트 (아래 참고). |
| D-day · 바람소리 | 다음 음력 2월 초하루까지 남은 날, 풍속에 따라 변하는 바람소리. |

## 3. 사용한 공공데이터 API

모든 호출은 **서버 함수(`/api`)**를 거치며, 키는 브라우저에 내려가지 않습니다.

| # | API | 쓰는 오퍼레이션 | 이 서비스에서의 쓰임 |
|---|---|---|---|
| 1 | **한국관광공사 국문 관광정보 서비스 (TourAPI)** | `locationBasedList2` `areaBasedList2` `searchKeyword2` `detailCommon2` `detailIntro2` `detailImage2` | 여정 장소 주변 명소·맛집(위치기반, 가까운 순), 검색, 장소 상세(소개·사진·이용 정보·공공누리 유형) |
| 2 | **기상청 단기예보 조회서비스** | `getVilageFcst` | 제주시(격자 53,38)·서귀포시(52,33)의 풍속(WSD)·풍향(VEC)·기온·하늘·강수 → 3D 바람장(두 지점의 실제 값)과 추천 기준(두 지점의 평균) |
| 3 | **국가유산청 국가유산 오픈API** (키 불필요) | `SearchKindOpenapiList.do` `SearchKindOpenapiDt.do` `SearchImageOpenapi.do` | 칠머리당영등굿 등 제주 국가유산의 목록·공식 설명·대표 사진·사진 갤러리 |
| 4 | **제주특별자치도 제주오름요약설명** (공공데이터포털 파일데이터의 오픈API, 같은 인증키) | `api.odcloud.kr/api/15096996/v1/…` → `/api/oreum` | 오름 90곳의 이름·위치·표고·좌표·설명. 바람길 지도(홈)에 작은 점으로 표시하고, 점을 누르면 상세(표고·바람 안내·설명·근처 맛집)를 보여 줍니다 |
| 5 | **한국관광공사 관광사진정보** (`PhotoGalleryService1/gallerySearchList1`, 같은 인증키) | `scripts/build-oreum-photos.mjs` → `src/data/oreumPhotos.json` | 오름 이름으로 검색해 제목·촬영지에 이름이 들어 있는 사진만 골라 미리 저장(90회 호출을 화면마다 하지 않으려고). 21곳 + TourAPI 사진 합쳐 90곳 중 약 37곳에 사진이 있고, 나머지는 공개 자료에 사진이 없어 그림으로 표시합니다 |

그 밖의 데이터: 지형은 **AWS Open Data Terrain Tiles**(SRTM·NASADEM·GEBCO 등)의 고도 타일을 `scripts/build-dem.mjs`로 한 번 변환해 `src/data/jejuDem.js`에 넣었습니다(실행 중에는 외부 호출 없음).

## 4. AI 에이전트 — 영등할망 가이드

`api/agent.js`가 **Claude(`claude-sonnet-5-5`)**에게 아래 5개 도구를 주고, 모델이 스스로 필요한 도구를 골라 호출한 뒤 그 결과로만 답하게 합니다. 화면(`/agent`)에는 에이전트가 호출한 도구 목록이 함께 표시됩니다.

| 도구 | 하는 일 |
|---|---|
| `get_yeongdeung_stops` | 영등 여정 3곳(한수리·칠머리당·우도)의 이름·역할·위경도 |
| `search_nearby_places` | 좌표 주변 관광지·음식점 등 (TourAPI 위치기반) |
| `get_weather` | 제주시·서귀포시 기온·강수·**풍속·풍향** (기상청) |
| `search_tour_places` | 키워드로 관광지·문화시설·축제·음식점 검색 |
| `search_heritage` | 국가유산 검색 (국가유산청) |

지침(시스템 프롬프트)의 핵심: 도구 결과에 없는 장소·가게는 **지어내지 않는다**, 풍속 10m/s 이상이면 바람을 비껴가는 곳과 실내를 우선 추천하고 우도 배편 운항 확인을 안내한다, 영등 전승은 단정하지 않고 "전해집니다"로 말한다.

예) "오늘 바람이 센데 칠머리당 근처에서 바람을 피해 갈 만한 곳이랑 점심 먹을 곳 알려줘" → 여정 확인 → 날씨(풍속) 확인 → 주변 명소·맛집 검색 → 답변.

## 5. 기술 구조

```
[브라우저: React 19 + Vite]                      [Vercel 서버 함수 /api]            [외부]
 src/pages ─ router ─ RootLayout                  api/tour.js      ┐
 src/components (WindScene = three.js 3D)         api/nearby.js    ├─ server/tour.js ─────── 한국관광공사 TourAPI
 src/store (Zustand)  ◄── fetch('/api/…') ──►     api/place.js     ┘
 src/api/client.js                                api/weather.js ─── server/weather.js ──── 기상청 단기예보
        │                                         api/heritage.js ── server/heritage.js ─── 국가유산청 오픈API
        │ supabase-js (anon key)                  api/agent.js ───── Claude + 위 함수들을 "도구"로
        ▼
   Supabase (favorites 테이블)
```

```
api/        Vercel 서버 함수 — API 키는 여기(서버)에서만 사용
server/     외부 API 호출 로직 (api/ 와 에이전트가 함께 사용)
scripts/    build-dem.mjs(고도 데이터 변환), dev-local.mjs(로컬 개발 실행)
src/
  pages/        Home(3D 스토리) · Places · Heritage · Agent · My · Check(개발용 동작 체크)
  components/   WindScene · StorySection · NearbyPanel · PlaceDetailPanel · HeritageModal · ItemCard …
  hooks/        useNearby · useLiveWind · useWindSound
  lib/          terrain(지형) · windField(바람장) · advice(바람 기준 추천) · geo · dday · supabase
  data/         story(영등 여정·프리셋) · jejuDem(고도 데이터) · sampleNearby(API 실패 시 자리표시)
  store/        Zustand 전역 상태 (닉네임·알림·즐겨찾기·에이전트 대화)
```

기술: React 19, React Router 7, Zustand, Bootstrap 5(Bootswatch darkly), three.js, Supabase, Vercel(서버리스).

## 6. 사용한 기술과 기능 상세

### 6-1. 평가 항목별 구현 위치

| 평가 항목 | 이 프로젝트의 구현 | 코드 위치 |
|---|---|---|
| React 구조 | Router·Zustand·컴포넌트 분리, 공용 카드(`ItemCard`)·상태 표시(`Status`) 재사용, 지역 상태(`useState`)와 전역 상태(Zustand) 구분 | `src/router.jsx` `src/store/` `src/components/` `src/pages/` |
| 공공 API 3개 이상 | TourAPI · 기상청 단기예보 · 국가유산청, 로딩·에러·빈 결과 처리 | `server/` `api/` `src/api/client.js` `src/components/Status.jsx` |
| Supabase | 즐겨찾기 저장·조회, 새로고침 후에도 유지 | `src/lib/supabase.js` `src/store/useAppStore.js` `src/pages/My.jsx` |
| AI 에이전트 | 도구 5개를 스스로 골라 호출하는 루프, 호출 내역 화면 표시, "지어내지 않는다" 지침 | `api/agent.js` `src/pages/Agent.jsx` |
| 제주 IP 기획 | 영등할망 × 오늘의 바람 × 길목의 명소·맛집 | 이 문서 1장, `src/pages/Home.jsx` |
| 배포·보안 | Vercel 서버리스 + 고정 주소, 비밀 키는 서버 전용·저장소에 없음 | `vercel.json` `.gitignore` `api/` |
| 가산점: three.js 3D | 실제 고도 3D 지형·바람 파티클·상호작용 (6-3) | `src/components/WindScene.jsx` `src/lib/` |

### 6-2. React 구조

- **라우팅 (React Router 7)**: `createBrowserRouter`로 주소별 페이지를 한 곳(`src/router.jsx`)에서 관리하고, 메뉴도 같은 파일의 `NAV_ITEMS`에서 만듭니다. 공통 틀 `RootLayout`(메뉴·푸터·알림)에 `<Outlet />`으로 페이지가 들어가며, 없는 주소는 `errorElement`(NotFound)로 처리합니다. 홈은 전체 화면 3D라 컨테이너·푸터 없이 그립니다. 주소: `/` `/places` `/heritage` `/agent` `/my` `/oreum`(바람따라 오름) `/course`(할망따라) `/check`(개발용 동작 체크).
- **컴포넌트 재사용**: `ItemCard` 하나로 명소·국가유산·즐겨찾기 카드를 모두 그리고(사진 깨짐 대체, "자세히 보기"·"즐겨찾기" 버튼 지원), `Status`(Loading·ErrorAlert·Empty)와 `PageHeader`를 여러 페이지가 함께 씁니다. 3D 홈은 `StorySection` `StoryPhoto` `WindMeter` `WindControls` `PlaceList` `NearbyPanel` `PlaceDetailPanel` 등으로 쪼갰습니다.
- **상태 구분**: 한 페이지 안에서만 쓰는 값(검색어·결과·로딩·에러, 홈의 풍속·선택한 장소·패널 열림)은 `useState`, 여러 페이지가 함께 보는 값은 **Zustand**(`src/store/useAppStore.js`)에 둡니다 — 닉네임(`persist`로 localStorage에 저장), 알림(토스트), 즐겨찾기, 에이전트 대화.
- **커스텀 훅**: `useNearby`(주변 명소·맛집 불러오기와 실패 시 대체), `useLiveWind`(실시간 바람), `useWindSound`(바람소리).
- **디자인**: Bootstrap 5.3 + Bootswatch **darkly** 테마 + react-bootstrap(Navbar·Card·Modal·Offcanvas·Toast) + Bootstrap Icons. 홈의 3D 화면 전용 스타일은 `w-` 접두사로 분리(`src/styles/wind.css`)하고, 모바일(720px 이하)용 배치도 따로 있습니다.

### 6-3. three.js (3D 지도)

`three`(r187)를 React `useEffect` 안에서 **직접** 사용합니다 (`@react-three/fiber`가 아님). 장면은 한 번만 만들고, 정리 단계에서 애니메이션 취소·이벤트 해제·geometry/material/texture/renderer를 해제해 StrictMode의 이중 실행에도 안전합니다.

| 요소 | 사용한 기법 |
|---|---|
| 지형 | `PlaneGeometry`(약 0.25km 격자, 정점 8만여 개)를 실제 고도로 변형, 고도별 색 팔레트와 노이즈 음영을 **정점 색**으로 입히고 `MeshLambertMaterial` + `computeVertexNormals` |
| 고도 데이터 | AWS Terrain Tiles(Terrarium 인코딩)를 `scripts/build-dem.mjs`로 내려받아 정수 격자(Int16)로 구워 넣고, 실행 중에는 쌍선형 보간으로 읽음. 낮은 오름이 묻히지 않도록 높이를 **지수 0.75**로 압축 |
| 바다 | `MeshPhongMaterial`(반투명·flat shading) 평면, 풍속에 비례한 파도 진폭을 **CPU 정점 애니메이션**으로 표현. 수심은 해안에서 멀어질수록 깊어지도록 **거리 변환(chamfer 2-pass)**으로 계산 |
| 바람 | 3,600개(모바일 1,800개)의 파티클을 `LineSegments`(꼬리가 있는 선), `AdditiveBlending`으로 그리고 속도는 정점 색으로 표현. 65×29 **격자 바람장**을 보간해 각 파티클을 이동시키며, `Raycaster`로 마우스 위치를 지면에 투영해 주변 파티클을 밀어냄 |
| 분위기 | `HemisphereLight` + `DirectionalLight`(달빛), `FogExp2`, 별(`Points` 900개) |
| 카메라 | 스크롤 위치에 따라 각 섹션의 카메라 지점(`data-cam`) 사이를 smoothstep으로 보간하고 지수 감쇠 lerp로 부드럽게 이동. `setViewOffset`으로 스토리 카드 반대편에 지도를 배치 |
| 마커·핀 | `Sprite` + `CanvasTexture`(빛 번짐). 이름표는 3D 좌표를 화면으로 투영해(`project`) DOM 요소 위치를 갱신 |
| 상호작용 | Pointer Events로 **드래그 시점 회전**(카메라를 목표점 둘레로 yaw·pitch 회전, 더블클릭·스크롤 시 복귀), 클릭과 드래그 구분, `setPointerCapture`, 화면 공간 **빛 피킹**(작은 점도 누르기 쉬움), 호버 이름표 |
| 성능·호환 | 화면 크기에 따라 파티클 수 조절, `pixelRatio` 최대 2. three 버전이 올라가며 달라진 색 관리·조명 단위를 맞추려고 `ColorManagement`를 끄고 조명 세기를 π로 보정 |

> 스타터에 들어 있던 `@react-three/fiber`·`drei`와 샘플 `components/Jeju3D.jsx`는 현재 사용하지 않습니다.

### 6-4. Supabase (즐겨찾기)

- `@supabase/supabase-js`로 브라우저에서 anon 키로 접근합니다(`src/lib/supabase.js`, 환경변수가 없으면 `isSupabaseReady`로 안내).
- `favorites` 테이블에 `nickname · source('tour'|'heritage') · item_id · title · created_at`을 저장하고, 닉네임별로 최신순 조회합니다. 저장·불러오기 함수(`addFavorite`·`loadFavorites`)는 Zustand store에 있어서 명소·국가유산·상세 패널 어디서든 같은 방식으로 저장하고 `/my`에서 같은 데이터를 봅니다.
- **별 토글**: 앱을 열 때 즐겨찾기를 불러 두어(`useFavorites` 훅) 저장된 항목은 채워진 별·"저장됨"으로 보이고, 다시 누르면 삭제합니다.
- **중복 방지**: 저장 전에 같은 닉네임·출처·항목이 이미 있는지 서버에서도 확인합니다(다른 탭·기기에서 저장했어도 막힘). DB에 유니크 인덱스를 두면 동시 요청까지 막을 수 있습니다(아래 SQL).
- **삭제 확인**: Supabase는 delete 정책이 없으면 오류 없이 0건만 지우므로, 삭제 후 돌아온 행 수를 확인해 실패하면 안내합니다.
- 저장·삭제 성공·실패는 토스트로 알리며, 샘플(자리표시) 데이터는 저장 버튼을 막습니다.

### 6-5. AI 에이전트 구현

- **Claude tool use 루프** (`api/agent.js`, `@anthropic-ai/sdk`): 질문 → 모델이 도구 선택(`tool_use`) → 서버가 `server/` 함수 실행 → 결과를 `tool_result`로 돌려줌 → 더 부를 도구가 없으면 최종 답. 도구는 5개이며 각 도구의 `description`이 모델의 선택 기준입니다.
- **비용·안전 장치** (안내서 규칙 준수): 모델은 `claude-sonnet-5-5` 그대로, 루프 **최대 5회**, `max_tokens` 1024, 대화 기록은 **최근 10개만** 전송, 한도 초과(429)는 안내 문구로 변환.
- **화면** (`src/pages/Agent.jsx`): 에이전트가 호출한 도구와 인자·결과 건수를 답변 위에 표시하고, 대화는 Zustand store에 두어 다른 메뉴에 다녀와도 유지됩니다.
- **환각 방지**: 시스템 지침에 "도구 결과에 없는 장소·가게는 지어내지 않는다"를 두었고, 아래 질문으로 실제로 지켜지는지 확인합니다.

**에이전트 테스트 (체크포인트 6)** — _Claude 키 수령 후 결과 캡처를 이곳에 추가_

| 질문 | 기대 동작 | 결과 |
|---|---|---|
| "제주시 지금 날씨 어때?" | `get_weather` 1회 | (예정) |
| "관덕정이 어떤 국가유산이야?" | `search_heritage` | (예정) |
| "내일 서귀포에 비 오면 해녀 문화를 체험할 실내 장소 추천해줘" | 도구 2개 이상 연속 호출 | (예정) |
| "제주에 있는 에펠탑 알려줘" | 지어내지 않고 "결과 없음" | (예정) |
| "오늘 바람이 센데 칠머리당 근처에서 바람을 피해 갈 만한 곳이랑 점심 먹을 곳 알려줘" | 여정 → 날씨 → 주변 검색 연속 호출 | (예정) |

### 6-6. 서버 함수·배포·보안

- **Vercel 서버리스 함수**(`api/*.js`)가 외부 API를 대신 호출합니다. 브라우저에서 직접 부르면 키가 노출되고 CORS로 막히기 때문입니다. 외부 호출 로직은 `server/`에 두어 **화면용 API와 에이전트 도구가 같은 함수를 함께 씁니다.**
- **입력 검증**: `/api/nearby`(좌표·반경·건수 범위 제한), `/api/place`·`/api/heritage`(식별자는 숫자만, 유형은 허용 목록만).
- **캐시**: 변하지 않는 공공 데이터 응답은 `Cache-Control: s-maxage=3600`으로 Vercel에서 1시간 캐시해 외부 호출과 한도 소진을 줄입니다.
- **응답 처리**: 국가유산청의 XML은 `fast-xml-parser`로 읽되, 관리번호(`0000710000000`)의 앞자리 0이 사라지지 않도록 값을 문자열로 유지합니다. 사진 주소는 `https`로 바꿔 혼합 콘텐츠 차단을 피합니다.
- **키 관리**: 비밀 키(`DATA_GO_KR_KEY`·`ANTHROPIC_API_KEY`)는 서버 환경변수에만 있고 `VITE_` 접두사를 쓰지 않으며, `.env.local`은 `.gitignore`로 저장소에 올라가지 않습니다. `/api/hello`는 키가 "있는지 없는지"만 알려 줍니다.
- **배포**: GitHub `main`에 push하면 Vercel이 자동 배포합니다(`vercel.json`: 서울 리전, `/api`를 제외한 주소는 SPA로 연결).

### 6-7. 그 밖에 사용한 브라우저·표준 기능

- **Web Audio API**: 브라운 노이즈 + 밴드패스 필터로 바람소리를 만들고 풍속에 따라 음량·음색을 바꿈
- **`Intl.DateTimeFormat`(중국력 옵션)**: 음력 날짜로 "다음 영등(음력 2월 초하루)까지 D-day" 계산
- **Pointer Events · `ResizeObserver` · `requestAnimationFrame`**: 3D 조작과 스크롤 카메라
- **localStorage**: Zustand `persist`로 닉네임 유지
- 길찾기는 별도 API 없이 카카오맵 링크(좌표 전달)로 연결

### 6-8. 주요 패키지

| 용도 | 패키지 (package.json 기준) |
|---|---|
| 화면 | react ^19, react-dom ^19, react-router-dom ^7, zustand ^5 |
| 디자인 | bootstrap ^5.3, react-bootstrap ^2, bootswatch ^5.3, bootstrap-icons ^1 |
| 3D | three ^0.187 |
| 데이터·AI | @supabase/supabase-js ^2, @anthropic-ai/sdk, fast-xml-parser ^5 |
| 개발 도구 | vite ^8, oxlint, pngjs(고도 변환 스크립트 전용), Vercel CLI |

## 7. 실행 방법

Node.js 20 이상이 필요합니다.

```bash
npm install
cp .env.example .env.local      # Windows: copy .env.example .env.local  → 값 채우기
npm run dev                     # 화면 http://localhost:5173
```

`/api` 서버 함수까지 쓰려면 Vercel CLI가 필요합니다 (처음 한 번 `npx vercel login`, `npx vercel link`).

```bash
npm run dev:api                 # .env.local 의 값을 넘겨 vercel dev 실행 (http://localhost:3000)
```

`vite.config.js`의 개발용 프록시가 `/api` 요청을 3000번으로 넘기므로, 두 명령을 함께 켜 두고 화면은 5173번으로 보면 됩니다. 연결 상태는 `/check` 화면에서 확인할 수 있습니다.

### 환경 변수

| 이름 | 용도 | 공개 여부 |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 주소 | 브라우저에 들어감(공개 값) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon(publishable) 키 | 브라우저에 들어감(공개 값) |
| `DATA_GO_KR_KEY` | 공공데이터포털 인증키 (**Decoding 키**, TourAPI·기상청 공용) | **서버 전용 비밀** |
| `ANTHROPIC_API_KEY` | Claude API 키 | **서버 전용 비밀** |

비밀 키에는 `VITE_`를 붙이지 않습니다. `.env.local`은 `.gitignore`로 저장소에 올라가지 않으며, 배포본의 값은 Vercel 환경변수에 등록합니다(`DATA_GO_KR_KEY`는 Secret).

### Supabase 테이블

```sql
create table favorites (
  id bigint generated always as identity primary key,
  nickname text not null,
  source text not null,       -- 'tour' | 'heritage'
  item_id text not null,
  title text not null,
  created_at timestamptz default now()
);
alter table favorites enable row level security;
create policy "read all"   on favorites for select using (true);
create policy "insert all" on favorites for insert with check (true);
create policy "delete all" on favorites for delete using (true);   -- 즐겨찾기 삭제용
create unique index favorites_unique on favorites (nickname, source, item_id);   -- 중복 저장 방지
```

위 정책은 **실습용(누구나 읽고 쓰고 지우기)**입니다. 닉네임은 로그인이 아니라서 다른 사람의 즐겨찾기를 지울 수도 있으므로, 실제 서비스에서는 Supabase Auth로 로그인한 사용자만 자신의 행을 읽고 쓰고 지우도록 바꿔야 합니다.

## 8. 출처 · 저작권 · 유의사항

- **한국관광공사 TourAPI**: 장소 정보·사진은 한국관광공사 자료이며, 사진마다 공공누리 유형(예: 제3유형 — 출처표시·변경금지)이 다르므로 화면에 출처와 유형을 표기합니다. 사진은 가공하지 않고 잘라서 보여 주기만 합니다.
- **국가유산청**: 영등굿 설명·사진은 국가유산청 국가유산 오픈API 자료입니다.
- **영상**: "영등할망이란?" 장면의 영상은 UNESCO 공식 유튜브 채널의 "Jeju Chilmeoridang Yeongdeunggut"(© 2008 문화재청, 현 국가유산청)을 유튜브 임베드로 보여 줍니다. 파일을 복사하지 않고, 사용자가 눌렀을 때만 불러오며(개인정보 보호 도메인 `youtube-nocookie`), 임베드의 시작·끝 시간 설정으로 **핵심 구간(0:36~1:55)만 재생**합니다. 출처와 유네스코 원문(전체 영상) 페이지 링크를 함께 표기하며, 영상은 영어로 제작되어 있습니다.
- **지형**: AWS Terrain Tiles(SRTM·NASADEM·GEBCO 등)를 바탕으로 한 것이며 높이는 보기 좋게 과장했습니다. 바다 수심은 실제가 아니라 해안에서 멀어질수록 깊어지는 표현입니다.
- **전승**: 영등할망의 입도·퇴도 장소와 시기는 지역과 문헌에 따라 다르게 전해집니다. 이 서비스는 대표적인 전승을 따랐으며, 단정하지 않습니다.
- **좌표**: 한수리·칠머리당·우도 등 여정 장소와 샘플 관광지의 위경도는 근사값입니다.

## 9. 알려진 한계

- **바람 시각화는 일부 연출입니다.** 화면의 격자 바람장은 기상청 **제주시·서귀포시 2지점**의 실제 예보값을 두 지점 사이로 보간한 것이라, 그 사이와 동·서쪽 끝의 바람은 실제 관측이 아닌 추정입니다. 한라산을 비껴 흐르는 효과도 연출입니다. (직접 슬라이더로 바람을 바꾸는 "체험 모드"에서는 한 값에 지점별 변화를 준 샘플 바람장을 씁니다.)
- 풍속 단계(5 미만 잔잔 / 5~10 보통 / 10 이상 강함)와 "바람 맞는 쪽·비낀 쪽" 판정(한라산 중심의 방위 기준)은 이 프로젝트에서 정한 단순 기준입니다.
- 예보는 3시간 단위 발표값이며, 화면에는 현재 시각 이전의 가장 최근 예보 시각 값을 씁니다.
- **할망따라 코스의 한계**: 이동 시간·거리·지도 경로선은 **공개 OSRM 데모 서버(`/api/route`, 키 없음)의 자동차 기준 값**이라 실시간 교통은 반영하지 않으며, 서버가 응답하지 않으면 직선거리를 시속 35km로 어림한 값으로 대체하고 화면에 그렇게 안내합니다. 지도는 Leaflet + OpenStreetMap 타일입니다. **앱 안에서 턴 바이 턴 내비는 하지 않고**, 길안내·대중교통 정보는 카카오맵 링크(키 없음)로 넘겨 줍니다(대중교통 시간표는 이 앱이 직접 다루지 않습니다). 영업시간·휴무·혼잡은 반영하지 않으며, 한 곳에 머무는 시간은 1시간으로 고정했습니다. 국가유산은 위치 정보가 없어 코스에 넣지 못합니다. 순서는 최대 6곳의 모든 경우(720가지)를 점수(바람 세기와 장소 성격, 이동 시간, 식사 시간대)로 비교해 고르는 단순 규칙이며 AI가 판단한 것이 아닙니다. 코스를 짤 하루는 오후 2시 전이면 오늘, 그 뒤면 내일입니다.
- **맛집·명소는 한국관광공사 TourAPI에 등록된 곳만** 보여 줍니다(제주 음식점 388곳, 그중 사진이 있는 356곳). 제주의 모든 식당은 아니며, 사진이 없는 곳은 카드 품질을 위해 제외합니다. 더 많은 식당이 필요하면 다른 API(소상공인 상가정보, 카카오 로컬 등)를 따로 신청해야 합니다.
- 주변 명소·맛집 호출이 실패하면 "예시" 자리표시 데이터로 대체되고 화면에 샘플임을 표시합니다(국가유산청 페이지는 오류 안내를 띄웁니다). 국가유산청은 짧은 시간에 요청이 몰리면 연결을 거부한 적이 있어 서버에서 1시간 캐시합니다.
- 터치 화면에서는 드래그가 페이지 스크롤과 겹쳐 시점 회전을 끄고, 빛을 탭하는 동작만 지원합니다.

---

### 제출 전에 채울 항목 (이 구역은 제출 전에 삭제)

- [ ] 에이전트 테스트 결과 캡처 — 6-5의 질문 5개 (도구 2개 이상 연속 호출, "지어내지 않음" 확인 포함), Claude 키 수령 후 표의 "(예정)"을 결과로 교체
- [ ] 배포본에서 즐겨찾기 저장 → `/my` 확인 캡처
- [ ] 주요 화면 캡처 (홈 3D, 사진 카드, 장소 상세 패널, 영등굿·유산)
- [ ] 시크릿 창에서 배포 주소 최종 점검
