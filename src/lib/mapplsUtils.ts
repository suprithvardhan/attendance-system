import axios from 'axios';

const MAPPLS_API_KEY = process.env.NEXT_PUBLIC_MAPPLS_API_KEY;

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await axios.get(`https://apis.mapmyindia.com/advancedmaps/v1/${MAPPLS_API_KEY}/rev_geocode?lat=${lat}&lng=${lng}`);
    return response.data.results[0].formatted_address;
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    return 'Unknown location';
  }
}