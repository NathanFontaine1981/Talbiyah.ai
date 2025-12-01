import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  showHome?: boolean;
  homeLabel?: string;
  homePath?: string;
  className?: string;
  darkMode?: boolean;
}

// Route to label mappings for automatic breadcrumb generation
const routeLabels: Record<string, string> = {
  // Main routes
  '/dashboard': 'Dashboard',
  '/teachers': 'Find Teachers',
  '/courses': 'My Courses',
  '/recordings/history': 'Recordings',
  '/buy-credits': 'Buy Credits',
  '/account/settings': 'Settings',
  '/messages': 'Messages',
  '/refer': 'Refer Friends',

  // Student routes
  '/student/quran-progress': 'Quran Progress',
  '/student/arabic-progress': 'Arabic Progress',
  '/student/my-teachers': 'My Teachers',
  '/student/lesson-insights': 'Lesson Insights',

  // Parent routes
  '/parent/dashboard': 'Parent Dashboard',
  '/parent/onboarding': 'Setup',
  '/my-children': 'My Children',

  // Teacher routes
  '/teacher/hub': 'Teacher Hub',
  '/teacher/my-students': 'My Students',
  '/teacher/homework-review': 'Homework Review',
  '/teacher/schedule': 'My Schedule',
  '/teacher/availability': 'Availability',
  '/teacher/earnings': 'Earnings',
  '/teacher/payment-settings': 'Payment Settings',
  '/teacher/edit-profile': 'Edit Profile',
  '/teacher/tier-info': 'Tier Info',

  // Admin routes
  '/admin': 'Admin',
  '/admin/users': 'User Management',
  '/admin/teachers': 'Teacher Management',
  '/admin/teacher-tiers': 'Teacher Tiers',
  '/admin/teacher-payouts': 'Payouts',
  '/admin/sessions': 'Sessions',
  '/admin/group-sessions': 'Group Sessions',
  '/admin/courses': 'Courses',
  '/admin/recordings': 'Recordings',
  '/admin/analytics': 'Analytics',
  '/admin/insights-generator': 'Insights Generator',
  '/admin/settings': 'Settings',

  // Feature routes
  '/islamic-source-reference': 'Islamic Source Reference',
  '/about/islamic-source-reference': 'About Islamic Sources',
  '/khutba-creator': 'Khutba Creator',
  '/khutba-reflections': 'Reflections',
  '/insights-library': 'Insights Library',

  // Booking routes
  '/book-session': 'Book Session',
  '/checkout': 'Checkout',
};

// Dynamic route patterns
const dynamicRoutePatterns: Array<{
  pattern: RegExp;
  getLabel: (match: RegExpMatchArray) => string;
}> = [
  {
    pattern: /^\/teacher\/(\w+)$/,
    getLabel: () => 'Teacher Profile'
  },
  {
    pattern: /^\/lesson-insights\/(.+)$/,
    getLabel: () => 'Lesson Insights'
  },
  {
    pattern: /^\/child\/(.+)$/,
    getLabel: () => 'Child Dashboard'
  }
];

export default function Breadcrumbs({
  items,
  showHome = true,
  homeLabel = 'Home',
  homePath = '/',
  className = '',
  darkMode = false
}: BreadcrumbsProps) {
  const location = useLocation();

  // Use provided items or auto-generate from location
  const breadcrumbItems: BreadcrumbItem[] = items || generateBreadcrumbs(location.pathname);

  if (breadcrumbItems.length === 0 && !showHome) {
    return null;
  }

  const textColor = darkMode ? 'text-slate-400' : 'text-slate-500';
  const hoverColor = darkMode ? 'hover:text-white' : 'hover:text-slate-900';
  const activeColor = darkMode ? 'text-white' : 'text-slate-900';
  const iconColor = darkMode ? 'text-slate-600' : 'text-slate-300';

  return (
    <nav className={`flex items-center text-sm ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {showHome && (
          <li>
            <Link
              to={homePath}
              className={`flex items-center ${textColor} ${hoverColor} transition`}
            >
              <Home className="w-4 h-4" />
              <span className="sr-only">{homeLabel}</span>
            </Link>
          </li>
        )}

        {breadcrumbItems.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight className={`w-4 h-4 ${iconColor} mx-2`} />
            {item.path && index < breadcrumbItems.length - 1 ? (
              <Link
                to={item.path}
                className={`${textColor} ${hoverColor} transition`}
              >
                {item.label}
              </Link>
            ) : (
              <span className={`font-medium ${activeColor}`}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];

  // Check for exact match first
  if (routeLabels[pathname]) {
    // Build up the path hierarchy
    const segments = pathname.split('/').filter(Boolean);
    let currentPath = '';

    for (let i = 0; i < segments.length; i++) {
      currentPath += '/' + segments[i];
      const label = routeLabels[currentPath];

      if (label) {
        items.push({
          label,
          path: i < segments.length - 1 ? currentPath : undefined
        });
      }
    }

    return items;
  }

  // Check dynamic patterns
  for (const { pattern, getLabel } of dynamicRoutePatterns) {
    const match = pathname.match(pattern);
    if (match) {
      // Get parent path breadcrumbs first
      const parentPath = pathname.substring(0, pathname.lastIndexOf('/'));
      if (parentPath && routeLabels[parentPath]) {
        items.push({
          label: routeLabels[parentPath],
          path: parentPath
        });
      }

      items.push({
        label: getLabel(match),
        path: undefined
      });

      return items;
    }
  }

  // Fallback: generate from path segments
  const segments = pathname.split('/').filter(Boolean);
  let currentPath = '';

  for (let i = 0; i < segments.length; i++) {
    currentPath += '/' + segments[i];
    const segment = segments[i];

    // Capitalize and format segment
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    items.push({
      label,
      path: i < segments.length - 1 ? currentPath : undefined
    });
  }

  return items;
}

// Export a simpler version for page headers
interface PageHeaderBreadcrumbProps {
  title: string;
  parentLabel?: string;
  parentPath?: string;
  darkMode?: boolean;
}

export function PageHeaderBreadcrumb({
  title,
  parentLabel,
  parentPath,
  darkMode = false
}: PageHeaderBreadcrumbProps) {
  const items: BreadcrumbItem[] = [];

  if (parentLabel && parentPath) {
    items.push({ label: parentLabel, path: parentPath });
  }

  items.push({ label: title });

  return <Breadcrumbs items={items} darkMode={darkMode} />;
}
