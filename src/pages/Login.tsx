import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Lock, ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      toast.success('로그인 성공!');
      navigate('/admin');
    } catch (e: any) {
      toast.error(e.message || '오류가 발생했어요');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-romantic flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm w-full text-center"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">
          관리자 로그인
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          이메일로 로그인하세요
        </p>

        <div className="space-y-3 mb-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="비밀번호"
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !email.trim() || !password.trim()}
          className="w-full rounded-lg gradient-hero px-6 py-3 text-sm font-semibold text-primary-foreground shadow-romantic hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? '처리 중...' : '로그인'}
        </button>

        <button
          onClick={() => navigate('/')}
          className="mt-3 block mx-auto text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="inline h-3 w-3 mr-1" />
          돌아가기
        </button>
      </motion.div>
    </div>
  );
}
