import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './providers/ThemeProvider';
import { AuthProvider } from './providers/AuthProvider';
import { ToastProvider } from './providers/ToastProvider';
import { router } from './router';
import PwaUpdatePrompt from './PwaUpdatePrompt';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
          <PwaUpdatePrompt />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
