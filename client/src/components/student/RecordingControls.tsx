import { Mic, Square, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useRef, useEffect } from "react";

interface RecordingControlsProps {
  enabled: boolean;
  onRecordingComplete: (blob: Blob) => void;
}

export default function RecordingControls({ enabled, onRecordingComplete }: RecordingControlsProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setHasRecording(true);
        onRecordingComplete(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const playRecording = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-6" data-testid="card-recording-controls">
      <div className="flex flex-col items-center gap-6">
        {isRecording ? (
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
              <p className="text-sm font-medium text-foreground">녹음 중...</p>
              <p className="text-2xl font-semibold text-destructive mt-2" data-testid="text-recording-time">
                {formatTime(recordingTime)}
              </p>
            </div>
          </>
        ) : hasRecording ? (
          <>
            <div className="flex gap-4">
              <Button
                size="icon"
                variant="outline"
                className="w-16 h-16 rounded-full"
                onClick={playRecording}
                data-testid="button-play-recording"
              >
                <Play className="w-8 h-8 ml-1" />
              </Button>
              <Button
                size="icon"
                variant="default"
                className="w-16 h-16 rounded-full"
                onClick={startRecording}
                data-testid="button-rerecord"
              >
                <Mic className="w-8 h-8" />
              </Button>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">녹음 완료</p>
              <p className="text-xs text-muted-foreground mt-1">
                재생하거나 다시 녹음할 수 있습니다
              </p>
            </div>
          </>
        ) : (
          <>
            <Button
              size="icon"
              variant="default"
              className="w-16 h-16 rounded-full"
              onClick={startRecording}
              disabled={!enabled}
              data-testid="button-start-recording"
            >
              <Mic className="w-8 h-8" />
            </Button>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {enabled ? "녹음 시작" : "질문을 먼저 들어주세요"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {enabled ? "버튼을 눌러 답변을 녹음하세요" : "2회 청취 후 녹음 가능"}
              </p>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}