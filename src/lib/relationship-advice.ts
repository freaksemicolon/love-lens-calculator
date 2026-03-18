import type { Answers } from './scoring';
import type { FinalResult } from './scoring';

interface AdviceSection {
  icon: string;
  title: string;
  tips: string[];
}

function avg(answers: Answers, ids: number[]): number {
  return ids.reduce((s, id) => s + (answers[id] ?? 3), 0) / ids.length;
}

export function generateRelationshipAdvice(a: Answers, b: Answers, result: FinalResult): AdviceSection[] {
  const sections: AdviceSection[] = [];

  // ━━━ 오래 연애하는 방법 ━━━
  const longevityTips: string[] = [];

  const aAttach = avg(a, [1,2,3,4,5,6,7,8,9,10]);
  const bAttach = avg(b, [1,2,3,4,5,6,7,8,9,10]);

  if (Math.abs(aAttach - bAttach) >= 1.5) {
    longevityTips.push('두 사람의 애착 스타일이 달라요. 불안한 쪽은 "괜찮다"는 확인을, 회피하는 쪽은 혼자만의 시간을 존중해주세요.');
  }

  if ((a[18] ?? 3) >= 4 && (b[18] ?? 3) >= 4) {
    longevityTips.push('둘 다 대화를 중요하게 생각하는 건 큰 장점이에요! 정기적으로 "우리 관계 점검 대화"를 가져보세요.');
  } else if ((a[18] ?? 3) <= 2 || (b[18] ?? 3) <= 2) {
    longevityTips.push('대화를 어려워하는 쪽이 있어요. 일주일에 한 번, 15분씩 서로의 감정을 나누는 시간을 만들어보세요.');
  }

  if (result.finalScore >= 80) {
    longevityTips.push('이미 건강한 관계예요! 익숙함에 무뎌지지 않도록 새로운 경험을 함께 해보세요.');
    longevityTips.push('서로의 성장을 응원하고, 개인 시간도 존중하면 더 오래갈 수 있어요.');
  } else if (result.finalScore >= 60) {
    longevityTips.push('작은 불만이 쌓이기 전에 표현하는 습관을 만들어보세요. "나는 ~할 때 ~한 감정이야" 형식이 좋아요.');
    longevityTips.push('서로의 연애 언어(사랑의 5가지 언어)를 파악하고, 상대가 원하는 방식으로 사랑을 표현해보세요.');
  } else {
    longevityTips.push('지금 관계에서 가장 큰 스트레스 요인이 무엇인지 솔직하게 이야기해보세요.');
    longevityTips.push('혼자 해결하려 하지 말고, 필요하면 커플 상담도 좋은 선택이에요.');
  }

  longevityTips.push('싸운 후 24시간 이내에 화해하는 규칙을 만들어보세요. 냉전은 관계를 가장 빨리 망가뜨려요.');

  sections.push({ icon: '⏳', title: '오래 연애하는 방법', tips: longevityTips });

  // ━━━ 서로 좋아하는 방법 ━━━
  const loveTips: string[] = [];

  const aExpr = avg(a, [21,22,23,24,25,26,27,28,29,30]);
  const bExpr = avg(b, [21,22,23,24,25,26,27,28,29,30]);

  if ((a[21] ?? 3) >= 4 || (b[21] ?? 3) >= 4) {
    loveTips.push('"사랑해"라는 말을 중요하게 생각하는 사람이 있어요. 매일 한 번은 진심을 담아 말로 표현해주세요.');
  }
  if ((a[22] ?? 3) >= 4 || (b[22] ?? 3) >= 4) {
    loveTips.push('스킨십을 중요하게 여기는 사람이 있어요. 가벼운 포옹이나 손잡기로 안정감을 줄 수 있어요.');
  }
  if ((a[23] ?? 3) >= 4 || (b[23] ?? 3) >= 4) {
    loveTips.push('이벤트나 선물에 의미를 두는 사람이 있어요. 거창하지 않아도 작은 깜짝 선물이 큰 감동이 돼요.');
  }
  if ((a[24] ?? 3) >= 4 || (b[24] ?? 3) >= 4) {
    loveTips.push('함께하는 시간이 사랑의 증거라고 느끼는 사람이 있어요. 스마트폰을 내려놓고 온전히 함께하는 시간을 만들어보세요.');
  }

  if (Math.abs(aExpr - bExpr) >= 1.5) {
    loveTips.push('표현 방식에 차이가 있어요. "나는 이렇게 해주면 기뻐" 하고 서로의 사랑 표현법을 공유해보세요.');
  } else {
    loveTips.push('서로의 표현 스타일이 비슷해요! 같은 방식으로 주고받으면 만족도가 높아질 거예요.');
  }

  loveTips.push('상대의 작은 변화(머리, 옷, 표정)를 알아채고 말해주세요. "관심 있다"는 최고의 사랑 표현이에요.');
  loveTips.push('상대의 단점보다 장점에 집중하는 연습을 해보세요. 매일 감사한 점 하나씩 말해주면 관계가 달라져요.');

  sections.push({ icon: '💕', title: '서로 좋아하는 방법', tips: loveTips });

  // ━━━ 배려하는 방법 ━━━
  const careTips: string[] = [];

  if ((a[17] ?? 3) >= 4 || (b[17] ?? 3) >= 4) {
    careTips.push('상대 입장에서 생각하려는 노력이 보여요. 이 장점을 더 살려서 "나라면 어떨까?" 자주 떠올려보세요.');
  } else {
    careTips.push('상대방의 감정을 이해하려는 연습이 필요해요. 상대가 화나거나 슬플 때 "왜 그런 감정인지" 먼저 물어보세요.');
  }

  const aEffort = avg(a, [31,32,33,34,35,36,37,38]);
  const bEffort = avg(b, [31,32,33,34,35,36,37,38]);

  if (Math.abs(aEffort - bEffort) >= 1) {
    careTips.push('노력의 균형이 맞지 않을 수 있어요. 한쪽만 맞추지 말고, 서로 번갈아가며 양보하는 연습을 해보세요.');
  }

  if ((a[19] ?? 3) >= 4 || (b[19] ?? 3) >= 4) {
    careTips.push('갈등을 피하려는 성향이 있어요. 불편한 감정도 표현하는 것이 진짜 배려예요. 부드럽게 말하되 회피하지 마세요.');
  }

  careTips.push('상대가 힘들어할 때 해결책을 제시하기보다 "많이 힘들었겠다" 하고 공감부터 해주세요.');
  careTips.push('상대의 개인 시간과 공간을 존중해주세요. 24시간 함께하는 것보다 혼자만의 시간 후 다시 만나는 것이 더 건강해요.');
  careTips.push('약속을 지키는 것이 가장 기본적인 배려예요. 작은 약속도 꼭 지키는 습관을 들여보세요.');

  if ((a[12] ?? 3) >= 4 || (b[12] ?? 3) >= 4) {
    careTips.push('감정이 격해질 때는 10분 쉬고 다시 대화하는 "타임아웃 규칙"을 만들어보세요.');
  }

  sections.push({ icon: '🤝', title: '서로 배려하는 방법', tips: careTips });

  return sections;
}
