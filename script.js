async function handleSubmit(form, status, event) {
  event.preventDefault();

  const data = new FormData(event.target);
  const {action, method} = event.target;

  let inner = 'Oops! There was a problem, please try again!';
  try {
    const response = await fetch(action, {
      method: method,
      body: data,
      headers: {
        'Accept': 'application/json'
      }
    });
    if (response.ok) {
      inner = "Thanks! We'll be in touch shortly!";
      form.reset();
    }
  } catch (error) {
    // ¯\_(ツ)_/¯
  }
  status.textContent = inner;
}

document.addEventListener('DOMContentLoaded', () => {
  const year = new Date().getFullYear();
  document.querySelector('.year').textContent = year.toString();

  const contact = document.querySelector('.cta-button');
  const close = document.querySelector('.close');
  const overlay = document.querySelector('.contact-overlay');
  contact.addEventListener('click', () => {
    overlay.style.display = 'block';
  });
  close.addEventListener('click', () => {
    overlay.style.display = 'none';
  });

  const form = document.querySelector('.form');
  form.addEventListener('submit', (e) => {
    const status = document.querySelector('.form-status');
    handleSubmit(form, status, e);
  });
});
