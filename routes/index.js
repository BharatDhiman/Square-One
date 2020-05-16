const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');

//Welcome
router.get('/', (req,res) => res.render('welcome'));

//Menu
router.get('/menu', (req,res) => res.render('menu'));

//Dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) => 
    res.render('dashboard', {
        user: req.user
    }));
    

// router.post('/dashboard', ensureAuthenticated, (req, res) =>{
//     const price = req.body.price;
//     if(price < req.user.balance){
//         console.log('you can buy it');
//     }
//     else{
//         res.send('hellooooo');
//     }
// });



module.exports = router;