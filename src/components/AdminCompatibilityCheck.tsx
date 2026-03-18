import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, ArrowLeft, Search, RotateCcw, Trash2, Edit3, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { calculateFinal } from '@/lib/scoring';
import type { Answers, FinalResult } from '@/lib/scoring';
import { getGradeInfo, applyScoreOverride } from '@/lib/score-override';
import ResultView from '@/components/ResultView';
import { toast } from 'sonner';

interface Props {
  onBack: () => void;
}

interface QuizPerson {
  id: string;
  nickname: string;
  answers: Answers;
}

interface OverrideRecord {
  id: string;
  nickname_a: string;
  nickname_b: string;
  original_score: number;
  modified_score: number;
  created_at: string;
}


export default function AdminCompatibilityCheck({ onBack }: Props) {
  const [people, setPeople] = useState<QuizPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedA, setSelectedA] = useState('');
  const [selectedB, setSelectedB] = useState('');
  const [result, setResult] = useState<FinalResult | null>(null);
  const [resultNames, setResultNames] = useState<{ a: string; b: string }>({ a: '', b: '' });
  const [resultAnswers, setResultAnswers] = useState<{ a: Answers; b: Answers }>({ a: {}, b: {} });
  const [overrides, setOverrides] = useState<OverrideRecord[]>([]);

  // Score override state
  const [showScoreEdit, setShowScoreEdit] = useState(false);
  const [customScore, setCustomScore] = useState('');
  const [originalScore, setOriginalScore] = useState(0);
  const originalResultRef = useRef<FinalResult | null>(null);

  useEffect(() => {
    fetchPeople();
    fetchOverrides();
  }, []);

  const fetchPeople = async () => {
    const { data, error } = await supabase
      .from('quiz_results')
      .select('id, nickname, answers')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('데이터 로드 실패');
    } else {
      setPeople(
        (data || []).map((d) => ({
          id: d.id,
          nickname: d.nickname,
          answers: d.answers as unknown as Answers,
        }))
      );
    }
    setLoading(false);
  };

  const fetchOverrides = async () => {
    const { data } = await supabase
      .from('compatibility_overrides')
      .select('*')
      .order('created_at', { ascending: false });
    setOverrides((data as unknown as OverrideRecord[]) || []);
  };

  const handleCalculate = () => {
    const personA = people.find((p) => p.id === selectedA);
    const personB = people.find((p) => p.id === selectedB);
    if (!personA || !personB) {
      toast.error('두 사람을 선택해주세요');
      return;
    }
    if (personA.id === personB.id) {
      toast.error('서로 다른 사람을 선택해주세요');
      return;
    }

    const finalResult = calculateFinal(personA.answers, personB.answers);
    setResult(finalResult);
    setOriginalScore(finalResult.finalScore);
    setResultNames({ a: personA.nickname, b: personB.nickname });
    setResultAnswers({ a: personA.answers, b: personB.answers });
    setShowScoreEdit(false);
    setCustomScore('');
  };

  const handleApplyCustomScore = async () => {
    const score = Number(customScore);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error('0~100 사이 점수를 입력해주세요');
      return;
    }
    if (!result) return;

    const nameA = resultNames.a;
    const nameB = resultNames.b;
    // Use sorted names to ensure unique pair
    const sortedA = nameA < nameB ? nameA : nameB;
    const sortedB = nameA < nameB ? nameB : nameA;

    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    // Upsert: delete existing then insert (unique index on sorted pair)
    await supabase
      .from('compatibility_overrides')
      .delete()
      .or(`and(nickname_a.eq.${sortedA},nickname_b.eq.${sortedB}),and(nickname_a.eq.${sortedB},nickname_b.eq.${sortedA})`);

    const { error } = await supabase
      .from('compatibility_overrides')
      .insert({
        nickname_a: sortedA,
        nickname_b: sortedB,
        original_score: originalScore,
        modified_score: score,
        modified_by: userId,
      } as any);

    if (error) {
      toast.error('저장 실패: ' + error.message);
      return;
    }

    setResult(applyScoreOverride(originalResultRef.current!, score));
    setShowScoreEdit(false);
    setCustomScore('');
    fetchOverrides();
    toast.success(`궁합 점수를 ${originalScore}점 → ${score}점으로 변경했어요 (실제 결과에 반영됨)`);
  };

  const handleDeleteOverride = async (record: OverrideRecord) => {
    const { error } = await supabase
      .from('compatibility_overrides')
      .delete()
      .eq('id', record.id);

    if (error) {
      toast.error('삭제 실패');
      return;
    }

    // If current result matches, restore original score
    if (result) {
      const names = [resultNames.a, resultNames.b].sort();
      const recordNames = [record.nickname_a, record.nickname_b].sort();
      if (names[0] === recordNames[0] && names[1] === recordNames[1]) {
        setResult(originalResultRef.current!);
        setOriginalScore(originalResultRef.current!.finalScore);
      }
    }

    fetchOverrides();
    toast.success(`${record.nickname_a} ❤️ ${record.nickname_b} 원래 점수(${record.original_score}점)로 복원 완료`);
  };

  if (result && showScoreEdit) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl bg-card p-6 shadow-soft">
          <h3 className="font-display text-lg font-bold text-foreground mb-2">
            {resultNames.a} ❤️ {resultNames.b} 점수 수정
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            원래 점수: {originalScore}점 → 수정할 점수를 입력하세요 (0~100)
            <br />
            <span className="text-primary">⚠️ 저장하면 실제 사용자 궁합 결과에도 반영됩니다</span>
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={100}
              value={customScore}
              onChange={(e) => setCustomScore(e.target.value)}
              className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-center text-lg font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="점수"
            />
            <span className="text-sm text-muted-foreground">점</span>
            <button
              onClick={handleApplyCustomScore}
              className="flex items-center gap-1 text-sm gradient-hero text-primary-foreground px-4 py-2 rounded-lg hover:scale-105 transition-transform"
            >
              <Save className="h-4 w-4" /> 적용
            </button>
            <button
              onClick={() => setShowScoreEdit(false)}
              className="flex items-center gap-1 text-sm bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/80"
            >
              <X className="h-4 w-4" /> 취소
            </button>
          </div>
          {customScore && !isNaN(Number(customScore)) && Number(customScore) >= 0 && Number(customScore) <= 100 && (
            <p className="mt-3 text-xs text-muted-foreground">
              미리보기: {getGradeInfo(Number(customScore)).gradeEmoji} {getGradeInfo(Number(customScore)).grade}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (result && !showScoreEdit) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl bg-card p-4 shadow-soft">
          <div className="text-sm text-muted-foreground">
            현재 점수: <span className="font-bold text-foreground">{result.finalScore}점</span>
            {result.finalScore !== originalScore && (
              <span className="ml-2 text-xs text-primary">(원본: {originalScore}점)</span>
            )}
          </div>
          <button
            onClick={() => {
              setShowScoreEdit(true);
              setCustomScore(String(result.finalScore));
            }}
            className="flex items-center gap-1 text-xs gradient-hero text-primary-foreground px-3 py-1.5 rounded-lg hover:scale-105 transition-transform"
          >
            <Edit3 className="h-3 w-3" /> 점수 수정
          </button>
        </div>

        <ResultView
          result={result}
          nameA={resultNames.a}
          nameB={resultNames.b}
          answersA={resultAnswers.a}
          answersB={resultAnswers.b}
          onReset={() => setResult(null)}
        />

        {overrides.length > 0 && (
          <OverrideHistory overrides={overrides} onDelete={handleDeleteOverride} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" /> 궁합 확인
        </h2>
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> 뒤로
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        두 사람을 선택하면 궁합 결과를 확인하고, 점수를 수정하면 실제 결과에도 반영돼요.
      </p>

      {loading ? (
        <p className="text-center text-muted-foreground text-sm py-8">로딩 중...</p>
      ) : people.length < 2 ? (
        <p className="text-center text-muted-foreground text-sm py-8">
          최소 2명 이상의 검사 결과가 필요해요 (현재 {people.length}명)
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '첫 번째 사람', value: selectedA, onChange: setSelectedA, color: 'text-primary' },
              { label: '두 번째 사람', value: selectedB, onChange: setSelectedB, color: 'text-accent' },
            ].map((slot, idx) => (
              <div key={idx}>
                <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Users className={`h-3 w-3 ${slot.color}`} /> {slot.label}
                </label>
                <select
                  value={slot.value}
                  onChange={(e) => slot.onChange(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">선택하세요</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>{p.nickname}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <button
            onClick={handleCalculate}
            disabled={!selectedA || !selectedB || selectedA === selectedB}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg gradient-hero px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-romantic hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            <Search className="h-4 w-4" /> 궁합 결과 보기
          </button>
        </>
      )}

      {overrides.length > 0 && (
        <OverrideHistory overrides={overrides} onDelete={handleDeleteOverride} />
      )}
    </div>
  );
}

function OverrideHistory({
  overrides,
  onDelete,
}: {
  overrides: OverrideRecord[];
  onDelete: (record: OverrideRecord) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <h3 className="font-display text-sm font-semibold text-foreground">
        📋 점수 수정 기록 ({overrides.length})
      </h3>
      <div className="space-y-2">
        {overrides.map((record) => {
          const { gradeEmoji } = getGradeInfo(record.modified_score);
          return (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between rounded-lg bg-card p-3 shadow-soft"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{gradeEmoji}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {record.nickname_a} ❤️ {record.nickname_b}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {record.original_score}점 → <span className="text-primary font-semibold">{record.modified_score}점</span> · {new Date(record.created_at).toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onDelete(record)}
                className="flex items-center gap-1 p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                title="원래 점수로 복원 (수정 기록 삭제)"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
