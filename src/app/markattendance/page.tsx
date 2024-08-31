import AttendanceForm from '@/components/AttendanceForm';

export default function MarkAttendance() {
  return (
    <div className="container mx-auto px-4 py-8 bg-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-center text-gray-800">Mark Attendance</h1>
      <AttendanceForm />
    </div>
  );
}