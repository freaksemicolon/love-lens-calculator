import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { questions, categories } from '@/lib/questions';
import type { Answers } from '@/lib/scoring';
import QuizQuestion from './QuizQuestion';
import { Heart, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface Props {
  person: 'A' | 'B';
  personName: string;
  onComplete: (answers: Answers) => void;
  onBack?: () => void;
}

export default function QuizSection({ person, personName, onComplete, onBack }: Props) {
  const [answers, setAnswers] = useState<Answers>({});
  const [currentCat, setCurrentCat] = useState(0);

  const cat = categories[currentCat];
  const catQuestions = questions.filter(
    (q) => q.id >= cat.range[0] && q.id <= cat.range[1]
  );

  const catComplete = catQuestions.every((q) => answers[q.id] !== undefined);
  const allComplete = questions.every((q) => answers[q.id] !== undefined);
  const progress = (Object.keys(answers).length / 40) * 100;

  const handleAnswer = (qId: number, val: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  return (
    <div className="min-h-screen gradient-romantic">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-3">
            <Heart className="h-4 w-4" />
            {personName}의 테스트
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            {cat.icon} {cat.label}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            카테고리 {currentCat + 1} / {categories.length}
          </p>
        </motion.div>

        {/* Progress bar */}
        <div className="mb-6 h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full gradient-hero rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Questions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCat}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-4"
          >
            {catQuestions.map((q, i) => (
              <QuizQuestion
                key={q.id}
                question={q}
                value={answers[q.id]}
                onChange={(val) => handleAnswer(q.id, val)}
                index={i}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={() => {
              if (currentCat > 0) setCurrentCat(currentCat - 1);
              else onBack?.();
            }}
            className="flex items-center gap-2 rounded-lg bg-secondary px-5 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            <ArrowLeft className="h-4 w-4" />
            {currentCat > 0 ? '이전' : '처음으로'}
          </button>

          {currentCat < categories.length - 1 ? (
            <button
              onClick={() => catComplete && setCurrentCat(currentCat + 1)}
              disabled={!catComplete}
              className={`flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium transition-all ${
                catComplete
                  ? 'gradient-hero text-primary-foreground shadow-romantic'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              다음 <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => allComplete && onComplete(answers)}
              disabled={!allComplete}
              className={`flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium transition-all ${
                allComplete
                  ? 'gradient-hero text-primary-foreground shadow-romantic'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              완료
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
