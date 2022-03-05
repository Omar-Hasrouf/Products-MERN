const express = require('express')
const router = express.Router();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config()

function generateAccessToken() {
    return jwt.sign({authorized: true}, process.env.JWT_SECRET, { expiresIn: '2h' });
}

router.use(express.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.post('/login', (req, res) => {

    const password = req.body.password;

    if (password === process.env.AUTH_PASSWORD) {
        const token = generateAccessToken();
        res.json(token);
    } else
        res.status(400).json({ 'message': 'Bad request' });

});

router.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

module.exports = router;