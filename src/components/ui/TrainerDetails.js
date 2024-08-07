import React, { useState, useEffect } from 'react';
import { User, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import DatePicker from './DatePicker';
import { format, parse, isValid } from 'date-fns';

const TrainerDetails = ({ initialTrainerId, onBack }) => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrainerData(initialTrainerId);
  }, [initialTrainerId]);

  const fetchTrainerData = async (trainerId) => {
    try {
      setLoading(true);
      const [usersResponse, coursesResponse, coordinatorsResponse, trainersResponse] = await Promise.all([
        api.getUsers({ trainer_id: trainerId }),
        api.getCourses(),
        api.getCoordinators(),
        api.getTrainers()
      ]);

      // Assuming the user data already includes display_name
      const studentsWithFullNames = usersResponse.users.map(user => ({
        ...user,
        full_name: user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim()
      }));

      setStudents(studentsWithFullNames);
      setCourses(coursesResponse.courses);
      setCoordinators(coordinatorsResponse.coordinators);
      setTrainers(trainersResponse.trainers);
      
      const trainer = trainersResponse.trainers.find(t => t.id === trainerId);
      setSelectedTrainer(trainer);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId, field, value) => {
    try {
      let formattedValue = value;
      if (field.includes('date')) {
        const parsedDate = parse(value, 'd-MMM-yyyy', new Date());
        if (!isValid(parsedDate)) {
          throw new Error('Invalid date format');
        }
        formattedValue = format(parsedDate, 'yyyy-MM-dd');
      } else if (field === 'class_time') {
        formattedValue = convertTo24HourFormat(value);
      }

      await api.updateUser(userId, { [field]: formattedValue });
      setStudents(students.map(student => {
        if (student.id === userId) {
          const updatedStudent = { ...student, [field]: value };
          if (field === 'first_name' || field === 'last_name') {
            updatedStudent.full_name = `${updatedStudent.first_name || ''} ${updatedStudent.last_name || ''}`.trim();
          }
          return updatedStudent;
        }
        return student;
      }));
    } catch (error) {
      console.error('Error updating user:', error);
      setError(`Failed to update user: ${error.message}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
    if (!isValid(parsedDate)) {
      console.error('Invalid date:', dateString);
      return 'Invalid Date';
    }
    return format(parsedDate, 'd-MMM-yyyy');
  };

  const convertTo12HourFormat = (time24) => {
    if (!time24 || !time24.includes(':')) return time24;
    const [hour, minute] = time24.split(':');
    const parsedDate = parse(`${hour}:${minute}`, 'HH:mm', new Date());
    if (!isValid(parsedDate)) {
      console.error('Invalid time:', time24);
      return time24;
    }
    return format(parsedDate, 'h:mm a');
  };

  const convertTo24HourFormat = (time12) => {
    if (!time12) return time12;
    const parsedDate = parse(time12, 'h:mm a', new Date());
    if (!isValid(parsedDate)) {
      console.error('Invalid time:', time12);
      return time12;
    }
    return format(parsedDate, 'HH:mm');
  };

  const handleTrainerChange = (trainerId) => {
    fetchTrainerData(parseInt(trainerId));
  };

  if (loading) return <div className="text-center mt-8">Loading...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">{error}</div>;

  const totalUniqueStudents = new Set(students.map(s => s.id)).size;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 min-h-screen text-white p-8">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-4 text-white hover:text-gray-200">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold">Trainer Details</h1>
        </div>
        <div className="flex items-center">
          <span className="mr-4">{new Date().toLocaleString()}</span>
          <User className="h-8 w-8" />
          <span className="ml-2">User</span>
        </div>
      </header>

      <div className="bg-white text-black rounded-lg p-6 shadow-lg mb-8">
        <Select
          value={selectedTrainer?.id.toString()}
          onValueChange={handleTrainerChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Trainer" />
          </SelectTrigger>
          <SelectContent>
            {trainers.map((trainer) => (
              <SelectItem key={trainer.id} value={trainer.id.toString()}>
                {trainer.trainer_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedTrainer && (
          <div className="mt-4">
            <p>Trainer Name: {selectedTrainer.trainer_name}</p>
            <p>Total Students: {totalUniqueStudents}</p>
            <p>Working Hours: {selectedTrainer.scheduled_hours}</p>
            <p>Room No: {selectedTrainer.room_number}</p>
          </div>
        )}
      </div>

      <div className="bg-white text-black rounded-lg p-6 shadow-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2">Full Name (UserName)</th>
              <th className="p-2">Course</th>
              <th className="p-2">Contact Number</th>
              <th className="p-2">Coordinator Name</th>
              <th className="p-2">Start Date</th>
              <th className="p-2">End Date</th>
              <th className="p-2">Class Duration</th>
              <th className="p-2">Class Time</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="border-b">
                <td className="p-2">
                  {student.full_name} ({student.user_login})
                  {student.on_hold && <span className="ml-2 bg-yellow-200 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded">On Hold</span>}
                  {student.hold_requested && <span className="ml-2 bg-orange-200 text-orange-800 text-xs font-medium px-2 py-0.5 rounded">Hold Requested</span>}
                </td>
                <td className="p-2">
                  <Select
                    value={student.course_id}
                    onValueChange={(value) => handleUpdateUser(student.id, 'course_id', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.course_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-2">
                  <input
                    type="tel"
                    value={student.contact_number}
                    onChange={(e) => handleUpdateUser(student.id, 'contact_number', e.target.value)}
                    className="w-full p-1 border rounded"
                  />
                </td>
                <td className="p-2">
                  <Select
                    value={student.coordinator_id}
                    onValueChange={(value) => handleUpdateUser(student.id, 'coordinator_id', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a coordinator" />
                    </SelectTrigger>
                    <SelectContent>
                      {coordinators.map((coordinator) => (
                        <SelectItem key={coordinator.id} value={coordinator.id}>
                          {coordinator.coordinator_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-2">
                  <DatePicker
                    value={formatDate(student.course_start_date)}
                    onChange={(date) => handleUpdateUser(student.id, 'course_start_date', date)}
                  />
                </td>
                <td className="p-2">
                  <DatePicker
                    value={formatDate(student.course_end_date)}
                    onChange={(date) => handleUpdateUser(student.id, 'course_end_date', date)}
                  />
                </td>
                <td className="p-2">{courses.find(c => c.id === student.course_id)?.class_duration} Minutes</td>
                <td className="p-2">
                  <input
                    type="text"
                    value={convertTo12HourFormat(student.class_time)}
                    onChange={(e) => handleUpdateUser(student.id, 'class_time', e.target.value)}
                    className="w-full p-1 border rounded"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrainerDetails;