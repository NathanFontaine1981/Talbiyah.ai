import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SignUp from './pages/SignUp';
import ChooseCourse from './pages/ChooseCourse';
import CourseQuranExplanation from './pages/CourseQuranExplanation';
import CourseArabic from './pages/CourseArabic';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import AdminDashboard from './pages/AdminDashboard';
import AdminHome from './pages/admin/AdminHome';
import TeacherManagement from './pages/admin/TeacherManagement';
import UsersManagement from './pages/admin/UsersManagement';
import SessionsManagement from './pages/admin/SessionsManagement';
import CoursesManagement from './pages/admin/CoursesManagement';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import ApplyToTeach from './pages/ApplyToTeach';
import AccountSettings from './pages/AccountSettings';
import Dashboard from './pages/Dashboard';
import Teachers from './pages/Teachers';
import TeacherProfile from './pages/TeacherProfile';
import Counselling from './pages/Counselling';
import Matchmaking from './pages/Matchmaking';
import Welcome from './pages/Welcome';
import BookSession from './pages/BookSession';
import PaymentSuccess from './pages/PaymentSuccess';
import QuranProgress from './pages/QuranProgress';
import CoursesOverview from './pages/CoursesOverview';
import RecordingsHistory from './pages/RecordingsHistory';
import ReferralLanding from './pages/ReferralLanding';
import TeacherProfileSetup from './pages/TeacherProfileSetup';
import VirtualImamAbout from './pages/VirtualImamAbout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/choose-course" element={<ChooseCourse />} />
        <Route path="/course/quran-understanding" element={<CourseQuranExplanation />} />
        <Route path="/course/arabic-language" element={<CourseArabic />} />
        <Route
          path="/courses-overview"
          element={
            <ProtectedRoute>
              <CoursesOverview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/quran"
          element={
            <ProtectedRoute>
              <CourseQuranExplanation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/quran-progress"
          element={
            <ProtectedRoute>
              <QuranProgress />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminHome />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="teachers" element={<TeacherManagement />} />
          <Route path="sessions" element={<SessionsManagement />} />
          <Route path="courses" element={<CoursesManagement />} />
          <Route path="recordings" element={<div className="text-white">Recordings Management Coming Soon</div>} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<div className="text-white">Settings Coming Soon</div>} />
        </Route>
        <Route
          path="/apply-to-teach"
          element={
            <ProtectedRoute>
              <ApplyToTeach />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/setup-profile"
          element={
            <ProtectedRoute>
              <TeacherProfileSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/progress/quran"
          element={
            <ProtectedRoute>
              <QuranProgress />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/settings"
          element={
            <ProtectedRoute>
              <AccountSettings />
            </ProtectedRoute>
          }
        />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/teacher/:id" element={<TeacherProfile />} />
        <Route path="/counselling" element={<Counselling />} />
        <Route path="/matchmaking" element={<Matchmaking />} />
        <Route
          path="/welcome"
          element={
            <ProtectedRoute>
              <Welcome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/book/session"
          element={
            <ProtectedRoute>
              <BookSession />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment-success"
          element={
            <ProtectedRoute>
              <PaymentSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recordings/history"
          element={
            <ProtectedRoute>
              <RecordingsHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/refer"
          element={
            <ProtectedRoute>
              <ReferralLanding />
            </ProtectedRoute>
          }
        />
        <Route path="/about/virtual-imam" element={<VirtualImamAbout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
