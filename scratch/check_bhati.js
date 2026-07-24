const http = require('http');

http.get('http://localhost:5000/api/cms/landing-page', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log("CMS HERO TEXTBLOCKS:", JSON.stringify(json?.data?.hero?.textBlocks, null, 2));
    } catch (e) {
      console.log("RAW:", data);
    }
  });
}).on('error', err => console.error(err));
