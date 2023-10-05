#!/usr/bin/env node

import lighthouse from "lighthouse";
import fs from "fs";
import ccss from "clean-css";
import stylelint from "stylelint";
import * as htmlvalidate from 'html-validate';
import validateSiteManifest from "web-app-manifest-validator";
import {JSDOM} from "jsdom";
import puppeteer from "puppeteer";
import hs from "http-server";

const name = 'Enfunc';
const punchline = 'Unleashing potential, accelerating progress';
const logo = 'https://www.enfunc.com/media/enfunc.png';
const url = 'https://www.enfunc.com';
const email = 'hello@enfunc.com';
const description = 'Enfunc is a global tech consultancy specializing in tailored digital solutions, advisory, startup guidance, and funding, enabling businesses to thrive in the digital era.';
const logos = [
  {logo: "media/logo_stars.webp", name: "The Stars Group", url: "https://www.starsgroup.com/"},
  {logo: "media/logo_lloyds.webp", name: "Lloyds Banking Group", url: "https://www.lloydsbankinggroup.com/"},
  {logo: "media/logo_nhs.webp", name: "NHS", url: "https://www.nhs.uk/"},
  {logo: "media/logo_pfizer.webp", name: "Pfizer", url: "https://www.pfizer.com/"},
  {logo: "media/logo_auth0.webp", name: "Auth0", url: "https://auth0.com/"},
  {logo: "media/logo_array.webp", name: "Array", url: "https://www.array.com/"},
  {logo: "media/logo_celtra.webp", name: "Celtra", url: "https://www.celtra.com/"},
];

const analytics = `(function(window, document, dataLayerName, id) {
    window[dataLayerName]=window[dataLayerName]||[],window[dataLayerName].push({start:(new Date).getTime(),event:"stg.start"});var scripts=document.getElementsByTagName('script')[0],tags=document.createElement('script');
    function stgCreateCookie(a,b,c){var d="";if(c){var e=new Date;e.setTime(e.getTime()+24*c*60*60*1e3),d="; expires="+e.toUTCString();f="; SameSite=Strict"}document.cookie=a+"="+b+d+f+"; path=/"}
    var isStgDebug=(window.location.href.match("stg_debug")||document.cookie.match("stg_debug"))&&!window.location.href.match("stg_disable_debug");stgCreateCookie("stg_debug",isStgDebug?1:"",isStgDebug?14:-1);
    var qP=[];dataLayerName!=="dataLayer"&&qP.push("data_layer_name="+dataLayerName),isStgDebug&&qP.push("stg_debug");var qPString=qP.length>0?("?"+qP.join("&")):"";
    tags.async=!0,tags.src="https://enfunc.containers.piwik.pro/"+id+".js"+qPString,scripts.parentNode.insertBefore(tags,scripts);
    !function(a,n,i){a[n]=a[n]||{};for(var c=0;c<i.length;c++)!function(i){a[n][i]=a[n][i]||{},a[n][i].api=a[n][i].api||function(){var a=[].slice.call(arguments,0);"string"==typeof a[0]&&window[dataLayerName].push({event:n+"."+i+":"+a[0],parameters:[].slice.call(arguments,1)})}}(i[c])}(window,"ppms",["tm","cm"]);
  })(window, document, 'dataLayer', '4466da6e-a361-42fc-8ea2-e93fc3e9c75b');`

const manifest = {
  name,
  short_name: name,
  description,
  theme_color: "#B2EFC1",
  background_color: "#FFFFFF",
  display: 'standalone',
  orientation: 'portrait',
  scope: '/',
  start_url: '/',
  icons: [
    {src: "media/android-chrome-192x192.png", sizes: "192x192", type: "image/png"},
    {src: "media/android-chrome-512x512.png", sizes: "512x512", type: "image/png"},
  ]
};

const validateManifest = (manifest) => {
  const errors = validateSiteManifest(manifest);
  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
}

const ld = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name,
  url,
  logo,
  description,
  "contactPoint": {
    "@type": "ContactPoint",
    email,
  }
}

const validateCSS = async (css) => {
  const result = await stylelint.lint({
    code: css, config: {
      extends: 'stylelint-config-standard',
      rules: {
        "media-feature-range-notation": null,
      }
    }
  });
  if (result.errored) {
    throw new Error(result.output);
  }
}

const validateHTML = async (html) => {
  const validator = new htmlvalidate.HtmlValidate();
  const result = await validator.validateString(html, '', {extends: ['html-validate:recommended']});
  if (!result.valid) throw new Error(result.results[0].toString());
}

const validateLinks = async (html) => {
  const anchors = new JSDOM(html).window.document.querySelectorAll('a');
  const links = new Set([
    ...Array.from(anchors).map(anchor => anchor.href).filter(url => url.startsWith('http')),
    ...manifest.icons.map(icon => `${url}/${icon.src}`),
    url,
    logo,
  ]);
  for (const link of links) {
    console.log(`Validating ${link}`)
    const response = await fetch(link, {method: 'HEAD'});
    if (!response.ok) {
      throw new Error(`${link} returns ${response.status}`);
    }
  }
}

const validatePerformance = async (port = 8089) => {
  const s = hs.createServer();
  s.listen(port);

  const browser = await puppeteer.launch({
    product: 'chrome',
    headless: 'new',
    defaultViewport: null,
    args: [
      '--incognito',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--ignore-certificate-errors',
    ],
  });

  try {
    const result = await lighthouse(`http://localhost:${port}`, {
      output: 'html',
      port: new URL(browser.wsEndpoint()).port,
      logLevel: 'info',
    }, {
      extends: 'lighthouse:default',
      settings: {
        skipCategories: ['pwa'],
      },
    });
    const categories = result.lhr.categories;
    for (let category in categories) {
      if (categories[category].score < 0.9 && category !== 'pwa') {
        fs.writeFileSync('lhr.html', result.report);
        throw new Error(`${category} score is below 90%`)
      }
    }
  } finally {
    await browser.close();
    s.close()
  }
};

const run = async () => {
  await validateManifest(manifest);
  console.log('Manifest is valid.');

  const css = fs.readFileSync('bin/style.css', 'utf8');
  await validateCSS(css);
  console.log('CSS is valid.');

  const keys = {
    $name: name,
    $punchline: punchline,
    $logo: logo,
    $url: url,
    $email: email,
    $description: description,
    $manifest: btoa(JSON.stringify(manifest)),
    $ld: JSON.stringify(ld, null, 2),
    $css: new ccss().minify(css).styles,
    $logos: logos.reduce((acc, {
      name,
      url,
      logo
    }) => acc + `<a href="${url}" target="_blank"><img src="${logo}" alt="${name}" title="${name}"></a>`, ''),
    $analytics: analytics,
  }

  const html = fs.readFileSync('bin/index.template', 'utf8')
    .replace(/\$([a-z]+)/g, (_, key) => keys[`$${key}`]);
  await validateHTML(html);
  console.log('HTML is valid.');

  await validateLinks(html);
  console.log('All links are valid.');

  fs.writeFileSync('./index.html', html);
  await validatePerformance()
  console.log('Website generated.');
}

(async () => {
  try {
    await run();
  } catch (e) {
    console.error(e);
  }
})();
