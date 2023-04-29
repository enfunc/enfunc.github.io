async function sendForm(event) {
  const {action, method} = event.target;
  try {
    const response = await fetch(action, {
      method: method,
      body: new FormData(event.target),
      headers: {
        'Accept': 'application/json',
      },
    });
    return response.ok;
  } catch (error) { // ¯\_(ツ)_/¯
  }
  return false;
}

function loadImage(src, cb) {
  const image = new Image();
  image.addEventListener('load', () => cb(src));
  image.src = src;
}

function isNetworkFast() {
  const conn = navigator.connection;
  if (conn) {
    return conn.type === 'wifi' || conn.type === 'ethernet' || conn.effectiveType === '4g';
  }
  return true;
}

function backgroundImage(base = window.location.href) {
  const images = ['/media/bg_1.jpg', '/media/bg_2.jpg', '/media/bg_3.jpg'];
  const rand = Math.floor(Math.random() * images.length);
  return new URL(images[rand], base);
}

document.addEventListener('DOMContentLoaded', () => {
  const screenQuery = window.matchMedia('(min-width: 80em)');
  const updateBackground = (mql) => {
    const main = document.querySelector('main');
    if (mql.matches && isNetworkFast()) {
      loadImage(backgroundImage(), (src) => {
        main.style.background = `linear-gradient(to bottom, rgba(255, 255, 255, 1) 40%, rgba(255, 255, 255, 0) 100%), url("${src}")`;
        main.style.backgroundSize = 'cover';
      });
    } else {
      main.style.background = 'none';
    }
  };
  screenQuery.addEventListener('change', updateBackground);
  updateBackground(screenQuery);

  const year = new Date().getFullYear();
  document.querySelector('.year').textContent = year.toString();

  const contact = document.querySelector('.cta-button');
  const close = document.querySelector('.close');
  const overlay = document.querySelector('.contact-overlay');
  contact.addEventListener('click', () => overlay.style.display = 'block');
  close.addEventListener('click', () => overlay.style.display = 'none');

  const form = document.querySelector('.form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let message = 'Oops! There was a problem, please try again!';
    if (await sendForm(e)) {
      message = 'Thanks! We will be in touch shortly!';
      form.reset();
    }
    document.querySelector('.form-status').textContent = message;
  });
});
