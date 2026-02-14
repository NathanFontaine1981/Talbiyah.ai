import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { Toaster } from 'sonner';
import { initSentry } from './sentryConfig';
import ErrorBoundary from './components/ErrorBoundary';
import CartExpiryNotifications from './components/CartExpiryNotifications';
import CookieConsent from './components/CookieConsent';
import FeedbackButton from './components/FeedbackButton';
import { ThemeProvider } from './contexts/ThemeContext';
import { useActivityTracker } from './hooks/useActivityTracker';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Activity tracker component - tracks page views automatically
function ActivityTracker() {
  useActivityTracker();
  return null;
}

// Initialize Sentry error tracking
initSentry();

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
    <div className="w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// Core pages - loaded immediately
import Home from './pages/Home';
import HomeLandingV2 from './pages/HomeLandingV2';
import Features from './pages/Features';
import Demo from './pages/Demo';
import SignUp from './pages/SignUp';
import VerifyEmail from './pages/VerifyEmail';
import AuthCallback from './pages/AuthCallback';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy loaded pages - heavy components loaded on demand
const ChooseCourse = lazy(() => import('./pages/ChooseCourse'));
const SubjectSelection = lazy(() => import('./pages/SubjectSelection'));
const CourseQuranExplanation = lazy(() => import('./pages/CourseQuranExplanation'));
const CourseArabic = lazy(() => import('./pages/CourseArabic'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Cart = lazy(() => import('./pages/Cart'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Teachers = lazy(() => import('./pages/Teachers'));
const TeacherProfile = lazy(() => import('./pages/TeacherProfile'));
const Matchmaking = lazy(() => import('./pages/Matchmaking'));
const Welcome = lazy(() => import('./pages/Welcome'));
const BookSession = lazy(() => import('./pages/BookSession'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const BookingSuccess = lazy(() => import('./pages/BookingSuccess'));
const BuyCredits = lazy(() => import('./pages/BuyCredits'));
const TransferCredits = lazy(() => import('./pages/TransferCredits'));
const PaymentHistory = lazy(() => import('./pages/PaymentHistory'));
const CreditPurchaseSuccess = lazy(() => import('./pages/CreditPurchaseSuccess'));
const TokenPurchaseSuccess = lazy(() => import('./pages/TokenPurchaseSuccess'));
const BookingOptions = lazy(() => import('./pages/BookingOptions'));
const QuranProgress = lazy(() => import('./pages/QuranProgress'));
const ArabicProgress = lazy(() => import('./pages/ArabicProgress'));
const CoursesOverview = lazy(() => import('./pages/CoursesOverview'));
const RecordingsHistory = lazy(() => import('./pages/RecordingsHistory'));
const ApplyToTeach = lazy(() => import('./pages/ApplyToTeach'));
const AccountSettings = lazy(() => import('./pages/AccountSettings'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const MyChildren = lazy(() => import('./pages/MyChildren'));
const ChildDashboardView = lazy(() => import('./pages/ChildDashboardView'));
const TeacherBooking = lazy(() => import('./pages/TeacherBooking'));
const MyReferrals = lazy(() => import('./pages/MyReferrals'));
const Messages = lazy(() => import('./pages/Messages'));
const ReferralDashboard = lazy(() => import('./pages/ReferralDashboard'));
const ReferralLeaderboard = lazy(() => import('./pages/ReferralLeaderboard'));
const RescheduleLesson = lazy(() => import('./pages/RescheduleLesson'));
const MyClasses = lazy(() => import('./pages/MyClasses'));
const MissedLessons = lazy(() => import('./pages/MissedLessons'));
const DashboardPremium = lazy(() => import('./pages/DashboardPremium'));
const TierDiagnostic = lazy(() => import('./pages/TierDiagnostic'));
const IslamicSourceReferenceAbout = lazy(() => import('./pages/IslamicSourceReferenceAbout'));
const IslamicSourceReference = lazy(() => import('./pages/IslamicSourceReference'));
const KhutbaCreator = lazy(() => import('./pages/KhutbaCreator'));
const DuaBuilder = lazy(() => import('./pages/DuaBuilder'));
const QunutPractice = lazy(() => import('./pages/QunutPractice'));
const IstikharaPractice = lazy(() => import('./pages/IstikharaPractice'));
const JanazahPractice = lazy(() => import('./pages/JanazahPractice'));
const VettingProcess = lazy(() => import('./pages/VettingProcess'));
const KhutbaReflections = lazy(() => import('./pages/KhutbaReflections'));
const InsightsLibrary = lazy(() => import('./pages/InsightsLibrary'));
const ReferralInfo = lazy(() => import('./pages/ReferralInfo'));

// Explore & New Muslim pages (public)
const ExplorePage = lazy(() => import('./pages/explore/ExplorePage'));
const UnshakableFoundations = lazy(() => import('./pages/UnshakableFoundations'));
const NewMuslimLanding = lazy(() => import('./pages/NewMuslimLanding'));
const SalahTutorialPage = lazy(() => import('./pages/SalahTutorialPage'));
const ExplorerDashboard = lazy(() => import('./pages/ExplorerDashboard'));
const Suggestions = lazy(() => import('./pages/Suggestions'));
const HowToPage = lazy(() => import('./pages/HowToPage'));

// Course pages
const CoursePage = lazy(() => import('./pages/dawra/DawraCoursePage'));
const CourseSessionInsights = lazy(() => import('./pages/dawra/DawraSessionInsights'));
const CourseTeacherDashboard = lazy(() => import('./pages/dawra/DawraTeacherDashboard'));
const CourseLiveRoom = lazy(() => import('./pages/dawra/DawraLiveRoom'));
const TeacherCourses = lazy(() => import('./pages/dawra/TeacherCourses'));

// Diagnostic Assessment pages
const StartDiagnostic = lazy(() => import('./pages/diagnostic/StartDiagnostic'));
const DiagnosticBooking = lazy(() => import('./pages/diagnostic/DiagnosticBooking'));
const DiagnosticSuccess = lazy(() => import('./pages/diagnostic/DiagnosticSuccess'));
const DiagnosticReport = lazy(() => import('./pages/diagnostic/DiagnosticReport'));

// Lesson page - contains heavy HMS SDK (4MB+)
const Lesson = lazy(() => import('./pages/Lesson'));

// Student pages
const ManageTeachers = lazy(() => import('./pages/student/ManageTeachers'));
const MyTeachers = lazy(() => import('./pages/student/MyTeachers'));
const GroupClasses = lazy(() => import('./pages/student/GroupClasses'));
const LessonInsights = lazy(() => import('./pages/student/LessonInsights'));
const RecordingWithInsights = lazy(() => import('./pages/student/RecordingWithInsights'));
const DailyMaintenancePage = lazy(() => import('./pages/student/DailyMaintenancePage'));
const SmartHomeworkPage = lazy(() => import('./pages/student/SmartHomeworkPage'));
const MemorizationSetupPage = lazy(() => import('./pages/student/MemorizationSetupPage'));
const AyahRecallPracticePage = lazy(() => import('./pages/student/AyahRecallPracticePage'));

// Parent pages
const ParentOnboarding = lazy(() => import('./pages/parent/ParentOnboarding'));

// Teacher pages - only loaded for teachers
const TeacherProfileSetup = lazy(() => import('./pages/TeacherProfileSetup'));
const TeacherPendingApproval = lazy(() => import('./pages/TeacherPendingApproval'));
const TeacherAvailability = lazy(() => import('./pages/TeacherAvailability'));
const TeacherEditProfile = lazy(() => import('./pages/teacher/EditProfile'));
const TeacherHub = lazy(() => import('./pages/teacher/TeacherHub'));
const MyStudents = lazy(() => import('./pages/teacher/MyStudents'));
const HomeworkReview = lazy(() => import('./pages/teacher/HomeworkReview'));
const TeacherGroupLessons = lazy(() => import('./pages/teacher/GroupLessons'));
const TeacherGroupHomework = lazy(() => import('./pages/teacher/GroupHomework'));
const MySchedule = lazy(() => import('./pages/teacher/MySchedule'));
const TeacherTierDashboard = lazy(() => import('./pages/TeacherTierDashboard'));
const TeacherTierInfo = lazy(() => import('./pages/TeacherTierInfo'));
const TeacherEarnings = lazy(() => import('./pages/TeacherEarnings'));
const TeacherPaymentSettings = lazy(() => import('./pages/TeacherPaymentSettings'));
const TeacherDiagnosticAssessment = lazy(() => import('./pages/teacher/DiagnosticAssessment'));
const DiagnosticPrepView = lazy(() => import('./components/teacher/DiagnosticPrepView'));
const BookWithStudent = lazy(() => import('./pages/teacher/BookWithStudent'));

// Admin pages - only loaded for admins
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminHome = lazy(() => import('./pages/admin/AdminHome'));
const TeacherManagement = lazy(() => import('./pages/admin/TeacherManagement'));
const TeacherReview = lazy(() => import('./pages/admin/TeacherReview'));
const TeacherTiers = lazy(() => import('./pages/admin/TeacherTiers'));
const GroupLessonTeachers = lazy(() => import('./pages/admin/GroupLessonTeachers'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const Sessions = lazy(() => import('./pages/admin/Sessions'));
const GroupSessions = lazy(() => import('./pages/admin/GroupSessions'));
const CoursesManagement = lazy(() => import('./pages/admin/CoursesManagement'));
const Recordings = lazy(() => import('./pages/admin/Recordings'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const InsightsGenerator = lazy(() => import('./pages/admin/InsightsGenerator'));
const GroupSessionCreator = lazy(() => import('./pages/admin/GroupSessionCreator'));
const InsightTemplateManager = lazy(() => import('./pages/admin/InsightTemplateManager'));
const PromoCodeManager = lazy(() => import('./pages/admin/PromoCodeManager'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const TeacherPayouts = lazy(() => import('./pages/admin/TeacherPayouts'));
const FeedbackManagement = lazy(() => import('./pages/admin/FeedbackManagement'));
const AdminSuggestions = lazy(() => import('./pages/admin/AdminSuggestions'));
const DiagnosticAssessments = lazy(() => import('./pages/admin/DiagnosticAssessments'));
const ContentModeration = lazy(() => import('./pages/admin/ContentModeration'));
const LegacyBilling = lazy(() => import('./pages/admin/LegacyBilling'));
const AdminEmail = lazy(() => import('./pages/admin/AdminEmail'));
const SadaqahManagement = lazy(() => import('./pages/admin/SadaqahManagement'));

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <BrowserRouter>
        <ScrollToTop />
        <ActivityTracker />
        <Suspense fallback={<PageLoader />}>
        <Routes>
        <Route path="/" element={<HomeLandingV2 />} />
        <Route path="/features" element={<Features />} />
        <Route path="/landing-old" element={<Home />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/new-muslim" element={<UnshakableFoundations />} />
        <Route path="/new-muslim-landing" element={<NewMuslimLanding />} />
        <Route path="/salah" element={<SalahTutorialPage />} />
        <Route path="/suggestions" element={<Suggestions />} />
        <Route path="/how-to" element={<HowToPage />} />
        <Route path="/course/:slug" element={<CoursePage />} />
        <Route path="/course/:slug/session/:sessionNumber" element={<CourseSessionInsights />} />
        <Route
          path="/course/:slug/live/:sessionNumber"
          element={
            <ProtectedRoute>
              <CourseLiveRoom />
            </ProtectedRoute>
          }
        />
        <Route
          path="/explorer"
          element={
            <ProtectedRoute>
              <ExplorerDashboard />
            </ProtectedRoute>
          }
        />
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
          path="/dashboard-premium"
          element={
            <ProtectedRoute>
              <DashboardPremium />
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
          path="/group-classes"
          element={
            <ProtectedRoute>
              <GroupClasses />
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
          <Route path="teachers/:teacherId/review" element={<TeacherReview />} />
          <Route path="teacher-tiers" element={<TeacherTiers />} />
          <Route path="group-lesson-teachers" element={<GroupLessonTeachers />} />
          <Route path="teacher-payouts" element={<TeacherPayouts />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="group-sessions" element={<GroupSessions />} />
          <Route path="courses" element={<CoursesManagement />} />
          <Route path="recordings" element={<Recordings />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="insights-generator" element={<InsightsGenerator />} />
          <Route path="group-session-creator" element={<GroupSessionCreator />} />
          <Route path="insight-templates" element={<InsightTemplateManager />} />
          <Route path="promo-codes" element={<PromoCodeManager />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="feedback" element={<FeedbackManagement />} />
          <Route path="suggestions" element={<AdminSuggestions />} />
          <Route path="diagnostic-assessments" element={<DiagnosticAssessments />} />
          <Route path="content-moderation" element={<ContentModeration />} />
          <Route path="legacy-billing" element={<LegacyBilling />} />
          <Route path="email" element={<AdminEmail />} />
          <Route path="sadaqah" element={<SadaqahManagement />} />
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
          path="/teacher/group-lessons"
          element={
            <ProtectedRoute>
              <TeacherGroupLessons />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/group-homework/:sessionId"
          element={
            <ProtectedRoute>
              <TeacherGroupHomework />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/course/:id"
          element={
            <ProtectedRoute>
              <CourseTeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/courses"
          element={
            <ProtectedRoute>
              <TeacherCourses />
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
          path="/teacher/diagnostic/:lessonId"
          element={
            <ProtectedRoute>
              <TeacherDiagnosticAssessment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/diagnostic-prep/:assessmentId"
          element={
            <ProtectedRoute>
              <DiagnosticPrepView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/book-with-student/:studentId"
          element={
            <ProtectedRoute>
              <BookWithStudent />
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
        <Route
          path="/daily-review"
          element={
            <ProtectedRoute>
              <DailyMaintenancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/homework"
          element={
            <ProtectedRoute>
              <SmartHomeworkPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-memorization"
          element={
            <ProtectedRoute>
              <MemorizationSetupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/practice/ayah-recall"
          element={
            <ProtectedRoute>
              <AyahRecallPracticePage />
            </ProtectedRoute>
          }
        />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/teachers/vetting-process" element={<VettingProcess />} />
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
          path="/transfer-credits"
          element={
            <ProtectedRoute>
              <TransferCredits />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment-history"
          element={
            <ProtectedRoute>
              <PaymentHistory />
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
          path="/token-purchase-success"
          element={
            <ProtectedRoute>
              <TokenPurchaseSuccess />
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
        <Route path="/referral-info" element={<ReferralInfo />} />
        <Route
          path="/khutba-creator"
          element={
            <ProtectedRoute>
              <KhutbaCreator />
            </ProtectedRoute>
          }
        />
        <Route path="/dua-builder" element={<DuaBuilder />} />
        <Route path="/qunut-practice" element={<QunutPractice />} />
        <Route path="/istikhara-practice" element={<IstikharaPractice />} />
        <Route path="/janazah-practice" element={<JanazahPractice />} />
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
        {/* Diagnostic Assessment Routes */}
        <Route
          path="/diagnostic/start"
          element={
            <ProtectedRoute>
              <StartDiagnostic />
            </ProtectedRoute>
          }
        />
        <Route
          path="/diagnostic/book/:assessmentId"
          element={
            <ProtectedRoute>
              <DiagnosticBooking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/diagnostic/success/:assessmentId"
          element={
            <ProtectedRoute>
              <DiagnosticSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/diagnostic/report/:assessmentId"
          element={
            <ProtectedRoute>
              <DiagnosticReport />
            </ProtectedRoute>
          }
        />
        </Routes>
        </Suspense>
        <FeedbackButton />
        <CartExpiryNotifications />
        <CookieConsent />
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
            className: 'font-sans',
          }}
        />
        </BrowserRouter>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
