import { useEffect } from 'react';

interface GoogleImageSearchProps {
  searchEngineId: string;
}

export const GoogleImageSearch: React.FC<GoogleImageSearchProps> = ({ searchEngineId }) => {
  useEffect(() => {
    // Load the Google Custom Search script
    const script = document.createElement('script');
    script.src = `https://cse.google.com/cse.js?cx=${searchEngineId}`;
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup: remove the script when component unmounts
      document.head.removeChild(script);
    };
  }, [searchEngineId]);

  return (
    <div className="gcse-search"></div>
  );
};
