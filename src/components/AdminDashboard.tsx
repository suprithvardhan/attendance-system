import React, { useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { CSVLink } from 'react-csv';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card/card';
import { Button } from './ui/button/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './ui/table/table';
import { Drawer, DrawerTrigger, DrawerHeader, DrawerContent, DrawerDescription,DrawerTitle } from './ui/drawer/drawer';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog/dialog';
import { useToast } from './ui/use-toast/use-toast';
import { Input } from './ui/input/input';
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';

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
  const [searchQuery, setSearchQuery] = useState('');
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
        const branch = branchCodes[record.rollNumber.substring(6,8)] || 'Unknown';
        return [
          record.rollNumber,
          new Date(record.timestamp).toLocaleString(),
          record.location,
          branch
        ];
      })
    ];
  };

  const filteredAttendanceList = attendanceList.filter((record) => {
    const branch = branchCodes[record.rollNumber.substring(6, 8)] || 'Unknown';
    return (
      record.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const attendanceDataByBranch = attendanceList.reduce((acc, record) => {
    const branch = branchCodes[record.rollNumber.substring(6, 8)] || 'Unknown';
    acc[branch] = (acc[branch] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const pieChartData = {
    labels: Object.keys(attendanceDataByBranch),
    datasets: [
      {
        label: 'Attendance by Branch',
        data: Object.values(attendanceDataByBranch),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E6E6FA', '#8A2BE2', '#00CED1', '#20B2AA'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E6E6FA', '#8A2BE2', '#00CED1', '#20B2AA'],
      },
    ],
  };

  const pieOptions = {
    plugins: {
      tooltip: {
        callbacks: {
          label: function (tooltipItem: any) {
            const branch = tooltipItem.label;
            const count = tooltipItem.raw;
            return `${branch}: ${count} students`;
          },
        },
      },
    },
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
                    <div className="p-4">
                      <p>Are you sure you want to stop the current attendance session?</p>
                      <Button onClick={stopAttendance} disabled={isLoading} variant="destructive" className="mt-4">
                        {isLoading ? 'Stopping...' : 'Stop Attendance'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              
                  <CSVLink
                    data={generateCSVData()}
                    filename="attendance.csv"
                    className="btn btn-primary ml-4"
                  >
                    Download CSV
                  </CSVLink>
              
                {currentSession && (
                  <div className="mt-4">
                    <h4 className="text-lg font-bold">Session Details:</h4>
                    <p>Company Name: {currentSession.companyName}</p>
                    <p>Duration: {currentSession.duration} minutes</p>
                    <p>Start Time: {new Date(currentSession.startTime).toLocaleString()}</p>
                    <p>End Time: {new Date(currentSession.endTime).toLocaleString()}</p>
                    <p>Status: {currentSession.isActive ? 'Active' : 'Ended'}</p>
                  </div>
                )}
              </>
            )}
            <Input
              placeholder="Search by Roll Number or Branch"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-4"
            />
            <Table className="mb-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Branch</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendanceList.map((record, index) => {
                  const branch = branchCodes[record.rollNumber.substring(6,8)] || 'Unknown';
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
            <div className="mt-8">
              <h3 className="text-lg font-bold mb-4">Attendance Analysis</h3>
              <div className="flex items-center">
                <div className="relative h-48 w-48">
                  <Pie data={pieChartData} options={pieOptions} />
                </div>
                <div className="ml-8">
                  <h4 className="text-sm font-bold mb-2">Branch Legend:</h4>
                  <ul>
                    {Object.keys(attendanceDataByBranch).map((branch, index) => (
                      <li key={index} className="flex items-center mb-1">
                        <div
                          className="h-4 w-4 rounded-full mr-2"
                          style={{ backgroundColor: pieChartData.datasets[0].backgroundColor[index] }}
                        ></div>
                        <span>{branch}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="text-center mt-4">
                Total Students: {attendanceList.length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
