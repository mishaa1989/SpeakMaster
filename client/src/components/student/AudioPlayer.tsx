import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useRef, useEffect } from "react";

interface AudioPlayerProps {
  audioUrl: string;
  maxListens: number;
  onListenComplete: () => void;
}

export default function AudioPlayer({ audioUrl, maxListens, onListenComplete }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [listensRemaining, setListensRemaining] = useState(maxListens);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (listensRemaining > 0) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setIsPlaying(false);
      const newRemaining = listensRemaining - 1;
      setListensRemaining(newRemaining);
      
      if (newRemaining === 0) {
        onListenComplete();
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [listensRemaining, onListenComplete]);

  return (
    <Card className="p-6" data-testid="card-audio-player">
      <div className="flex flex-col items-center gap-6">
        <Button
          size="icon"
          variant="default"
          className="w-16 h-16 rounded-full"
          onClick={handlePlayPause}
          disabled={listensRemaining === 0 && !isPlaying}
          data-testid="button-play-audio"
        >
          {isPlaying ? (
            <Pause className="w-8 h-8" />
          ) : (
            <Play className="w-8 h-8 ml-1" />
          )}
        </Button>
        
        <audio ref={audioRef} src={audioUrl} />
        
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">질문 듣기</p>
          <p className="text-xs text-muted-foreground mt-1" data-testid="text-listens-remaining">
            남은 청취 횟수: {listensRemaining}/{maxListens}
          </p>
        </div>
      </div>
    </Card>
  );
}