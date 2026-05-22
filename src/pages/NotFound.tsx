import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0C0E12]">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-[#F7F7F7]">404</h1>
        <p className="text-xl text-[#94979C] mb-4">Oops! Page not found</p>
        <a href="/" className="text-[#75E0A7] hover:text-[#75E0A7]/80 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
