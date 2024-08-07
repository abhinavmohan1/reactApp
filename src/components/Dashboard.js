import React, { useState, useEffect } from 'react';
import { Search, User } from 'lucide-react';
import api from '../services/api';

const Dashboard = ({ onTrainerSelect }) => {
  const [attendanceData, setAttendanceData] = useState({ today: 0, last_7_days: 0, last_30_days: 0 });
  const [yesterdayRoomData, setYesterdayRoomData] = useState({});
  const [trainers, setTrainers] = useState([]);
  const [searchTrainerQuery, setSearchTrainerQuery] = useState('');
  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  const [courseHoldRequests, setCourseHoldRequests] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const yesterdayDate = getYesterdayDate();
        const todayDate = getTodayDate();
        const roomNumbers = ['19', '20', '30', '50', '60'];
        
        console.log('Fetching data for date range:', yesterdayDate, 'to', todayDate);
        
        const attendanceResponse = await api.getAttendanceHistory({ 
          start_date: yesterdayDate, 
          end_date: todayDate
        });

        console.log('Attendance Response:', attendanceResponse);

        processGeneralAttendance(attendanceResponse);
        processYesterdayRoomData(attendanceResponse, roomNumbers);

        const trainersResponse = await api.getTrainers();
        console.log('Trainers Response:', trainersResponse);
        if (trainersResponse && Array.isArray(trainersResponse.trainers)) {
          setTrainers(trainersResponse.trainers);
        } else {
          setTrainers([]);
          setError(prevError => `${prevError ? prevError + '\n' : ''}Invalid trainers data`);
        }

        const courseHoldResponse = await api.getCourseHoldRequests();
        console.log('Course Hold Response:', courseHoldResponse);
        if (courseHoldResponse && Array.isArray(courseHoldResponse.hold_requests)) {
          setCourseHoldRequests(courseHoldResponse.hold_requests);
        } else {
          setCourseHoldRequests([]);
          setError(prevError => `${prevError ? prevError + '\n' : ''}Invalid course hold requests data`);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data');
        setAttendanceData({ today: 0, last_7_days: 0, last_30_days: 0 });
        setYesterdayRoomData({});
        setTrainers([]);
        setCourseHoldRequests([]);
      }
    };

    fetchData();
  }, []);

  const getYesterdayDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDate(yesterday);
  };

  const getTodayDate = () => {
    return formatDate(new Date());
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const processGeneralAttendance = (attendanceResponse) => {
    console.log('Processing General Attendance:', attendanceResponse);
    if (attendanceResponse && typeof attendanceResponse === 'object' && 'total_records' in attendanceResponse) {
      const totalAttendance = attendanceResponse.total_records || 0;
      console.log('Total Attendance:', totalAttendance);
      setAttendanceData(prevData => ({
        ...prevData,
        today: totalAttendance
      }));
    } else {
      console.warn('Invalid general attendance data');
      setAttendanceData(prevData => ({
        ...prevData,
        today: 0
      }));
      setError(prevError => `${prevError ? prevError + '\n' : ''}Invalid general attendance data`);
    }
  };

  const processYesterdayRoomData = (attendanceResponse, roomNumbers) => {
    console.log('Processing Room Attendances:', attendanceResponse, roomNumbers);
    if (attendanceResponse && Array.isArray(attendanceResponse.attendance_records)) {
      const processedData = roomNumbers.reduce((acc, room) => {
        acc[room] = attendanceResponse.attendance_records.filter(record => record.room_number === room).length;
        return acc;
      }, {});
      console.log('Processed Room Data:', processedData);
      setYesterdayRoomData(processedData);
    } else {
      console.warn('Invalid room attendance data');
      setYesterdayRoomData({});
      setError(prevError => `${prevError ? prevError + '\n' : ''}Invalid room attendance data`);
    }
  };

  const handleSearchTrainer = async () => {
    try {
      const response = await api.searchTrainers({ query: searchTrainerQuery });
      console.log('Search Trainers Response:', response);
      if (response && Array.isArray(response.trainers)) {
        setTrainers(response.trainers);
      } else {
        setTrainers([]);
        setError('Invalid search trainers data');
      }
    } catch (error) {
      console.error('Error searching trainers:', error);
      setError('Error searching trainers');
      setTrainers([]);
    }
  };

  const handleSearchStudent = async () => {
    try {
      const response = await api.searchUsers({ query: searchStudentQuery });
      console.log('Search Students Response:', response);
      // Handle student search results
    } catch (error) {
      console.error('Error searching students:', error);
      setError('Error searching students');
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 min-h-screen text-white">
      <header className="flex justify-between items-center p-4">
        <h1 className="text-2xl font-bold">Student Monitoring System</h1>
        <div className="flex items-center">
          <span className="mr-4">{new Date().toLocaleString()}</span>
          <a href="https://nationalinstituteoflanguage.in" target="_blank" rel="noopener noreferrer" className="bg-white text-blue-600 px-4 py-2 rounded-full mr-4">Go to website</a>
          <User className="h-8 w-8" />
          <span className="ml-2">User</span>
        </div>
      </header>

      <main className="p-4">
        {error && (
          <div className="bg-red-500 text-white p-4 mb-4 rounded">
            <p>Error: {error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white text-black rounded-lg p-4 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Welcome! User</h2>
            <div className="flex items-center">
              <div className="mr-4 text-4xl">✓</div>
              <div>
                <h3 className="font-bold">No. of Attendance Marked</h3>
                <p>Yesterday: {attendanceData.today}</p>
                <p>Last 7 days: {attendanceData.last_7_days}</p>
                <p>Last 30 days: {attendanceData.last_30_days}</p>
              </div>
            </div>
          </div>

          <div className="bg-white text-black rounded-lg p-4 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Group Class (yesterday)</h2>
            <div className="grid grid-cols-2 gap-2">
              <p>Room No. 19: Total Attendance: {yesterdayRoomData['19'] || 0}</p>
              <p>Room No. 20: Total Attendance: {yesterdayRoomData['20'] || 0}</p>
              <p>Room No. 30: Total Attendance: {yesterdayRoomData['30'] || 0}</p>
              <p>Room No. 50: Total Attendance: {yesterdayRoomData['50'] || 0}</p>
              <p>Room No. 60: Total Attendance: {yesterdayRoomData['60'] || 0}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between mb-4">
          <div className="relative w-1/3">
            <input
              type="text"
              placeholder="Search Trainer"
              className="w-full p-2 pr-10 rounded-full text-black"
              value={searchTrainerQuery}
              onChange={(e) => setSearchTrainerQuery(e.target.value)}
            />
            <button 
              className="absolute right-0 top-0 mt-2 mr-3 bg-teal-500 text-white px-3 py-1 rounded-full"
              onClick={handleSearchTrainer}
            >
              SEARCH
            </button>
          </div>

          <div className="relative w-1/3">
            <input
              type="text"
              placeholder="Search Student"
              className="w-full p-2 pr-10 rounded-full text-black"
              value={searchStudentQuery}
              onChange={(e) => setSearchStudentQuery(e.target.value)}
            />
            <button 
              className="absolute right-0 top-0 mt-2 mr-3 bg-teal-500 text-white px-3 py-1 rounded-full"
              onClick={handleSearchStudent}
            >
              SEARCH
            </button>
          </div>

          <div className="bg-white text-black rounded-lg p-4 shadow-lg w-1/4">
            <h3 className="font-bold mb-2">New Course Hold Requests</h3>
            <p className="text-4xl font-bold text-center">{courseHoldRequests.length}</p>
            <button className="w-full bg-green-500 text-white py-2 rounded-full mt-2">
              See requests
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 shadow-lg overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left" colSpan="2">Active Trainers, Num: {trainers.length}</th>
                <th>Working Hours</th>
                <th>Approved Hours</th>
                <th>Unutilized Time</th>
              </tr>
            </thead>
            <tbody>
              {trainers.map((trainer) => (
                <tr key={trainer.id}>
                  <td>
                    <button 
                      onClick={() => onTrainerSelect(trainer.id, trainer.room_number)} 
                      className="text-blue-300 hover:underline"
                    >
                      {trainer.room_number}
                    </button>
                  </td>
                  <td>
                    <button 
                      onClick={() => onTrainerSelect(trainer.id, trainer.room_number)} 
                      className="text-blue-300 hover:underline"
                    >
                      {trainer.trainer_name}
                    </button>
                  </td>
                  <td className="text-center">{trainer.scheduled_hours}</td>
                  <td className="text-center">{trainer.approved_hours}</td>
                  <td className="text-center">{trainer.approved_hours - trainer.scheduled_hours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;