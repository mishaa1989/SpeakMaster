import { useState } from "react";
import { useLocation, useSearch } from "wouter";
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
import { Key, Loader2 } from "lucide-react";

export default function StudentTestPage() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  
  // Parse URL parameters for direct test access
  const urlParams = new URLSearchParams(searchString);
  const urlTestId = urlParams.get('testId');
  const urlLanguage = urlParams.get('language');
  const isDirectAccess = !!urlTestId && !!urlLanguage;
  
  const [accessCode, setAccessCode] = useState("");
  const [accessCodeVerified, setAccessCodeVerified] = useState(isDirectAccess);
  const [verifiedTestInfo, setVerifiedTestInfo] = useState<{id: string; name: string; language: string; questionCount: number} | null>(null);
  const [studentName, setStudentName] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(urlLanguage || "");
  const [selectedTestSetId, setSelectedTestSetId] = useState<string | null>(isDirectAccess ? urlTestId : null);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [recordings, setRecordings] = useState<Blob[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [nameConfirmed, setNameConfirmed] = useState(false);
  const { toast } = useToast();

  // Access code verification mutation
  const verifyAccessCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await fetch('/api/public/verify-access-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode: code }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '승인코드 확인에 실패했습니다');
      }
      
      return data;
    },
    onSuccess: (data) => {
      setAccessCodeVerified(true);
      setVerifiedTestInfo(data.testSet);
      setSelectedTestSetId(data.testSet.id);
      setSelectedLanguage(data.testSet.language);
      toast({
        title: "인증 성공",
        description: `${data.testSet.name} 테스트에 접속합니다.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "인증 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: selectedTestSet } = useQuery<TestSet>({
    queryKey: ['/api/public/test-sets', selectedTestSetId],
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

  // Access code input screen (for non-direct access)
  if (!isDirectAccess && !accessCodeVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Key className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-semibold text-foreground mb-2">
              승인코드 입력
            </h1>
            <p className="text-muted-foreground">
              관리자에게 받은 6자리 승인코드를 입력하세요
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="access-code">승인코드</Label>
              <Input
                id="access-code"
                placeholder="예: ABC123"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase().slice(0, 6))}
                className="text-center text-2xl tracking-widest font-mono"
                maxLength={6}
                data-testid="input-access-code"
              />
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
                  if (accessCode.length !== 6) {
                    toast({
                      title: "오류",
                      description: "6자리 승인코드를 입력해주세요.",
                      variant: "destructive",
                    });
                    return;
                  }
                  verifyAccessCodeMutation.mutate(accessCode);
                }}
                disabled={accessCode.length !== 6 || verifyAccessCodeMutation.isPending}
                data-testid="button-verify"
              >
                {verifyAccessCodeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    확인 중...
                  </>
                ) : (
                  "확인"
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Direct access: just need name confirmation
  if (isDirectAccess && !nameConfirmed) {
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
              <Label>응시 언어</Label>
              <div className="px-3 py-2 border rounded-md bg-muted text-muted-foreground">
                {urlLanguage}
              </div>
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
                  setNameConfirmed(true);
                }}
                disabled={!studentName.trim()}
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

  // Access code verified: just need name confirmation
  if (accessCodeVerified && verifiedTestInfo && !nameConfirmed) {
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
              <Label>응시 테스트</Label>
              <div className="px-3 py-2 border rounded-md bg-muted text-muted-foreground">
                {verifiedTestInfo.name} ({verifiedTestInfo.language})
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setAccessCodeVerified(false);
                  setVerifiedTestInfo(null);
                  setAccessCode("");
                  setSelectedTestSetId(null);
                  setSelectedLanguage("");
                }}
                data-testid="button-back"
              >
                뒤로
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
                  setNameConfirmed(true);
                }}
                disabled={!studentName.trim()}
                data-testid="button-continue"
              >
                테스트 시작
              </Button>
            </div>
          </div>
        </Card>
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