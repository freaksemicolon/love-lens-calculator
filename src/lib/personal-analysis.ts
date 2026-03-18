import type { Answers } from './scoring';
import { categories } from './questions';

const reverseIds = new Set([1,2,3,4,5,6,7,8,9,10,12,15,16,19,31,32,33,34,37,38]);
const asIsIds = new Set([13,14,17,18,24,26,28,29,35,36]);
const middleIds = new Set([11,20,21,22,23,25,27,30,39]);

function getHealthScore(qId: number, raw: number): number {
  if (reverseIds.has(qId)) return 6 - raw;
  if (asIsIds.has(qId)) return raw;
  if (middleIds.has(qId)) return 5 - Math.abs(raw - 3);
  if (qId === 40) return 5 - Math.abs(raw - 4);
  return raw;
}

export interface CategoryScore {
  key: string;
  label: string;
  icon: string;
  score: number;       // 0~100 normalized
  rawAvg: number;      // raw average 1~5
  healthAvg: number;   // health-scored average
  level: string;
  description: string;
}

export interface PersonalProfile {
  nickname: string;
  totalScore: number;  // 0~100
  categories: CategoryScore[];
  summary: string;
  type: string;
  typeEmoji: string;
}

function getCategoryAnalysis(key: string, rawAvg: number, healthAvg: number): { level: string; description: string } {
  const pct = (healthAvg / 5) * 100;

  switch (key) {
    case 'attachment':
      if (pct >= 75) return { level: '안정형', description: '상대에게 의존하지 않으면서도 깊은 유대를 형성할 수 있어요. 불안 없이 관계를 즐기는 편이에요.' };
      if (pct >= 50) return { level: '약간 불안형', description: '대체로 안정적이지만 특정 상황에서 불안감이 올라올 수 있어요. 자기 인식만으로도 충분히 관리 가능해요.' };
      if (pct >= 30) return { level: '불안형', description: '상대의 반응에 민감하고, 확인 욕구가 강한 편이에요. 자기 확신을 키우는 것이 관계에 도움이 돼요.' };
      return { level: '고불안형', description: '관계에서 많은 불안을 느끼고 있어요. 상대의 작은 변화에도 크게 반응할 수 있어요. 자존감 회복이 우선이에요.' };

    case 'communication':
      if (pct >= 75) return { level: '소통 능숙', description: '감정과 논리를 균형 있게 전달하며, 갈등 상황에서도 대화로 풀어나가는 힘이 있어요.' };
      if (pct >= 50) return { level: '보통 수준', description: '기본적인 소통은 가능하지만, 깊은 감정 표현이나 갈등 해결에서 어려움을 느낄 수 있어요.' };
      if (pct >= 30) return { level: '소통 미흡', description: '감정 표현이 서툴고, 갈등 시 회피하거나 감정적으로 대응하는 경향이 있어요.' };
      return { level: '소통 어려움', description: '자신의 감정을 전달하는 것에 큰 어려움을 느끼고 있어요. 소통 연습이 관계 개선의 핵심이에요.' };

    case 'expression':
      if (pct >= 75) return { level: '표현 풍부', description: '사랑을 적극적으로 표현하면서도 상대의 표현 방식을 존중할 줄 알아요.' };
      if (pct >= 50) return { level: '균형적 표현', description: '필요할 때 표현하지만 과하지 않아요. 다만 상대가 다른 표현 방식을 원할 수 있어요.' };
      if (pct >= 30) return { level: '표현 부족', description: '마음은 있지만 표현이 부족한 편이에요. 상대가 서운해할 수 있으니 의식적인 노력이 필요해요.' };
      return { level: '무표현형', description: '감정 표현에 매우 소극적이에요. 상대는 사랑받고 있는지 확신하기 어려울 수 있어요.' };

    case 'initiative':
      if (pct >= 75) return { level: '건강한 자존감', description: '관계에서 자신의 가치를 알고, 필요하면 건강한 선을 그을 수 있어요. 이상적인 상태예요.' };
      if (pct >= 50) return { level: '보통 자존감', description: '대체로 안정적이지만 관계에서 가끔 자신을 낮추는 경향이 있어요.' };
      if (pct >= 30) return { level: '낮은 자존감', description: '관계 유지를 위해 자신을 많이 희생하는 편이에요. 자기 기준을 세우는 연습이 필요해요.' };
      return { level: '매우 낮은 자존감', description: '관계에서 자신을 거의 돌보지 못하고 있어요. 혼자만의 시간과 자기 돌봄이 시급해요.' };

    default:
      return { level: '-', description: '' };
  }
}

function getOverallType(cats: CategoryScore[]): { type: string; emoji: string; summary: string } {
  const attachment = cats.find(c => c.key === 'attachment')!;
  const communication = cats.find(c => c.key === 'communication')!;
  const expression = cats.find(c => c.key === 'expression')!;
  const initiative = cats.find(c => c.key === 'initiative')!;

  const avgPct = cats.reduce((s, c) => s + c.score, 0) / cats.length;

  if (avgPct >= 80) {
    return {
      type: '성숙한 연애인',
      emoji: '🌟',
      summary: `안정적인 애착, 좋은 소통 능력, 적절한 표현, 건강한 자존감을 모두 갖추고 있어요. 관계를 건강하게 유지할 수 있는 힘이 있는 사람이에요. 지금처럼 자신을 돌보며 상대도 존중하는 태도를 유지하면 어떤 관계에서든 빛날 거예요.`,
    };
  }
  if (attachment.score < 40 && initiative.score < 40) {
    return {
      type: '불안-의존형',
      emoji: '🫧',
      summary: `상대에 대한 불안감이 높고, 관계에서 자신보다 상대를 우선시하는 경향이 있어요. 사랑받고 싶은 욕구가 강하지만, 때로는 그것이 집착으로 이어질 수 있어요. 먼저 자신을 사랑하는 연습이 필요해요.`,
    };
  }
  if (communication.score < 40 && expression.score < 40) {
    return {
      type: '내면 잠금형',
      emoji: '🔒',
      summary: `마음속에 많은 감정이 있지만 표현하는 것이 어려운 타입이에요. 소통도 표현도 부족하면 상대는 벽을 느낄 수 있어요. 작은 것부터 말로 표현하는 연습을 시작해보세요.`,
    };
  }
  if (attachment.score >= 60 && communication.score >= 60) {
    return {
      type: '안정 소통형',
      emoji: '💬',
      summary: `안정적인 애착을 바탕으로 소통을 잘하는 타입이에요. 관계에서 갈등이 생겨도 대화로 풀어나갈 수 있는 힘이 있어요. 표현력과 자존감을 조금 더 키우면 완벽에 가까워질 거예요.`,
    };
  }
  if (expression.score >= 60 && initiative.score >= 60) {
    return {
      type: '주도적 표현형',
      emoji: '🔥',
      summary: `자신감이 있고 표현력도 뛰어난 타입이에요. 관계에서 적극적으로 이끌어가며 상대에게 사랑을 잘 전달해요. 다만 상대의 속도에 맞추는 여유도 필요할 수 있어요.`,
    };
  }

  return {
    type: '성장하는 연애인',
    emoji: '🌱',
    summary: `아직 완벽하지 않지만 성장 가능성이 큰 타입이에요. 몇 가지 영역에서 개선이 필요하지만, 이 테스트를 통해 자신을 돌아보는 것 자체가 좋은 시작이에요. 약한 부분을 인식하고 의식적으로 노력하면 관계의 질이 크게 좋아질 거예요.`,
  };
}

export function analyzePersonal(nickname: string, answers: Answers): PersonalProfile {
  const catScores: CategoryScore[] = categories.map((cat) => {
    const [from, to] = cat.range;
    let rawSum = 0;
    let healthSum = 0;
    let count = 0;

    for (let i = from; i <= to; i++) {
      const raw = answers[i] ?? 3;
      rawSum += raw;
      healthSum += getHealthScore(i, raw);
      count++;
    }

    const rawAvg = rawSum / count;
    const healthAvg = healthSum / count;
    const score = Math.round((healthAvg / 5) * 100);
    const { level, description } = getCategoryAnalysis(cat.key, rawAvg, healthAvg);

    return {
      key: cat.key,
      label: cat.label,
      icon: cat.icon,
      score,
      rawAvg,
      healthAvg,
      level,
      description,
    };
  });

  const totalScore = Math.round(catScores.reduce((s, c) => s + c.score, 0) / catScores.length);
  const { type, emoji, summary } = getOverallType(catScores);

  return {
    nickname,
    totalScore,
    categories: catScores,
    summary,
    type,
    typeEmoji: emoji,
  };
}
