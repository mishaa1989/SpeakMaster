import { Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useState } from "react";

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
}

export default function FileUploadZone({ onFilesSelected, maxFiles = 50 }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'audio/mpeg' || file.type === 'audio/mp3'
    );
    
    if (files.length > 0) {
      onFilesSelected(files.slice(0, maxFiles));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      onFilesSelected(files.slice(0, maxFiles));
    }
  };

  return (
    <Card
      className={`border-2 border-dashed min-h-48 flex flex-col items-center justify-center gap-4 transition-colors ${
        isDragging ? 'border-primary bg-primary/5' : 'border-border'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      data-testid="dropzone-upload"
    >
      <Upload className="w-12 h-12 text-muted-foreground" />
      <div className="text-center">
        <p className="text-base font-medium text-foreground">
          MP3 파일을 드래그하거나 클릭하여 업로드
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          최대 {maxFiles}개 파일 (MP3만 가능)
        </p>
      </div>
      <input
        type="file"
        multiple
        accept="audio/mpeg,audio/mp3"
        onChange={handleFileSelect}
        className="hidden"
        id="file-upload"
        data-testid="input-file"
      />
      <label
        htmlFor="file-upload"
        className="px-6 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover-elevate active-elevate-2"
        data-testid="button-select-files"
      >
        파일 선택
      </label>
    </Card>
  );
}