import { useEffect, useRef, useState } from 'react';
import { Camera, Square, Play, RotateCcw, Upload, X } from 'lucide-react';

interface VideoRecorderProps {
  onVideoRecorded: (blob: Blob) => void;
  maxDurationSeconds?: number;
  existingVideoUrl?: string | null;
}

export default function VideoRecorder({
  onVideoRecorded,
  maxDurationSeconds = 120,
  existingVideoUrl
}: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState('');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  async function startCamera() {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraReady(true);
      setShowCamera(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access to record your introduction.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please ensure your device has a camera.');
      } else {
        setError('Unable to access camera. Please check your browser settings.');
      }
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);
  }

  function startRecording() {
    if (!streamRef.current) return;

    try {
      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType,
        videoBitsPerSecond: 2500000
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        chunksRef.current = [];
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxDurationSeconds) {
            stopRecording();
            return maxDurationSeconds;
          }
          return newTime;
        });
      }, 1000);
    } catch (err) {
      console.error('Recording error:', err);
      setError('Failed to start recording. Please try again.');
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }

  function handlePreview() {
    if (recordedBlob && videoRef.current) {
      stopCamera();
      videoRef.current.src = URL.createObjectURL(recordedBlob);
      videoRef.current.controls = true;
      setIsPreviewing(true);
    }
  }

  function handleReRecord() {
    setRecordedBlob(null);
    setIsPreviewing(false);
    setRecordingTime(0);
    if (videoRef.current) {
      videoRef.current.src = '';
      videoRef.current.controls = false;
    }
    startCamera();
  }

  function handleSave() {
    if (recordedBlob) {
      onVideoRecorded(recordedBlob);
      handleCancel();
    }
  }

  function handleCancel() {
    setShowCamera(false);
    setRecordedBlob(null);
    setIsPreviewing(false);
    setRecordingTime(0);
    stopCamera();
    if (videoRef.current) {
      videoRef.current.src = '';
      videoRef.current.controls = false;
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  if (!showCamera && !existingVideoUrl) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={startCamera}
          className="w-full px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition flex items-center justify-center space-x-2"
        >
          <Camera className="w-5 h-5" />
          <span>Record Video Introduction</span>
        </button>
        <p className="text-sm text-gray-600 text-center">
          Optional: Record a short video introducing yourself (recommended 1-2 minutes)
        </p>
      </div>
    );
  }

  if (existingVideoUrl && !showCamera) {
    return (
      <div className="space-y-3">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <video
            src={existingVideoUrl}
            controls
            className="w-full"
          />
        </div>
        <button
          type="button"
          onClick={startCamera}
          className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition flex items-center justify-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Record New Video</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={!isPreviewing}
          className="w-full h-full object-cover"
        />

        {isRecording && (
          <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full flex items-center space-x-2 animate-pulse">
            <div className="w-3 h-3 bg-white rounded-full"></div>
            <span className="text-sm font-medium">Recording {formatTime(recordingTime)}</span>
          </div>
        )}

        {isRecording && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full">
              <p className="text-sm text-gray-700">
                Max duration: {formatTime(maxDurationSeconds)}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {!isRecording && !recordedBlob && isCameraReady && (
          <>
            <button
              type="button"
              onClick={startRecording}
              className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition flex items-center justify-center space-x-2"
            >
              <Camera className="w-5 h-5" />
              <span>Start Recording</span>
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
            >
              <X className="w-5 h-5" />
            </button>
          </>
        )}

        {isRecording && (
          <button
            type="button"
            onClick={stopRecording}
            className="flex-1 px-4 py-3 bg-gray-900 hover:bg-black text-white rounded-lg font-medium transition flex items-center justify-center space-x-2"
          >
            <Square className="w-5 h-5" />
            <span>Stop Recording</span>
          </button>
        )}

        {recordedBlob && !isPreviewing && (
          <>
            <button
              type="button"
              onClick={handlePreview}
              className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition flex items-center justify-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={handleReRecord}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </>
        )}

        {isPreviewing && (
          <>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition flex items-center justify-center space-x-2"
            >
              <Upload className="w-5 h-5" />
              <span>Save Video</span>
            </button>
            <button
              type="button"
              onClick={handleReRecord}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Re-record</span>
            </button>
          </>
        )}
      </div>

      {!isRecording && !recordedBlob && (
        <p className="text-sm text-gray-600 text-center">
          Click "Start Recording" when you're ready. Recording will automatically stop at {formatTime(maxDurationSeconds)}.
        </p>
      )}
    </div>
  );
}
