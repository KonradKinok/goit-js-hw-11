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
const footer = document.querySelector('footer');

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
  addClass(footer);
  gallery.innerHTML = null;
  query = ev.currentTarget.elements.searchQuery.value;
  currentPage = 1;
  stopRenederingPage = false;
  loadNextPage(query);
});

//Lodash
const handleScrollThrottled = throttle(() => {
  handleScroll(false);
}, 1500);
//WindowListener
window.addEventListener('scroll', handleScrollThrottled);
window.addEventListener('touchmove', () => {
  handleScroll(true);
});

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
          removeClass(footer);
        }
        Notify.info(messageNotify, optionsNotify);
      }
      currentPage++;
    })
    .catch(error => {
      if (error.message.includes('400')) {
        messageNotify = `We're sorry, but you've reached the end of search results.`;
        Notify.info(messageNotify, optionsNotify);
        removeClass(footer);
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
 * @param {boolean} isMobile - Sprawdzenie czy użytkownik obsługuje stronę na telefonie komórkowym.
 * @returns {void}
 */
function handleScroll(isMobile) {
  if (!isMobile) {
    const { scrollTop, clientHeight, scrollHeight } = document.documentElement;
    if (
      scrollTop + clientHeight >= scrollHeight - 5 &&
      scrollTop > lastScrollTop
    ) {
      loadNextPage(query);
    }
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  } else {
    const windowHeight = window.innerHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    const lastImageOffset =
      gallery.lastElementChild.offsetTop +
      gallery.lastElementChild.offsetHeight;

    const isLastImageVisible = lastImageOffset <= windowHeight + scrollTop;
    if (isLastImageVisible) {
      loadNextPage(query);
    }
  }
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

/**
 *addClass
 * * Dodaje klasę do określonego elementu HTML, jeśli nie jest już obecna.
 * @param {HTMLElement} nameTag - Element HTML, do którego ma być dodana klasa.
 * @param {string} className - Nazwa klasy do dodania (domyślnie 'hidden').
 * @returns {void}
 */
function addClass(nameTag, className = 'hidden') {
  if (!nameTag.classList.contains(className)) {
    nameTag.classList.add(className);
  }
}

/**
 *removeClass
 * * Usuwa określoną klasę z elementu HTML, jeśli jest obecna.
 * @param {HTMLElement} nameTag - Element HTML, z którego ma być usunięta klasa.
 * @param {string} className - Nazwa klasy do usunięcia (domyślnie 'hidden').
 * @returns {void}
 */
function removeClass(nameTag, className = 'hidden') {
  if (nameTag.classList.contains(className)) {
    nameTag.classList.remove(className);
  }
}
