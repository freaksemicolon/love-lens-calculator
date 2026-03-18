import { motion } from 'framer-motion';
import type { Question } from '@/lib/questions';

interface Props {
  question: Question;
  value: number | undefined;
  onChange: (value: number) => void;
  index: number;
}

const labels = ['전혀 아니다', '아니다', '보통이다', '그렇다', '매우 그렇다'];

export default function QuizQuestion({ question, value, onChange, index }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-lg bg-card p-5 shadow-soft"
    >
      <p className="mb-4 text-sm font-medium text-foreground">
        <span className="mr-2 text-primary font-semibold">Q{question.id}.</span>
        {question.text}
      </p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            onClick={() => onChange(score)}
            className={`flex-1 rounded-md py-2.5 text-xs font-medium transition-all duration-200 ${
              value === score
                ? 'gradient-hero text-primary-foreground shadow-romantic scale-105'
                : 'bg-secondary text-secondary-foreground hover:bg-primary/10'
            }`}
          >
            <div className="text-base font-bold">{score}</div>
            <div className="mt-0.5 hidden sm:block text-[10px] opacity-80">{labels[score - 1]}</div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
