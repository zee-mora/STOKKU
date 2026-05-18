import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './index.css';
import AppRoutes from './routes';
import { ModalProvider } from './context/ModalContext';

function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ModalProvider>
    </AuthProvider>
  );
}

export default App;