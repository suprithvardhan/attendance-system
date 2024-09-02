// src/components/AttendanceForm.tsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast/use-toast';
import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card/card';
import Link from 'next/link';
import FaceCapture from './FaceCapture';
import { getFaceDescriptor } from '@/lib/faceRecognition';

export default function AttendanceForm() {
  const [rollNumber, setRollNumber] = useState('');
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const [attendanceResult, setAttendanceResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCompanyName();
    requestLocationPermission();
  }, []);

  const fetchCompanyName = async () => {
    try {
      const response = await fetch('/api/getActiveSession');
      if (!response.ok) throw new Error('Failed to fetch active session');
      const data = await response.json();
      setCompanyName(data.companyName);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Unable to fetch company name. Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const requestLocationPermission = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => setLocation(position.coords),
        (error) => console.error('Error getting location:', error)
      );
    }
  };

  const handleSubmit = async (imageData: string) => {
    setIsLoading(true);
    try {
      // Simulating a delay for the face detection process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const descriptor = await getFaceDescriptor(imageData);
      if (!descriptor) throw new Error('No face detected. Please try again.');

      // Simulating a delay for the attendance marking process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const response = await fetch('/api/markAttendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rollNumber,
          faceDescriptor: Array.from(descriptor),
          location: location ? `${location.latitude},${location.longitude}` : 'Unknown',
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Attendance marking failed');

      setAttendanceResult({ success: true, message: `Attendance marked successfully for Roll Number: ${rollNumber}` });
    } catch (error) {
      setAttendanceResult({
        success: false,
        message: (error as Error).message || 'An error occurred. Please try again.',
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
      <h2
        className={`text-2xl font-bold mb-4 ${
          attendanceResult?.success ? 'text-green-500' : 'text-red-500'
        }`}
      >
        {attendanceResult?.success ? 'Attendance Marked Successfully!' : 'Attendance Marking Failed'}
      </h2>
      <p className="mb-8 text-center">{attendanceResult?.message}</p>
      <Link href="/markattendance">
        <Button>Go to Home</Button>
      </Link>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 max-w-md"
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
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
                />
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
                  <motion.div
                    className="mt-4 flex flex-col items-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      className="w-16 h-16 border-4 border-green-500 rounded-full"
                      animate={{
                        rotate: 360,
                        borderColor: ['#38a169', '#38b2ac', '#4299e1', '#38a169']
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                    <motion.p
                      className="mt-2 text-green-500 font-semibold"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      Marking Attendance...
                    </motion.p>
                  </motion.div>
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
        <CardFooter>
          {step === 2 && (
            <Button onClick={() => setStep(3)} className="w-full">
              Next
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}