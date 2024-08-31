'use client';
import { useState } from 'react';
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card/card";
import { useToast } from "@/components/ui/use-toast/use-toast";
import { motion } from 'framer-motion';

interface AdminLoginProps {
  onLogin: (username: string, password: string) => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (username === 'suprith' && password === 'suprith') {
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
      onLogin(username, password);
    } else {
      toast({
        title: "Error",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900"
    >
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>Login to access the admin dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="text-center">
          <p className="text-sm text-gray-600">Note: Use the credentials `suprith` for both fields.</p>
        </CardFooter>
      </Card>
    </motion.div>
  );
}