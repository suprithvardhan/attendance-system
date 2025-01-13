'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useToast } from '@/components/ui/use-toast/use-toast';
import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card/card';
import dynamic from 'next/dynamic';
import { getFaceDescriptor } from '@/lib/faceRecognition';
import { Loader2 } from 'lucide-react';

const FaceCapture = dynamic(() => import('./FaceCapture'), {
  loading: () => <p>Loading camera...</p>,
  ssr: false
});

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
      <h2 className={`text-2xl font-bold mb-4 ${registrationResult?.success ? 'text-green-500' : 'text-red-500'}`}>
        {registrationResult?.success ? 'Registration Successful!' : 'Registration Failed'}
      </h2>
      <p className="mb-8 text-center">{registrationResult?.message}</p>
      <Button onClick={() => {
        setStep(1);
        setRegistrationResult(null);
        setRollNumber('');
      }}>
        Register Another Student
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
            <CardTitle className="text-2xl">Register</CardTitle>
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
                    className="mb-4"
                  />
                  <Button onClick={() => setStep(3)} className="w-full">
                    Next
                  </Button>
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
        </Card>
      </motion.div>
    </div>
  );
}
