export interface VideoValidationResult {
  isValid: boolean;
  error?: string;
  duration?: number;
  size?: number;
}

export async function validateVideoFile(file: File): Promise<VideoValidationResult> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    
    video.onloadedmetadata = () => {
      const duration = video.duration;
      const size = file.size;
      
      // Clean up
      URL.revokeObjectURL(url);
      
      // Validate duration (30 seconds max)
      if (duration > 30) {
        resolve({
          isValid: false,
          error: 'Video must be 30 seconds or less',
          duration,
          size
        });
        return;
      }
      
      // Validate size (50MB max)
      if (size > 50 * 1024 * 1024) {
        resolve({
          isValid: false,
          error: 'Video file must be under 50MB',
          duration,
          size
        });
        return;
      }
      
      // Check format
      if (!file.type.startsWith('video/')) {
        resolve({
          isValid: false,
          error: 'File must be a video',
          duration,
          size
        });
        return;
      }
      
      resolve({
        isValid: true,
        duration,
        size
      });
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        isValid: false,
        error: 'Unable to process video file',
      });
    };
    
    video.src = url;
  });
}

export function formatVideoDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)}MB`;
}