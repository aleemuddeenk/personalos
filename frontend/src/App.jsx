import React, { useState } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import StudyPlanner from './pages/StudyPlanner';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';

export default function App() {
  const [activePage, setActivePage] = useState('home');

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <Home />;
      case 'tasks':
        return <Tasks />;
      case 'study':
        return <StudyPlanner />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Home />;
    }
  };

  return (
    <Layout activePage={activePage} setActivePage={setActivePage}>
      {renderPage()}
    </Layout>
  );
}
