import { Progress } from "@/components/ui/progress";

interface TestHeaderProps {
  currentQuestion: number;
  totalQuestions: number;
}

export default function TestHeader({ currentQuestion, totalQuestions }: TestHeaderProps) {
  const progress = (currentQuestion / totalQuestions) * 100;

  return (
    <div className="sticky top-0 z-50 bg-background border-b border-border p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold text-foreground">
            문제 {currentQuestion}/{totalQuestions}
          </h1>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}% 완료
          </span>
        </div>
        <Progress value={progress} className="h-2" data-testid="progress-test" />
      </div>
    </div>
  );
}