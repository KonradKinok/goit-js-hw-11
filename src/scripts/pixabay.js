'use strict';
import axios from 'axios';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
const optionsNotify = {
  timeout: 4000,
};
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
const apiKey = '43602379-82b2565bd0b0a0b53c6c265a8';

/**fetchCatByBreed
 *
 * @param {string} breedId
 * @returns object
 */
export async function fetchAllPictures(query, currentPage) {
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
  console.log(url);
  const response = await axios.get(url);
  return response.data;
}
