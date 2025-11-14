import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Mail } from "lucide-react";
import completionImage from "@assets/generated_images/Test_completion_success_illustration_2a9bc3e7.png";

interface CompletionScreenProps {
  onBackToHome: () => void;
}

export default function CompletionScreen({ onBackToHome }: CompletionScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full p-8" data-testid="card-completion">
        <div className="flex flex-col items-center text-center space-y-6">
          <img 
            src={completionImage} 
            alt="Success" 
            className="w-48 h-48 object-contain"
          />
          
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-primary">
              <CheckCircle2 className="w-8 h-8" />
              <h1 className="text-2xl font-semibold">제출 완료!</h1>
            </div>
            <p className="text-base text-foreground">
              모든 답변이 성공적으로 제출되었습니다
            </p>
          </div>

          <div className="w-full p-4 bg-muted rounded-md space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-foreground">
              <Mail className="w-4 h-4" />
              이메일 전송 완료
            </div>
            <p className="text-xs text-muted-foreground">
              녹음 파일이 강사 이메일로 전송되었습니다
            </p>
          </div>

          <Button 
            className="w-full px-8 py-6 text-base mt-4"
            onClick={onBackToHome}
            data-testid="button-back-home"
          >
            홈으로 돌아가기
          </Button>
        </div>
      </Card>
    </div>
  );
}