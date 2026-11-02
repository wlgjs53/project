import Anthropic from '@anthropic-ai/sdk';
import { searchTour, nearbyTour } from '../server/tour.js';
import { getWeather } from '../server/weather.js';
import { searchHeritage } from '../server/heritage.js';
import { getYeongdeungStops } from '../server/yeongdeung.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-5-5';

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
    description: '기상청 단기예보로 제주시/서귀포시의 앞으로 몇 시간 기온·하늘·강수·풍속(m/s)·풍향(바람이 불어오는 방위 °)을 조회한다',
    input_schema: {
      type: 'object',
      properties: { place: { type: 'string', enum: ['제주시', '서귀포시'] } },
      required: ['place'],
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
  search_heritage: searchHeritage,
};

const SYSTEM = `너는 '영등할망의 바람길'의 가이드다. 음력 2월에 바람의 신 영등할망이 제주에 들어와(입도: 한림 한수리) 머물다가(맞이: 건입동 칠머리당의 영등굿) 우도 쪽으로 떠난다는 전승을 따라, 오늘의 바람에 맞는 명소·맛집 코스를 안내한다.
- 장소·날씨·유산 정보는 반드시 도구로 확인한 뒤 답한다. 도구 결과에 없는 장소나 가게는 지어내지 않는다.
- 코스를 짤 때는 get_yeongdeung_stops 로 여정 장소를 확인하고, get_weather 의 풍속·풍향을 본 뒤, search_nearby_places 로 그 근처 명소(12)와 맛집(39)을 찾는다.
- 풍속이 10m/s 이상이면 바람을 비껴가는 곳과 실내(식당·전시)를 우선 추천하고, 우도 배편은 운항 여부를 먼저 확인하라고 안내한다. 5m/s 미만이면 해안 명소를 권한다. 비가 오거나 강수확률이 높으면 실내 대안도 함께 낸다.
- 영등 전승은 지역과 문헌마다 다르므로 단정하지 말고 '전해집니다'처럼 말한다.
- 답은 한국어로, 6문장 이내로 짧게.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { message, history = [] } = req.body ?? {};
  const messages = [...history.slice(-10), { role: 'user', content: message }]; // 최근 10개만 보내 비용 절약
  const steps = []; // 화면에 "에이전트가 무엇을 했는지" 보여주기용

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
        return res.status(200).json({ answer, steps });
      }

      messages.push({ role: 'assistant', content: r.content }); // Claude의 도구 호출 요청을 대화에 기록
      const results = [];
      for (const block of r.content) {
        if (block.type !== 'tool_use') continue;
        let result;
        try { result = await runTool[block.name](block.input ?? {}); }
        catch (e) { result = { error: e.message }; }
        steps.push({ tool: block.name, args: block.input, count: Array.isArray(result) ? result.length : 0 });
        results.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) });
      }
      messages.push({ role: 'user', content: results }); // 도구 결과를 Claude에게 돌려줌
    }
    res.status(200).json({ answer: '도구 호출이 너무 많아 중단했어요. 질문을 좁혀 주세요.', steps });
  } catch (e) {
    // 429 = 호출 한도 초과, 401 = 키 오류
    res.status(e.status ?? 500).json({ error: e.status === 429 ? '사용량이 많아요. 1분 뒤 다시 시도하세요.' : e.message });
  }
}
