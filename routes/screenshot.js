const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const puppeteer = require('puppeteer');

require('dotenv').config();

var credentials = new AWS.SharedIniFileCredentials({ profile: 'digitalocean' });
AWS.config.credentials = credentials;
var ep = new AWS.Endpoint('fra1.digitaloceanspaces.com');

const S3 = new AWS.S3({
  accessKeyId: process.env.ACCESS_ID,
  secretAccessKey: process.env.ACCESS_SECRET,
  endpoint: ep,
});

router.post('/', async (req, res) => {
  const { address, exactId, cardId, userId } = req.body;

  let url = address;

  // Perform URL validation
  if (!url || !url.trim()) {
    res.json({
      status: 'error',
      error: 'Enter a valid URL',
    });

    return;
  }

  let browser = null;
  let page = null;

  try {
    console.log('Launching...' + address);

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        "--proxy-server='direct://'",
        '--proxy-bypass-list=*',
      ],
      defaultViewport: {
        width: 150,
        height: 275,
      },
      ignoreHTTPSErrors: true,
      timeout: 15000,
    });

    console.log('Creating page...' + address);
    page = await browser.newPage();
    await page.setViewport({
      height: 275,
      width: 150,
    });

    console.log('Created, setting other data...' + address);

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36'
    );
    await page.setDefaultNavigationTimeout(0);

    try {
      console.log('Trying...' + address);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
      console.log('Goto complete...' + address);
      const imageBuffer = await page.screenshot();
      console.log('Screenshot taken...' + address);

      await page.close();
      await browser.close();

      console.log('Closed....' + address);

      const params = {
        Bucket: process.env.BUCKET,
        Key: `user-files/images/${userId}/${cardId}/${exactId}/screenshot.jpg`,
        Body: imageBuffer,
        ACL: 'public-read',
        ContentType: 'image/jpg',
      };

      S3.upload(params, (error, data) => {
        if (error) {
          res.status(500).send('Error');
        }
        //console.log(data.Location);
        res.status(200).json({ path: data.Location });
      });
    } catch (error) {
      console.log(error);
      await page.close();
      await browser.close();
    }

    // upload this buffer on AWS S3
  } catch (error) {
    console.log(error);

    if (browser !== null) {
      await browser.close();
    }

    if (page !== null) {
      await page.close();
    }

    res.status(400).json({
      status: 'error',
      data: error.message || 'Something went wrong',
    });
    // return callback(error);
  }
});

//We need to export the router
module.exports = router;
