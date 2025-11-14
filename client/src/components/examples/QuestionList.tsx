import QuestionList from '../admin/QuestionList'

const mockQuestions = [
  { id: '1', filename: 'question_01.mp3', duration: '0:45', url: '#' },
  { id: '2', filename: 'question_02.mp3', duration: '1:12', url: '#' },
  { id: '3', filename: 'question_03.mp3', duration: '0:58', url: '#' },
]

export default function QuestionListExample() {
  return (
    <QuestionList 
      questions={mockQuestions}
      onDelete={(id) => console.log('Delete:', id)}
      onPlay={(url) => console.log('Play:', url)}
    />
  )
}