import AudioPlayer from '../student/AudioPlayer'

export default function AudioPlayerExample() {
  return (
    <AudioPlayer 
      audioUrl="#"
      maxListens={2}
      onListenComplete={() => console.log('Listen complete')}
    />
  )
}