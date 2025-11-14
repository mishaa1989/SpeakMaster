import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import FileUploadZone from "@/components/admin/FileUploadZone";
import TestSetCard from "@/components/admin/TestSetCard";
import emptyStateImage from "@assets/generated_images/Empty_state_educational_illustration_b3f91838.png";
import { useToast } from "@/hooks/use-toast";
import type { TestSet } from "@shared/schema";

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const [showUpload, setShowUpload] = useState(false);
  const { toast } = useToast();

  const { data: testSets = [], isLoading } = useQuery<TestSet[]>({
    queryKey: ['/api/test-sets'],
  });

  const createTestSetMutation = useMutation({
    mutationFn: async (data: { name: string; files: File[] }) => {
      const formData = new FormData();
      formData.append('name', data.name);
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

  const handleFilesSelected = (files: File[]) => {
    const name = `모의고사 세트 ${(testSets?.length || 0) + 1}`;
    createTestSetMutation.mutate({ name, files });
  };

  const handleDeleteQuestion = (testSetId: string, questionId: string) => {
    deleteQuestionMutation.mutate({ testSetId, questionId });
  };

  const handleDeleteSet = (setId: string) => {
    deleteTestSetMutation.mutate(setId);
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