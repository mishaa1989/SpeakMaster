import TestSetCard from '../admin/TestSetCard'

const mockQuestions = [
  { id: '1', filename: 'question_01.mp3', duration: '0:45', url: '#' },
  { id: '2', filename: 'question_02.mp3', duration: '1:12', url: '#' },
  { id: '3', filename: 'question_03.mp3', duration: '0:58', url: '#' },
]

export default function TestSetCardExample() {
  return (
    <TestSetCard
      id="set-1"
      name="진단평가 세트 1"
      createdAt="2025-11-14"
      questions={mockQuestions}
      onDeleteQuestion={(id) => console.log('Delete question:', id)}
      onPlayQuestion={(url) => console.log('Play:', url)}
      onDeleteSet={(id) => console.log('Delete set:', id)}
    />
  )
}