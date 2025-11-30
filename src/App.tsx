import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { initSentry } from './sentryConfig';
import Home from './pages/Home';
import SignUp from './pages/SignUp';

// Initialize Sentry error tracking
initSentry();
import ChooseCourse from './pages/ChooseCourse';
import SubjectSelection from './pages/SubjectSelection';
import CourseQuranExplanation from './pages/CourseQuranExplanation';
import CourseArabic from './pages/CourseArabic';
import Checkout from './pages/Checkout';
import Cart from './pages/Cart';
import AdminDashboard from './pages/AdminDashboard';
import AdminHome from './pages/admin/AdminHome';
import TeacherManagement from './pages/admin/TeacherManagement';
import TeacherTiers from './pages/admin/TeacherTiers';
import UserManagement from './pages/admin/UserManagement';
import Sessions from './pages/admin/Sessions';
import GroupSessions from './pages/admin/GroupSessions';
import CoursesManagement from './pages/admin/CoursesManagement';
import Recordings from './pages/admin/Recordings';
import Analytics from './pages/admin/Analytics';
import InsightsGenerator from './pages/admin/InsightsGenerator';
import ApplyToTeach from './pages/ApplyToTeach';
import AccountSettings from './pages/AccountSettings';
import Dashboard from './pages/Dashboard';
import Teachers from './pages/Teachers';
import TeacherProfile from './pages/TeacherProfile';
import Matchmaking from './pages/Matchmaking';
import Welcome from './pages/Welcome';
import BookSession from './pages/BookSession';
import PaymentSuccess from './pages/PaymentSuccess';
import BookingSuccess from './pages/BookingSuccess';
import BuyCredits from './pages/BuyCredits';
import CreditPurchaseSuccess from './pages/CreditPurchaseSuccess';
import BookingOptions from './pages/BookingOptions';
import QuranProgress from './pages/QuranProgress';
import ArabicProgress from './pages/ArabicProgress';
import CoursesOverview from './pages/CoursesOverview';
import RecordingsHistory from './pages/RecordingsHistory';
import TeacherProfileSetup from './pages/TeacherProfileSetup';
import TeacherPendingApproval from './pages/TeacherPendingApproval';
import TeacherAvailability from './pages/TeacherAvailability';
import TeacherEditProfile from './pages/teacher/EditProfile';
import TeacherHub from './pages/teacher/TeacherHub';
import MyStudents from './pages/teacher/MyStudents';
import HomeworkReview from './pages/teacher/HomeworkReview';
import MySchedule from './pages/teacher/MySchedule';
import IslamicSourceReferenceAbout from './pages/IslamicSourceReferenceAbout';
import IslamicSourceReference from './pages/IslamicSourceReference';
import KhutbaCreator from './pages/KhutbaCreator';
import KhutbaReflections from './pages/KhutbaReflections';
import InsightsLibrary from './pages/InsightsLibrary';
import ProtectedRoute from './components/ProtectedRoute';
import MyChildren from './pages/MyChildren';
import ChildDashboardView from './pages/ChildDashboardView';
import ParentOnboarding from './pages/parent/ParentOnboarding';
import TeacherBooking from './pages/TeacherBooking';
import ManageTeachers from './pages/student/ManageTeachers';
import MyTeachers from './pages/student/MyTeachers';
import Lesson from './pages/Lesson';
import VerifyEmail from './pages/VerifyEmail';
import MyReferrals from './pages/MyReferrals';
import Messages from './pages/Messages';
import AuthCallback from './pages/AuthCallback';
import LessonInsights from './pages/student/LessonInsights';
import RecordingWithInsights from './pages/student/RecordingWithInsights';
import ReferralDashboard from './pages/ReferralDashboard';
import ReferralLeaderboard from './pages/ReferralLeaderboard';
import TeacherTierDashboard from './pages/TeacherTierDashboard';
import TeacherTierInfo from './pages/TeacherTierInfo';
import RescheduleLesson from './pages/RescheduleLesson';
import MyClasses from './pages/MyClasses';
import TeacherEarnings from './pages/TeacherEarnings';
import TeacherPayouts from './pages/admin/TeacherPayouts';
import TeacherPaymentSettings from './pages/TeacherPaymentSettings';
import MissedLessons from './pages/MissedLessons';
import TierDiagnostic from './pages/TierDiagnostic';
import Onboarding from './pages/Onboarding';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/choose-course" element={<ChooseCourse />} />
        <Route
          path="/subjects"
          element={
            <ProtectedRoute>
              <SubjectSelection />
            </ProtectedRoute>
          }
        />
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
          path="/courses/arabic-progress"
          element={
            <ProtectedRoute>
              <ArabicProgress />
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
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
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
          path="/reschedule-lesson"
          element={
            <ProtectedRoute>
              <RescheduleLesson />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-classes"
          element={
            <ProtectedRoute>
              <MyClasses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/missed-lessons"
          element={
            <ProtectedRoute>
              <MissedLessons />
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
          <Route path="users" element={<UserManagement />} />
          <Route path="teachers" element={<TeacherManagement />} />
          <Route path="teacher-tiers" element={<TeacherTiers />} />
          <Route path="teacher-payouts" element={<TeacherPayouts />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="group-sessions" element={<GroupSessions />} />
          <Route path="courses" element={<CoursesManagement />} />
          <Route path="recordings" element={<Recordings />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="insights-generator" element={<InsightsGenerator />} />
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
          path="/teacher/pending-approval"
          element={
            <ProtectedRoute>
              <TeacherPendingApproval />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/hub"
          element={
            <ProtectedRoute>
              <TeacherHub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/my-students"
          element={
            <ProtectedRoute>
              <MyStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/homework-review"
          element={
            <ProtectedRoute>
              <HomeworkReview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/schedule"
          element={
            <ProtectedRoute>
              <MySchedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/availability"
          element={
            <ProtectedRoute>
              <TeacherAvailability />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/edit-profile"
          element={
            <ProtectedRoute>
              <TeacherEditProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/tiers"
          element={
            <ProtectedRoute requireTeacherOrAdmin={true}>
              <TeacherTierDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/tier-info"
          element={
            <ProtectedRoute requireTeacherOrAdmin={true}>
              <TeacherTierInfo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/tier-diagnostic"
          element={
            <ProtectedRoute>
              <TierDiagnostic />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/earnings"
          element={
            <ProtectedRoute>
              <TeacherEarnings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/payment-settings"
          element={
            <ProtectedRoute>
              <TeacherPaymentSettings />
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
        <Route
          path="/lesson/:lessonId"
          element={
            <ProtectedRoute>
              <Lesson />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lesson/:lessonId/insights"
          element={
            <ProtectedRoute>
              <LessonInsights />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recording/:recordingId"
          element={
            <ProtectedRoute>
              <RecordingWithInsights />
            </ProtectedRoute>
          }
        />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/teacher/:id" element={<TeacherProfile />} />
        <Route
          path="/teacher/:id/book"
          element={
            <ProtectedRoute>
              <TeacherBooking />
            </ProtectedRoute>
          }
        />
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
          path="/booking-success"
          element={
            <ProtectedRoute>
              <BookingSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking-options"
          element={
            <ProtectedRoute>
              <BookingOptions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buy-credits"
          element={
            <ProtectedRoute>
              <BuyCredits />
            </ProtectedRoute>
          }
        />
        <Route
          path="/credit-purchase-success"
          element={
            <ProtectedRoute>
              <CreditPurchaseSuccess />
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
            <ProtectedRoute excludeTeachers={true}>
              <ReferralDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/referral/leaderboard"
          element={
            <ProtectedRoute excludeTeachers={true}>
              <ReferralLeaderboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/onboarding"
          element={
            <ProtectedRoute>
              <ParentOnboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-children"
          element={
            <ProtectedRoute>
              <MyChildren />
            </ProtectedRoute>
          }
        />
        <Route
          path="/child/:childId/dashboard"
          element={
            <ProtectedRoute>
              <ChildDashboardView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/my-teachers"
          element={
            <ProtectedRoute>
              <ManageTeachers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-teachers"
          element={
            <ProtectedRoute>
              <MyTeachers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-referrals"
          element={
            <ProtectedRoute excludeTeachers={true}>
              <MyReferrals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/islamic-source-reference"
          element={
            <ProtectedRoute>
              <IslamicSourceReference />
            </ProtectedRoute>
          }
        />
        <Route path="/about/islamic-source-reference" element={<IslamicSourceReferenceAbout />} />
        <Route
          path="/khutba-creator"
          element={
            <ProtectedRoute>
              <KhutbaCreator />
            </ProtectedRoute>
          }
        />
        <Route
          path="/khutba-reflections"
          element={
            <ProtectedRoute>
              <KhutbaReflections />
            </ProtectedRoute>
          }
        />
        <Route
          path="/insights-library"
          element={
            <ProtectedRoute>
              <InsightsLibrary />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
