const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/auth-controller');
const bearer = require('../middleware/bearer');

router.post('/', authCtrl.signup);
router.post('/login', authCtrl.login);
router.post('/logout', bearer, authCtrl.logout);

router.post('/delete-account/verify', bearer, authCtrl.deleteAccount);
router.post('/delete-account', bearer, authCtrl.preDeleteAccount);

module.exports = router;