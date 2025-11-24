import React from 'react';
import "font-awesome/css/font-awesome.min.css";
import "primereact/resources/themes/bootstrap4-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "bootstrap/dist/css/bootstrap.css";
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import LandingPage from './pages/LandingPage';
import MainPage from './components/MainPage/MainPage';
import Dashboard from './components/Dashboard/Dashboard';
import "./App.css";


const App: React.FC = () => {
  return (
    <div>
     <ThemeProvider>
      <BrowserRouter>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/main" element={<MainPage userId={'TestUser13'} />} />
                <Route path="/dashboard" element={<Dashboard userId={'TestUser13'} />} />
              </Routes>
      </BrowserRouter>
    </ThemeProvider>
    </div>
  );
}

export default App;