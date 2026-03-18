import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  Trash2,
  Edit3,
  RotateCcw,
  ArrowLeft,
  Save,
  X,
  LogOut,
  ShieldAlert,
  Heart,
} from "lucide-react";
import { questions } from "@/lib/questions";
import AdminCompatibilityCheck from "@/components/AdminCompatibilityCheck";
import type { Answers } from "@/lib/scoring";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";

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
  const [editAnswers, setEditAnswers] = useState<Answers>({} as Answers);

  const [activeTab, setActiveTab] = useState<"results" | "compatibility">(
    "results"
  );

  const checkAdminRole = useCallback(async (userId: string) => {
    const { data, error } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    if (error) {
      console.error("has_role error:", error);
      setIsAdmin(false);
      return false;
    }

    const admin = data === true;
    setIsAdmin(admin);
    return admin;
  }, []);

  const fetchResults = useCallback(async () => {
    setDataLoading(true);

    const { data, error } = await supabase
      .from("quiz_results")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("fetchResults error:", error);
      toast.error("데이터 로드 실패");
      setResults([]);
    } else {
      setResults((data as QuizResult[]) || []);
    }

    setDataLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (!currentUser) {
        setIsAdmin(false);
        setResults([]);
        setLoading(false);
        navigate("/login", { replace: true });
        return;
      }

      const admin = await checkAdminRole(currentUser.id);

      if (admin) {
        await fetchResults();
      } else {
        setResults([]);
      }

      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (!currentUser) {
        setIsAdmin(false);
        setResults([]);
        setLoading(false);
        navigate("/login", { replace: true });
        return;
      }

      const admin = await checkAdminRole(currentUser.id);

      if (admin) {
        await fetchResults();
      } else {
        setResults([]);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [checkAdminRole, fetchResults, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleDelete = async (id: string, nickname: string) => {
    if (!confirm(`"${nickname}" 데이터를 삭제할까요?`)) return;

    const { error } = await supabase.from("quiz_results").delete().eq("id", id);

    if (error) {
      console.error("delete error:", error);
      toast.error("삭제 실패 (권한을 확인하세요)");
    } else {
      toast.success(`${nickname} 삭제 완료`);
      setResults((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleStartEdit = (result: QuizResult) => {
    setEditingId(result.id);
    setEditAnswers({ ...(result.answers as Answers) });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditAnswers({} as Answers);
  };

  const handleSaveEdit = async (result: QuizResult) => {
    const originalAnswers = result.original_answers || result.answers;

    const { error } = await supabase
      .from("quiz_results")
      .update({
        answers: editAnswers as any,
        original_answers: originalAnswers as any,
      })
      .eq("id", result.id);

    if (error) {
      console.error("save edit error:", error);
      toast.error("저장 실패 (권한을 확인하세요)");
    } else {
      toast.success("점수 수정 완료");
      setEditingId(null);
      await fetchResults();
    }
  };

  const handleRestore = async (result: QuizResult) => {
    if (!result.original_answers) {
      toast.info("원본 데이터가 없어요 (수정된 적 없음)");
      return;
    }

    const { error } = await supabase
      .from("quiz_results")
      .update({
        answers: result.original_answers as any,
        original_answers: null,
      })
      .eq("id", result.id);

    if (error) {
      console.error("restore error:", error);
      toast.error("복원 실패");
    } else {
      toast.success("원래 점수로 복원 완료");
      await fetchResults();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">로딩 중...</p>
          <p className="text-sm text-muted-foreground">
            관리자 권한을 확인하고 있어요
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <div>
            <h1 className="text-2xl font-bold">접근 권한 없음</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              관리자 권한이 필요합니다.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              로그인 계정: {user.email}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleLogout}
              className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
            >
              로그아웃
            </button>
            <button
              onClick={() => navigate("/")}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              <h1 className="text-2xl font-bold">관리자 모드</h1>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              총 {results.length}명 · {user.email}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4" />
              돌아가기
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 rounded-lg bg-secondary px-4 py-2 text-sm text-secondary-foreground hover:bg-secondary/80"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("results")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "results"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            데이터 관리
          </button>
          <button
            onClick={() => setActiveTab("compatibility")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "compatibility"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            궁합 시뮬레이션
          </button>
        </div>

        {activeTab === "compatibility" ? (
          <AdminCompatibilityCheck onBack={() => setActiveTab("results")} />
        ) : dataLoading ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
            로딩 중...
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
            아직 데이터가 없어요
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold">{result.nickname}</h2>
                      {result.original_answers && (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                          수정됨
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(result.created_at).toLocaleString("ko-KR")}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {result.original_answers && (
                      <button
                        onClick={() => handleRestore(result)}
                        className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-xs text-secondary-foreground hover:bg-secondary/80"
                        title="원래 점수로 복원"
                      >
                        <RotateCcw className="h-4 w-4" />
                        복원
                      </button>
                    )}

                    {editingId === result.id ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(result)}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground"
                        >
                          <Save className="h-4 w-4" />
                          저장
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-xs text-secondary-foreground"
                        >
                          <X className="h-4 w-4" />
                          취소
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(result)}
                        className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-xs text-secondary-foreground hover:bg-secondary/80"
                      >
                        <Edit3 className="h-4 w-4" />
                        수정
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(result.id, result.nickname)}
                      className="inline-flex items-center gap-1 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive hover:bg-destructive/20"
                    >
                      <Trash2 className="h-4 w-4" />
                      삭제
                    </button>
                  </div>
                </div>

                {editingId === result.id ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {questions.map((q) => (
                      <div
                        key={q.id}
                        className="rounded-xl border border-border p-3 space-y-2"
                      >
                        <div className="text-sm font-medium">Q{q.id}</div>
                        <select
                          value={(editAnswers as any)?.[q.id] ?? 3}
                          onChange={(e) =>
                            setEditAnswers((prev) => ({
                              ...prev,
                              [q.id]: Number(e.target.value),
                            }))
                          }
                          className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
                        >
                          {[1, 2, 3, 4, 5].map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {questions.map((q) => {
                      const val = (result.answers as any)?.[q.id] ?? "-";
                      const orig = result.original_answers
                        ? (result.original_answers as any)?.[q.id]
                        : null;
                      const changed = orig !== null && orig !== val;

                      return (
                        <div
                          key={q.id}
                          className="rounded-xl border border-border p-3"
                        >
                          <div className="text-xs text-muted-foreground">
                            Q{q.id}
                          </div>
                          <div
                            className={`mt-1 text-lg font-bold ${
                              changed ? "text-amber-600" : ""
                            }`}
                          >
                            {val}
                          </div>
                          {changed && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              원본: {orig}
                            </div>
                          )}
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
