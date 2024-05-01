'use strict';
//Import
import * as pixabayMethods from './pixabay';
import throttle from 'lodash.throttle';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
const optionsNotify = {
  timeout: 2000,
};
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

//DOM
const form = document.querySelector('form#search-form');
const gallery = document.querySelector('div.gallery');

//Global variables
let query = '';
let currentPage = 1;
let lightbox;
let stopRenederingPage = false;
let lastScrollTop = 0;
let lastTouchY = 0;
//Listeners
//FormListener
form.addEventListener('submit', ev => {
  ev.preventDefault();
  gallery.innerHTML = null;
  query = ev.currentTarget.elements.searchQuery.value;
  currentPage = 1;
  stopRenederingPage = false;
  loadNextPage(query);
});

//------------------------------------

//--------------------------------------------
//Lodash
const handleScrollThrottled = throttle(() => {
  handleScroll();
}, 1500);
//WindowListener
window.addEventListener('scroll', handleScrollThrottled);
// window.addEventListener('touchend', event => {
//   const windowHeight = window.innerHeight;
//   const scrollHeight = document.documentElement.scrollHeight;
//   const scrollTop = window.scrrollY || document.documentElement.scrollTop;

//   // Obliczamy odległość od góry dokumentu do ostatniego obrazka
//   const lastImageOffset =
//     gallery.lastElementChild.offsetTop + gallery.lastElementChild.offsetHeight;

//   // Sprawdzamy czy ostatni obrazek jest widoczny na ekranie
//   const isLastImageVisible = lastImageOffset <= windowHeight + scrollTop;

//   // Jeśli ostatni obrazek jest widoczny i użytkownik przewinął stronę do końca, to ładujemy kolejną stronę obrazków
//   if (isLastImageVisible && windowHeight + scrollTop >= scrollHeight) {
//     const query = form.elements.searchQuery.value;
//     loadNextPage(query);
//   }
// });

//Funkcje
/**
 * loadNextPage
 * * Pobiera i renderuje kolejną stronę obrazków na podstawie podanego zapytania.
 * @param {string} query - Zapytanie wyszukiwania obrazków.
 * @returns {void}
 */
async function loadNextPage(query) {
  let messageNotify = '';
  pixabayMethods
    .fetchPicturesPerPage(query, currentPage)
    .then(picturesCollection => {
      if (picturesCollection.hits.length > 0 && !stopRenederingPage) {
        renderPictures(picturesCollection);
        if (currentPage === 1) {
          Notify.success(
            `Hooray! We found ${picturesCollection.totalHits} images.`,
            optionsNotify
          );
          //Lightbox
          lightbox = new SimpleLightbox('.gallery a', {
            captionsData: 'alt',
            captionDelay: 250,
          });
        } else {
          smoothScroll();
          //Lightbox
          lightbox.refresh();
        }
      } else {
        if (currentPage === 1) {
          messageNotify = `No results found. Try searching using different query data.`;
        } else {
          messageNotify = `We're sorry, but you've reached the end of search results.`;
          stopRenederingPage = true;
        }
        Notify.info(messageNotify, optionsNotify);
      }
      currentPage++;
    })
    .catch(error => {
      if (error.message.includes('400')) {
        messageNotify = `We're sorry, but you've reached the end of search results.`;
        Notify.info(messageNotify, optionsNotify);
      } else {
        messageNotify = error;
        Notify.failure(messageNotify, optionsNotify);
      }
    });
}

/**
 * renderPictures
 * * Renderuje obrazki na stronie na podstawie danych otrzymanych z serwera.
 * @param {object} dataPictures - Obiekt zawierający dane obrazków do wyrenderowania.
 * @param {array} dataPictures.hits - Tablica obiektów zawierających informacje o każdym obrazku.
 * @param {string} dataPictures.hits[].webformatURL - Adres URL obrazka w formacie web.
 * @param {string} dataPictures.hits[].largeImageURL - Adres URL obrazka w formacie dużego obrazu.
 * @param {string} dataPictures.hits[].tags - Tagi opisujące obrazek.
 * @param {number} dataPictures.hits[].likes - Liczba polubień obrazka.
 * @param {number} dataPictures.hits[].views - Liczba wyświetleń obrazka.
 * @param {number} dataPictures.hits[].comments - Liczba komentarzy pod obrazkiem.
 * @param {number} dataPictures.hits[].downloads - Liczba pobrań obrazka.
 * @returns {void}
 */
function renderPictures(dataPictures) {
  const markup = dataPictures.hits
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => {
        return `  <div class="photo-card">
          <a class="link-img" href="${largeImageURL}">
            <img src="${webformatURL}" alt="${tags}" loading="lazy" />
          
          <div class="info">
            <div>
              <p class="info-item">
                <b>Likes</b>
              </p>
              <p class="info-item">${likes}</p>
            </div>
            <div>
              <p class="info-item">
                <b>Views</b>
              </p>
              <p class="info-item">${views}</p>
            </div>
            <div>
              <p class="info-item">
                <b>Comments</b>
              </p>
              <p class="info-item">${comments}</p>
            </div>
            <div>
              <p class="info-item">
                <b>Downloads</b>
              </p>
              <p class="info-item">${downloads}</p>
            </div>
          </div>
          </a>
        </div>`;
      }
    )
    .join('');

  gallery.insertAdjacentHTML('beforeend', markup);
}

/**
 * handleScroll
 * * Obsługuje zdarzenie przewijania strony w dół, aby automatycznie wczytywać kolejną stronę obrazków, gdy użytkownik dojdzie do końca strony.
 * @returns {void}
 */
function handleScroll() {
  const { scrollTop, clientHeight, scrollHeight } = document.documentElement;
  if (
    scrollTop + clientHeight >= scrollHeight - 5 &&
    scrollTop > lastScrollTop
  ) {
    loadNextPage(query);
  }
  lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
}

/**
 * smoothScroll
 * * Funkcja realizująca płynne przewijanie strony o dwukrotność wysokości pierwszego elementu w galerii.
 * @returns {void}
 */
function smoothScroll() {
  const { height: cardHeight } = document
    .querySelector('.gallery')
    .firstElementChild.getBoundingClientRect();
  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}
