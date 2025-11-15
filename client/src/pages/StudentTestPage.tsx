import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import TestHeader from "@/components/student/TestHeader";
import QuestionCard from "@/components/student/QuestionCard";
import CompletionScreen from "@/components/student/CompletionScreen";
import { useToast } from "@/hooks/use-toast";
import type { TestSet } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StudentTestPage() {
  const [, setLocation] = useLocation();
  const [selectedTestSetId, setSelectedTestSetId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [recordings, setRecordings] = useState<Blob[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [instructorEmail, setInstructorEmail] = useState("");
  const { toast } = useToast();

  const { data: testSets = [], isLoading: loadingTestSets } = useQuery<TestSet[]>({
    queryKey: ['/api/test-sets'],
  });

  const { data: selectedTestSet } = useQuery<TestSet>({
    queryKey: ['/api/test-sets', selectedTestSetId],
    enabled: !!selectedTestSetId,
  });

  const submitTestMutation = useMutation({
    mutationFn: async (data: { testSetId: string; recordings: Blob[]; email: string }) => {
      console.log('Submitting test with', data.recordings.length, 'recordings');
      
      const formData = new FormData();
      formData.append('testSetId', data.testSetId);
      formData.append('instructorEmail', data.email);
      
      data.recordings.forEach((blob, index) => {
        console.log(`Recording ${index + 1}:`, blob.size, 'bytes, type:', blob.type);
        formData.append('recordings', blob, `recording_${index + 1}.webm`);
      });

      const response = await fetch('/api/submit-test', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Submit failed:', response.status, errorText);
        throw new Error('Failed to submit test');
      }

      return response.json();
    },
    onSuccess: () => {
      setIsComplete(true);
      toast({
        title: "제출 완료!",
        description: "테스트가 성공적으로 제출되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "오류",
        description: "테스트 제출에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleNext = (recording: Blob) => {
    setRecordings([...recordings, recording]);
    if (selectedTestSet && currentQuestion < selectedTestSet.questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleSubmit = async (recording: Blob) => {
    const allRecordings = [...recordings, recording];
    setRecordings(allRecordings);
    
    if (selectedTestSetId && instructorEmail) {
      submitTestMutation.mutate({
        testSetId: selectedTestSetId,
        recordings: allRecordings,
        email: instructorEmail,
      });
    }
  };

  if (isComplete) {
    return <CompletionScreen onBackToHome={() => setLocation('/')} />;
  }

  if (!selectedTestSetId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-foreground mb-2">
              모의고사 선택
            </h1>
            <p className="text-muted-foreground">
              응시할 모의고사를 선택하세요
            </p>
          </div>

          <div className="space-y-4">
            <Card className="p-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                강사 이메일 주소
              </label>
              <input
                type="email"
                value={instructorEmail}
                onChange={(e) => setInstructorEmail(e.target.value)}
                placeholder="instructor@example.com"
                className="w-full px-4 py-2 rounded-md border border-input bg-background text-foreground"
                data-testid="input-instructor-email"
              />
              <p className="text-xs text-muted-foreground mt-2">
                완료 후 녹음 파일이 이 이메일로 전송됩니다
              </p>
            </Card>

            {loadingTestSets ? (
              <div className="text-center py-8 text-muted-foreground">
                로딩 중...
              </div>
            ) : testSets.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  현재 응시 가능한 모의고사가 없습니다
                </p>
                <Button onClick={() => setLocation('/')} data-testid="button-back-home">
                  홈으로 돌아가기
                </Button>
              </Card>
            ) : (
              <>
                {testSets.map((set) => (
                  <Card
                    key={set.id}
                    className="p-6 hover-elevate cursor-pointer"
                    onClick={() => {
                      if (set.questions.length === 15) {
                        if (!instructorEmail) {
                          toast({
                            title: "이메일 필요",
                            description: "강사 이메일을 먼저 입력해주세요.",
                            variant: "destructive",
                          });
                          return;
                        }
                        setSelectedTestSetId(set.id);
                      } else {
                        toast({
                          title: "선택 불가",
                          description: "이 세트는 아직 준비 중입니다.",
                          variant: "destructive",
                        });
                      }
                    }}
                    data-testid={`card-testset-${set.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                          {set.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          질문 수: {set.questions.length}/15
                        </p>
                      </div>
                      {set.questions.length === 15 && (
                        <Button data-testid={`button-select-${set.id}`}>
                          선택하기
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!selectedTestSet) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  const currentQuestionData = selectedTestSet.questions[currentQuestion - 1];

  return (
    <div className="min-h-screen bg-background">
      <TestHeader 
        currentQuestion={currentQuestion} 
        totalQuestions={selectedTestSet.questions.length} 
      />
      <QuestionCard
        questionNumber={currentQuestion}
        totalQuestions={selectedTestSet.questions.length}
        audioUrl={currentQuestionData?.url || "#"}
        onNext={handleNext}
        onSubmit={handleSubmit}
      />
    </div>
  );
}