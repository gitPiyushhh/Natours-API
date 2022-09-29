//////////////// ENTRY POINT FOR OUR APPLICATION /////////////////////

// This file if for getting the data from the user & delegate the actions
import { login } from './login';
import { logout } from './login';

// DOM ELEMENTS
const loginForm = document.querySelector('.form');
const logOutBtn = document.querySelector('.nav__el--logout');

// VALUES
// const email = document.getElementById('email').value;
// const password = document.getElementById('password').value;      // BUG: Will not work coz we have these values not yet defined in the code


if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}


if(logOutBtn) {
  logOutBtn.addEventListener('click', logout)
}