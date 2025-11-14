import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Send } from "lucide-react";
import AudioPlayer from "./AudioPlayer";
import RecordingControls from "./RecordingControls";
import { useState } from "react";

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
  const [listenComplete, setListenComplete] = useState(false);
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Card className="p-8" data-testid="card-question">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-center text-foreground mb-2">
              질문 {questionNumber}
            </h2>
            <p className="text-sm text-center text-muted-foreground">
              질문을 듣고 답변을 녹음해주세요
            </p>
          </div>

          <AudioPlayer
            audioUrl={audioUrl}
            maxListens={2}
            onListenComplete={() => setListenComplete(true)}
          />

          <RecordingControls
            enabled={listenComplete}
            onRecordingComplete={setRecording}
          />

          <Button
            className="w-full px-8 py-6 text-base"
            onClick={handleNext}
            disabled={!recording}
            data-testid={isLastQuestion ? "button-submit" : "button-next"}
          >
            {isLastQuestion ? (
              <>
                <Send className="w-5 h-5 mr-2" />
                제출하기
              </>
            ) : (
              <>
                다음 문제
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}