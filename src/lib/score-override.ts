import type { FinalResult } from '@/lib/scoring';

export function getGradeInfo(score: number) {
  if (score >= 90) return { grade: '매우 안정적', gradeEmoji: '💖', description: '오래갈 수 있는 관계예요. 서로를 잘 이해하고 있어요.' };
  if (score >= 80) return { grade: '좋은 관계', gradeEmoji: '💕', description: '서로에게 좋은 영향을 주고 있어요.' };
  if (score >= 70) return { grade: '노력 필요', gradeEmoji: '💛', description: '약간의 노력으로 더 좋아질 수 있어요.' };
  if (score >= 60) return { grade: '피로한 연애', gradeEmoji: '🧡', description: '지치지 않도록 서로 배려가 필요해요.' };
  if (score >= 50) return { grade: '불안정', gradeEmoji: '💔', description: '관계에 불안정한 요소가 많아요.' };
  return { grade: '구조적 어려움', gradeEmoji: '🩹', description: '근본적인 대화와 변화가 필요해요.' };
}

/**
 * Proportionally adjust all sub-scores in a FinalResult so they
 * are coherent with a new overridden final score.
 */
export function applyScoreOverride(original: FinalResult, newScore: number): FinalResult {
  const { grade, gradeEmoji, description } = getGradeInfo(newScore);

  // Original raw total (before clamping): personalAvg + compatibility + bonuses - penalties
  const originalRaw = original.personalAvg + original.compatibility + original.bonuses.total - original.penalties.total;

  if (originalRaw <= 0) {
    // Edge case: just set final score and grade
    return { ...original, finalScore: newScore, grade, gradeEmoji, description };
  }

  // We want the new raw to equal newScore
  // Scale the positive contributions proportionally
  const positiveTotal = original.personalAvg + original.compatibility + original.bonuses.total;
  const targetPositive = newScore + original.penalties.total;

  const scale = positiveTotal > 0 ? targetPositive / positiveTotal : 1;

  const newPersonalA = Math.round(original.personalA * scale * 10) / 10;
  const newPersonalB = Math.round(original.personalB * scale * 10) / 10;
  const newPersonalAvg = Math.round(((newPersonalA + newPersonalB) / 2) * 10) / 10;
  const newCompatibility = Math.round(original.compatibility * scale * 10) / 10;
  const newBonusTotal = Math.round(original.bonuses.total * scale * 10) / 10;

  return {
    personalA: newPersonalA,
    personalB: newPersonalB,
    personalAvg: newPersonalAvg,
    compatibility: newCompatibility,
    penalties: original.penalties, // keep penalties as-is
    bonuses: { ...original.bonuses, total: newBonusTotal },
    finalScore: newScore,
    grade,
    gradeEmoji,
    description,
  };
}
