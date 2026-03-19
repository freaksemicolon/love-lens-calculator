export type Answers = Record<number, number>; // questionId -> score (1-5)

// Reverse scored questions: 6 - score
const reverseIds = new Set([1,2,3,4,5,6,7,8,9,10,12,15,16,19,31,32,33,34,37,38]);

// As-is questions
const asIsIds = new Set([13,14,17,18,24,26,28,29,35,36]);

// Middle-optimal questions: 5 - |score - 3|
const middleIds = new Set([11,20,21,22,23,25,27,30,39]);

// Q40 special: 5 - |score - 4|

function getHealthScore(qId: number, raw: number): number {
  if (reverseIds.has(qId)) return 6 - raw;
  if (asIsIds.has(qId)) return raw;
  if (middleIds.has(qId)) return 5 - Math.abs(raw - 3);
  if (qId === 40) return 5 - Math.abs(raw - 4);
  return raw;
}

function avg(answers: Answers, ids: number[]): number {
  const vals = ids.map(id => answers[id] ?? 3);
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

function sumRange(answers: Answers, from: number, to: number): number {
  let s = 0;
  for (let i = from; i <= to; i++) s += (answers[i] ?? 3);
  return s;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// -----------------------------
// Personal score (기능 유지)
// -----------------------------
export function calculatePersonalScore(answers: Answers): number {
  let total = 0;
  for (let i = 1; i <= 40; i++) {
    total += getHealthScore(i, answers[i] ?? 3);
  }
  return (total / 200) * 40;
}

// -----------------------------
// Compatibility only (개선)
// - 개인 점수는 최종 합산에서 제외
// - 중요한 문항은 가중치 부여
// - 10~100으로 넓게 분포되도록 설계
// -----------------------------
const QUESTION_WEIGHTS: Record<number, number> = {
  // 1~10 애착/불안
  1: 1.4, 2: 1.4, 3: 1.4, 4: 1.4, 5: 1.4,
  6: 1.3, 7: 1.3, 8: 1.3, 9: 1.3, 10: 1.3,

  // 11~20 소통/갈등
  11: 1.0, 12: 1.0, 13: 1.1, 14: 1.1, 15: 1.1, 16: 1.1,
  17: 1.7, 18: 1.7, 19: 1.7, 20: 1.2,

  // 21~30 애정 표현 / 정서 니즈
  21: 1.4, 22: 1.4, 23: 1.4, 24: 1.4, 25: 1.4,
  26: 1.4, 27: 1.4, 28: 1.4, 29: 1.4, 30: 1.4,

  // 31~40 자존감 / 독립성 / 통제
  31: 1.2, 32: 1.2, 33: 1.2, 34: 1.2,
  35: 1.6, 36: 1.6, 37: 1.2, 38: 1.2,
  39: 1.4, 40: 1.4,
};

function getWeight(qId: number): number {
  return QUESTION_WEIGHTS[qId] ?? 1.0;
}

function getCompatibilityRatio(a: Answers, b: Answers): number {
  let weightedSimilaritySum = 0;
  let totalWeight = 0;

  for (let i = 1; i <= 40; i++) {
    const av = a[i] ?? 3;
    const bv = b[i] ?? 3;
    const diff = Math.abs(av - bv);       // 0 ~ 4
    const similarity = 1 - diff / 4;      // 1.0 ~ 0.0
    const weight = getWeight(i);

    weightedSimilaritySum += similarity * weight;
    totalWeight += weight;
  }

  return totalWeight === 0 ? 0.5 : weightedSimilaritySum / totalWeight;
}

export function calculateCompatibility(a: Answers, b: Answers): number {
  const ratio = getCompatibilityRatio(a, b); // 0~1

  // 중간 점수대가 너무 많지 않게 분포 확장
  // 0.5 근처는 더 내려가고, 높은 유사도는 더 올라가게 함
  const spread = Math.pow(ratio, 1.85);

  // 10~100 범위 매핑
  return 10 + spread * 90;
}

// -----------------------------
// Penalties (확장)
// -----------------------------
export function calculatePenalties(a: Answers, b: Answers): { total: number; reasons: string[] } {
  let penalty = 0;
  const reasons: string[] = [];

  const aAttachAvg = avg(a, [1,2,3,4,5,6,7,8,9,10]);
  const bAttachAvg = avg(b, [1,2,3,4,5,6,7,8,9,10]);

  const aCommAvg = avg(a, [11,12,13,14,15,16,17,18,19,20]);
  const bCommAvg = avg(b, [11,12,13,14,15,16,17,18,19,20]);

  const aExpAvg = avg(a, [21,22,23,24,25,26,27,28,29,30]);
  const bExpAvg = avg(b, [21,22,23,24,25,26,27,28,29,30]);

  const aSelfAvg = avg(a, [31,32,33,34,35,36,37,38]);
  const bSelfAvg = avg(b, [31,32,33,34,35,36,37,38]);

  const aControlAvg = avg(a, [39,40]);
  const bControlAvg = avg(b, [39,40]);

  const aAvoid = a[19] ?? 3;
  const bAvoid = b[19] ?? 3;

  const diffAttach = Math.abs(aAttachAvg - bAttachAvg);
  const diffComm = Math.abs(aCommAvg - bCommAvg);
  const diffExp = Math.abs(aExpAvg - bExpAvg);
  const diffSelf = Math.abs(aSelfAvg - bSelfAvg);
  const diffControl = Math.abs(aControlAvg - bControlAvg);

  // 1. 불안형 vs 회피형
  if ((aAttachAvg >= 4 && bAvoid >= 4) || (bAttachAvg >= 4 && aAvoid >= 4)) {
    penalty += 8;
    reasons.push('한쪽은 확신을 원하고, 한쪽은 거리를 두려는 패턴이 보여요');
  }

  // 2. 애정 표현 욕구 차이
  if (diffExp >= 1.8) {
    penalty += 7;
    reasons.push('애정 표현을 원하는 정도에 큰 차이가 있어요');
  } else if (diffExp >= 1.2) {
    penalty += 4;
    reasons.push('애정 표현 방식이 조금 달라 오해가 생길 수 있어요');
  }

  // 3. 갈등 회피 커플
  const aQ18 = a[18] ?? 3;
  const bQ18 = b[18] ?? 3;
  const aQ19 = a[19] ?? 3;
  const bQ19 = b[19] ?? 3;
  if (aQ18 <= 2 && aQ19 >= 4 && bQ18 <= 2 && bQ19 >= 4) {
    penalty += 8;
    reasons.push('둘 다 갈등을 미루거나 피하는 경향이 있어요');
  }

  // 4. 소통 온도 차이
  if (diffComm >= 1.5) {
    penalty += 6;
    reasons.push('대화로 문제를 푸는 방식에 차이가 커요');
  }

  // 5. 관계 주도권 / 통제 충돌
  if (aControlAvg >= 4 && bControlAvg >= 4) {
    penalty += 6;
    reasons.push('둘 다 관계를 주도하려는 성향이 강해 부딪힐 수 있어요');
  }

  // 6. 자존감-통제 불균형
  if ((aSelfAvg <= 2.5 && bControlAvg >= 4) || (bSelfAvg <= 2.5 && aControlAvg >= 4)) {
    penalty += 7;
    reasons.push('한쪽이 위축되고 다른 한쪽이 관계를 끌고 가기 쉬운 조합이에요');
  }

  // 7. 밀착형 vs 독립형
  const aIndependent = avg(a, [35,36]);
  const bIndependent = avg(b, [35,36]);
  if (Math.abs(aIndependent - bIndependent) >= 2) {
    penalty += 6;
    reasons.push('가까워지고 싶은 거리감의 기준이 달라요');
  }

  // 8. 감정 기복 차이
  const aEmotion = avg(a, [1,2,3,4,5,6,7,8,9,10,31,32,33,34,37,38]);
  const bEmotion = avg(b, [1,2,3,4,5,6,7,8,9,10,31,32,33,34,37,38]);
  if (Math.abs(aEmotion - bEmotion) >= 1.5) {
    penalty += 5;
    reasons.push('감정의 안정감 차이가 커서 서로 힘들 수 있어요');
  }

  // 9. 확신 요구 vs 자유 추구
  if (
    (aAttachAvg >= 4 && bIndependent >= 4.3) ||
    (bAttachAvg >= 4 && aIndependent >= 4.3)
  ) {
    penalty += 6;
    reasons.push('한쪽은 더 가까움을 원하고, 다른 한쪽은 자유를 더 중시해요');
  }

  // 10. 관계 기대치 차이
  const aNeediness = avg(a, [21,22,23,24,25,26,27,28,29,30,1,2,3,4,5]);
  const bNeediness = avg(b, [21,22,23,24,25,26,27,28,29,30,1,2,3,4,5]);
  if (Math.abs(aNeediness - bNeediness) >= 1.6) {
    penalty += 5;
    reasons.push('관계에서 기대하는 밀도와 반응 속도 차이가 커요');
  }

  // 11. 둘 다 매우 불안정한 애착
  if (aAttachAvg >= 4.4 && bAttachAvg >= 4.4) {
    penalty += 6;
    reasons.push('둘 다 불안이 높아 관계 피로도가 커질 수 있어요');
  }

  // 12. 둘 다 지나치게 냉각형
  if (aAvoid >= 4.4 && bAvoid >= 4.4) {
    penalty += 5;
    reasons.push('둘 다 거리를 두는 편이라 정서적 연결이 약해질 수 있어요');
  }

  return { total: penalty, reasons };
}

// -----------------------------
// Bonuses (확장)
// -----------------------------
export function calculateBonuses(a: Answers, b: Answers): { total: number; reasons: string[] } {
  let bonus = 0;
  const reasons: string[] = [];

  const aAttachAvg = avg(a, [1,2,3,4,5,6,7,8,9,10]);
  const bAttachAvg = avg(b, [1,2,3,4,5,6,7,8,9,10]);

  const aCommAvg = avg(a, [11,12,13,14,15,16,17,18,19,20]);
  const bCommAvg = avg(b, [11,12,13,14,15,16,17,18,19,20]);

  const aExpAvg = avg(a, [21,22,23,24,25,26,27,28,29,30]);
  const bExpAvg = avg(b, [21,22,23,24,25,26,27,28,29,30]);

  const aIndependent = avg(a, [35,36]);
  const bIndependent = avg(b, [35,36]);

  const aControlAvg = avg(a, [39,40]);
  const bControlAvg = avg(b, [39,40]);

  // 1. 둘 다 안정형
  if (aAttachAvg >= 2 && aAttachAvg <= 3 && bAttachAvg >= 2 && bAttachAvg <= 3) {
    bonus += 5;
    reasons.push('둘 다 안정형이에요! 💛');
  }

  // 2. 둘 다 소통 중시
  if ((a[17] ?? 3) >= 4 && (a[18] ?? 3) >= 4 && (b[17] ?? 3) >= 4 && (b[18] ?? 3) >= 4) {
    bonus += 5;
    reasons.push('둘 다 소통을 중시해요! 💬');
  }

  // 3. 둘 다 독립적
  if ((a[35] ?? 3) >= 4 && (a[36] ?? 3) >= 4 && (b[35] ?? 3) >= 4 && (b[36] ?? 3) >= 4) {
    bonus += 4;
    reasons.push('둘 다 독립성을 존중해요! 🌿');
  }

  // 4. 애정 표현 템포가 비슷함
  if (Math.abs(aExpAvg - bExpAvg) <= 0.5) {
    bonus += 4;
    reasons.push('애정 표현 템포가 비슷해요! 💞');
  }

  // 5. 갈등 해결 방식이 비슷함
  if (Math.abs(aCommAvg - bCommAvg) <= 0.5) {
    bonus += 4;
    reasons.push('문제를 푸는 방식이 비슷해요! 🫶');
  }

  // 6. 서로 부담 없이 안정적인 거리감
  if (aIndependent >= 3.2 && aIndependent <= 4.2 && bIndependent >= 3.2 && bIndependent <= 4.2) {
    bonus += 3;
    reasons.push('서로에게 너무 답답하지도, 너무 멀지도 않은 거리감을 가져요! 🍃');
  }

  // 7. 둘 다 감정 조절이 비교적 안정적
  const aHealth = calculatePersonalScore(a);
  const bHealth = calculatePersonalScore(b);
  if (aHealth >= 28 && bHealth >= 28) {
    bonus += 3;
    reasons.push('둘 다 관계를 비교적 건강하게 운영할 가능성이 높아요! ✨');
  }

  // 8. 통제 욕구가 낮아 편안한 관계
  if (aControlAvg <= 3 && bControlAvg <= 3) {
    bonus += 3;
    reasons.push('서로를 통제하려 하기보다 편안하게 두는 편이에요! ☁️');
  }

  // 9. 서로에게 필요한 애정 밀도가 유사함
  const aNeediness = avg(a, [21,22,23,24,25,26,27,28,29,30,1,2,3,4,5]);
  const bNeediness = avg(b, [21,22,23,24,25,26,27,28,29,30,1,2,3,4,5]);
  if (Math.abs(aNeediness - bNeediness) <= 0.6) {
    bonus += 3;
    reasons.push('관계에서 원하는 친밀감의 밀도가 비슷해요! 🤍');
  }

  // 10. 둘 다 대화로 회복하려는 의지가 강함
  if (
    (a[17] ?? 3) >= 4 && (a[18] ?? 3) >= 4 && (a[19] ?? 3) <= 2 &&
    (b[17] ?? 3) >= 4 && (b[18] ?? 3) >= 4 && (b[19] ?? 3) <= 2
  ) {
    bonus += 4;
    reasons.push('서운한 일이 생겨도 대화로 회복하려는 힘이 커요! 🔧');
  }

  return { total: bonus, reasons };
}

export interface FinalResult {
  personalA: number;
  personalB: number;
  personalAvg: number;
  compatibility: number;
  penalties: { total: number; reasons: string[] };
  bonuses: { total: number; reasons: string[] };
  finalScore: number;
  grade: string;
  gradeEmoji: string;
  description: string;
}

export function calculateFinal(a: Answers, b: Answers): FinalResult {
  const personalA = calculatePersonalScore(a);
  const personalB = calculatePersonalScore(b);
  const personalAvg = (personalA + personalB) / 2;
  const compatibility = calculateCompatibility(a, b);
  const penalties = calculatePenalties(a, b);
  const bonuses = calculateBonuses(a, b);

  // 핵심 변경:
  // 개인 점수는 표시만 하고, 최종 궁합 점수에는 더하지 않음
  let finalScore = compatibility + bonuses.total - penalties.total;
  finalScore = clamp(Math.round(finalScore), 10, 100);

  let grade: string;
  let gradeEmoji: string;
  let description: string;

  if (finalScore >= 90) {
    grade = '매우 잘 맞음';
    gradeEmoji = '💘';
    description = '성향 차이가 적고 관계 운영 방식도 잘 맞아요.';
  } else if (finalScore >= 80) {
    grade = '좋은 궁합';
    gradeEmoji = '💕';
    description = '전반적으로 잘 맞는 편이에요.';
  } else if (finalScore >= 70) {
    grade = '꽤 잘 맞음';
    gradeEmoji = '🙂';
    description = '차이는 있지만 충분히 잘 맞춰갈 수 있어요.';
  } else if (finalScore >= 55) {
    grade = '보통';
    gradeEmoji = '😐';
    description = '잘 맞는 부분도 있고 부딪히는 부분도 있어요.';
  } else if (finalScore >= 40) {
    grade = '주의 필요';
    gradeEmoji = '⚠️';
    description = '관계에서 반복적으로 부딪힐 가능성이 있어요.';
  } else if (finalScore >= 25) {
    grade = '어려운 궁합';
    gradeEmoji = '🥲';
    description = '핵심 성향 차이가 커서 노력 없이는 힘들 수 있어요.';
  } else {
    grade = '매우 어려움';
    gradeEmoji = '🧊';
    description = '연애 방식 자체가 많이 달라요.';
  }

  return {
    personalA,
    personalB,
    personalAvg,
    compatibility,
    penalties,
    bonuses,
    finalScore,
    grade,
    gradeEmoji,
    description,
  };
}
