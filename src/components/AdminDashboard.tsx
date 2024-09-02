import React, { useState, useEffect } from 'react';
import { useMediaQuery} from '@/hooks/use-media-query';
import { CSVLink } from 'react-csv';
import { motion, AnimatePresence } from 'framer-motion';
import { Card , CardHeader,CardTitle,CardDescription,CardContent } from './ui/card/card';
import { Button } from './ui/button/button';
import { Table,TableHeader,TableRow,TableHead,TableBody,TableCell } from './ui/table/table';
import { DrawerTitle,Drawer,DrawerTrigger,DrawerHeader,DrawerContent,DrawerDescription } from './ui/drawer/drawer';
import { Dialog,DialogTrigger,DialogContent,DialogHeader,DialogTitle,DialogDescription } from './ui/dialog/dialog';
import { useToast } from './ui/use-toast/use-toast';
import { Input } from './ui/input/input';
interface AttendanceRecord {
  rollNumber: string;
  timestamp: string;
  location: string;
}

interface AttendanceSession {
  _id: string;
  companyName: string;
  duration: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface BranchCode {
  [key: string]: string;
}

const branchCodes: BranchCode = {
  '01': 'CE',
  '02': 'EEE',
  '03': 'ME',
  '04': 'ECE',
  '05': 'CSE',
  '12': 'IT',
  '19': 'ECM',
  '62': 'CS',
  '67': 'DS',
  '66': 'AIML',
  '69': 'IOT',
};

export default function AdminDashboard() {
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [currentSession, setCurrentSession] = useState<AttendanceSession | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [attendanceDuration, setAttendanceDuration] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isStopOpen, setIsStopOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 640px)");

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await fetch('/api/getAttendance');
      if (response.ok) {
        const data = await response.json();
        setAttendanceList(data.attendanceList);
        setCurrentSession(data.session);
      } else {
        throw new Error('Failed to fetch attendance');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch attendance data",
        variant: "destructive",
      });
    }
  };

  const startAttendance = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/startAttendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, duration: attendanceDuration }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to start attendance');
      }
      setCurrentSession(data.session);
      toast({
        title: "Success",
        description: "Attendance session started successfully",
      });
      fetchAttendance();
    } catch (error) {
      console.error('Error starting attendance:', error);
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to start attendance session",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsStartOpen(false);
    }
  };

  const stopAttendance = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stopAttendance', { method: 'POST' });
      if (response.ok) {
        setCurrentSession(null);
        toast({
          title: "Success",
          description: "Attendance session stopped successfully",
        });
        fetchAttendance();
      } else {
        throw new Error('Failed to stop attendance');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop attendance session",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsStopOpen(false);
    }
  };

  const generateCSVData = () => {
    return [
      ['Roll Number', 'Timestamp', 'Location', 'Branch'],
      ...attendanceList.map(record => {
        const branch = branchCodes[record.rollNumber.slice(0, 2)] || 'Unknown';
        return [
          record.rollNumber,
          new Date(record.timestamp).toLocaleString(),
          record.location,
          branch
        ];
      })
    ];
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
          <CardDescription>Manage attendance sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isMobile ? (
              <>
                <Drawer open={isStartOpen} onOpenChange={setIsStartOpen}>
                  <DrawerTrigger asChild>
                    <Button disabled={currentSession?.isActive || isLoading}>
                      Start Attendance
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Start Attendance Session</DrawerTitle>
                      <DrawerDescription>Enter session details</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4">
                      <Input
                        placeholder="Company Name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="mb-4"
                      />
                      <Input
                        type="number"
                        placeholder="Attendance Duration (minutes)"
                        value={attendanceDuration}
                        onChange={(e) => setAttendanceDuration(Number(e.target.value))}
                        className="mb-4"
                      />
                      <Button onClick={startAttendance} disabled={isLoading}>
                        {isLoading ? 'Starting...' : 'Start Attendance'}
                      </Button>
                    </div>
                  </DrawerContent>
                </Drawer>
                <Drawer open={isStopOpen} onOpenChange={setIsStopOpen}>
                  <DrawerTrigger asChild>
                    <Button disabled={!currentSession?.isActive || isLoading} variant="destructive">
                      Stop Attendance
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Stop Attendance Session</DrawerTitle>
                      <DrawerDescription>Confirm to stop the session</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4">
                      <p>Are you sure you want to stop the current attendance session?</p>
                      <Button onClick={stopAttendance} disabled={isLoading} variant="destructive" className="mt-4">
                        {isLoading ? 'Stopping...' : 'Stop Attendance'}
                      </Button>
                    </div>
                  </DrawerContent>
                </Drawer>
              </>
            ) : (
              <>
                <Dialog open={isStartOpen} onOpenChange={setIsStartOpen}>
                  <DialogTrigger asChild>
                    <Button disabled={currentSession?.isActive || isLoading}>
                      Start Attendance
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Start Attendance Session</DialogTitle>
                      <DialogDescription>Enter session details</DialogDescription>
                    </DialogHeader>
                    <Input
                      placeholder="Company Name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="mb-4"
                    />
                    <Input
                      type="number"
                      placeholder="Attendance Duration (minutes)"
                      value={attendanceDuration}
                      onChange={(e) => setAttendanceDuration(Number(e.target.value))}
                      className="mb-4"
                    />
                    <Button onClick={startAttendance} disabled={isLoading}>
                      {isLoading ? 'Starting...' : 'Start Attendance'}
                    </Button>
                  </DialogContent>
                </Dialog>
                <Dialog open={isStopOpen} onOpenChange={setIsStopOpen}>
                  <DialogTrigger asChild>
                    <Button disabled={!currentSession?.isActive || isLoading} variant="destructive">
                      Stop Attendance
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Stop Attendance Session</DialogTitle>
                      <DialogDescription>Confirm to stop the session</DialogDescription>
                    </DialogHeader>
                    <p>Are you sure you want to stop the current attendance session?</p>
                    <Button onClick={stopAttendance} disabled={isLoading} variant="destructive" className="mt-4">
                      {isLoading ? 'Stopping...' : 'Stop Attendance'}
                    </Button>
                  </DialogContent>
                </Dialog>
              </>
            )}
            <CSVLink
              data={generateCSVData()}
              filename={`attendance_${new Date().toISOString()}.csv`}
              className="no-underline"
            >
              <Button variant="outline" className="mt-4">
                Download CSV
              </Button>
            </CSVLink>
          </div>
          {currentSession && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Current Session</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Company: {currentSession.companyName}</p>
                <p>Start Time: {new Date(currentSession.startTime).toLocaleString()}</p>
                <p>End Time: {new Date(currentSession.endTime).toLocaleString()}</p>
                <p>Status: {currentSession.isActive ? 'Active' : 'Closed'}</p>
              </CardContent>
            </Card>
          )}
          <Table className="mt-6">
            <TableHeader>
              <TableRow>
                <TableHead>Roll Number</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Branch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceList.map((record, index) => {
                const branch = branchCodes[record.rollNumber.slice(0, 2)] || 'Unknown';
                return (
                  <TableRow key={index}>
                    <TableCell>{record.rollNumber}</TableCell>
                    <TableCell>{new Date(record.timestamp).toLocaleString()}</TableCell>
                    <TableCell>{record.location}</TableCell>
                    <TableCell>{branch}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}