import { useEffect, useMemo, useState } from 'react';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';

const getPath = () => window.location.pathname;

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [path, setPath] = useState(getPath());

  useEffect(() => {
    const onPopState = () => setPath(getPath());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const authApi = useMemo(
    () => ({
      onLogin: (nextToken) => {
        localStorage.setItem('token', nextToken);
        setToken(nextToken);
        window.history.pushState({}, '', '/');
        setPath('/');
      },
      onLogout: () => {
        localStorage.removeItem('token');
        setToken('');
        window.history.pushState({}, '', '/auth');
        setPath('/auth');
      }
    }),
    []
  );

  if (!token || path === '/auth') {
    return <Auth onLogin={authApi.onLogin} />;
  }

  return <Dashboard token={token} onLogout={authApi.onLogout} />;
}

export default App;
