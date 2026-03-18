import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowRight, Search, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Answers } from '@/lib/scoring';
import { calculateFinal } from '@/lib/scoring';
import { analyzePersonal, type PersonalProfile } from '@/lib/personal-analysis';
import { applyScoreOverride } from '@/lib/score-override';
import QuizSection from '@/components/QuizSection';
import ResultView from '@/components/ResultView';
import PersonalResultView from '@/components/PersonalResultView';
import { toast } from 'sonner';

type Step = 'landing' | 'quiz' | 'personal' | 'check' | 'result';

export default function Index() {
  const [step, setStep] = useState<Step>('landing');
  const [nickname, setNickname] = useState('');
  const [myAnswers, setMyAnswers] = useState<Answers>({});
  const [personalProfile, setPersonalProfile] = useState<PersonalProfile | null>(null);
  const [saving, setSaving] = useState(false);

  // Compatibility check
  const [nickA, setNickA] = useState('');
  const [nickB, setNickB] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof calculateFinal> | null>(null);
  const [resultNames, setResultNames] = useState<{ a: string; b: string }>({ a: '', b: '' });
  const [resultAnswers, setResultAnswers] = useState<{ a: Answers; b: Answers }>({ a: {}, b: {} });

  const handleQuizComplete = async (answers: Answers) => {
    setMyAnswers(answers);
    setSaving(true);
    try {
      const { error } = await supabase
        .from('quiz_results')
        .insert({ nickname: nickname.trim(), answers: answers as any });

      if (error) {
        if (error.code === '23505') {
          toast.error('이미 사용 중인 닉네임이에요!');
          setSaving(false);
          return;
        }
        throw error;
      }
      const profile = analyzePersonal(nickname.trim(), answers);
      setPersonalProfile(profile);
      setStep('personal');
    } catch (e: any) {
      toast.error('저장 중 오류가 발생했어요: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!nickname.trim()) return;
    // Check if nickname already exists
    const { data } = await supabase
      .from('quiz_results')
      .select('id')
      .eq('nickname', nickname.trim())
      .maybeSingle();

    if (data) {
      toast.error('이미 사용 중인 닉네임이에요! 다른 닉네임을 입력해주세요.');
      return;
    }
    setStep('quiz');
  };

  const handleCheckCompatibility = async () => {
    if (!nickA.trim() || !nickB.trim()) return;
    if (nickA.trim() === nickB.trim()) {
      toast.error('서로 다른 닉네임을 입력해주세요!');
      return;
    }
    setChecking(true);
    try {
      const { data: dataA } = await supabase
        .from('quiz_results')
        .select('answers')
        .eq('nickname', nickA.trim())
        .maybeSingle();

      const { data: dataB } = await supabase
        .from('quiz_results')
        .select('answers')
        .eq('nickname', nickB.trim())
        .maybeSingle();

      if (!dataA || !dataB) {
        const missing = [];
        if (!dataA) missing.push(nickA.trim());
        if (!dataB) missing.push(nickB.trim());
        toast.error(`${missing.join(', ')}님이 아직 테스트를 완료하지 않았어요!`);
        return;
      }

      const answersA = dataA.answers as unknown as Answers;
      const answersB = dataB.answers as unknown as Answers;
      const finalResult = calculateFinal(answersA, answersB);

      // Check for admin score override
      const sortedA = nickA.trim() < nickB.trim() ? nickA.trim() : nickB.trim();
      const sortedB = nickA.trim() < nickB.trim() ? nickB.trim() : nickA.trim();
      const { data: override } = await supabase
        .from('compatibility_overrides')
        .select('modified_score')
        .eq('nickname_a', sortedA)
        .eq('nickname_b', sortedB)
        .maybeSingle();

      if (override) {
        const score = (override as any).modified_score as number;
        const gradeInfo = getGradeInfo(score);
        finalResult.finalScore = score;
        finalResult.grade = gradeInfo.grade;
        finalResult.gradeEmoji = gradeInfo.gradeEmoji;
        finalResult.description = gradeInfo.description;
      }

      setResultNames({ a: nickA.trim(), b: nickB.trim() });
      setResultAnswers({ a: answersA, b: answersB });
      setResult(finalResult);
      setStep('result');
    } catch (e: any) {
      toast.error('조회 중 오류가 발생했어요');
    } finally {
      setChecking(false);
    }
  };

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
              className="space-y-3 mb-6"
            >
              <input
                type="text"
                placeholder="나의 닉네임"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              onClick={handleStartQuiz}
              disabled={!nickname.trim()}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-8 py-3.5 text-sm font-semibold transition-all ${
                nickname.trim()
                  ? 'gradient-hero text-primary-foreground shadow-romantic hover:scale-105'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              테스트 시작하기 <ArrowRight className="h-4 w-4" />
            </motion.button>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-6"
            >
              <button
                onClick={() => setStep('check')}
                className="text-sm text-primary hover:underline flex items-center gap-1 mx-auto"
              >
                <Search className="h-3.5 w-3.5" />
                궁합 결과 확인하기
              </button>
            </motion.div>

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

      {step === 'quiz' && (
        <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <QuizSection
            person="A"
            personName={nickname}
            onComplete={handleQuizComplete}
            onBack={() => setStep('landing')}
          />
          {saving && (
            <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
              <div className="text-center">
                <Heart className="h-8 w-8 text-primary animate-pulse mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">저장 중...</p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {step === 'personal' && personalProfile && (
        <motion.div key="personal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <PersonalResultView
            profile={personalProfile}
            onCheckCompatibility={() => setStep('check')}
            onReset={() => {
              setStep('landing');
              setNickname('');
              setPersonalProfile(null);
            }}
          />
        </motion.div>
      )}

      {step === 'check' && (
        <motion.div
          key="check"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen gradient-romantic flex items-center justify-center px-4"
        >
          <div className="max-w-md w-full text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
            >
              <Search className="h-10 w-10 text-primary" />
            </motion.div>

            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              궁합 결과 확인
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              두 사람의 닉네임을 입력하세요
            </p>

            <div className="space-y-3 mb-6">
              <input
                type="text"
                placeholder="첫 번째 사람 닉네임"
                value={nickA}
                onChange={(e) => setNickA(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                type="text"
                placeholder="두 번째 사람 닉네임"
                value={nickB}
                onChange={(e) => setNickB(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-accent/50 px-4 py-3 mb-6 text-left">
              <AlertCircle className="h-4 w-4 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">
                두 사람 모두 테스트를 완료해야 결과를 볼 수 있어요
              </p>
            </div>

            <button
              onClick={handleCheckCompatibility}
              disabled={!nickA.trim() || !nickB.trim() || checking}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-8 py-3.5 text-sm font-semibold transition-all ${
                nickA.trim() && nickB.trim() && !checking
                  ? 'gradient-hero text-primary-foreground shadow-romantic hover:scale-105'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              {checking ? '확인 중...' : '결과 보기'} <Heart className="h-4 w-4" />
            </button>

            <div className="mt-4">
              <button
                onClick={() => setStep('landing')}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← 처음으로
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {step === 'result' && result && (
        <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ResultView
            result={result}
            nameA={resultNames.a}
            nameB={resultNames.b}
            answersA={resultAnswers.a}
            answersB={resultAnswers.b}
            onReset={() => {
              setStep('landing');
              setResult(null);
              setNickA('');
              setNickB('');
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
