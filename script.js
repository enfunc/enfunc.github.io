async function sendForm(target) {
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
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelector(this.getAttribute('href')).scrollIntoView({
        behavior: 'smooth',
      });
    });
  });

  const year = new Date().getFullYear();
  document.querySelector('.year').textContent = year.toString();

  const form = document.querySelector('.form');
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
