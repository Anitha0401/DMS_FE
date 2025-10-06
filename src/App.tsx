import React from 'react';
import "font-awesome/css/font-awesome.min.css";
import "primereact/resources/themes/bootstrap4-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "bootstrap/dist/css/bootstrap.css";
import "./App.css";
import LandingPage from './pages/LandingPage';

const App: React.FC = () => {
  return (
    <div>
      <LandingPage />
    </div>
  );
}

export default App;