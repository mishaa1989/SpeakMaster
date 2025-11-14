import RecordingControls from '../student/RecordingControls'

export default function RecordingControlsExample() {
  return (
    <RecordingControls 
      enabled={true}
      onRecordingComplete={(blob) => console.log('Recording complete:', blob)}
    />
  )
}