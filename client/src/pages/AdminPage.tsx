import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import FileUploadZone from "@/components/admin/FileUploadZone";
import TestSetCard from "@/components/admin/TestSetCard";
import emptyStateImage from "@assets/generated_images/Empty_state_educational_illustration_b3f91838.png";

interface TestSet {
  id: string;
  name: string;
  createdAt: string;
  questions: Array<{
    id: string;
    filename: string;
    duration: string;
    url: string;
  }>;
}

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const [testSets, setTestSets] = useState<TestSet[]>([
    {
      id: 'set-1',
      name: '모의고사 세트 1',
      createdAt: '2025-11-14',
      questions: [
        { id: '1', filename: 'question_01.mp3', duration: '0:45', url: '#' },
        { id: '2', filename: 'question_02.mp3', duration: '1:12', url: '#' },
        { id: '3', filename: 'question_03.mp3', duration: '0:58', url: '#' },
      ],
    },
  ]);
  const [showUpload, setShowUpload] = useState(false);

  const handleFilesSelected = (files: File[]) => {
    console.log('Files selected:', files);
    const newQuestions = files.map((file, index) => ({
      id: `q-${Date.now()}-${index}`,
      filename: file.name,
      duration: '0:00',
      url: URL.createObjectURL(file),
    }));

    const newSet: TestSet = {
      id: `set-${Date.now()}`,
      name: `모의고사 세트 ${testSets.length + 1}`,
      createdAt: new Date().toISOString().split('T')[0],
      questions: newQuestions,
    };

    setTestSets([...testSets, newSet]);
    setShowUpload(false);
  };

  const handleDeleteQuestion = (setId: string, questionId: string) => {
    setTestSets(sets =>
      sets.map(set =>
        set.id === setId
          ? { ...set, questions: set.questions.filter(q => q.id !== questionId) }
          : set
      )
    );
  };

  const handleDeleteSet = (setId: string) => {
    setTestSets(sets => sets.filter(set => set.id !== setId));
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
                모의고사 관리
              </h1>
            </div>
            <Button
              onClick={() => setShowUpload(!showUpload)}
              data-testid="button-new-set"
            >
              <Plus className="w-4 h-4 mr-2" />
              새 세트 만들기
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {showUpload && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">새 모의고사 세트 업로드</h2>
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

        {testSets.length === 0 ? (
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
                onPlayQuestion={(url) => console.log('Play:', url)}
                onDeleteSet={handleDeleteSet}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}