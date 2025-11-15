import { Play, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useRef, useEffect } from "react";

interface AutoRecordingPlayerProps {
  audioUrl: string;
  onRecordingComplete: (blob: Blob) => void;
}

export default function AutoRecordingPlayer({ audioUrl, onRecordingComplete }: AutoRecordingPlayerProps) {
  const [status, setStatus] = useState<'ready' | 'playing' | 'recording' | 'complete'>('ready');
  const [playCount, setPlayCount] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [canPlayback, setCanPlayback] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();
  const recordedBlobRef = useRef<Blob | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startAutoWorkflow = async () => {
    try {
      setStatus('playing');
      setPlayCount(0);
      setRecordingTime(0);
      chunksRef.current = [];

      // Get microphone access
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = micStream;

      // Create audio context
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      // Load question audio
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Create audio destination for recording
      const destination = audioContext.createMediaStreamDestination();

      // Connect microphone to destination
      const micSource = audioContext.createMediaStreamSource(micStream);
      micSource.connect(destination);

      // Start recording immediately
      const mediaRecorder = new MediaRecorder(destination.stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        recordedBlobRef.current = blob;
        onRecordingComplete(blob);
        setStatus('complete');
        setCanPlayback(true);
        
        // Cleanup
        micStream.getTracks().forEach(track => track.stop());
        if (audioContext.state !== 'closed') {
          audioContext.close();
        }
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };

      mediaRecorder.start();
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);

      // Play question audio twice
      const playAudio = async (count: number) => {
        return new Promise<void>((resolve) => {
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          
          // Connect to both destination (for recording) and audioContext.destination (for playback)
          source.connect(destination);
          source.connect(audioContext.destination);
          
          source.onended = () => {
            setPlayCount(count);
            resolve();
          };
          
          source.start();
        });
      };

      // Play twice
      await playAudio(1);
      await playAudio(2);
      
      // After playing twice, switch to recording-only mode
      setStatus('recording');

    } catch (err) {
      console.error('Error starting workflow:', err);
      console.error('Error details:', err instanceof Error ? err.message : String(err));
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
      setStatus('ready');
      alert('오류가 발생했습니다: ' + (err instanceof Error ? err.message : '알 수 없는 오류'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const playRecording = () => {
    if (recordedBlobRef.current) {
      const url = URL.createObjectURL(recordedBlobRef.current);
      const audio = new Audio(url);
      audio.play();
    }
  };

  const restartRecording = () => {
    setStatus('ready');
    setPlayCount(0);
    setRecordingTime(0);
    setCanPlayback(false);
    recordedBlobRef.current = null;
    chunksRef.current = [];
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Audio Player Section */}
      <Card className="p-6" data-testid="card-audio-player">
        <div className="flex flex-col items-center gap-6">
          <Button
            size="icon"
            variant="default"
            className="w-16 h-16 rounded-full"
            onClick={startAutoWorkflow}
            disabled={status !== 'ready'}
            data-testid="button-play-audio"
          >
            {status === 'playing' ? (
              <Volume2 className="w-8 h-8 animate-pulse" />
            ) : (
              <Play className="w-8 h-8 ml-1" />
            )}
          </Button>
          
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {status === 'ready' && '질문 듣기 (자동 녹음 시작)'}
              {status === 'playing' && '질문 재생 중...'}
              {status === 'recording' && '답변 녹음 중...'}
              {status === 'complete' && '녹음 완료'}
            </p>
            {(status === 'playing' || status === 'recording') && (
              <p className="text-xs text-muted-foreground mt-1" data-testid="text-play-count">
                재생 횟수: {playCount}/2
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Recording Controls Section */}
      <Card className="p-6" data-testid="card-recording-controls">
        <div className="flex flex-col items-center gap-6">
          {status === 'recording' ? (
            <>
              <div className="relative">
                <Button
                  size="icon"
                  variant="destructive"
                  className="w-16 h-16 rounded-full animate-pulse"
                  onClick={stopRecording}
                  data-testid="button-stop-recording"
                >
                  <Square className="w-6 h-6" />
                </Button>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">답변 녹음 중...</p>
                <p className="text-2xl font-semibold text-destructive mt-2" data-testid="text-recording-time">
                  {formatTime(recordingTime)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  답변이 끝나면 중지 버튼을 누르세요
                </p>
              </div>
            </>
          ) : status === 'complete' ? (
            <div className="text-center py-4">
              <p className="text-lg font-medium text-foreground">✓ 녹음 완료</p>
              <p className="text-xs text-muted-foreground mt-2">
                녹음 시간: {formatTime(recordingTime)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                잠시 후 다음 문제로 이동합니다...
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                {status === 'ready' && '"질문 듣기" 버튼을 누르면 자동으로 시작됩니다'}
                {status === 'playing' && '질문을 듣고 있습니다... 잠시만 기다려주세요'}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
