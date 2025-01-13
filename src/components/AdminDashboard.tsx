'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMediaQuery } from '@/hooks/use-media-query';
import { CSVLink } from 'react-csv';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card/card';
import { Button } from './ui/button/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './ui/table/table';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from './ui/drawer/drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog/dialog';
import { useToast } from './ui/use-toast/use-toast';
import { Input } from './ui/input/input';
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import { Toaster } from "@/components/ui/use-toast/toaster";
import dynamic from 'next/dynamic';
import Map, { Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {getDistance} from 'geolib'; 
import { GridLoader } from 'react-spinners';
import { AttendanceRecord as AttendanceRecordType, Session, OutOfCampusAttempt } from '@/types';
import { startAttendance, stopAttendance } from '@/config/api';
import axios from 'axios';
import { Socket } from 'socket.io-client';

interface AttendanceRecord extends AttendanceRecordType {
  // Add any additional properties if needed
}

interface AttendanceSession {
  _id: string;
  companyName: string;
  duration: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  location: { lat: number; lng: number };
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

interface AdminDashboardProps {
  onLogout: () => void;
}

interface AttendanceData {
  session: AttendanceSession | null;
  attendanceList: AttendanceRecord[];
  outOfCampusAttempts: OutOfCampusAttempt[];
}

const getSocket = dynamic(() => import('@/lib/socketClient'), {
  ssr: false
});

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [attendanceDuration, setAttendanceDuration] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isStopOpen, setIsStopOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 640px)");
  const { toast } = useToast();
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [attendanceLocation, setAttendanceLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<any>(null);
  const [outOfCampusAttempts, setOutOfCampusAttempts] = useState<OutOfCampusAttempt[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  const CAMPUS_CENTER = { latitude: 17.4564, longitude: 78.6646 };
  const CAMPUS_RADIUS = 300; // meters

  const isWithinCampus = (lat: number, lng: number) => {
    const distance = getDistance(
      { latitude: lat, longitude: lng },
      CAMPUS_CENTER
    );
    return distance <= CAMPUS_RADIUS;
  };

  const checkSessionExpiry = useCallback(() => {
    if (currentSession && currentSession.isActive) {
      const now = new Date();
      const endTime = currentSession.endTime ? new Date(currentSession.endTime) : null;
      if (endTime && now >= endTime) {
        if (sessionTimeoutRef.current) {
          clearTimeout(sessionTimeoutRef.current);
        }
        sessionTimeoutRef.current = setTimeout(() => {
          setCurrentSession((prevSession) => 
            prevSession ? { ...prevSession, isActive: false } : null
          );
          toast({
            title: "Session Ended",
            description: "The attendance session has ended.",
          });
        }, 1000); // 1 second delay
      }
    }
  }, [currentSession, toast]);

  useEffect(() => {
    let mounted = true;
    let currentSocket: Socket | null = null;

    const initSocket = async () => {
      try {
        const getSocket = (await import('@/lib/socketClient')).default;
        const socketInstance = await getSocket();
        
        if (!mounted) return;
        
        currentSocket = socketInstance;
        setSocket(socketInstance);

        currentSocket.on('attendanceUpdate', (data: AttendanceData) => {
          if (!mounted) return;
          console.log('AdminDashboard: Received attendance update:', data);
          setAttendanceList(data.attendanceList);
          setCurrentSession(data.session);
          setOutOfCampusAttempts(data.outOfCampusAttempts);
        });

        currentSocket.on('initialData', (data: AttendanceData) => {
          if (!mounted) return;
          console.log('AdminDashboard: Received initial data:', data);
          setAttendanceList(data.attendanceList);
          setCurrentSession(data.session);
          setOutOfCampusAttempts(data.outOfCampusAttempts);
        });

        currentSocket.emit('requestInitialData');
      } catch (error) {
        console.error('Socket initialization error:', error);
      }
    };

    initSocket();

    return () => {
      mounted = false;
      if (currentSocket) {
        currentSocket.off('attendanceUpdate');
        currentSocket.off('initialData');
        currentSocket.disconnect();
      }
    };
  }, []);

  const handleStartAttendance = async () => {
    if (!location) {
      toast({
        title: "Error",
        description: "Please select a location first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await startAttendance({
        location,
        companyName,
        duration: Number(duration)
      });

      if (socket) {
        socket.emit('attendanceSessionStarted', response.data);
      }

      setCurrentSession(response.data.session);
      setShowLocationDialog(false);
      toast({
        title: "Success",
        description: "Attendance session started successfully",
      });
    } catch (error) {
      console.error('Error starting attendance:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start attendance session",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopAttendance = async () => {
    try {
      const result = await stopAttendance();
      console.log('Stop attendance result:', result);
      toast({
        title: "Success",
        description: "Attendance session stopped successfully",
      });
      setIsStopOpen(false);
    } catch (error) {
      console.error('Error stopping attendance:', error);
      toast({
        title: "Error",
        description: "Failed to stop attendance session",
        variant: "destructive",
      });
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

  const renderMap = () => (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{
        longitude: 78.6646, // Longitude for Sreenidhi Institute
        latitude: 17.4564, // Latitude for Sreenidhi Institute
        zoom: 14 // Adjusted zoom level to show the surrounding area
      }}
      style={{width: '100%', height: 400}}
      mapStyle="mapbox://styles/mapbox/streets-v11"
      onClick={(e) => setAttendanceLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng })}
    >
      {attendanceLocation && (
        <Marker
          longitude={attendanceLocation.lng}
          latitude={attendanceLocation.lat}
          draggable
          onDragEnd={(e) => setAttendanceLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng })}
        />
      )}
    </Map>
  );

  const renderSessionControls = () => (
    <div className="flex space-x-4 mb-4">
      <Button 
        onClick={() => setIsStartOpen(true)} 
        disabled={currentSession?.isActive || isLoading}
        className="bg-green-500 hover:bg-green-600 text-white"
      >
        Start Attendance
      </Button>
      <Button 
        onClick={() => setIsStopOpen(true)} 
        disabled={!currentSession?.isActive || isLoading}
        className="bg-red-500 hover:bg-red-600 text-white"
      >
        Stop Attendance
      </Button>
      <CSVLink
        data={generateCSVData()}
        filename="attendance.csv"
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
      >
        Download CSV
      </CSVLink>
    </div>
  );

  const renderSessionDialog = () => (
    <>
      <Dialog open={isStartOpen} onOpenChange={setIsStartOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Attendance Session</DialogTitle>
            <DialogDescription>Enter session details and select location</DialogDescription>
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
            <div style={{ height: '400px', width: '100%' }}>
              {renderMap()}
            </div>
            <Button onClick={handleStartAttendance} disabled={isLoading || !attendanceLocation} className="mt-4 h-10 px-4 py-2">
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <GridLoader color="#ffffff" size={8} margin={2} />
                </div>
              ) : (
                'Start Attendance'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isStopOpen} onOpenChange={setIsStopOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stop Attendance Session</DialogTitle>
            <DialogDescription>Confirm to stop the session</DialogDescription>
          </DialogHeader>
          <div className="p-4">
            <p>Are you sure you want to stop the current attendance session?</p>
            <Button onClick={handleStopAttendance} disabled={isLoading} variant="destructive" className="mt-4 h-10 px-4 py-2">
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <GridLoader color="#ffffff" size={8} margin={2} />
                </div>
              ) : (
                'Stop Attendance'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  const renderSessionDrawer = () => (
    <>
      <Drawer open={isStartOpen} onOpenChange={setIsStartOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Start Attendance Session</DrawerTitle>
            <DrawerDescription>Enter session details and select location</DrawerDescription>
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
            <div style={{ height: '400px', width: '100%' }}>
              {renderMap()}
            </div>
            <Button onClick={handleStartAttendance} disabled={isLoading || !attendanceLocation} className="mt-4 h-10 px-4 py-2">
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <GridLoader color="#ffffff" size={8} margin={2} />
                </div>
              ) : (
                'Start Attendance'
              )}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
      <Drawer open={isStopOpen} onOpenChange={setIsStopOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Stop Attendance Session</DrawerTitle>
            <DrawerDescription>Confirm to stop the session</DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            <p>Are you sure you want to stop the current attendance session?</p>
            <Button onClick={handleStopAttendance} disabled={isLoading} variant="destructive" className="mt-4 h-10 px-4 py-2">
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <GridLoader color="#ffffff" size={8} margin={2} />
                </div>
              ) : (
                'Stop Attendance'
              )}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );

  const renderAttendanceTable = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Roll Number</TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...filteredAttendanceList, ...outOfCampusAttempts]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .map((record, index) => {
              const branch = branchCodes[record.rollNumber.substring(6,8)] || 'Unknown';
              const isOutOfCampus = record.location === 'Outside Campus';
              return (
                <TableRow 
                  key={index} 
                  className={isOutOfCampus ? "bg-red-100 dark:bg-red-900" : ""}
                >
                  <TableCell>{record.rollNumber}</TableCell>
                  <TableCell>{new Date(record.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{isOutOfCampus ? 'Outside Campus' : 'Campus'}</TableCell>
                  <TableCell>{branch}</TableCell>
                  <TableCell>{isOutOfCampus ? "Out of Campus" : "Marked"}</TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </div>
  );

  const renderAttendanceAnalysis = () => (
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-4">Attendance Analysis</h3>
      <div className="flex flex-col md:flex-row items-center justify-center gap-8">
        <div className="w-full md:w-1/2 max-w-xs">
          <Pie data={pieChartData} options={pieOptions} />
        </div>
        <div className="w-full md:w-1/2">
          <h4 className="text-sm font-bold mb-2">Branch Legend:</h4>
          <ul className="grid grid-cols-2 gap-2">
            {Object.keys(attendanceDataByBranch).map((branch, index) => (
              <li key={index} className="flex items-center">
                <div
                  className="h-4 w-4 rounded-full mr-2"
                  style={{ backgroundColor: pieChartData.datasets[0].backgroundColor[index] }}
                ></div>
                <span>{branch}: {attendanceDataByBranch[branch]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="text-center mt-4 text-lg font-semibold">
        Total Students: {attendanceList.length}
      </div>
    </div>
  );

  return (
    <>
      <div className="container mx-auto p-4">
        <Card className="w-full bg-card text-card-foreground">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
                <CardDescription>Manage attendance sessions and view records</CardDescription>
              </div>
              <Button onClick={onLogout} variant="outline">
                Logout
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {renderSessionControls()}
              {isMobile ? renderSessionDrawer() : renderSessionDialog()}
              {currentSession && (
                <div className="bg-secondary p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Current Session</h3>
                  <p><strong>Company:</strong> {currentSession.companyName}</p>
                  <p><strong>Start Time:</strong> {new Date(currentSession.startTime).toLocaleString()}</p>
                  <p><strong>End Time:</strong> {currentSession.endTime ? new Date(currentSession.endTime).toLocaleString() : 'N/A'}</p>
                  <p><strong>Status:</strong> <span className={currentSession.isActive ? "text-green-500" : "text-red-500"}>{currentSession.isActive ? 'Active' : 'Ended'}</span></p>
                </div>
              )}
              <Input
                placeholder="Search by Roll Number or Branch"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-4"
              />
              {renderAttendanceTable()}
              {renderAttendanceAnalysis()}
            </div>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </>
  );
}
