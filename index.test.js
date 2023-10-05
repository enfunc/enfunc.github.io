const fs = require('fs');

describe('Enfunc', () => {
  test('matches snapshot', async () => {
    const html = fs.readFileSync('index.html', 'utf8');
    expect(html).toMatchSnapshot();
  });
});
