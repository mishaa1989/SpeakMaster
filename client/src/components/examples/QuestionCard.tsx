import QuestionCard from '../student/QuestionCard'

export default function QuestionCardExample() {
  return (
    <QuestionCard
      questionNumber={1}
      totalQuestions={15}
      audioUrl="#"
      onNext={(blob) => console.log('Next with recording:', blob)}
      onSubmit={(blob) => console.log('Submit with recording:', blob)}
    />
  )
}