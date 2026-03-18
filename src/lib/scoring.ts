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

export function calculatePersonalScore(answers: Answers): number {
  let total = 0;
  for (let i = 1; i <= 40; i++) {
    total += getHealthScore(i, answers[i] ?? 3);
  }
  return (total / 200) * 40;
}

export function calculateCompatibility(a: Answers, b: Answers): number {
  let total = 0;
  for (let i = 1; i <= 40; i++) {
    total += 5 - Math.abs((a[i] ?? 3) - (b[i] ?? 3));
  }
  return (total / 200) * 35;
}

export function calculatePenalties(a: Answers, b: Answers): { total: number; reasons: string[] } {
  let penalty = 0;
  const reasons: string[] = [];

  // 불안형 vs 회피형
  const aAttachAvg = avg(a, [1,2,3,4,5,6,7,8,9,10]);
  const bAttachAvg = avg(b, [1,2,3,4,5,6,7,8,9,10]);
  const aAvoid = a[19] ?? 3;
  const bAvoid = b[19] ?? 3;
  if ((aAttachAvg >= 4 && bAvoid >= 4) || (bAttachAvg >= 4 && aAvoid >= 4)) {
    penalty += 5;
    reasons.push('불안형 vs 회피형 패턴이 감지되었어요');
  }

  // 표현 욕구 차이
  const aExpAvg = avg(a, [21,22,23,24,25,26,27,28,29,30]);
  const bExpAvg = avg(b, [21,22,23,24,25,26,27,28,29,30]);
  if (Math.abs(aExpAvg - bExpAvg) >= 2) {
    penalty += 4;
    reasons.push('애정 표현 욕구에 큰 차이가 있어요');
  }

  // 자존감 불균형
  const aEffort = avg(a, [31,32,33,34,35,36,37,38]);
  const bEffort = avg(b, [31,32,33,34,35,36,37,38]);
  const aControl = avg(a, [39,40]);
  const bControl = avg(b, [39,40]);
  if ((aEffort >= 3.5 && bControl >= 4) || (bEffort >= 3.5 && aControl >= 4)) {
    penalty += 4;
    reasons.push('자존감 불균형이 감지되었어요');
  }

  // 갈등 회피 커플
  const aQ18 = a[18] ?? 3, bQ18 = b[18] ?? 3;
  const aQ19 = a[19] ?? 3, bQ19 = b[19] ?? 3;
  if (aQ18 <= 2 && aQ19 >= 4 && bQ18 <= 2 && bQ19 >= 4) {
    penalty += 5;
    reasons.push('갈등 회피 커플 패턴이 감지되었어요');
  }

  return { total: penalty, reasons };
}

export function calculateBonuses(a: Answers, b: Answers): { total: number; reasons: string[] } {
  let bonus = 0;
  const reasons: string[] = [];

  const aAttachAvg = avg(a, [1,2,3,4,5,6,7,8,9,10]);
  const bAttachAvg = avg(b, [1,2,3,4,5,6,7,8,9,10]);
  if (aAttachAvg >= 2 && aAttachAvg <= 3 && bAttachAvg >= 2 && bAttachAvg <= 3) {
    bonus += 4;
    reasons.push('둘 다 안정형이에요! 💛');
  }

  if ((a[17] ?? 3) >= 4 && (a[18] ?? 3) >= 4 && (b[17] ?? 3) >= 4 && (b[18] ?? 3) >= 4) {
    bonus += 4;
    reasons.push('둘 다 소통을 중시해요! 💬');
  }

  if ((a[35] ?? 3) >= 4 && (a[36] ?? 3) >= 4 && (b[35] ?? 3) >= 4 && (b[36] ?? 3) >= 4) {
    bonus += 3;
    reasons.push('둘 다 독립적이에요! 🌿');
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

  let finalScore = personalAvg + compatibility + bonuses.total - penalties.total;
  finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));

  let grade: string, gradeEmoji: string, description: string;
  if (finalScore >= 90) {
    grade = '매우 안정적'; gradeEmoji = '💖'; description = '오래갈 수 있는 관계예요. 서로를 잘 이해하고 있어요.';
  } else if (finalScore >= 80) {
    grade = '좋은 관계'; gradeEmoji = '💕'; description = '서로에게 좋은 영향을 주고 있어요.';
  } else if (finalScore >= 70) {
    grade = '노력 필요'; gradeEmoji = '💛'; description = '약간의 노력으로 더 좋아질 수 있어요.';
  } else if (finalScore >= 60) {
    grade = '피로한 연애'; gradeEmoji = '🧡'; description = '지치지 않도록 서로 배려가 필요해요.';
  } else if (finalScore >= 50) {
    grade = '불안정'; gradeEmoji = '💔'; description = '관계에 불안정한 요소가 많아요.';
  } else {
    grade = '구조적 어려움'; gradeEmoji = '🩹'; description = '근본적인 대화와 변화가 필요해요.';
  }

  return { personalA, personalB, personalAvg, compatibility, penalties, bonuses, finalScore, grade, gradeEmoji, description };
}
