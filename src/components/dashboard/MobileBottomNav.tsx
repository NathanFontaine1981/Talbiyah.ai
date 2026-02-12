import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  GraduationCap,
  MessageCircle,
  Menu,
} from 'lucide-react';

interface MobileBottomNavProps {
  selectedViewRole: string;
  unreadMessageCount: number;
  onMenuOpen: () => void;
}

export default function MobileBottomNav({
  selectedViewRole,
  unreadMessageCount,
  onMenuOpen,
}: MobileBottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      icon: Home,
      label: 'Home',
      path: '/dashboard',
    },
    {
      icon: Search,
      label: selectedViewRole === 'Teacher' ? 'Students' : 'Teachers',
      path: selectedViewRole === 'Teacher' ? '/teacher/my-students' : '/teachers',
    },
    {
      icon: GraduationCap,
      label: 'Courses',
      path: '/courses-overview',
    },
    {
      icon: MessageCircle,
      label: 'Messages',
      path: '/messages',
      badge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
    },
    {
      icon: Menu,
      label: 'More',
      path: '__menu__',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive = item.path !== '__menu__' && location.pathname === item.path;
          const isMenu = item.path === '__menu__';

          return (
            <button
              key={item.label}
              onClick={() => {
                if (isMenu) {
                  onMenuOpen();
                } else {
                  navigate(item.path);
                }
              }}
              className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium mt-1">{item.label}</span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
