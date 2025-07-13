import { useNavigate } from 'react-router-dom';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { MoonIcon, SunIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../context/ThemeContext'; // or wherever your context is

interface TokenPayload extends JwtPayload {
  email?: string;
  sub: string;
}

export default function Header({ className = '' }: { className?: string }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const token = localStorage.getItem('accessToken');

  let user: TokenPayload | null = null;
  if (token) {
    try {
      const decodedToken = jwtDecode<TokenPayload>(token);
      const currentTime = Date.now() / 1000;
      if (decodedToken.exp && decodedToken.exp < currentTime) {
        localStorage.removeItem('accessToken');
        user = null;
      } else {
        user = decodedToken;
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      localStorage.removeItem('accessToken');
      user = null;
    }
  }

  const getUserInitial = (email?: string) => {
    return email?.charAt(0).toUpperCase() ?? 'U';
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  return (
    <header className={`shadow-lg py-6 border-b border-[var(--color-mid)] ${theme} relative z-10 header bg-[var(--color-mid)] ${className}`}>
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
        <a href="/" className="flex items-center gap-2 cursor-pointer">
          <span className="text-3xl font-bold text-[var(--color-brand)]">ShareLink</span>
        </a>

        <nav className="flex items-center gap-6">

          {/* Theme Toggle Button */}
            <button
            onClick={toggleTheme}
            className="group relative w-10 h-10 rounded-full transition duration-300 flex items-center justify-center cursor-pointer"
            aria-label="Toggle theme"
            >
            {/* Hover background circle */}
            <div className={`absolute inset-0 bg-[var(--color-mid)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full z-0`}/>

            {/* Icons */}
            <div className="relative w-5 h-5">
                {/* Moon Icon */}
                <MoonIcon
                className={`absolute inset-0 transition-all duration-300 text-[var(--text-color)] ${
                    theme === 'light'
                    ? 'opacity-100 scale-100 rotate-0'
                    : 'opacity-0 scale-75 -rotate-90'
                }`}
                />

                {/* Sun Icon */}
                <SunIcon
                className={`absolute inset-0 transition-all duration-300 text-[var(--text-color)] ${
                    theme === 'dark'
                    ? 'opacity-100 scale-100 rotate-0'
                    : 'opacity-0 scale-75 rotate-90'
                }`}
                />
            </div>
            </button>


          {user ? (
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-base select-none bg-[var(--color-brand)] text-[var(--bg-color)]">
                {getUserInitial(user.email || user.sub)}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition duration-300 ease-in-out text-white"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4">
                {/* Log In */}
                <button
                    onClick={() => navigate('/login')}
                    className="relative px-4 py-2 rounded-full text-[var(--text-color)] transition duration-300 ease-in-out overflow-hidden group cursor-pointer"
                >
                    <div className="absolute inset-0 bg-[var(--color-mid)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full z-0" />
                    <span className="relative z-10">Log In</span>
                </button>

                {/* Sign Up */}
                <button
                    onClick={() => navigate('/signup')}
                    className="relative px-4 py-2 rounded-full text-[var(--text-color)] transition duration-300 ease-in-out overflow-hidden group cursor-pointer"
                >
                    <div className="absolute inset-0 bg-[var(--color-mid)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full z-0" />
                    <span className="relative z-10">Sign Up</span>
                </button>
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
