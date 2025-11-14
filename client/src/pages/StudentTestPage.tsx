import { useState } from "react";
import { useLocation } from "wouter";
import TestHeader from "@/components/student/TestHeader";
import QuestionCard from "@/components/student/QuestionCard";
import CompletionScreen from "@/components/student/CompletionScreen";

const TOTAL_QUESTIONS = 15;

export default function StudentTestPage() {
  const [, setLocation] = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [recordings, setRecordings] = useState<Blob[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const handleNext = (recording: Blob) => {
    setRecordings([...recordings, recording]);
    if (currentQuestion < TOTAL_QUESTIONS) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleSubmit = (recording: Blob) => {
    const allRecordings = [...recordings, recording];
    setRecordings(allRecordings);
    console.log('Submitting all recordings:', allRecordings);
    setIsComplete(true);
  };

  if (isComplete) {
    return <CompletionScreen onBackToHome={() => setLocation('/')} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <TestHeader currentQuestion={currentQuestion} totalQuestions={TOTAL_QUESTIONS} />
      <QuestionCard
        questionNumber={currentQuestion}
        totalQuestions={TOTAL_QUESTIONS}
        audioUrl="#"
        onNext={handleNext}
        onSubmit={handleSubmit}
      />
    </div>
  );
}