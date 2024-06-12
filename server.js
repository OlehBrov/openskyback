const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const { nanoid } = require("nanoid");
const dotenv = require('dotenv');
const cors = require('cors');
dotenv.config();

const app = express();
const port = 3000;

const public_key = process.env.PUBLIC_KEY;
const private_key = process.env.PRIVATE_KEY;
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: https://static.liqpay.com https://stats.g.doubleclick.net");
    next();
});
app.post('/verify', (req, res) => {
 
    const receivedData = req.body.data;
    const receivedSignature = req.body.signature;

 
    const signString = private_key + receivedData + private_key;
    const sha1 = crypto.createHash('sha1');
    sha1.update(signString);
    const generatedSignature = sha1.digest('base64');

    
    if (generatedSignature === receivedSignature) {
        
        const decodedData = Buffer.from(receivedData, 'base64').toString('utf-8');
        const paymentData = JSON.parse(decodedData);
        
       
        console.log('Payment verified:');
        res.status(200).send('Payment verified');
    } else {
        // The signature is invalid
        console.error('Invalid signature');
        res.status(400).send('Invalid signature');
    }
})

app.get('/pay', (req, res) => {
    const date = Date.now()
    const id = nanoid(30)
    const orderId =  date + id

    const params = {
        public_key: public_key,
        action: 'pay',
        amount: req.query.payment,
        currency: 'UAH',
        description: "description text",
        order_id:orderId,
        version: '3',
        server_url: 'https://openskyback.onrender.com/verify',
        result_url: 'https://open-sky-2f780b.webflow.io'
    };

    const data = Buffer.from(JSON.stringify(params)).toString('base64');
    const signString = private_key + data + private_key;
    const sha1 = crypto.createHash('sha1');
    sha1.update(signString);
    const signature = sha1.digest('base64');
   
    res.json({ data, signature });
});

app.listen(port, () => {
    console.log(`LiqPay integration app listening at http://localhost:${port}`);
});
