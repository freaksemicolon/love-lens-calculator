import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, ArrowLeft, Search, RotateCcw, Trash2, Edit3, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { calculateFinal } from '@/lib/scoring';
import type { Answers, FinalResult } from '@/lib/scoring';
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

interface CompatibilityRecord {
  id: string;
  nameA: string;
  nameB: string;
  originalScore: number;
  modifiedScore: number;
  grade: string;
  gradeEmoji: string;
  timestamp: string;
}

const STORAGE_KEY = 'admin_compatibility_history';

function loadHistory(): CompatibilityRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(records: CompatibilityRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function getGradeInfo(score: number) {
  if (score >= 90) return { grade: '매우 안정적', gradeEmoji: '💖', description: '오래갈 수 있는 관계예요. 서로를 잘 이해하고 있어요.' };
  if (score >= 80) return { grade: '좋은 관계', gradeEmoji: '💕', description: '서로에게 좋은 영향을 주고 있어요.' };
  if (score >= 70) return { grade: '노력 필요', gradeEmoji: '💛', description: '약간의 노력으로 더 좋아질 수 있어요.' };
  if (score >= 60) return { grade: '피로한 연애', gradeEmoji: '🧡', description: '지치지 않도록 서로 배려가 필요해요.' };
  if (score >= 50) return { grade: '불안정', gradeEmoji: '💔', description: '관계에 불안정한 요소가 많아요.' };
  return { grade: '구조적 어려움', gradeEmoji: '🩹', description: '근본적인 대화와 변화가 필요해요.' };
}

export default function AdminCompatibilityCheck({ onBack }: Props) {
  const [people, setPeople] = useState<QuizPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedA, setSelectedA] = useState('');
  const [selectedB, setSelectedB] = useState('');
  const [result, setResult] = useState<FinalResult | null>(null);
  const [resultNames, setResultNames] = useState<{ a: string; b: string }>({ a: '', b: '' });
  const [resultAnswers, setResultAnswers] = useState<{ a: Answers; b: Answers }>({ a: {}, b: {} });
  const [history, setHistory] = useState<CompatibilityRecord[]>(loadHistory);

  // Score override state
  const [showScoreEdit, setShowScoreEdit] = useState(false);
  const [customScore, setCustomScore] = useState('');
  const [originalScore, setOriginalScore] = useState(0);

  useEffect(() => {
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
    fetchPeople();
  }, []);

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

  const handleApplyCustomScore = () => {
    const score = Number(customScore);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error('0~100 사이 점수를 입력해주세요');
      return;
    }
    if (!result) return;

    const { grade, gradeEmoji, description } = getGradeInfo(score);
    const modifiedResult: FinalResult = {
      ...result,
      finalScore: score,
      grade,
      gradeEmoji,
      description,
    };
    setResult(modifiedResult);

    // Save to history
    const record: CompatibilityRecord = {
      id: crypto.randomUUID(),
      nameA: resultNames.a,
      nameB: resultNames.b,
      originalScore: originalScore,
      modifiedScore: score,
      grade,
      gradeEmoji,
      timestamp: new Date().toISOString(),
    };
    const updated = [record, ...history];
    setHistory(updated);
    saveHistory(updated);

    setShowScoreEdit(false);
    setCustomScore('');
    toast.success(`궁합 점수를 ${originalScore}점 → ${score}점으로 변경했어요`);
  };

  const handleRestoreRecord = (record: CompatibilityRecord) => {
    // If current result matches this record, restore original score
    if (result && resultNames.a === record.nameA && resultNames.b === record.nameB) {
      const { grade, gradeEmoji, description } = getGradeInfo(record.originalScore);
      setResult({
        ...result,
        finalScore: record.originalScore,
        grade,
        gradeEmoji,
        description,
      });
      toast.success(`${record.nameA} ❤️ ${record.nameB} 원래 점수(${record.originalScore}점)로 복원했어요`);
    } else {
      toast.info(`해당 커플을 다시 선택하고 결과를 확인해주세요`);
    }

    // Remove from history
    const updated = history.filter((r) => r.id !== record.id);
    setHistory(updated);
    saveHistory(updated);
  };

  const handleDeleteRecord = (id: string) => {
    const updated = history.filter((r) => r.id !== id);
    setHistory(updated);
    saveHistory(updated);
    toast.success('기록 삭제 완료');
  };

  const handleClearHistory = () => {
    if (!confirm('모든 궁합 수정 기록을 삭제할까요?')) return;
    setHistory([]);
    saveHistory([]);
    toast.success('기록 전체 삭제 완료');
  };

  if (result && !showScoreEdit) {
    return (
      <div className="space-y-4">
        {/* Score override bar */}
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

        {/* History below result */}
        {history.length > 0 && (
          <HistorySection
            history={history}
            onRestore={handleRestoreRecord}
            onDelete={handleDeleteRecord}
            onClearAll={handleClearHistory}
          />
        )}
      </div>
    );
  }

  if (result && showScoreEdit) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl bg-card p-6 shadow-soft">
          <h3 className="font-display text-lg font-bold text-foreground mb-2">
            {resultNames.a} ❤️ {resultNames.b} 점수 수정
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            원래 점수: {originalScore}점 → 수정할 점수를 입력하세요 (0~100)
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
        두 사람을 선택하면 궁합 결과를 확인하고, 점수를 직접 수정할 수 있어요.
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

      {/* History */}
      {history.length > 0 && (
        <HistorySection
          history={history}
          onRestore={handleRestoreRecord}
          onDelete={handleDeleteRecord}
          onClearAll={handleClearHistory}
        />
      )}
    </div>
  );
}

function HistorySection({
  history,
  onRestore,
  onDelete,
  onClearAll,
}: {
  history: CompatibilityRecord[];
  onRestore: (record: CompatibilityRecord) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-foreground">
          📋 점수 수정 기록 ({history.length})
        </h3>
        <button
          onClick={onClearAll}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="h-3 w-3" /> 전체 삭제
        </button>
      </div>

      <div className="space-y-2">
        {history.map((record) => (
          <motion.div
            key={record.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between rounded-lg bg-card p-3 shadow-soft"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{record.gradeEmoji}</span>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {record.nameA} ❤️ {record.nameB}
                </p>
                <p className="text-xs text-muted-foreground">
                  {record.originalScore}점 → <span className="text-primary font-semibold">{record.modifiedScore}점</span> · {record.grade} · {new Date(record.timestamp).toLocaleString('ko-KR')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onRestore(record)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                title="원래 점수로 복원"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onDelete(record.id)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="기록 삭제"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
