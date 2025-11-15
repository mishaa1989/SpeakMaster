import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import FileUploadZone from "@/components/admin/FileUploadZone";
import TestSetCard from "@/components/admin/TestSetCard";
import emptyStateImage from "@assets/generated_images/Empty_state_educational_illustration_b3f91838.png";
import { useToast } from "@/hooks/use-toast";
import type { TestSet, Submission } from "@shared/schema";

const LANGUAGES = ["영어", "중국어", "러시아어", "독일어", "프랑스어"];

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const [showUpload, setShowUpload] = useState(false);
  const [instructorEmail, setInstructorEmail] = useState("mishaa1989@naver.com");
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
  const [testName, setTestName] = useState("");
  const [activeTab, setActiveTab] = useState("test-sets");
  const { toast } = useToast();

  const { data: testSets = [], isLoading } = useQuery<TestSet[]>({
    queryKey: ['/api/test-sets'],
  });

  const { data: submissions = [], isLoading: submissionsLoading } = useQuery<Submission[]>({
    queryKey: ['/api/submissions'],
    enabled: activeTab === 'submissions',
  });

  const createTestSetMutation = useMutation({
    mutationFn: async (data: { name: string; files: File[]; durations: number[]; instructorEmail: string; language: string }) => {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('instructorEmail', data.instructorEmail);
      formData.append('language', data.language);
      formData.append('durations', JSON.stringify(data.durations));
      data.files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/test-sets', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create test set');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/test-sets'] });
      setShowUpload(false);
      toast({
        title: "성공",
        description: "새 모의고사 세트가 생성되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "오류",
        description: "모의고사 세트 생성에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const deleteTestSetMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/test-sets/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Delete failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/test-sets'] });
      toast({
        title: "삭제 완료",
        description: "모의고사 세트가 삭제되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "오류",
        description: "삭제에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async ({ testSetId, questionId }: { testSetId: string; questionId: string }) => {
      const response = await fetch(`/api/test-sets/${testSetId}/questions/${questionId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Delete failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/test-sets'] });
      toast({
        title: "삭제 완료",
        description: "질문이 삭제되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "오류",
        description: "삭제에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        resolve(audio.duration);
      };
      audio.onerror = () => {
        reject(new Error('Failed to load audio'));
      };
      audio.src = URL.createObjectURL(file);
    });
  };

  const handleFilesSelected = async (files: File[]) => {
    if (!instructorEmail) {
      toast({
        title: "오류",
        description: "강사 이메일을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!testName.trim()) {
      toast({
        title: "오류",
        description: "테스트 이름을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    const name = `${selectedLanguage} - ${testName}`;
    
    try {
      // Get duration for each file
      const durations = await Promise.all(
        files.map(file => getAudioDuration(file))
      );
      
      createTestSetMutation.mutate({ name, files, durations, instructorEmail, language: selectedLanguage });
      
      // Reset form
      setTestName("");
      setSelectedLanguage(LANGUAGES[0]);
    } catch (error) {
      toast({
        title: "오류",
        description: "오디오 파일 정보를 읽을 수 없습니다.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteQuestion = (testSetId: string, questionId: string) => {
    deleteQuestionMutation.mutate({ testSetId, questionId });
  };

  const handleDeleteSet = (setId: string) => {
    deleteTestSetMutation.mutate(setId);
  };

  const handlePlayAudio = (url: string) => {
    const audio = new Audio(url);
    audio.play().catch(err => {
      console.error('Audio playback failed:', err);
      toast({
        title: "재생 실패",
        description: "오디오 파일을 재생할 수 없습니다.",
        variant: "destructive",
      });
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border sticky top-0 bg-background z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/')}
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-semibold text-foreground">
                관리자 페이지
              </h1>
            </div>
            {activeTab === 'test-sets' && (
              <Button
                onClick={() => setShowUpload(!showUpload)}
                data-testid="button-new-set"
              >
                <Plus className="w-4 h-4 mr-2" />
                새 세트 만들기
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6" data-testid="tabs-list">
            <TabsTrigger value="test-sets" data-testid="tab-test-sets">
              모의고사 관리
            </TabsTrigger>
            <TabsTrigger value="submissions" data-testid="tab-submissions">
              제출 내역
            </TabsTrigger>
          </TabsList>

          <TabsContent value="test-sets">
            {showUpload && (
              <div className="mb-8 space-y-4">
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
                    학생이 제출하면 녹음 파일이 이 이메일로 전송됩니다
                  </p>
                </Card>
                
                <Card className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      언어 선택
                    </label>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="w-full px-4 py-2 rounded-md border border-input bg-background text-foreground"
                      data-testid="select-language"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      테스트 이름
                    </label>
                    <input
                      type="text"
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      placeholder="예: 진단 평가 1"
                      className="w-full px-4 py-2 rounded-md border border-input bg-background text-foreground"
                      data-testid="input-test-name"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      최종 이름: {selectedLanguage} - {testName || "(이름 입력)"}
                    </p>
                  </div>
                </Card>
                
                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-semibold">MP3 파일 업로드</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      15개의 MP3 파일을 업로드하세요
                    </p>
                  </CardHeader>
                  <CardContent>
                    <FileUploadZone onFilesSelected={handleFilesSelected} />
                  </CardContent>
                </Card>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="text-muted-foreground">로딩 중...</div>
              </div>
            ) : testSets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <img 
                  src={emptyStateImage} 
                  alt="Empty state" 
                  className="w-64 h-64 object-contain mb-6"
                />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  아직 세트가 없습니다
                </h3>
                <p className="text-muted-foreground mb-6">
                  새 세트 만들기 버튼을 눌러 시작하세요
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {testSets.map(set => (
                  <TestSetCard
                    key={set.id}
                    {...set}
                    onDeleteQuestion={(qId) => handleDeleteQuestion(set.id, qId)}
                    onPlayQuestion={handlePlayAudio}
                    onDeleteSet={handleDeleteSet}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="submissions">
            {submissionsLoading ? (
              <div className="flex justify-center py-16">
                <div className="text-muted-foreground">로딩 중...</div>
              </div>
            ) : submissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  아직 제출 내역이 없습니다
                </h3>
                <p className="text-muted-foreground">
                  학생이 응시를 완료하면 여기에 표시됩니다
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {submissions.map(submission => (
                  <Card key={submission.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1" data-testid={`text-student-name-${submission.id}`}>
                          {submission.studentName}
                        </h3>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p data-testid={`text-test-name-${submission.id}`}>
                            테스트: {submission.testSetName}
                          </p>
                          <p data-testid={`text-language-${submission.id}`}>
                            언어: {submission.language}
                          </p>
                          <p data-testid={`text-recording-count-${submission.id}`}>
                            녹음 파일: {submission.recordingCount}개
                          </p>
                          <p data-testid={`text-submitted-at-${submission.id}`}>
                            제출 시간: {new Date(submission.submittedAt).toLocaleString('ko-KR')}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          window.location.href = `/api/submissions/${submission.id}/download`;
                        }}
                        data-testid={`button-download-${submission.id}`}
                      >
                        다운로드
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}