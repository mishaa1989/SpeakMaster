import { Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Question {
  id: string;
  filename: string;
  duration: string;
  url: string;
}

interface QuestionListProps {
  questions: Question[];
  onDelete: (id: string) => void;
  onPlay: (url: string) => void;
}

export default function QuestionList({ questions, onDelete, onPlay }: QuestionListProps) {
  return (
    <div className="space-y-2">
      {questions.map((question, index) => (
        <Card key={question.id} className="p-4 hover-elevate" data-testid={`card-question-${index}`}>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 text-primary font-medium flex-shrink-0">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {question.filename}
              </p>
              <p className="text-xs text-muted-foreground">{question.duration}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onPlay(question.url)}
                data-testid={`button-play-${index}`}
              >
                <Play className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onDelete(question.id)}
                data-testid={`button-delete-${index}`}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}