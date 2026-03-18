import { motion } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell } from 'recharts';
import { Share2, RotateCcw, Search, User } from 'lucide-react';
import type { PersonalProfile } from '@/lib/personal-analysis';
import { toast } from 'sonner';

interface Props {
  profile: PersonalProfile;
  onCheckCompatibility: () => void;
  onReset: () => void;
}

function ScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 48;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="120" height="120" className="-rotate-90">
        <circle cx="60" cy="60" r="48" stroke="hsl(var(--secondary))" strokeWidth="8" fill="none" />
        <motion.circle
          cx="60" cy="60" r="48"
          stroke="url(#personalGrad)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="personalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(350 65% 55%)" />
            <stop offset="100%" stopColor="hsl(15 80% 60%)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <motion.span
          className="text-2xl font-bold text-foreground font-display"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {score}
        </motion.span>
        <p className="text-[10px] text-muted-foreground">/ 100</p>
      </div>
    </div>
  );
}

const COLORS = [
  'hsl(350, 65%, 55%)',
  'hsl(25, 70%, 55%)',
  'hsl(340, 60%, 60%)',
  'hsl(15, 80%, 60%)',
];

export default function PersonalResultView({ profile, onCheckCompatibility, onReset }: Props) {
  const radarData = profile.categories.map((c) => ({
    subject: c.icon + ' ' + c.label,
    value: c.score,
    fullMark: 100,
  }));

  const barData = profile.categories.map((c) => ({
    name: c.label,
    score: c.score,
    icon: c.icon,
  }));

  const handleShare = async () => {
    const text = `💕 연애 적합도 테스트 결과\n\n` +
      `📛 ${profile.nickname}\n` +
      `${profile.typeEmoji} ${profile.type} (${profile.totalScore}점)\n\n` +
      profile.categories.map(c => `${c.icon} ${c.label}: ${c.score}점 (${c.level})`).join('\n') +
      `\n\n${profile.summary}\n\n` +
      `🔗 나도 테스트하기: ${window.location.origin}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: '연애 적합도 테스트 결과', text });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(text);
      toast.success('결과가 클립보드에 복사되었어요!');
    } catch {
      toast.error('공유 실패');
    }
  };

  return (
    <div className="min-h-screen gradient-romantic">
      <div className="mx-auto max-w-lg px-4 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-6"
        >
          <div className="text-5xl mb-3">{profile.typeEmoji}</div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-1">
            {profile.type}
          </h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{profile.nickname}</span>님의 연애 프로필
          </p>
        </motion.div>

        {/* Score Ring */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-6"
        >
          <ScoreRing score={profile.totalScore} />
        </motion.div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl bg-card p-5 shadow-soft mb-6"
        >
          <h3 className="flex items-center gap-2 font-display font-semibold text-foreground text-sm mb-3">
            <User className="h-4 w-4 text-primary" /> 종합 분석
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {profile.summary}
          </p>
        </motion.div>

        {/* Radar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl bg-card p-5 shadow-soft mb-6"
        >
          <h3 className="font-display font-semibold text-foreground text-sm mb-4">📊 영역별 분포</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Radar
                name="점수"
                dataKey="value"
                stroke="hsl(350, 65%, 55%)"
                fill="hsl(350, 65%, 55%)"
                fillOpacity={0.25}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl bg-card p-5 shadow-soft mb-6"
        >
          <h3 className="font-display font-semibold text-foreground text-sm mb-4">📈 영역별 점수</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={20}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-3 mb-8"
        >
          {profile.categories.map((cat, i) => (
            <motion.div
              key={cat.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              className="rounded-xl bg-card p-4 shadow-soft"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-foreground text-sm">
                  {cat.icon} {cat.label}
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    {cat.level}
                  </span>
                  <span className="text-sm font-bold text-foreground">{cat.score}점</span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden mb-2">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  initial={{ width: 0 }}
                  animate={{ width: `${cat.score}%` }}
                  transition={{ duration: 1, delay: 0.8 + i * 0.1 }}
                />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{cat.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="space-y-3"
        >
          <button
            onClick={handleShare}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg gradient-hero px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-romantic hover:scale-105 transition-all"
          >
            <Share2 className="h-4 w-4" /> 결과 공유하기
          </button>

          <button
            onClick={onCheckCompatibility}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-card border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            <Search className="h-4 w-4" /> 궁합 결과 확인하기
          </button>

          <button
            onClick={onReset}
            className="w-full inline-flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground py-2"
          >
            <RotateCcw className="h-4 w-4" /> 처음으로 돌아가기
          </button>
        </motion.div>
      </div>
    </div>
  );
}
