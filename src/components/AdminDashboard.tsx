'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table/table";
import { useToast } from "@/components/ui/use-toast/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog/dialog";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer/drawer";
import { CSVLink } from "react-csv";

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

  const StartAttendanceContent = (
    <>
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
    </>
  );

  const StopAttendanceContent = (
    <>
      <p>Are you sure you want to stop the current attendance session?</p>
      <Button onClick={stopAttendance} disabled={isLoading} variant="destructive" className="mt-4">
        {isLoading ? 'Stopping...' : 'Stop Attendance'}
      </Button>
    </>
  );

  const generateCSVData = () => {
    return [
      ['Roll Number', 'Timestamp', 'Location'],
      ...attendanceList.map(record => [
        record.rollNumber,
        new Date(record.timestamp).toLocaleString(),
        record.location
      ])
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
                      {StartAttendanceContent}
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
                      {StopAttendanceContent}
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
                    {StartAttendanceContent}
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
                    {StopAttendanceContent}
                  </DialogContent>
                </Dialog>
              </>
            )}
            {/* CSV Download Button */}
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceList.map((record, index) => (
                <TableRow key={index}>
                  <TableCell>{record.rollNumber}</TableCell>
                  <TableCell>{new Date(record.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{record.location}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
