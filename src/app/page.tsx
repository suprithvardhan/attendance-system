// src/app/page.tsx
import { Button } from "@/components/ui/button/button";
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)]"
    >
      <h1 className="text-4xl md:text-6xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
        Welcome to Attendance System
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/markattendance" passHref>
          <Button size="lg" className="w-full">
            Mark Attendance
          </Button>
        </Link>
        <Link href="/register" passHref>
          <Button size="lg" variant="outline" className="w-full">
            Register
          </Button>
        </Link>
        <Link href="/admin" passHref>
          <Button size="lg" variant="secondary" className="w-full">
            Admin
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}