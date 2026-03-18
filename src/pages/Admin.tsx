import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, Edit3, RotateCcw, ArrowLeft, Save, X, LogOut, ShieldAlert, Heart } from 'lucide-react';
import { questions } from '@/lib/questions';
import AdminCompatibilityCheck from '@/components/AdminCompatibilityCheck';
import type { Answers } from '@/lib/scoring';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';

interface QuizResult {
  id: string;
  nickname: string;
  answers: Answers;
  original_answers: Answers | null;
  created_at: string;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAnswers, setEditAnswers] = useState<Answers>({});

  // Check auth and admin role
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // Check admin role via has_role function
          const { data } = await supabase.rpc('has_role', {
            _user_id: currentUser.id,
            _role: 'admin',
          });
          setIsAdmin(data === true);
        } else {
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data } = await supabase.rpc('has_role', {
          _user_id: currentUser.id,
          _role: 'admin',
        });
        setIsAdmin(data === true);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchResults = async () => {
    setDataLoading(true);
    const { data, error } = await supabase
      .from('quiz_results')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('데이터 로드 실패');
    } else {
      setResults((data as unknown as QuizResult[]) || []);
    }
    setDataLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchResults();
  }, [isAdmin]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleDelete = async (id: string, nickname: string) => {
    if (!confirm(`"${nickname}" 데이터를 삭제할까요?`)) return;
    const { error } = await supabase.from('quiz_results').delete().eq('id', id);
    if (error) {
      toast.error('삭제 실패 (권한을 확인하세요)');
    } else {
      toast.success(`${nickname} 삭제 완료`);
      setResults((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleStartEdit = (result: QuizResult) => {
    setEditingId(result.id);
    setEditAnswers({ ...(result.answers as Answers) });
  };

  const handleSaveEdit = async (result: QuizResult) => {
    const originalAnswers = result.original_answers || result.answers;
    const { error } = await supabase
      .from('quiz_results')
      .update({
        answers: editAnswers as any,
        original_answers: originalAnswers as any,
      })
      .eq('id', result.id);

    if (error) {
      toast.error('저장 실패 (권한을 확인하세요)');
    } else {
      toast.success('점수 수정 완료');
      setEditingId(null);
      fetchResults();
    }
  };

  const handleRestore = async (result: QuizResult) => {
    if (!result.original_answers) {
      toast.info('원본 데이터가 없어요 (수정된 적 없음)');
      return;
    }
    const { error } = await supabase
      .from('quiz_results')
      .update({
        answers: result.original_answers as any,
        original_answers: null,
      })
      .eq('id', result.id);

    if (error) {
      toast.error('복원 실패');
    } else {
      toast.success('원래 점수로 복원 완료');
      fetchResults();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-romantic flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen gradient-romantic flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm w-full text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">접근 권한 없음</h1>
          <p className="text-sm text-muted-foreground mb-4">
            관리자 권한이 필요합니다.
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            로그인 계정: {user.email}
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/80"
            >
              <LogOut className="h-4 w-4" /> 로그아웃
            </button>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-muted-foreground hover:text-foreground px-4 py-2"
            >
              ← 돌아가기
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-romantic">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">🛠️ 관리자 모드</h1>
            <p className="text-sm text-muted-foreground">총 {results.length}명 · {user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" /> 로그아웃
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> 돌아가기
            </button>
          </div>
        </div>

        {dataLoading ? (
          <p className="text-center text-muted-foreground">로딩 중...</p>
        ) : results.length === 0 ? (
          <p className="text-center text-muted-foreground">아직 데이터가 없어요</p>
        ) : (
          <div className="space-y-4">
            {results.map((result) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-card p-5 shadow-soft"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-semibold text-foreground text-lg">{result.nickname}</span>
                    {result.original_answers && (
                      <span className="ml-2 text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                        수정됨
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {result.original_answers && (
                      <button
                        onClick={() => handleRestore(result)}
                        className="flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg hover:bg-secondary/80 transition-colors"
                        title="원래 점수로 복원"
                      >
                        <RotateCcw className="h-3 w-3" /> 복원
                      </button>
                    )}
                    {editingId === result.id ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(result)}
                          className="flex items-center gap-1 text-xs gradient-hero text-primary-foreground px-3 py-1.5 rounded-lg"
                        >
                          <Save className="h-3 w-3" /> 저장
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg"
                        >
                          <X className="h-3 w-3" /> 취소
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(result)}
                        className="flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg hover:bg-secondary/80 transition-colors"
                      >
                        <Edit3 className="h-3 w-3" /> 수정
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(result.id, result.nickname)}
                      className="flex items-center gap-1 text-xs bg-destructive/10 text-destructive px-3 py-1.5 rounded-lg hover:bg-destructive/20 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" /> 삭제
                    </button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mb-3">
                  {new Date(result.created_at).toLocaleString('ko-KR')}
                </p>

                {editingId === result.id ? (
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {questions.map((q) => (
                      <div key={q.id} className="text-center">
                        <label className="text-[10px] text-muted-foreground block">Q{q.id}</label>
                        <select
                          value={editAnswers[q.id] ?? 3}
                          onChange={(e) =>
                            setEditAnswers((prev) => ({ ...prev, [q.id]: Number(e.target.value) }))
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
                ) : (
                  <div className="grid grid-cols-10 gap-1">
                    {questions.map((q) => {
                      const val = (result.answers as any)?.[q.id] ?? '-';
                      const orig = result.original_answers
                        ? (result.original_answers as any)?.[q.id]
                        : null;
                      const changed = orig !== null && orig !== val;
                      return (
                        <div
                          key={q.id}
                          className={`text-center text-xs rounded py-1 ${
                            changed ? 'bg-primary/10 text-primary font-bold' : 'bg-secondary text-secondary-foreground'
                          }`}
                          title={`Q${q.id}${changed ? ` (원본: ${orig})` : ''}`}
                        >
                          {val}
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
