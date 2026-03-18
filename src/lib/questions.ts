export interface Question {
  id: number;
  text: string;
  category: string;
}

export const categories = [
  { key: 'attachment', label: '애착 & 불안', icon: '💭', range: [1, 10] },
  { key: 'communication', label: '소통 방식', icon: '💬', range: [11, 20] },
  { key: 'expression', label: '애정 표현 방식', icon: '💝', range: [21, 30] },
  { key: 'initiative', label: '관계 주도권 & 자존감', icon: '🌟', range: [31, 40] },
];

export const questions: Question[] = [
  // 1. 애착 & 불안
  { id: 1, text: '답장이 늦으면 이유를 상상하게 된다', category: 'attachment' },
  { id: 2, text: '상대의 말투 변화에 민감하다', category: 'attachment' },
  { id: 3, text: '"나 싫어졌나?"라는 생각을 해본다', category: 'attachment' },
  { id: 4, text: '상대의 행동을 과하게 해석하는 편이다', category: 'attachment' },
  { id: 5, text: '연락이 없으면 불안하다', category: 'attachment' },
  { id: 6, text: '상대가 바쁘다고 하면 서운하다', category: 'attachment' },
  { id: 7, text: '혼자 있을 때 연애 생각이 많다', category: 'attachment' },
  { id: 8, text: '상대의 기분에 내 기분이 크게 좌우된다', category: 'attachment' },
  { id: 9, text: '상대가 다른 사람과 가까우면 신경 쓰인다', category: 'attachment' },
  { id: 10, text: '확신을 자주 받고 싶다', category: 'attachment' },
  // 2. 소통 방식
  { id: 11, text: '서운한 걸 바로 말하는 편이다', category: 'communication' },
  { id: 12, text: '싸울 때 감정이 먼저 나온다', category: 'communication' },
  { id: 13, text: '문제를 논리적으로 설명하려고 한다', category: 'communication' },
  { id: 14, text: '싸움 후 먼저 연락하는 편이다', category: 'communication' },
  { id: 15, text: '상대가 말 안 하면 나도 안 한다', category: 'communication' },
  { id: 16, text: '내 감정을 설명하는 게 어렵다', category: 'communication' },
  { id: 17, text: '상대 입장에서 생각하려고 노력한다', category: 'communication' },
  { id: 18, text: '대화로 해결하는 게 중요하다고 생각한다', category: 'communication' },
  { id: 19, text: '불편한 상황을 피하려 한다', category: 'communication' },
  { id: 20, text: '말보다 행동이 더 중요하다고 생각한다', category: 'communication' },
  // 3. 애정 표현 방식
  { id: 21, text: '사랑한다는 말을 자주 듣고 싶다', category: 'expression' },
  { id: 22, text: '스킨십이 관계에서 중요하다', category: 'expression' },
  { id: 23, text: '선물이나 이벤트를 중요하게 생각한다', category: 'expression' },
  { id: 24, text: '함께 보내는 시간이 가장 중요하다', category: 'expression' },
  { id: 25, text: '상대가 나를 표현해주길 바란다', category: 'expression' },
  { id: 26, text: '표현이 적어도 행동이 좋으면 괜찮다', category: 'expression' },
  { id: 27, text: '상대가 무심하면 상처받는다', category: 'expression' },
  { id: 28, text: '내가 더 많이 표현하는 편이다', category: 'expression' },
  { id: 29, text: '감정보다 행동이 더 진짜라고 생각한다', category: 'expression' },
  { id: 30, text: '특별한 날은 꼭 챙겨야 한다', category: 'expression' },
  // 4. 관계 주도권 & 자존감
  { id: 31, text: '연애에서 내가 더 많이 노력하는 편이다', category: 'initiative' },
  { id: 32, text: '상대가 나보다 더 좋아했으면 좋겠다', category: 'initiative' },
  { id: 33, text: '거절당하는 상황이 두렵다', category: 'initiative' },
  { id: 34, text: '관계가 불안하면 더 집착하게 된다', category: 'initiative' },
  { id: 35, text: '혼자 있어도 괜찮은 편이다', category: 'initiative' },
  { id: 36, text: '상대 없이도 삶이 충분히 만족스럽다', category: 'initiative' },
  { id: 37, text: '상대에게 맞추는 편이다', category: 'initiative' },
  { id: 38, text: '내 기준을 쉽게 낮추는 편이다', category: 'initiative' },
  { id: 39, text: '관계에서 내가 주도권을 갖고 싶다', category: 'initiative' },
  { id: 40, text: '필요하면 관계를 끊을 수 있다', category: 'initiative' },
];
