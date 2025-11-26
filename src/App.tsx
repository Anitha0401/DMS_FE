import React from 'react';
import "font-awesome/css/font-awesome.min.css";
import "primereact/resources/themes/bootstrap4-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "bootstrap/dist/css/bootstrap.css";
import { BrowserRouter, Route, Routes, useSearchParams } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import LandingPage from './pages/LandingPage';
import ManualMainPage from './components/Manuals/MainPage/ManualMainPage';
import Dashboard from './components/Dashboard/Dashboard';
import ManualViewer from './components/Manuals/MainPage/ManualViewer';
import CircularsList from './components/Circulars/CircularsList';
import "./App.css";

const ManualViewerWrapper: React.FC<{ userId: string }> = ({ userId }) => {
  const [searchParams] = useSearchParams();
  const calledMode = searchParams.get('mode') || 'all';
  
  return <ManualViewer userId={userId} calledMode={calledMode} />;
};

const CircularViewerWrapper: React.FC<{ userId: string }> = ({ userId }) => {
  const [searchParams] = useSearchParams();
  const calledMode = searchParams.get('mode') || 'all';
  
  return <CircularsList userId={userId} calledMode={calledMode} />;
};

const App: React.FC = () => {
  return (
    <div>
     <ThemeProvider>
      <BrowserRouter>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/main" element={<ManualMainPage userId={'TestUser13'} />} />
                <Route path="/dashboard" element={<Dashboard userId={'TestUser13'} />} />
                <Route path="/manuals" element={<ManualMainPage userId={'TestUser13'} />} />
                <Route path="/manualView" element={<ManualViewerWrapper userId={'TestUser13'} />} />
                <Route path="/circulars" element={<CircularViewerWrapper userId={'TestUser13'} />} />
              </Routes>
      </BrowserRouter>
    </ThemeProvider>
    </div>
  );
}

export default App;