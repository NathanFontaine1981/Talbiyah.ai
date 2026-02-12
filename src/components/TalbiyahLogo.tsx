import { Link } from 'react-router-dom';

interface TalbiyahLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  linkTo?: string | null;
  className?: string;
  dark?: boolean;
}

const sizeMap = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

const textSizeMap = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-2xl',
};

export default function TalbiyahLogo({
  size = 'md',
  showText = true,
  linkTo = '/',
  className = '',
  dark = false,
}: TalbiyahLogoProps) {
  const content = (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/images/logo.png"
        alt="Talbiyah.ai"
        className={`${sizeMap[size]} object-contain rounded-lg`}
      />
      {showText && (
        <span className={`${textSizeMap[size]} font-bold ${dark ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
          Talbiyah<span className="text-emerald-500">.ai</span>
        </span>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="flex items-center gap-2 no-underline">
        {content}
      </Link>
    );
  }

  return content;
}
