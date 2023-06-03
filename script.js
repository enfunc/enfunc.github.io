const sendForm = async (target) => {
  const {action, method} = target;
  try {
    const response = await fetch(action, {
      method: method,
      body: new FormData(target),
      headers: {
        'Accept': 'application/json',
      },
    });
    return response.ok;
  } catch (error) { // ¯\_(ツ)_/¯
  }
  return false;
};

const swapNode = (fst, snd) => {
  const p = snd.parentNode;
  const s = snd.nextElementSibling;
  fst.replaceWith(snd);
  p.insertBefore(fst, s);
};

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelector(this.getAttribute('href')).scrollIntoView({
        behavior: 'smooth',
      });
    });
  });

  const mql = window.matchMedia('(orientation: landscape) and (width >= 1170px)');
  const mid = document.querySelector('.mid');
  const swapIfLandscape = (e) => {
    if (e.matches) {
      swapNode(mid, mid.nextElementSibling);
    }
  };

  swapIfLandscape(mql);
  mql.addEventListener('change', swapIfLandscape);

  const year = new Date().getFullYear();
  document.querySelector('.year').textContent = year.toString();

  const form = document.querySelector('form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let message = 'Oops! There was a problem, please try again!';
    if (await sendForm(e.target)) {
      message = 'Thanks! We will be in touch shortly!';
      form.reset();
    }
    document.querySelector('.form-status').textContent = message;
  });
});
