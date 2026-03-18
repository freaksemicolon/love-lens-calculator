import { motion } from 'framer-motion';
import type { FinalResult } from '@/lib/scoring';
import { Heart, RotateCcw, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';

interface Props {
  result: FinalResult;
  nameA: string;
  nameB: string;
  onReset: () => void;
}

function ScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r="54" stroke="hsl(var(--secondary))" strokeWidth="10" fill="none" />
        <motion.circle
          cx="70" cy="70" r="54"
          stroke="url(#scoreGradient)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(350 65% 55%)" />
            <stop offset="100%" stopColor="hsl(15 80% 60%)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <motion.span
          className="text-3xl font-bold text-foreground font-display"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {score}
        </motion.span>
        <p className="text-xs text-muted-foreground">/ 100</p>
      </div>
    </div>
  );
}

function StatBar({ label, value, max, delay }: { label: string; value: number; max: number; delay: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">{value.toFixed(1)}</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <motion.div
          className="h-full gradient-hero rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 1, delay, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export default function ResultView({ result, nameA, nameB, onReset }: Props) {
  return (
    <div className="min-h-screen gradient-romantic">
      <div className="mx-auto max-w-lg px-4 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <div className="text-5xl mb-3">{result.gradeEmoji}</div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-1">
            {result.grade}
          </h1>
          <p className="text-muted-foreground text-sm">{result.description}</p>
        </motion.div>

        {/* Score ring */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <ScoreRing score={result.finalScore} />
        </motion.div>

        {/* Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl bg-card p-6 shadow-soft space-y-4 mb-6"
        >
          <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" /> 점수 상세
          </h3>
          <StatBar label={`${nameA} 건강도`} value={result.personalA} max={40} delay={0.5} />
          <StatBar label={`${nameB} 건강도`} value={result.personalB} max={40} delay={0.6} />
          <StatBar label="개인 평균 (P)" value={result.personalAvg} max={40} delay={0.7} />
          <StatBar label="궁합 점수" value={result.compatibility} max={35} delay={0.8} />
        </motion.div>

        {/* Bonuses */}
        {result.bonuses.reasons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-xl bg-card p-5 shadow-soft mb-4"
          >
            <h3 className="flex items-center gap-2 font-semibold text-foreground text-sm mb-3">
              <Sparkles className="h-4 w-4 text-accent" />
              안정 보너스 (+{result.bonuses.total})
            </h3>
            {result.bonuses.reasons.map((r, i) => (
              <p key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-primary shrink-0" /> {r}
              </p>
            ))}
          </motion.div>
        )}

        {/* Penalties */}
        {result.penalties.reasons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="rounded-xl bg-card p-5 shadow-soft mb-8"
          >
            <h3 className="flex items-center gap-2 font-semibold text-foreground text-sm mb-3">
              ⚠️ 위험 패턴 (-{result.penalties.total})
            </h3>
            {result.penalties.reasons.map((r, i) => (
              <p key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingDown className="h-3 w-3 text-destructive shrink-0" /> {r}
              </p>
            ))}
          </motion.div>
        )}

        {/* Info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center text-xs text-muted-foreground mb-6"
        >
          이 점수는 "얼마나 좋아하냐"가 아니라<br />
          "얼마나 오래 건강하게 유지되냐"를 측정합니다
        </motion.p>

        {/* Reset */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center"
        >
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-lg gradient-hero px-6 py-3 text-sm font-medium text-primary-foreground shadow-romantic transition-transform hover:scale-105"
          >
            <RotateCcw className="h-4 w-4" /> 다시 하기
          </button>
        </motion.div>
      </div>
    </div>
  );
}
