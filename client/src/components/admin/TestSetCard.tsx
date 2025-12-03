import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileAudio, ChevronDown, Link2, Key, Copy } from "lucide-react";
import QuestionList from "./QuestionList";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

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
            <div 
              className="flex items-center gap-1 cursor-pointer hover:text-foreground"
              onClick={copyAccessCode}
              title="클릭하여 승인코드 복사"
            >
              <Key className="w-3 h-3" />
              <span className="font-mono font-medium">{accessCode}</span>
              <Copy className="w-3 h-3" />
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