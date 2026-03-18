import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Users, ArrowLeft, Search, RotateCcw, Trash2 } from 'lucide-react';
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
  score: number;
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

export default function AdminCompatibilityCheck({ onBack }: Props) {
  const [people, setPeople] = useState<QuizPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedA, setSelectedA] = useState('');
  const [selectedB, setSelectedB] = useState('');
  const [result, setResult] = useState<FinalResult | null>(null);
  const [resultNames, setResultNames] = useState<{ a: string; b: string }>({ a: '', b: '' });
  const [resultAnswers, setResultAnswers] = useState<{ a: Answers; b: Answers }>({ a: {}, b: {} });
  const [history, setHistory] = useState<CompatibilityRecord[]>(loadHistory);

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
    setResultNames({ a: personA.nickname, b: personB.nickname });
    setResultAnswers({ a: personA.answers, b: personB.answers });

    // Save to history
    const record: CompatibilityRecord = {
      id: crypto.randomUUID(),
      nameA: personA.nickname,
      nameB: personB.nickname,
      score: finalResult.finalScore,
      grade: finalResult.grade,
      gradeEmoji: finalResult.gradeEmoji,
      timestamp: new Date().toISOString(),
    };
    const updated = [record, ...history];
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
    if (!confirm('모든 궁합 기록을 삭제할까요?')) return;
    setHistory([]);
    saveHistory([]);
    toast.success('기록 전체 삭제 완료');
  };

  if (result) {
    return (
      <ResultView
        result={result}
        nameA={resultNames.a}
        nameB={resultNames.b}
        answersA={resultAnswers.a}
        answersB={resultAnswers.b}
        onReset={() => setResult(null)}
      />
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
        이미 검사를 완료한 두 사람을 선택하면 저장된 답변을 기반으로 궁합 결과를 확인할 수 있어요.
      </p>

      {loading ? (
        <p className="text-center text-muted-foreground text-sm py-8">로딩 중...</p>
      ) : people.length < 2 ? (
        <p className="text-center text-muted-foreground text-sm py-8">
          최소 2명 이상의 검사 결과가 필요해요 (현재 {people.length}명)
        </p>
      ) : (
        <>
          {/* Person Selection */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '첫 번째 사람', value: selectedA, onChange: setSelectedA, color: 'text-primary' },
              { label: '두 번째 사람', value: selectedB, onChange: setSelectedB, color: 'text-accent' },
            ].map((slot, idx) => (
              <div key={idx}>
                <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                  <Users className={`h-3 w-3 ${slot.color}`} /> {slot.label}
                </label>
                <select
                  value={slot.value}
                  onChange={(e) => slot.onChange(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">선택하세요</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nickname}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Calculate Button */}
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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-foreground">
              📋 궁합 확인 기록 ({history.length})
            </h3>
            <button
              onClick={handleClearHistory}
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
                      {record.score}점 · {record.grade} · {new Date(record.timestamp).toLocaleString('ko-KR')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteRecord(record.id)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="기록 삭제"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
