import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { Lock, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminLoginPage() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkSetupRequired = async () => {
      try {
        const response = await fetch('/api/admin/setup-required');
        if (response.ok) {
          const data = await response.json();
          if (data.setupRequired) {
            setLocation('/admin/setup');
          }
        }
      } catch (error) {
        console.error('Error checking setup status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkSetupRequired();
  }, [setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        toast({
          title: "로그인 성공",
          description: "관리자 페이지로 이동합니다.",
        });
        setLocation('/admin');
      } else {
        toast({
          title: "로그인 실패",
          description: "비밀번호가 올바르지 않습니다.",
          variant: "destructive",
        });
        setPassword("");
      }
    } catch (error) {
      toast({
        title: "오류",
        description: "로그인 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <p className="text-muted-foreground">확인 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full">
        <div className="mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/')}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>

        <Card className="p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              관리자 로그인
            </h1>
            <p className="text-sm text-muted-foreground">
              관리자 비밀번호를 입력하세요
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                data-testid="input-password"
                className="text-center"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!password.trim() || isLoading}
              data-testid="button-login"
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
