// src/components/RegisterForm.tsx
'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useToast } from '@/components/ui/use-toast/use-toast';
import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card/card';
import Link from 'next/link';
import FaceCapture from './FaceCapture';
import { getFaceDescriptor } from '@/lib/faceRecognition';

export default function RegisterForm() {
  const [rollNumber, setRollNumber] = useState('');
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (imageData: string) => {
    setIsLoading(true);
    try {
      // Simulating a delay for the face detection process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const descriptor = await getFaceDescriptor(imageData);
      if (!descriptor) {
        throw new Error('No face detected. Please try again.');
      }

      // Simulating a delay for the registration process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber, faceDescriptor: Array.from(descriptor) }),
      });

      const data = await response.json();

      if (response.ok) {
        setRegistrationResult({ success: true, message: `Student with Roll Number ${rollNumber} has been registered successfully.` });
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else {
        throw new Error(data.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      setRegistrationResult({
        success: false,
        message: (error as Error).message || 'An error occurred during registration. Please try again.',
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
          registrationResult?.success ? 'text-green-500' : 'text-red-500'
        }`}
      >
        {registrationResult?.success ? 'Registration Successful!' : 'Registration Failed'}
      </h2>
      <p className="mb-8 text-center">{registrationResult?.message}</p>
      <Link href="/register">
        <Button>Register Another Student</Button>
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
          <CardTitle>Register</CardTitle>
          <CardDescription>Register a new student</CardDescription>
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
                  Register New Student
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
            {step === 3 && !registrationResult && (
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
                      className="w-16 h-16 border-4 border-blue-500 rounded-full"
                      animate={{
                        rotate: 360,
                        borderColor: ['#4299e1', '#6b46c1', '#38a169', '#4299e1'],
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                    <motion.p
                      className="mt-2 text-blue-500 font-semibold"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      Processing...
                    </motion.p>
                  </motion.div>
                )}
              </motion.div>
            )}
            {registrationResult && (
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