import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Track scroll position for animation
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="w-full flex justify-center py-2 sticky top-4 z-50 mt-4"
         style={{
           backgroundColor: 'transparent',
           width: '100%'
         }}>
      <nav className="flex items-center justify-between text-white px-6 h-16 w-full rounded-full shadow-lg"
           style={{
             maxWidth: '60rem',
             width: '70%',
             backgroundColor: scrollPosition > 50 ? 'rgba(137, 138, 138, 0.95)' : '#898A8A',
             boxShadow: scrollPosition > 50 ? '0 2px 10px rgba(0, 0, 0, 0.1)' : 'none',
             backdropFilter: scrollPosition > 50 ? 'blur(8px)' : 'none',
             transition: 'background-color 0.3s, box-shadow 0.3s, backdrop-filter 0.3s'
           }}>
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img
              src="/ddn-logo.png"
              alt="DDN Logo"
              className="h-10 w-auto object-contain"
              style={{ transition: 'opacity 0.3s' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/ddn_tab_logo2.jpg";
              }}
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-5">
          <Link to="/monthly" className="text-white hover:text-gray-300 transition-colors duration-200 font-medium">
            Monthly Report
          </Link>
          <Link to="/bug-stats" className="text-white hover:text-gray-300 transition-colors duration-200 font-medium">
            Bug Stats
          </Link>
          <Link to="/bug-areas" className="text-white hover:text-gray-300 transition-colors duration-200 font-medium">
            Bug Areas
          </Link>

        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-20 rounded-lg shadow-xl z-50 md:hidden"
             style={{
               width: '90%',
               maxWidth: '60rem',
               left: '50%',
               transform: 'translateX(-50%)',
               margin: '0 auto',
               backgroundColor: '#898A8A'
             }}>
          <div className="flex flex-col py-2">
            <Link
              to="/monthly"
              className="px-4 py-3 text-white hover:bg-gray-600 transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Monthly Report
            </Link>
            <Link
              to="/bug-stats"
              className="px-4 py-3 text-white hover:bg-gray-600 transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Bug Stats
            </Link>
            <Link
              to="/bug-areas"
              className="px-4 py-3 text-white hover:bg-gray-600 transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Bug Areas
            </Link>

          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;



