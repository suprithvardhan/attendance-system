'use client';

import { useState } from 'react';
import AdminLogin from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (username: string, password: string) => {
    if (username === 'suprith' && password === 'suprith') {
      setIsLoggedIn(true);
    }
  };

  if (!isLoggedIn) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return <AdminDashboard />;
}