// src/components/FaceCapture.tsx
import React, { useRef, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button/button";
import { Card, CardContent } from "@/components/ui/card/card";
import { motion } from 'framer-motion';

interface FaceCaptureProps {
  onCapture: (imageData: string) => void;
  isLoading: boolean;
}

export default function FaceCapture({ onCapture, isLoading }: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let localStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
          setIsCameraReady(true);
          setStream(localStream);
        }
      } catch (error) {
        console.error("Unable to access camera:", error);
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
        
        // Stop the video stream
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
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
          {isLoading && (
            <div className="relative aspect-video flex items-center justify-center">
              <motion.div
                animate={{
                  scale: [1, 2, 2, 1, 1],
                  rotate: [0, 0, 270, 270, 0],
                  borderRadius: ["20%", "20%", "50%", "50%", "20%"],
                }}
                transition={{
                  duration: 2,
                  ease: "easeInOut",
                  times: [0, 0.2, 0.5, 0.8, 1],
                  repeat: Infinity,
                  repeatDelay: 1
                }}
                className="w-32 h-32 bg-blue-500"
              />
              <motion.div
                className="absolute text-white text-xl font-bold"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Processing...
              </motion.div>
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
    </motion.div>
  );
}