// src/components/AttendanceForm.tsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast/use-toast';
import { Toaster } from '@/components/ui/use-toast/toaster';
import { Button } from '@/components/ui/button/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card/card';
import dynamic from 'next/dynamic';
import { getFaceDescriptor } from '@/lib/faceRecognition';
import { Input } from '@/components/ui/input/input';
import { PulseLoader } from 'react-spinners';
import socket from '@/lib/socket';

const FaceCapture = dynamic(() => import('./FaceCapture'), {
  loading: () => <p>Loading camera...</p>,
  ssr: false
});

export default function AttendanceForm() {
  const [rollNumber, setRollNumber] = useState('');
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceResult, setAttendanceResult] = useState<{ success: boolean; message: string } | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [userLocation, setUserLocation] = useState<GeolocationPosition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    console.log('AttendanceForm: Setting up socket listeners');

    const handleConnect = () => {
      console.log('AttendanceForm: Socket connected');
      fetchCompanyName();
    };

    const handleDisconnect = (reason: string) => {
      console.log(`AttendanceForm: Socket disconnected. Reason: ${reason}`);
    };

    const handleAttendanceUpdate = (data: any) => {
      console.log('AttendanceForm: Received attendance update:', data);
      if (data.session) {
        setCompanyName(data.session.companyName || '');
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('attendanceUpdate', handleAttendanceUpdate);

    requestLocationPermission();

    return () => {
      console.log('AttendanceForm: Cleaning up socket listeners');
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('attendanceUpdate', handleAttendanceUpdate);
    };
  }, []);

  const fetchCompanyName = async () => {
    try {
      const response = await fetch('/api/getActiveSession');
      const data = await response.json();
      if (data.companyName) {
        setCompanyName(data.companyName);
      }
    } catch (error) {
      console.error('Error fetching company name:', error);
    }
  };

  const requestLocationPermission = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation(position);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Error",
            description: "Unable to get your location. Please enable location services and try again.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const handleSubmit = async (imageData: string) => {
    setIsLoading(true);
    try {
      if (!userLocation) {
        throw new Error('Unable to get your location. Please enable location services and try again.');
      }

      const descriptor = await getFaceDescriptor(imageData);
      if (!descriptor) {
        throw new Error('No face detected. Please try again.');
      }

      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rollNumber,
          faceDescriptor: Array.from(descriptor),
          location: {
            lat: userLocation.coords.latitude,
            lng: userLocation.coords.longitude,
          },
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setAttendanceResult({ success: true, message: `Attendance marked successfully for Roll Number: ${data.rollNumber}` });
        toast({
          title: "Success",
          description: `Attendance marked for Roll Number: ${data.rollNumber}`,
        });
      } else if (response.status === 403 && data.outOfCampus) {
        setAttendanceResult({ success: false, message: 'You are not within the attendance area. Your attempt has been recorded.' });
        toast({
          title: "Out of Campus",
          description: "You are not within the attendance area. Your attempt has been recorded.",
          variant: "destructive",
        });
      } else {
        throw new Error(data.message || 'Failed to mark attendance. Please try again.');
      }
    } catch (error) {
      setAttendanceResult({
        success: false,
        message: (error as Error).message || 'An error occurred. Please try again.',
      });
      toast({
        title: "Error",
        description: (error as Error).message || 'An error occurred. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderResult = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center"
    >
      <h2 className={`text-2xl font-bold mb-4 ${attendanceResult?.success ? 'text-green-500' : 'text-red-500'}`}>
        {attendanceResult?.success ? 'Attendance Marked!' : 'Attendance Failed'}
      </h2>
      <p className="mb-8 text-center">{attendanceResult?.message}</p>
      <Button onClick={() => {
        setStep(1);
        setAttendanceResult(null);
        setRollNumber('');
      }}>
        Mark Another Attendance
      </Button>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="w-full bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-2xl">Mark Attendance</CardTitle>
            <CardDescription>{companyName && `Company: ${companyName}`}</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Button onClick={() => setStep(2)} className="w-full">
                    Mark Attendance
                  </Button>
                </motion.div>
              )}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Input
                    placeholder="Roll Number"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="mb-4"
                  />
                  <Button onClick={() => setStep(3)} className="w-full">
                    Next
                  </Button>
                </motion.div>
              )}
              {step === 3 && !attendanceResult && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <FaceCapture onCapture={handleSubmit} isLoading={isLoading} />
                  {isLoading && (
                    <div className="mt-4 flex justify-center">
                      <PulseLoader color="#3B82F6" size={10} margin={2} />
                    </div>
                  )}
                </motion.div>
              )}
              {attendanceResult && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderResult()}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
      <Toaster />
    </div>
  );
}