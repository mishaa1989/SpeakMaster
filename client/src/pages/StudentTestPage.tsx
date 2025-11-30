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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LANGUAGES = ["영어", "중국어", "러시아어", "독일어", "프랑스어"];

export default function StudentTestPage() {
  const [, setLocation] = useLocation();
  const [studentName, setStudentName] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedTestSetId, setSelectedTestSetId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [recordings, setRecordings] = useState<Blob[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();

  // Use public API for student access (no auth required)
  const { data: testSets = [], isLoading: loadingTestSets } = useQuery<{id: string; name: string; language: string; questionCount: number}[]>({
    queryKey: ['/api/public/test-sets'],
  });

  const { data: selectedTestSet } = useQuery<TestSet>({
    queryKey: ['/api/test-sets', selectedTestSetId],
    enabled: !!selectedTestSetId,
  });

  const submitTestMutation = useMutation({
    mutationFn: async (data: { testSetId: string; recordings: Blob[]; studentName: string; language: string }) => {
      console.log('Submitting test with', data.recordings.length, 'recordings');
      
      const formData = new FormData();
      formData.append('testSetId', data.testSetId);
      formData.append('studentName', data.studentName);
      formData.append('language', data.language);
      
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
    
    if (selectedTestSetId) {
      submitTestMutation.mutate({
        testSetId: selectedTestSetId,
        recordings: allRecordings,
        studentName,
        language: selectedLanguage,
      });
    }
  };

  if (isComplete) {
    return <CompletionScreen onBackToHome={() => setLocation('/')} />;
  }

  // Student info input screen
  if (!studentName || !selectedLanguage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-semibold text-foreground mb-2">
              학생 정보 입력
            </h1>
            <p className="text-muted-foreground">
              응시자 정보를 입력해주세요
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student-name">이름</Label>
              <Input
                id="student-name"
                placeholder="홍길동"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                data-testid="input-student-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">응시 언어</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger id="language" data-testid="select-language">
                  <SelectValue placeholder="언어를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation('/')}
                data-testid="button-cancel"
              >
                취소
              </Button>
              <Button
                className="w-full"
                onClick={() => {
                  if (!studentName.trim()) {
                    toast({
                      title: "오류",
                      description: "이름을 입력해주세요.",
                      variant: "destructive",
                    });
                    return;
                  }
                  if (!selectedLanguage) {
                    toast({
                      title: "오류",
                      description: "언어를 선택해주세요.",
                      variant: "destructive",
                    });
                    return;
                  }
                  // Validation passed, will show test selection
                }}
                disabled={!studentName.trim() || !selectedLanguage}
                data-testid="button-continue"
              >
                계속하기
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!selectedTestSetId) {
    // Filter test sets by selected language
    const filteredTestSets = testSets.filter(set => set.language === selectedLanguage);

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-foreground mb-2">
              진단평가 선택
            </h1>
            <p className="text-muted-foreground">
              응시할 진단평가를 선택하세요 ({selectedLanguage})
            </p>
          </div>

          <div className="space-y-4">
            {loadingTestSets ? (
              <div className="text-center py-8 text-muted-foreground">
                로딩 중...
              </div>
            ) : filteredTestSets.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  {selectedLanguage} 언어로 된 응시 가능한 진단평가가 없습니다
                </p>
                <Button onClick={() => {
                  setStudentName("");
                  setSelectedLanguage("");
                }} data-testid="button-back">
                  언어 다시 선택
                </Button>
              </Card>
            ) : (
              <>
                {filteredTestSets.map((set) => (
                  <Card
                    key={set.id}
                    className="p-6 hover-elevate cursor-pointer"
                    onClick={() => {
                      if (set.questionCount > 0) {
                        setSelectedTestSetId(set.id);
                      } else {
                        toast({
                          title: "선택 불가",
                          description: "질문이 없는 테스트입니다.",
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
                          질문 수: {set.questionCount}개
                        </p>
                      </div>
                      {set.questionCount > 0 && (
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