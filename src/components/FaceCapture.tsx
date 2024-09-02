import React, { useRef, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button/button";
import { Card, CardContent } from "@/components/ui/card/card";

interface FaceCaptureProps {
  onCapture: (imageData: string) => void;
  isLoading: boolean;
}

export default function FaceCapture({ onCapture, isLoading }: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  useEffect(() => {
    let localStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const constraints = {
            video: {
              facingMode: isMobileDevice() ? 'user' : 'environment',
              width: { ideal: 640 },
              height: { ideal: 480 }
            }
          };
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          localStream = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = localStream;
            setIsCameraReady(true);
            setStream(localStream);
          }
        } else {
          throw new Error('getUserMedia is not supported in this browser.');
        }
      } catch (error) {
        console.error("Unable to access camera:", error);
        alert("Unable to access the camera. Please check your browser permissions and settings.");
      }
    };

    startCamera();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, 640, 480);
        const imageData = canvasRef.current.toDataURL('image/jpeg');
        onCapture(imageData);
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        {!isLoading && (
          <div className="relative aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        )}
      
        <canvas ref={canvasRef} width="640" height="480" className="hidden" />
        <Button 
          onClick={captureImage} 
          disabled={!isCameraReady || isLoading}
          className="mt-4 w-full"
        >
          {isCameraReady ? (isLoading ? 'Processing...' : 'Capture and Submit') : 'Preparing Camera...'}
        </Button>
      </CardContent>
    </Card>
  );
}
