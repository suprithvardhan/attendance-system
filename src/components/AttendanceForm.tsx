// src/components/AttendanceForm.tsx
'use client';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card/card";
import { useToast } from "@/components/ui/use-toast/use-toast";
import { motion } from 'framer-motion';
import FaceCapture from './FaceCapture';
import { getFaceDescriptor } from '@/lib/faceRecognition';
import Link from 'next/link';

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
        title: "Error",
        description: "Unable to fetch company name. Please try again later.",
        variant: "destructive",
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
      const descriptor = await getFaceDescriptor(imageData);
      if (!descriptor) throw new Error('No face detected. Please try again.');

      const response = await fetch('/api/markAttendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rollNumber,
          faceDescriptor: Array.from(descriptor),
          location: location ? `${location.latitude},${location.longitude}` : 'Unknown'
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Attendance marking failed');

      setAttendanceResult({ success: true, message: `Attendance marked successfully for Roll Number: ${rollNumber}` });
    } catch (error) {
      setAttendanceResult({ success: false, message: (error as Error).message || 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderResult = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center"
    >
      <h2 className={`text-2xl font-bold mb-4 ${attendanceResult?.success ? 'text-green-500' : 'text-red-500'}`}>
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 max-w-md"
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
          <CardDescription>{companyName && `Company: ${companyName}`}</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <Button onClick={() => setStep(2)} className="w-full">
              Mark Attendance
            </Button>
          )}
          {step === 2 && (
            <Input
              placeholder="Roll Number"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
            />
          )}
          {step === 3 && !attendanceResult && (
            <FaceCapture onCapture={handleSubmit} isLoading={isLoading} />
          )}
          {attendanceResult && renderResult()}
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