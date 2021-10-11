const express = require('express');
const router = express.Router();

router.get('/eecs', (req, res) => {
    res.render('eecs');
})

module.exports = router;
