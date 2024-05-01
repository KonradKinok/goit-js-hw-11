'use strict';
//Import
import axios from 'axios';
//ApiKey
const apiKey = '43602379-82b2565bd0b0a0b53c6c265a8';

//Functions
/**
 * fetchPicturesPerPage
 * @param {string} query - Zapytanie wyszukiwania obrazów
 * @param {number} currentPage - Numer bieżącej strony
 * @returns {Promise<object>} Obiekt zawierający dane o obrazach
 */
export async function fetchPicturesPerPage(query, currentPage) {
  const searchParams = new URLSearchParams({
    key: apiKey,
    q: query,
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: 'true',
    per_page: 40,
    page: currentPage,
  });
  const url = `https://pixabay.com/api/?${searchParams}`;
  const response = await axios.get(url);
  return response.data;
}
