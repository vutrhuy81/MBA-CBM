
import React, { useState, useEffect } from 'react';
import LoginPage, { UserRole } from './components/LoginPage';
import MainPage from './MainPage';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [currentRole, setCurrentRole] = useState<UserRole>('Guest');

  useEffect(() => {
    const savedUser = localStorage.getItem('dga_user');
    const savedRole = localStorage.getItem('dga_role') as UserRole;
    if (savedUser && savedRole) {
      setIsAuthenticated(true);
      setCurrentUser(savedUser);
      setCurrentRole(savedRole);
    }
  }, []);

  const handleLogin = (username: string, role: UserRole) => {
    setIsAuthenticated(true);
    setCurrentUser(username);
    setCurrentRole(role);
    localStorage.setItem('dga_user', username);
    localStorage.setItem('dga_role', role);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser('');
    setCurrentRole('Guest');
    localStorage.removeItem('dga_user');
    localStorage.removeItem('dga_role');
  };

  return (
    <>
      {isAuthenticated ? (
        <MainPage user={currentUser} role={currentRole} onLogout={handleLogout} />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </>
  );
};

export default App;
