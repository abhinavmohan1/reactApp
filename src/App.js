import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import TrainerDetails from './components/ui/TrainerDetails';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const showTrainerDetails = (trainerId, roomNumber) => {
    setSelectedTrainer(trainerId);
    setSelectedRoom(roomNumber);
    setCurrentView('trainerDetails');
  };

  const showDashboard = () => {
    setCurrentView('dashboard');
  };

  return (
    <div className="App">
      {currentView === 'dashboard' && (
        <Dashboard onTrainerSelect={showTrainerDetails} />
      )}
      {currentView === 'trainerDetails' && (
        <TrainerDetails 
          trainerId={selectedTrainer} 
          roomNumber={selectedRoom} 
          onBack={showDashboard}
        />
      )}
    </div>
  );
}

export default App;