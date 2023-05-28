const server = require('http-server');

const serve = (port, root = './') => {
  const s = server.createServer({root: root})
  s.listen(port)
  return s
}

const content = {
  name: 'Enfunc',
  punchline: 'Unleashing potential, accelerating progress',
  desc: "Enfunc is a global tech consultancy specializing in tailored digital solutions, advisory, startup guidance, and funding, enabling businesses to thrive in the digital era.",
  url: "https://www.enfunc.com",
  logo: "https://www.enfunc.com/media/enfunc.png",
  title: 'Enfunc | Unleashing potential, accelerating progress',
  nav: ['What we do', 'Why us', 'Get in touch'],
  services: ['We code', 'We advise', 'We invest'],
  formUrl: 'https://formspree.io/f/moqzkrzl',
  logos: 11,
  accentColor: "#B2EFC1",
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
      'https://js.sentry-cdn.com/6d72b914e64e4d3c8488bbc1d22a2f75.min.js',
      `${baseUrl}/script.min.js`,
    ]
    const sources = await page.$$eval('script', els => els.map((el) => el.src));
    for (const src of js) {
      expect(sources).toContain(src);
    }
  });

  test('has the hero page', async () => {
    const h1 = await getText('h1');
    expect(h1).toBe(content.name);

    const h2 = await getText('h2');
    expect(h2).toBe(content.punchline);

    const txt = await getText('.hero p');
    expect(txt.length).toBeGreaterThan(100);

    const texts = await page.$$eval('.nav a', els => els.map(el => el.textContent));
    expect(texts).toEqual(content.nav);
  });

  test('has the correct services', async () => {
    const headings = await page.$$eval('.services h3', els => els.map(el => el.textContent));
    expect(headings).toEqual(content.services);

    const paras = await page.$$eval('.services p', els => els.map(el => el.textContent));
    paras.forEach((p) => {
      expect(p.length).toBeGreaterThan(280);
    })
  });

  test('has the correct us page', async () => {
    const paras = await page.$$eval('.us p', els => els.map(el => el.textContent));
    paras.forEach((p) => {
      expect(p.length).toBeGreaterThan(75);
    })
  });

  test('has the correct contact form', async () => {
    const action = await getAttr('form', 'action');
    expect(action).toBe(content.formUrl);

    const method = await getAttr('form', 'method');
    expect(method).toBe('POST');

    const send = await getText('button[type="submit"]');
    expect(send).toBe('Send');
  });

  test('has the correct number of logos', async () => {
    const logos = await page.$$('.footer .logos img');
    expect(logos.length).toBe(content.logos);
  });

  test('has the correct footer', async () => {
    const text = await getText('.footer p');
    expect(text.length).toBeGreaterThan(400);

    const year = new Date().getFullYear();
    const copy = await getText('.copy');
    expect(copy).toBe(`© ${year} ${content.name} AS. All rights reserved.`);
  });
});
