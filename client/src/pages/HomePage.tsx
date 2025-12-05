import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";
import { useLocation } from "wouter";

export default function HomePage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold text-foreground mb-4">
            첸트룸 타우러스 진단평가 시스템
          </h1>
          <p className="text-lg text-muted-foreground">
            외국어 회화 학습 관리 시스템
          </p>
        </div>

        <Card 
          className="p-8 hover-elevate cursor-pointer transition-all"
          onClick={() => setLocation('/student')}
          data-testid="card-student-mode"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                학생 모드
              </h2>
              <p className="text-sm text-muted-foreground">
                진단평가 응시하기
              </p>
            </div>
            <Button className="w-full" data-testid="button-student-mode">
              시작하기
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}