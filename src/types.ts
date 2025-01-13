export interface AttendanceRecord {
    rollNumber: string;
    timestamp: string;
    location: string;
  }
  
  export interface Session {
    _id: string;
    companyName: string;
    startTime: string;
    endTime: string | null;
    isActive: boolean;
    // Add any other properties your Session might have
  }

  export interface OutOfCampusAttempt {
    rollNumber: string;
    timestamp: string;
    location: {
      lat: number;
      lng: number;
    };
  }