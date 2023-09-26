const express = require('express');
const router = express.Router();
const socialsCtrl = require('../controllers/socials-controller');

router.post('/pk', socialsCtrl.setPublicKey);
router.post('/pk/of/:id', socialsCtrl.getPublicKey);

module.exports = router;