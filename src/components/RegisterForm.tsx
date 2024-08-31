// src/components/RegisterForm.tsx
'use client';
import { useState } from 'react';
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card/card";
import { useToast } from "@/components/ui/use-toast/use-toast";
import { motion } from 'framer-motion';
import FaceCapture from './FaceCapture';
import { getFaceDescriptor } from '@/lib/faceRecognition';
import Link from 'next/link';

export default function RegisterForm() {
  const [rollNumber, setRollNumber] = useState('');
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (imageData: string) => {
    setIsLoading(true);
    try {
      const descriptor = await getFaceDescriptor(imageData);
      if (!descriptor) {
        throw new Error('No face detected. Please try again.');
      }

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber, faceDescriptor: Array.from(descriptor) }),
      });

      const data = await response.json();

      if (response.ok) {
        setRegistrationResult({ success: true, message: `Student with Roll Number ${rollNumber} has been registered successfully.` });
      } else {
        throw new Error(data.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      setRegistrationResult({ success: false, message: (error as Error).message || 'An error occurred during registration. Please try again.' });
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
      <h2 className={`text-2xl font-bold mb-4 ${registrationResult?.success ? 'text-green-500' : 'text-red-500'}`}>
        {registrationResult?.success ? 'Registration Successful!' : 'Registration Failed'}
      </h2>
      <p className="mb-8 text-center">{registrationResult?.message}</p>
      <Link href="/register">
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
          <CardTitle>Register</CardTitle>
          <CardDescription>Register a new student</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <Button onClick={() => setStep(2)} className="w-full">
              Register New Student
            </Button>
          )}
          {step === 2 && (
            <Input
              placeholder="Roll Number"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
            />
          )}
          {step === 3 && !registrationResult && (
            <FaceCapture onCapture={handleSubmit} isLoading={isLoading} />
          )}
          {registrationResult && renderResult()}
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