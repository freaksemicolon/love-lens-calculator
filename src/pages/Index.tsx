import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowRight } from 'lucide-react';
import type { Answers } from '@/lib/scoring';
import { calculateFinal } from '@/lib/scoring';
import QuizSection from '@/components/QuizSection';
import ResultView from '@/components/ResultView';

type Step = 'landing' | 'quizA' | 'quizB' | 'result';

export default function Index() {
  const [step, setStep] = useState<Step>('landing');
  const [nameA, setNameA] = useState('');
  const [nameB, setNameB] = useState('');
  const [answersA, setAnswersA] = useState<Answers>({});
  const [answersB, setAnswersB] = useState<Answers>({});

  const canStart = nameA.trim() && nameB.trim();

  const result =
    step === 'result' ? calculateFinal(answersA, answersB) : null;

  return (
    <AnimatePresence mode="wait">
      {step === 'landing' && (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen gradient-romantic flex items-center justify-center px-4"
        >
          <div className="max-w-md w-full text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
            >
              <Heart className="h-10 w-10 text-primary animate-pulse-soft" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-display text-4xl font-bold text-foreground mb-3"
            >
              연애 적합도 테스트
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground text-sm mb-8"
            >
              40개의 질문으로 알아보는<br />
              우리 관계의 건강도와 궁합
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-3 mb-8"
            >
              <input
                type="text"
                placeholder="첫 번째 사람 이름"
                value={nameA}
                onChange={(e) => setNameA(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                type="text"
                placeholder="두 번째 사람 이름"
                value={nameB}
                onChange={(e) => setNameB(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              onClick={() => canStart && setStep('quizA')}
              disabled={!canStart}
              className={`inline-flex items-center gap-2 rounded-lg px-8 py-3.5 text-sm font-semibold transition-all ${
                canStart
                  ? 'gradient-hero text-primary-foreground shadow-romantic hover:scale-105'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              시작하기 <ArrowRight className="h-4 w-4" />
            </motion.button>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 flex justify-center gap-6 text-xs text-muted-foreground"
            >
              <span>📋 40문항</span>
              <span>⏱️ 약 10분</span>
              <span>💯 100점 만점</span>
            </motion.div>
          </div>
        </motion.div>
      )}

      {step === 'quizA' && (
        <motion.div key="quizA" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <QuizSection
            person="A"
            personName={nameA}
            onComplete={(a) => { setAnswersA(a); setStep('quizB'); }}
            onBack={() => setStep('landing')}
          />
        </motion.div>
      )}

      {step === 'quizB' && (
        <motion.div key="quizB" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <QuizSection
            person="B"
            personName={nameB}
            onComplete={(b) => { setAnswersB(b); setStep('result'); }}
            onBack={() => setStep('quizA')}
          />
        </motion.div>
      )}

      {step === 'result' && result && (
        <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ResultView
            result={result}
            nameA={nameA}
            nameB={nameB}
            onReset={() => {
              setStep('landing');
              setAnswersA({});
              setAnswersB({});
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
