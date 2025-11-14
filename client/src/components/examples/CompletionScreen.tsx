import CompletionScreen from '../student/CompletionScreen'

export default function CompletionScreenExample() {
  return <CompletionScreen onBackToHome={() => console.log('Back to home')} />
}