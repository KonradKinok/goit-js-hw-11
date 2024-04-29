'use strict';
import axios from 'axios';
import * as pixabayMethods from './pixabay';

import { Notify } from 'notiflix/build/notiflix-notify-aio';
const optionsNotify = {
  timeout: 4000,
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
  getPromisePictures(query);
});

function getPromisePictures(query) {
  currentPage = 1;
  pixabayMethods
    .fetchAllPictures(query, currentPage)
    .then(picturesColection => {
      console.log(picturesColection);
      renderPictures(picturesColection);
    })
    .catch(error => {
      Notify.failure(`${error}`, optionsNotify);
    });
}

function renderPictures(dataPictures) {
  console.log(dataPictures.total, dataPictures.totalHits);
  Notify.success(
    `Hooray! We found ${dataPictures.totalHits} images.`,
    optionsNotify
  );
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
        console.log(tags);
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

const { height: cardHeight } =
  gallery.firstElementChild.getBoundingClientRect();

window.scrollBy({
  top: cardHeight * 2,
  behavior: 'smooth',
});

// Funkcja pobierająca kolejną stronę obrazków
function loadNextPage(query) {
  pixabayMethods
    .fetchAllPictures(query, currentPage) // Pobieramy kolejną stronę
    .then(picturesCollection => {
      renderPictures(picturesCollection);
      currentPage++; // Zwiększamy numer strony
    })
    .catch(error => {
      Notify.failure(`${error}`, optionsNotify);
    });
}

// Funkcja sprawdzająca, czy użytkownik zbliżył się do końca strony
function handleScroll() {
  const { scrollTop, clientHeight, scrollHeight } = document.documentElement;
  if (scrollTop + clientHeight >= scrollHeight - 5) {
    const query = form.elements.searchQuery.value;
    loadNextPage(query); // Wczytujemy kolejną stronę obrazków
  }
}

// Nasłuchujemy zdarzenia przewijania okna
window.addEventListener('scroll', handleScroll);
