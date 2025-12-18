
import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import MainPage from './MainPage';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<string>('');

  useEffect(() => {
    // Kiểm tra trạng thái đăng nhập từ localStorage khi app load
    const savedUser = localStorage.getItem('dga_user');
    if (savedUser) {
      setIsAuthenticated(true);
      setCurrentUser(savedUser);
    }
  }, []);

  const handleLogin = (username: string) => {
    setIsAuthenticated(true);
    setCurrentUser(username);
    localStorage.setItem('dga_user', username);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser('');
    localStorage.removeItem('dga_user');
  };

  return (
    <>
      {isAuthenticated ? (
        <MainPage user={currentUser} onLogout={handleLogout} />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </>
  );
};

export default App;
