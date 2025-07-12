import { useEffect, useState } from 'react';

const IP_API_URL = 'https://api.ipify.org?format=json';
const GEO_API_URL = 'http://ip-api.com/json/';

interface GeoData {
  country_code: string;
  currency: string;
}

export const useGeoLocalization = () => {
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGeoData = async () => {
      try {
        // Step 1: Get user's IP address
        const ipResponse = await fetch(IP_API_URL);
        const ipData = await ipResponse.json();
        const userIp = ipData.ip;
        
        // Step 2: Get geo data from IP
        const geoResponse = await fetch(`${GEO_API_URL}${userIp}`);
        const geoData = await geoResponse.json();

        if (geoData.status === 'success') {
          // Fallback to default currency if geo data doesn't provide one
          setGeoData({
            country_code: geoData.countryCode,
            currency: geoData.currency || 'THB',
          });
        } else {
          throw new Error('Failed to retrieve geo data from API.');
        }

      } catch (error) {
        console.error('Failed to fetch geo-location data:', error);
        // Fallback to a default currency if detection fails
        setGeoData({
          country_code: 'TH',
          currency: 'THB',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchGeoData();
  }, []);

  return { geoData, isLoading };
};