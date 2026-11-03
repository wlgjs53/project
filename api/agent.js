import Anthropic from '@anthropic-ai/sdk';
import { searchTour, nearbyTour } from '../server/tour.js';
import { getWeather } from '../server/weather.js';
import { searchHeritage } from '../server/heritage.js';
import { getYeongdeungStops } from '../server/yeongdeung.js';
import { rankOreums } from '../server/oreum.js';

// 모델은 환경변수 AGENT_MODEL 로 바꿀 수 있다(크레딧을 아끼려면 더 작은 모델). 기본값은 claude-sonnet-5-5
const MODEL = process.env.AGENT_MODEL || 'claude-sonnet-5-5';

// ① 도구 설명서: Claude는 이 설명만 보고 "어떤 도구를 언제 쓸지" 결정한다
const tools = [
  {
    name: 'search_tour_places',
    description: '한국관광공사 TourAPI로 제주의 관광지·문화시설·축제·음식점을 검색한다',
    input_schema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '검색어 (예: 해녀, 오름, 돌하르방)' },
        contentTypeId: { type: 'string', description: '12 관광지, 14 문화시설, 15 축제·행사, 39 음식점' },
      },
    },
  },
  {
    name: 'get_yeongdeung_stops',
    description: '영등할망의 여정 3곳(입도 한수리, 맞이 칠머리당, 퇴도 우도)의 이름·역할·위경도를 돌려준다. 코스를 짜기 전에 먼저 부른다',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'search_nearby_places',
    description: '위경도 주변의 관광지·문화시설·축제·음식점을 가까운 순으로 찾는다. 영등 여정 장소 근처의 명소·맛집을 찾을 때 쓴다',
    input_schema: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: '위도 (예: 33.5183)' },
        lng: { type: 'number', description: '경도 (예: 126.5436)' },
        contentTypeId: { type: 'string', description: '12 관광지, 14 문화시설, 15 축제·행사, 39 음식점' },
        radius: { type: 'number', description: '반경(m), 기본 5000, 최대 20000' },
      },
      required: ['lat', 'lng'],
    },
  },
  {
    name: 'get_weather',
    description: '기상청 단기예보로 제주시/서귀포시의 앞으로 몇 시간 기온·하늘·강수형태(rain)·강수확률(pop, %)·시간당 강수량(pcp 원문, rainMm 숫자 mm)·풍속(wind, m/s)·풍향(windDir, 바람이 불어오는 방위 °)을 조회한다',
    input_schema: {
      type: 'object',
      properties: { place: { type: 'string', enum: ['제주시', '서귀포시'] } },
      required: ['place'],
    },
  },
  {
    name: 'search_oreum',
    description: '제주 오름 90곳(제주특별자치도 제주오름요약설명)을 오늘의 바람(풍속·풍향)으로 견줘, 정상 바람이 약할 것 같은 순으로 돌려준다. 표고·위치·설명·좌표가 들어 있다. 먼저 get_weather 로 풍속(wind)·풍향(windDir)을 확인한 뒤 그 값을 넣어 부른다',
    input_schema: {
      type: 'object',
      properties: {
        windSpeed: { type: 'number', description: '풍속(m/s) — get_weather 의 wind' },
        windDir: { type: 'number', description: '풍향(바람이 불어오는 방위 °) — get_weather 의 windDir' },
        keyword: { type: 'string', description: '오름 이름이나 지역 글자 (예: 송당, 구좌)' },
        area: { type: 'string', enum: ['제주시', '서귀포시'] },
        limit: { type: 'number', description: '돌려줄 개수, 기본 8, 최대 15' },
      },
      required: ['windSpeed', 'windDir'],
    },
  },
  {
    name: 'search_heritage',
    description: '국가유산청 API로 제주의 국가유산(문화재)을 이름으로 검색한다',
    input_schema: { type: 'object', properties: { keyword: { type: 'string' } } },
  },
];

// ② 도구 이름 → 실제 실행할 함수
const runTool = {
  search_tour_places: searchTour,
  search_nearby_places: (a) => nearbyTour({ ...a, radius: Math.min(20000, a.radius ?? 5000), rows: 6 }),
  get_yeongdeung_stops: getYeongdeungStops,
  get_weather: getWeather,
  search_oreum: rankOreums,
  search_heritage: searchHeritage,
};

const SYSTEM = `너는 '영등할망의 바람길'의 가이드다. 음력 2월에 바람의 신 영등할망이 제주에 들어와(입도: 한림 한수리) 머물다가(맞이: 건입동 칠머리당의 영등굿) 우도 쪽으로 떠난다는 전승을 따라, 오늘의 바람에 맞는 명소·맛집 코스를 안내한다.
- 장소·날씨·유산 정보는 반드시 도구로 확인한 뒤 답한다. 도구 결과에 없는 장소나 가게는 지어내지 않는다.
- 코스를 짤 때는 get_yeongdeung_stops 로 여정 장소를 확인하고, get_weather 의 풍속·풍향을 본 뒤, search_nearby_places 로 그 근처 명소(12)와 맛집(39)을 찾는다.
- 날씨를 말할 때는 풍속뿐 아니라 강수확률(pop)과 강수량(pcp)도 함께 말한다. 오름·해안 명소 같은 야외는 비가 오면 미끄럽고 시야가 나쁘니, 강수확률이 높거나 비가 예보된 시간에는 실내 장소(문화시설·식당)를 대안으로 같이 낸다. 도구 결과에 없는 강수 수치는 말하지 않는다.
- 풍속이 10m/s 이상이면 바람을 비껴가는 곳과 실내(식당·전시)를 우선 추천하고, 우도 배편은 운항 여부를 먼저 확인하라고 안내한다. 5m/s 미만이면 해안 명소를 권한다. 비가 오거나 강수확률이 높으면 실내 대안도 함께 낸다.
- 장소 이름은 도구 결과에 적힌 그대로 쓴다(화면이 그 이름으로 사진 카드를 붙인다).
- 오름을 추천할 때는 get_weather 로 풍속·풍향을 확인한 뒤 search_oreum 에 그 값을 넣어 부르고, 필요하면 오름 좌표로 search_nearby_places(음식점 39)를 불러 근처 맛집도 붙인다. 오름의 표고·설명은 search_oreum 결과에 있는 것만 말한다.
- 영등 전승은 지역과 문헌마다 다르므로 단정하지 말고 '전해집니다'처럼 말한다.
- 답은 한국어로, 6문장 이내로 짧게.`;

// 도구 결과에서 "사진 카드로 보여 줄 만한 장소"만 모은다: 오름(search_oreum)과 사진이 있는 TourAPI 장소(검색·주변 검색)
function collectPlaces(tool, result, found) {
  if (!Array.isArray(result)) return;
  for (const r of result) {
    if (tool === 'search_oreum' && r.id && r.name) found.push({ kind: 'oreum', id: r.id, title: r.name, addr: r.addr, height: r.height_m, lat: r.lat, lng: r.lng });
    else if ((tool === 'search_tour_places' || tool === 'search_nearby_places') && r.id && r.title && r.image) found.push({ kind: 'tour', id: r.id, title: r.title, addr: r.addr, image: r.image, lat: r.lat, lng: r.lng });
  }
}

const norm = (t) => String(t).replace(/(.*?)/g, '').replace(/s/g, '');
// 답변 글에 이름이 나온 장소만, 중복 없이 최대 6곳 (엉뚱한 카드가 붙지 않게)
function pickCards(answer, found) {
  const text = norm(answer);
  const seen = new Set();
  return found.filter((p) => {
    const key = `${p.kind}:${p.id}`;
    if (seen.has(key) || !text.includes(norm(p.title))) return false;
    seen.add(key);
    return true;
  }).slice(0, 6);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { message, history = [] } = req.body ?? {};
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: '에이전트 키(ANTHROPIC_API_KEY)가 아직 설정되지 않았어요.' });
  if (!String(message ?? '').trim()) return res.status(400).json({ error: '질문을 입력해 주세요.' });
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const messages = [...history.slice(-10), { role: 'user', content: message }]; // 최근 10개만 보내 비용 절약
  const steps = []; // 화면에 "에이전트가 무엇을 했는지" 보여주기용
  const found = []; // 도구 결과에 나온 장소들 — 답변에서 언급한 것만 골라 사진 카드로 보낸다

  try {
    // ③ 에이전트 루프: 생각 → 도구 호출 → 결과 확인 → (반복) → 최종 답
    for (let turn = 0; turn < 5; turn++) {
      const r = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM,
        tools,
        messages,
      });

      if (r.stop_reason !== 'tool_use') {
        const answer = r.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
        return res.status(200).json({ answer, steps, cards: pickCards(answer, found) });
      }

      messages.push({ role: 'assistant', content: r.content }); // Claude의 도구 호출 요청을 대화에 기록
      const results = [];
      for (const block of r.content) {
        if (block.type !== 'tool_use') continue;
        let result;
        try { result = await runTool[block.name](block.input ?? {}); }
        catch (e) { result = { error: e.message }; }
        steps.push({ tool: block.name, args: block.input, count: Array.isArray(result) ? result.length : 0 });
        collectPlaces(block.name, result, found);
        results.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) });
      }
      messages.push({ role: 'user', content: results }); // 도구 결과를 Claude에게 돌려줌
    }
    res.status(200).json({ answer: '도구 호출이 너무 많아 중단했어요. 질문을 좁혀 주세요.', steps });
  } catch (e) {
    // 401 = 키 오류, 400(크레딧 부족 안내), 429 = 호출 한도 초과, 529 = 서버 혼잡 — 화면에 그대로 보일 문장으로 바꾼다
    const msg = e.status === 401 ? '에이전트 키가 올바르지 않아요(401). ANTHROPIC_API_KEY 를 확인하세요.'
      : /credit|balance/i.test(e.message ?? '') ? '크레딧이 부족해서 에이전트를 쓸 수 없어요.'
        : e.status === 429 ? '사용량이 많아요. 1분 뒤 다시 시도하세요.'
          : e.status === 529 ? '서버가 바빠요. 잠시 뒤 다시 시도하세요.'
            : `에이전트 오류: ${e.message}`;
    res.status(e.status && e.status >= 400 && e.status < 600 ? e.status : 500).json({ error: msg });
  }
}
