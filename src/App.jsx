import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import ContactsPage from './pages/ContactsPage';
import ContactAddPage from './pages/ContactAddPage';
import ContactDetailsPage from './pages/ContactDetailsPage';
import ContactEditPage from './pages/ContactEditPage';
import FavoritesPage from './pages/FavoritesPage';
import GroupsPage from './pages/GroupsPage';
import RemindersPage from './pages/RemindersPage';
import ActivityPage from './pages/ActivityPage';
import PeoplePage from './pages/PeoplePage';
import InteractionsPage from './pages/InteractionsPage';
import EventsPage from './pages/EventsPage';
import ContactSharingPage from './pages/ContactSharingPage';
import NotFoundPage from './pages/NotFoundPage';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="contacts" element={<ContactsPage />} />
              <Route path="contacts/add" element={<ContactAddPage />} />
              <Route path="contacts/:id" element={<ContactDetailsPage />} />
              <Route path="contacts/:id/edit" element={<ContactEditPage />} />
              <Route path="favorites" element={<FavoritesPage />} />
              <Route path="groups" element={<GroupsPage />} />
              <Route path="reminders" element={<RemindersPage />} />
              <Route path="activity" element={<ActivityPage />} />
              <Route path="people" element={<PeoplePage />} />
              <Route path="interactions" element={<InteractionsPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="contact-sharing" element={<ContactSharingPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ConfirmProvider>
    </ToastProvider>
  );
}