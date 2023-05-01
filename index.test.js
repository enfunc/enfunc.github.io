const server = require('http-server');

const serve = (port, root = './') => {
  const s = server.createServer({root: root})
  s.listen(port)
  return s
}

const content = {
  name: 'Enfunc',
  desc: "Enfunc provides top-notch software engineering, advisory, and funding support to help unlock your business's full potential.",
  url: "https://www.enfunc.com",
  logo: "https://www.enfunc.com/media/enfunc.png",
  title: 'Enfunc | Top-tier software, creativity, and zest.',
  services: [' We code', ' We advise', ' We invest'],
  formUrl: 'https://formspree.io/f/moqzkrzl',
  logos: 12,
  cta: " Let's chat",
  accentColor: "rgb(178, 239, 193)",
  complementColor: "rgb(239, 178, 224)",
}

const getText = async (selector) => await page.$eval(selector, el => el.textContent);
const getAttr = async (selector, attr) => await page.$eval(selector, (el, attr) => el.getAttribute(attr), attr);
const getStyleProperty = async (selector, prop) => await page.$eval(selector, (el, prop) => getComputedStyle(el).getPropertyValue(prop), prop);

describe('Enfunc', () => {
  let localhost;
  let baseUrl;

  beforeAll(async () => {
    const port = 8081;
    localhost = serve(port);
    baseUrl = `http://localhost:${port}`;
    await page.goto(baseUrl);
  });

  afterAll(() => {
    if (localhost) localhost.close();
  })

  test('has the correct metadata', async () => {
    const tags = {
      'property="og:title"': content.title,
      'name="description"': content.desc,
      'property="og:description"': content.desc,
      'property="og:image"': content.logo,
      'property="og:url"': content.url,
      'property="og:type"': 'website',
    };
    for (const tag of Object.keys(tags)) {
      const content = await getAttr(`meta[${tag}]`, 'content');
      expect(content).toBe(tags[tag]);
    }
  });

  test('has the correct title', async () => {
    const title = await getText('title');
    expect(title).toBe(content.title);
  });

  test('has the correct webmanifest', async () => {
    const link = await getAttr('link[rel="manifest"]', 'href');
    expect(link).toBe('site.webmanifest');
  });

  test('has the correct favicons', async () => {
    const tags = {
      'link[rel="icon"]': 'media/favicon.ico',
      'link[rel="apple-touch-icon"]': 'media/apple-touch-icon.png',
    }
    for (const tag of Object.keys(tags)) {
      const link = await getAttr(tag, 'href');
      expect(link).toBe(tags[tag]);
    }
  });

  test('has the correct ld+json', async () => {
    const keys = {
      name: content.name,
      description: content.desc,
      url: content.url,
      logo: content.logo,
    }
    const ldjson = await page.evaluate(() => {
      const tags = document.querySelectorAll('script[type="application/ld+json"]');
      if (tags.length > 1) throw new Error('unexpected count');
      return JSON.parse(tags[0].textContent);
    });
    for (const key of Object.keys(keys)) {
      expect(ldjson[key]).toBe(keys[key]);
    }
  });

  test('has the expected CSS', async () => {
    const css = [
      'https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css',
      'https://fonts.googleapis.com/css2?family=Bayon&family=Schibsted+Grotesk&display=swap',
      `${baseUrl}/style.min.css`
    ];
    const hrefs = await page.$$eval('link[rel="stylesheet"]', els => els.map((el) => el.href));
    for (const href of hrefs) {
      expect(css).toContain(href);
    }
  });

  test('has the expected JS', async () => {
    const js = [
      'https://enfunc.containers.piwik.pro/ppms.js',
      'https://browser.sentry-cdn.com/7.50.0/bundle.tracing.replay.min.js',
      'https://enfunc.containers.piwik.pro/4466da6e-a361-42fc-8ea2-e93fc3e9c75b.js',
      'https://kit.fontawesome.com/21547d334e.js',
      'https://js.sentry-cdn.com/6d72b914e64e4d3c8488bbc1d22a2f75.min.js',
      `${baseUrl}/script.min.js`,
    ];
    const srcs = await page.$$eval('script', els => els.map((el) => el.src));
    for (const src of srcs) {
      if (src) expect(js).toContain(src);
    }
  });

  test('has the correct header', async () => {
    const h1 = await getText('h1');
    expect(h1).toBe(content.name);

    const bg = await getStyleProperty('header', 'background-color');
    expect(bg).toBe(content.accentColor);
  });

  test('has the correct services', async () => {
    const headings = await page.$$eval('.services h2', els => els.map(el => el.textContent));
    expect(headings).toEqual(content.services);

    const paras = await page.$$eval('.services p', els => els.map(el => el.textContent));
    paras.forEach((p) => {
      expect(p.length).toBeGreaterThan(280);
    })
  });

  const ctaSelector = '.cta-button';

  test('has the correct CTA button', async () => {
    const bg = async () => await getStyleProperty(ctaSelector, 'background-color');

    const text = await getText(ctaSelector);
    expect(text).toBe(content.cta);

    expect(await bg()).toBe(content.accentColor);
    await page.hover(ctaSelector);
    expect(await bg()).toBe(content.complementColor);
  });

  test('has the expected CTA functionality', async () => {
    const display = async () => await page.$eval('.contact-overlay', el => el.style.display);

    expect(await display()).toBe('');
    await page.click(ctaSelector);
    expect(await display()).toBe('block');
    await page.click('.close');
    expect(await display()).toBe('none');
  });

  test('has the correct contact form', async () => {
    const action = await getAttr('form', 'action');
    expect(action).toBe(content.formUrl);

    const method = await getAttr('form', 'method');
    expect(method).toBe('POST');
  });

  test('has the correct number of logos', async () => {
    const logos = await page.$$('.logos img');
    expect(logos.length).toBe(content.logos);
  });

  test('has the correct footer', async () => {
    const text = await getText('footer p');
    expect(text.length).toBeGreaterThan(400);

    const year = new Date().getFullYear();
    const copy = await getText('.copy');
    expect(copy).toBe(`© ${year} ${content.name}. All rights reserved.`);
  });
});
