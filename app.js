const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const nodemailer = require('nodemailer');

//OTP
const bodyParser = require('body-parser');
const Nexmo = require('nexmo');
const socketio = require('socket.io');
const ejs = require('ejs');

//INIT nexmo
const nexmo = new Nexmo({
    apiKey: '0e396221',
    apiSecret: 'ylyNNQRQO7VbPA7g'
}, {debug: true});

//INIT nodemailer
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'squareone199@gmail.com',
        pass: 'GMAILkapwd'
    }
});



const app = express();

// Passport config
require('./config/passport')(passport);

//DB config
const db = require('./config/keys').MongoURI;

// Connect to Mongo
mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true})
.then(() => console.log('MongoDB Connected...'))
.catch(err => console.log(err));

//EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

// Body Parser
app.use(express.urlencoded({extended:false}));

// Express session
app.set('trust proxy', 1) // trust first proxy
app.use(session({
    secret: 'kyakregajaanke',
    resave: true,
    saveUninitialized: true
    
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//connect flash
app.use(flash());

//global variables
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
})



/*
//otp continued
app.set('view engine', 'html');
app.engine('html', ejs.renderFile);
*/



//image
app.use(express.static(path.join(__dirname, 'public')));

//Body Parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());




//Routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));

//otp get request
app.get('/', (req,res) =>{
    res.render('welcome');
})

//catch form submition of otp
app.post('/', (req,res) => {
    // res.send(req.body);
    // console.log(req.body);
    const number = req.body.number;
    const text = req.body.onetp;

    nexmo.message.sendSms(
        '918360056128', number, text, { type: 'unicode' },
        (err, responseData) =>{
            if(err){
                console.log(err);
            }
            else{
                console.dir(responseData);
                // Get data from response
                const data = {
                    id: responseData.messages[0]['message-id'],
                    number: responseData.messages[0]['to']
                }


                // Emit to client
                io.emit('smsStatus', data);
            }
        }
    );
});


// app.post('/users/orderhistory', (req, res)=>{
//     console.log(req.body);
    
// })


const PORT = process.env.PORT || 5500;

const server = app.listen(PORT, () =>console.log(`Server started on port ${PORT}`));

// const serv = 'http://http://localhost:5500/';

// Connect to socket.io
const io = socketio(server);
io.on('connection', (socket) =>{
    console.log('Connected');
    socket.on('disconnect', () =>{
        console.log('Disconnect');
    })
});