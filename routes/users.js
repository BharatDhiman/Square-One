const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { ensureAuthenticated } = require('../config/auth');
const fetch = require("node-fetch");
const nodemailer = require('nodemailer');

const Nexmo = require('nexmo');

//INIT nexmo
const nexmo = new Nexmo({
    apiKey: '0e396221',
    apiSecret: 'ylyNNQRQO7VbPA7g'
}, { debug: true });

//gmail transporter
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'squareone199@gmail.com',
        pass: 'GMAILkapwd'
    }
});

// User model
const User = require('../models/User');

//Login page
router.get('/login', (req, res) => res.render('login'));

//Register page
router.get('/register', (req, res) => res.render('register'));

// Dashboard
router.get('/dashboard', (req, res) => res.render('dashboard'));

//Recharge
router.get('/recharge', ensureAuthenticated, (req, res) =>
    res.render('recharge', {
        user: req.user
    }));

// Admins Recharge Request
router.get('/rechargereq', ensureAuthenticated,(req, res) => 
res.render('rechargereq',{
    user: req.user
}));

// Profile
router.get('/profile', ensureAuthenticated, (req, res) => 
res.render('profile',{
    user: req.user
})
);

// Edit profile
router.get('/editprofile', ensureAuthenticated, (req, res) =>
    res.render('editprofile', {
        user: req.user
    })
);

// Previous Order
router.get('/prevorder', ensureAuthenticated, (req, res) =>
res.render('prevorder',{
    user: req.user
})
);

//Change Password
router.get('/changepwd', ensureAuthenticated, (req, res) =>
    res.render('changepwd', {
        user: req.user
    })
);


// Register Handle
router.post('/register', (req,res) =>{
    const { name, rollnumber, email, password, password2, gender, dob, contactnumber } = req.body;

    let errors = [];

    // Check required fields
    if(!name || !email || !password || !password2 || !gender || !dob || !contactnumber){
        errors.push({ masg: 'Please fill in all fields' });
    }


    // Check passwords match
    if(password != password2){
        errors.push( { msg: 'Passwords do not match' });
    }

    // Check pass length
    if(password.length < 6){
        errors.push( { msg: 'Password should be atleast 6 characters' });
    }

    if(errors.length > 0){
        res.render('register', {
            errors,
            name,
            rollnumber,
            email,
            password,
            password2,
            gender,
            dob,
            contactnumber

        });
    }
    else{
      // Validation passed
        User.findOne({ email:email })
        .then(user =>{
            if(user){
                //user exist
                errors.push({ msg: 'Email is already registered' });
                res.render('register', {
                    errors,
                    name,
                    rollnumber,
                    email,
                    password,
                    password2,
                    gender,
                    dob,
                    contactnumber
                });
            }
            else{
                const newUser = new User({
                    name,
                    rollnumber,
                    email,
                    password,
                    gender,
                    dob,
                    contactnumber 
                });


                // hash password
                bcrypt.genSalt(10, (err, salt) => bcrypt.hash(newUser.password, salt, (err, hash) =>{
                    if(err) throw err;
                    // Set password to hash
                    newUser.password = hash;
                    newUser.balance = 0;

                    newUser.isAdmin = false;
                    // Save User
                    newUser.save()
                    .then(user => {
                        req.flash('success_msg', 'You are now registered and can Login');
                        res.redirect('/users/login');
                    })
                    .catch( err => console.log(err));
                }))
            }
        });
    }

});


// Recharge
router.post('/recharge',ensureAuthenticated, (req, res) =>{

    User.findOne({ isAdmin: true }, (err, foundObject)=>{
        if(err){
            console.log(err);
        }
        else{
            const amount = req.body.amount;
            var obj = {amount:amount,email:req.user.email,contact:req.user.contactnumber};
            foundObject.rechargeReq.push(obj);

            foundObject.save((err, updt) => {
                if (err) {
                    req.flash('error_msg', 'Recharge Failed');
                    res.redirect('/recharge');
                }
                else {

                    req.flash('success_msg', 'Recharge Request has been sent!');
                    res.redirect('/dashboard');
                }
            });
        }

    })
        
        
    
    
});


// Accpet recharge request
router.post('/acceptrech', ensureAuthenticated, (req, res) =>{
const { contact, email, amount } = req.body;


User.findOne({ email:email }, (err, foundObject) =>{
    if(err)
    {
        console.log(err);
    }
    else{
        var x=parseInt(amount);
        foundObject.balance += x;
        var i=0;
        var pos;
        for(i=0;i<req.user.rechargeReq.length;i++)
        {
            if(req.user.rechargeReq[i].email==email)
            {
                pos=i;
                break;
            }
        }
        req.user.rechargeReq.splice(i,1);
        var arr=[];

        for (i = 0; i < req.user.rechargeReq.length; i++){
            arr.push(req.user.rechargeReq[i]);
        }

       


        foundObject.save((eror, updt) => {
            if (eror) {
                req.flash('error_msg', 'Recharge Failed');
                res.redirect('/users/rechargereq');
            }
            else {
                User.findOne({ isAdmin: true }, (er, findo) => {
                    if (er) {
                        console.log(er);
                    }
                    else {
                        findo.rechargeReq = arr;
                        findo.save((eror, updt) => {
                            if (eror) {
                                console.log(eror);
                            }
                            else {

                                console.log('Recharge request updated');
                            }
                        });
                    }
                });




                var number = contact;
               
                const text = "Recharge Successful of Rs."+amount;

/*
                nexmo.message.sendSms(
                    '918360056128', number, text, { type: 'unicode' },
                    (errorr, responseData) => {
                        if (errorr) {
                            console.log(errorr);
                        }
                        else {
                            console.dir(responseData);
                            // Get data from response
                            const data = {
                                id: responseData.messages[0]['message-id'],
                                number: responseData.messages[0]['to']
                            }

                        }
                    });

*/
                var mailOptions = {
                    from: 'squareone199@gmail.com',
                    to: req.body.email,
                    subject: 'Recharge Successful',
                    text: "Your Recharge Request of Rs."+amount+" has been accepted."
                };

                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Accepted Recharge email sent: ' + info.response);
                    }
                });




                req.flash('success_msg', 'Recharge Successful');
                res.redirect('/users/rechargereq');
            }
        });
    }
});

});



// Reject recharge request
router.post('/rejectrech', ensureAuthenticated, (req, res) =>{
    const { contact, email, amount } = req.body;
    User.findOne({ email: email }, (err, foundObject) => {
        if (err) {
            console.log(err);
        }
        else {
            
            var i = 0;
            var pos;
            for (i = 0; i < req.user.rechargeReq.length; i++) {
                if (req.user.rechargeReq[i].email == email) {
                    pos = i;
                    break;
                }
            }
            req.user.rechargeReq.splice(i, 1);
            var arr = [];

            for (i = 0; i < req.user.rechargeReq.length; i++) {
                arr.push(req.user.rechargeReq[i]);
            }

            User.findOne({ isAdmin: true }, (er, findo) => {
                if (er) {
                    console.log(er);
                }
                else {
                    findo.rechargeReq = arr;
                    findo.save((eror, updt) => {
                        if (eror) {
                            console.log(eror);
                        }
                        else {

                            console.log('Recharge request updated');
                        }
                    });
                }
            });



            foundObject.save((eror, updt) => {
                if (eror) {
                    req.flash('error_msg', 'Rejection Failed');
                    res.redirect('/users/rechargereq');
                }
                else {


                    var number = contact;
                    
                    const text = "Recharge Unsuccessfull";

/*
                    nexmo.message.sendSms(
                        '918360056128', number, text, { type: 'unicode' },
                        (errorr, responseData) => {
                            if (errorr) {
                                console.log(errorr);
                            }
                            else {
                                console.dir(responseData);
                                // Get data from response
                                const data = {
                                    id: responseData.messages[0]['message-id'],
                                    number: responseData.messages[0]['to']
                                }

                            }
                        });*/

                    var mailOptions = {
                        from: 'squareone199@gmail.com',
                        to: req.body.email,
                        subject: 'Recharge Unsuccessful',
                        text: "Your Recharge Request of Rs."+amount+" has been rejected"
                    };

                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log('Rejected Recharge email sent: ' + info.response);
                        }
                    });





                    req.flash('success_msg', 'Recharge Rejected');
                    res.redirect('/users/rechargereq');
                }
            });
        }
    });
 


});


// user details
router.post('/usr', (req, res) =>{
    User.find({}, function (err, usr) {
        var userMap = {};
        var k = 0;
        usr.forEach(function (user) {
            userMap[k++] = user;
            // console.log(user);
        });
        //console.log(userMap);
        // console.log(k);
        res.render('usr', { userMap });

});

});

// Edit Profile
router.post('/editprofile', ensureAuthenticated, (req, res) =>{
// console.log(req.body);
const { name, rollnumber, contactnumber, gender } = req.body;

User.findOne({email:req.user.email}, (err,foundObject) =>{
if(err)
{
    console.log(err);
}
else{
    foundObject.name=name;
    foundObject.rollnumber=rollnumber;
    foundObject.contactnumber = contactnumber;
    foundObject.gender = gender;

    foundObject.save((err, updt) =>{
        if(err)
        {
            req.flash('error_msg', 'Profile Updation Failed!');
            res.redirect('/users/profile');
        }
        else{
            req.flash('success_msg', 'Profile Updated Successfully');
            res.redirect('/users/profile');
        }
    })
}
});


});



var ar=[];

// order details
router.post('/orderhistory', ensureAuthenticated, (req, res) =>{
  //  console.log(req.body);
  const { noodles,manchurian,friedrice,cheesechilly,rajmachawal,shahipaneer,daalmakhani,mixveg,price } = req.body;
    const balance = req.user.balance;
    
  User.findOne({email:req.user.email},(err,foundObject) =>{
      if(err){
          console.log(err);
      }
      else{
        // console.log(foundObject.prevorder);
        var arr=[];
        
          if(noodles){
              foundObject.orders.push({item:'Noodles',quant:noodles});
              arr.push({ item: 'Noodles', quant: noodles });
          }
          if(manchurian){
              foundObject.orders.push({ item: 'Manchurian', quant: manchurian});
              arr.push({ item: 'Manchurian', quant: manchurian });
          }
          if(friedrice){
              foundObject.orders.push({ item: 'Fried Rice', quant: friedrice});
              arr.push({ item: 'Fried Rice', quant: friedrice });
          }
          if(cheesechilly){
              foundObject.orders.push({ item: 'Cheese Chilly', quant: cheesechilly});
              arr.push({ item: 'Cheese Chilly', quant: cheesechilly });
          }
          if(rajmachawal){
              foundObject.orders.push({ item: 'Rajma Chawal', quant: rajmachawal});
              arr.push({ item: 'Rajma Chawal', quant: rajmachawal });
          }
          if(shahipaneer){
              foundObject.orders.push({ item: 'Shahi Paneer', quant: shahipaneer});
              arr.push({ item: 'Shahi Paneer', quant: shahipaneer });
          }
          if(daalmakhani){
              foundObject.orders.push({ item: 'Daal Makhani', quant: daalmakhani});
              arr.push({ item: 'Daal Makhani', quant: daalmakhani });
          }
          if(mixveg){
              foundObject.orders.push({ item: 'Mix Veg', quant: mixveg});
              arr.push({ item: 'Mix Veg', quant: mixveg });
          }
        /*  foundObject.prevorder.push(arr);
          foundObject.save((err,updt) =>{
            if(err){
                console.log(err);
            }
            else{
                console.log('Order added');
            }
          });*/
          ar=arr;
      }
  })
    
});

//price
router.post('/prc', ensureAuthenticated, (req, res) => {
    //const {price} =req.body;
    // const v = JSON.stringify(req.body);
    // console.log(v);


    const price = req.body.price;
    const balance = req.user.balance;
    // console.log(price);
    // console.log(req.user.balance);

    if (price > balance) {
        req.flash('error_msg', 'Insufficient Balance');
        res.redirect('/dashboard')
    }
    else {
        var diff = balance - price;
        User.findOne({ email: req.user.email }, (err, foundObject) => {

            if (err) {
                console.log(err);

            }
            else {

                foundObject.balance = req.user.balance - price;
                foundObject.prevorder.push(ar);
                foundObject.save((err, updt) => {
                    if (err) {
                        req.flash('error_msg', 'Order Failed');
                        res.redirect('/dashboard');
                    }
                    else {


                       /* //send order details to contact number
                       var number = req.user.contactnumber;
                        number = number + 910000000000;
                        const text = "order completed paid Rs." + price + " Bal: Rs" + diff + ".";


                        nexmo.message.sendSms(
                            '918360056128', number, text, { type: 'unicode' },
                            (err, responseData) => {
                                if (err) {
                                    console.log(err);
                                }
                                else {
                                    console.dir(responseData);
                                    // Get data from response
                                    const data = {
                                        id: responseData.messages[0]['message-id'],
                                        number: responseData.messages[0]['to']
                                    }

                                }
                            });



                        req.flash('success_msg', 'Order Completed!');
                        res.redirect('/dashboard');*/


                        var mailOptions = {
                            from: 'squareone199@gmail.com',
                            to: req.user.email,
                            subject: 'Order Confirmation',
                            text: "order completed paid Rs." + price + " Bal: Rs" + diff + "."
                        };

                        transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                                console.log(error);
                            } else {
                                console.log('Email sent: ' + info.response);
                            }
                        });

                        req.flash('success_msg', 'Order Completed!');
                        res.redirect('/dashboard');
                    }
                });
            }
        })



    }

})



//otp send
router.post('/otpsend',ensureAuthenticated, (req,res)=>{
    const email = req.body.email;
    const text = req.body.onetp;


    var mailOptions = {
        from: 'squareone199@gmail.com',
        to: req.user.email,
        subject: 'OTP Verification',
        text: "Your One Time Password is " + text 
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
            console.log('Nahi chla');
        } else {
            console.log('Recharge otp sent with '+text +"  " +info.response);
        }
    });
});


//change password
router.post('/changepwd', ensureAuthenticated, (req, res) =>{

    const { password1, password2 } = req.body;

    User.findOne({ email: req.user.email }, (err, foundObject) => {

        if (err) {
            console.log(err);
            res.status(500).send();
        }
        else {
            bcrypt.compare(password1, foundObject.password, (err, isMatch) => {
                if (err) {
                    req.flash('error_msg', 'Please Enter Correct Password!');
                    res.redirect('/users/changepwd');
                }

                if (isMatch) {
                    if (password2.length < 6) {
                        req.flash('error_msg', 'New Password must be greater than or equal to 6 characters!');
                        res.redirect('/users/changepwd');
                    }
                    else {
                        bcrypt.genSalt(10, (err, salt) => bcrypt.hash(password2, salt, (err, hash) => {
                            if (err) throw err;
                            // Set password to hashed
                            foundObject.password = hash;
                            foundObject.save((err, updt) => {
                                if (err) {
                                    req.flash('error_msg', 'Password not Updated');
                                    res.redirect('/users/changepwd');
                                }
                                else {
                                    req.logOut();
                                    req.flash('success_msg', 'Password updated successfully');
                                    req.flash('success_msg', ' Please Log In with new Password');
                                    res.redirect('/users/login');


                                }
                            });

                        }
                        ));
                    }

                }
                else {
                    req.flash('error_msg', 'Please Enter Correct Password!');
                    res.redirect('/users/changepwd');
                }

            });



        }
    })


});

// Login handle
router.post('/login', (req,res,next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
});

// Logout Handle
router.get('/logout', (req, res) => {
    req.logOut();
    req.flash('success_msg', 'You are Logged Out');
    res.redirect('/users/login');
});




module.exports = router;