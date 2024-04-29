'use strict';
import axios from 'axios';
import * as pixabayMethods from './pixabay';
import throttle from 'lodash.throttle';

import { Notify } from 'notiflix/build/notiflix-notify-aio';
const optionsNotify = {
  timeout: 3000,
};

import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const form = document.querySelector('form#search-form');
const gallery = document.querySelector('div.gallery');

let currentPage = 1;

form.addEventListener('submit', ev => {
  ev.preventDefault();
  gallery.innerHTML = null;
  const query = ev.currentTarget.elements.searchQuery.value;
  console.log(query);
  currentPage = 1;
  loadNextPage(query);
});

// Funkcja pobierająca kolejną stronę obrazków wieża kamienna morze
function loadNextPage(query) {
  console.log('loadNextPage', query);
  pixabayMethods
    .fetchPicturesPerPage(query, currentPage) // Pobieramy kolejną stronę
    .then(picturesCollection => {
      console.log(
        'picturesCollection.hits.length',
        picturesCollection.hits.length
      );
      if (picturesCollection.hits.length > 0) {
        renderPictures(picturesCollection);
        if (currentPage === 1) {
          Notify.success(
            `Hooray! We found ${picturesCollection.totalHits} images.`,
            optionsNotify
          );
        } else {
          smoothScroll();
        }
      } else {
        if (currentPage === 1) {
          Notify.info(
            `No results found. Try searching using different query data.`,
            optionsNotify
          );
        } else {
          Notify.info(
            `We're sorry, but you've reached the end of search results.`,
            optionsNotify
          );
        }
      }

      currentPage++;
      console.log('currentPage', currentPage);
    })
    .catch(error => {
      if (error.message.includes('400')) {
        Notify.info(
          `We're sorry, but you've reached the end of search results.`,
          optionsNotify
        );
      } else {
        Notify.failure(`${error}`, optionsNotify);
      }
    });
}
function renderPictures(dataPictures) {
  console.log(dataPictures.total, dataPictures.totalHits);

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
        </div>`;
      }
    )
    .join('');

  gallery.insertAdjacentHTML('beforeend', markup);
}

// Funkcja sprawdzająca, czy użytkownik zbliżył się do końca strony
function handleScroll() {
  const { scrollTop, clientHeight, scrollHeight } = document.documentElement;
  if (scrollTop + clientHeight >= scrollHeight - 5) {
    const query = form.elements.searchQuery.value;
    loadNextPage(query); // Wczytujemy kolejną stronę obrazków
  }
}
const handleScrollThrottled = throttle(() => {
  handleScroll();
}, 1500); // 200 ms opóźnienia
// Nasłuchujemy zdarzenia przewijania okna
window.addEventListener('scroll', handleScrollThrottled);

function smoothScroll() {
  const { height: cardHeight } = document
    .querySelector('.gallery')
    .firstElementChild.getBoundingClientRect();
  console.log('cardHeight', cardHeight);
  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}
