import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Users, ArrowLeft } from 'lucide-react';
import { calculateFinal } from '@/lib/scoring';
import type { Answers, FinalResult } from '@/lib/scoring';
import ResultView from '@/components/ResultView';
import { toast } from 'sonner';

interface Props {
  onBack: () => void;
}

export default function AdminCompatibilityCheck({ onBack }: Props) {
  const [nameA, setNameA] = useState('');
  const [nameB, setNameB] = useState('');
  const [answersA, setAnswersA] = useState<Answers>(() => {
    const a: Answers = {};
    for (let i = 1; i <= 40; i++) a[i] = 3;
    return a;
  });
  const [answersB, setAnswersB] = useState<Answers>(() => {
    const a: Answers = {};
    for (let i = 1; i <= 40; i++) a[i] = 3;
    return a;
  });
  const [result, setResult] = useState<FinalResult | null>(null);

  const handleCalculate = () => {
    if (!nameA.trim() || !nameB.trim()) {
      toast.error('두 사람의 이름을 입력해주세요');
      return;
    }
    const finalResult = calculateFinal(answersA, answersB);
    setResult(finalResult);
  };

  if (result) {
    return (
      <ResultView
        result={result}
        nameA={nameA.trim()}
        nameB={nameB.trim()}
        answersA={answersA}
        answersB={answersB}
        onReset={() => setResult(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" /> 궁합 시뮬레이션
        </h2>
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> 뒤로
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        두 사람의 이름과 각 문항 점수(1~5)를 입력하면 궁합 결과를 미리 확인할 수 있어요.
      </p>

      {/* Names */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">첫 번째 사람</label>
          <input
            type="text"
            value={nameA}
            onChange={(e) => setNameA(e.target.value)}
            placeholder="이름 A"
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">두 번째 사람</label>
          <input
            type="text"
            value={nameB}
            onChange={(e) => setNameB(e.target.value)}
            placeholder="이름 B"
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Score Inputs */}
      {[
        { label: nameA.trim() || '사람 A', answers: answersA, setAnswers: setAnswersA, color: 'text-primary' },
        { label: nameB.trim() || '사람 B', answers: answersB, setAnswers: setAnswersB, color: 'text-accent' },
      ].map((person, pIdx) => (
        <motion.div
          key={pIdx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: pIdx * 0.1 }}
          className="rounded-xl bg-card p-4 shadow-soft"
        >
          <h3 className={`font-semibold text-sm mb-3 flex items-center gap-2 ${person.color}`}>
            <Users className="h-4 w-4" /> {person.label}의 점수
          </h3>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {Array.from({ length: 40 }, (_, i) => i + 1).map((qId) => (
              <div key={qId} className="text-center">
                <label className="text-[10px] text-muted-foreground block">Q{qId}</label>
                <select
                  value={person.answers[qId] ?? 3}
                  onChange={(e) =>
                    person.setAnswers((prev) => ({ ...prev, [qId]: Number(e.target.value) }))
                  }
                  className="w-full text-xs rounded border border-border bg-background px-1 py-1 text-foreground"
                >
                  {[1, 2, 3, 4, 5].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Calculate Button */}
      <button
        onClick={handleCalculate}
        disabled={!nameA.trim() || !nameB.trim()}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg gradient-hero px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-romantic hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
      >
        <Heart className="h-4 w-4" /> 궁합 결과 보기
      </button>
    </div>
  );
}
