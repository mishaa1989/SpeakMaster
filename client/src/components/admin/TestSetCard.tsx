import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileAudio, ChevronDown, Link2, Key, Copy, RefreshCw, Edit2, Check, X } from "lucide-react";
import QuestionList from "./QuestionList";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Question {
  id: string;
  filename: string;
  duration: string;
  url: string;
}

interface TestSetCardProps {
  id: string;
  name: string;
  createdAt: string;
  language: string;
  accessCode: string;
  questions: Question[];
  onDeleteQuestion: (questionId: string) => void;
  onPlayQuestion: (url: string) => void;
  onDeleteSet: (setId: string) => void;
}

export default function TestSetCard({
  id,
  name,
  createdAt,
  language,
  accessCode,
  questions,
  onDeleteQuestion,
  onPlayQuestion,
  onDeleteSet,
}: TestSetCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [editedCode, setEditedCode] = useState(accessCode);
  const { toast } = useToast();

  const updateCodeMutation = useMutation({
    mutationFn: async (newCode: string) => {
      const response = await apiRequest('PUT', `/api/test-sets/${id}/access-code`, { accessCode: newCode });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/test-sets'] });
      setIsEditingCode(false);
      toast({
        title: "승인코드 변경 완료",
        description: `새 승인코드: ${data.accessCode}`,
      });
    },
    onError: () => {
      toast({
        title: "오류",
        description: "승인코드 변경에 실패했습니다. 6자리 영문/숫자를 입력해주세요.",
        variant: "destructive",
      });
    },
  });

  const regenerateCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/test-sets/${id}/regenerate-code`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/test-sets'] });
      toast({
        title: "승인코드 재생성 완료",
        description: `새 승인코드: ${data.accessCode}`,
      });
    },
    onError: () => {
      toast({
        title: "오류",
        description: "승인코드 재생성에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleRegenerateCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    regenerateCodeMutation.mutate();
  };

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedCode(accessCode);
    setIsEditingCode(true);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingCode(false);
    setEditedCode(accessCode);
  };

  const handleSaveCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editedCode.length === 6) {
      updateCodeMutation.mutate(editedCode);
    } else {
      toast({
        title: "오류",
        description: "승인코드는 6자리여야 합니다.",
        variant: "destructive",
      });
    }
  };

  const copyTestLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const baseUrl = window.location.origin;
    const testLink = `${baseUrl}/student?testId=${id}&language=${encodeURIComponent(language)}`;
    navigator.clipboard.writeText(testLink).then(() => {
      toast({
        title: "링크 복사 완료",
        description: "학생에게 공유할 링크가 복사되었습니다.",
      });
    }).catch(() => {
      toast({
        title: "복사 실패",
        description: "링크 복사에 실패했습니다.",
        variant: "destructive",
      });
    });
  };

  const copyAccessCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(accessCode).then(() => {
      toast({
        title: "승인코드 복사 완료",
        description: `승인코드 ${accessCode}가 복사되었습니다.`,
      });
    }).catch(() => {
      toast({
        title: "복사 실패",
        description: "승인코드 복사에 실패했습니다.",
        variant: "destructive",
      });
    });
  };

  return (
    <Card data-testid={`card-testset-${id}`}>
      <CardHeader 
        className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4 cursor-pointer hover-elevate active-elevate-2"
        onClick={() => setIsOpen(!isOpen)}
        data-testid={`header-testset-${id}`}
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground truncate">{name}</h3>
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {createdAt}
            </div>
            <div className="flex items-center gap-1">
              <FileAudio className="w-3 h-3" />
              {questions.length}/15
            </div>
            <div className="flex items-center gap-2">
              {isEditingCode ? (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Key className="w-3 h-3" />
                  <input
                    type="text"
                    value={editedCode}
                    onChange={(e) => setEditedCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                    className="w-20 px-1 py-0.5 text-xs font-mono font-medium border border-input rounded bg-background"
                    maxLength={6}
                    autoFocus
                    data-testid={`input-edit-access-code-${id}`}
                  />
                  <button
                    onClick={handleSaveCode}
                    disabled={updateCodeMutation.isPending || editedCode.length !== 6}
                    className="text-green-600 hover:text-green-700 disabled:opacity-50"
                    title="저장"
                    data-testid={`button-save-code-${id}`}
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="text-muted-foreground hover:text-foreground"
                    title="취소"
                    data-testid={`button-cancel-edit-${id}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <>
                  <div 
                    className="flex items-center gap-1 cursor-pointer hover:text-foreground"
                    onClick={copyAccessCode}
                    title="클릭하여 승인코드 복사"
                  >
                    <Key className="w-3 h-3" />
                    <span className="font-mono font-medium">{accessCode}</span>
                    <Copy className="w-3 h-3" />
                  </div>
                  <button
                    onClick={handleStartEdit}
                    className="text-muted-foreground hover:text-foreground"
                    title="승인코드 수정"
                    data-testid={`button-edit-code-${id}`}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleRegenerateCode}
                    disabled={regenerateCodeMutation.isPending}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                    title="승인코드 재생성"
                    data-testid={`button-regenerate-code-${id}`}
                  >
                    <RefreshCw className={`w-3 h-3 ${regenerateCodeMutation.isPending ? 'animate-spin' : ''}`} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="icon"
            variant="ghost"
            onClick={copyTestLink}
            title="학생용 링크 복사"
            data-testid={`button-copy-link-${id}`}
          >
            <Link2 className="w-4 h-4" />
          </Button>
          <Badge variant={questions.length === 15 ? "default" : "secondary"}>
            {questions.length === 15 ? "완료" : "진행중"}
          </Badge>
          <ChevronDown 
            className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </CardHeader>
      {isOpen && (
        <>
          <CardContent>
            {questions.length > 0 ? (
              <QuestionList
                questions={questions}
                onDelete={onDeleteQuestion}
                onPlay={onPlayQuestion}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                아직 질문이 없습니다
              </div>
            )}
          </CardContent>
          {questions.length > 0 && (
            <CardFooter>
              <Button
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSet(id);
                }}
                className="w-full"
                data-testid={`button-delete-set-${id}`}
              >
                세트 삭제
              </Button>
            </CardFooter>
          )}
        </>
      )}
    </Card>
  );
}