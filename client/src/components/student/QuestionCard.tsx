import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Send } from "lucide-react";
import AutoRecordingPlayer from "./AutoRecordingPlayer";
import { useState, useEffect } from "react";

interface QuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  audioUrl: string;
  onNext: (recording: Blob) => void;
  onSubmit: (recording: Blob) => void;
}

export default function QuestionCard({
  questionNumber,
  totalQuestions,
  audioUrl,
  onNext,
  onSubmit,
}: QuestionCardProps) {
  const [recording, setRecording] = useState<Blob | null>(null);
  const isLastQuestion = questionNumber === totalQuestions;

  const handleNext = () => {
    if (recording) {
      if (isLastQuestion) {
        onSubmit(recording);
      } else {
        onNext(recording);
      }
    }
  };

  // 녹음 완료되면 자동으로 다음 문제로 이동
  useEffect(() => {
    if (recording && !isLastQuestion) {
      const timer = setTimeout(() => {
        onNext(recording);
      }, 1000); // 1초 대기 후 자동 이동
      
      return () => clearTimeout(timer);
    }
  }, [recording, isLastQuestion, onNext]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Card className="p-8" data-testid="card-question">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-center text-foreground mb-2">
              질문 {questionNumber}
            </h2>
            <p className="text-sm text-center text-muted-foreground">
              질문 듣기를 클릭하면 자동으로 2번 재생 후 녹음이 시작됩니다
            </p>
          </div>

          <AutoRecordingPlayer
            audioUrl={audioUrl}
            onRecordingComplete={setRecording}
          />

          {isLastQuestion && (
            <Button
              className="w-full px-8 py-6 text-base"
              onClick={handleNext}
              disabled={!recording}
              data-testid="button-submit"
            >
              <Send className="w-5 h-5 mr-2" />
              제출하기
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}