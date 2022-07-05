if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}


const express = require('express')
const path = require('path');
const mongoose = require('mongoose')
const methodOverride = require('method-override')
// const Campground = require('./models/campground')
// const Review = require('./models/review')
const ejsMate = require('ejs-mate')
// const catchAsync = require('./utils/catchAsync')
// const { campgroundSchema, reviewSchema } = require('./schemas')
const ExpressError = require('./utils/ExpressError')
// const Joi = require('joi')
const app = express();
const db = mongoose.connection;
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
const session = require('express-session');
const flash = require('connect-flash')
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const userRoutes = require('./routes/users')
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const MongoDBStore = require("connect-mongo")(session);
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp'; ;
/////////////////////////////////////


async function main() {
    await mongoose.connect(dbUrl);
}
main().catch(err => console.log(err));
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => console.log("DB connected"))


/////////////////////////////////////


app.engine('ejs', ejsMate)


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(mongoSanitize());
app.use(express.urlencoded({ extended: true })); //parse the post req.body, otherwise the body returned empty
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')))

const secret = process.env.SECRET || 'thisshouldbeabettersecret!';

const store = new MongoDBStore({
    url: dbUrl,
    secret: secret,
    touchAfter: 24 * 3600
});

store.on("error", function(e) {
    console.log("session store error", e)
})

const sessionConfig = {
    store,
    name:'_noisses',
    secret: secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,//extra security to cookie
        // secure: true, //makes it work only over https will break things for now because local host is not https
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, //want to add this to prevent a user to stay logged in forever
        maxAge: 1000 * 60 * 60 * 24 * 7,
    }
}//config to resolve deprecation warning
app.use(session(sessionConfig))
app.use(flash());
app.use(helmet());


const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://cdn.jsdelivr.net",
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/djqcxlpdj/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);


app.use(passport.initialize());
app.use(passport.session()); // need to be used after app.use(session(..));
passport.use(new LocalStrategy(User.authenticate())); //authenticate() static method was added to User model and is used by localStrategy.

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success'); //app.use middleware run on every single request. 
    //if there's a flash message from cookie, save it to local variable. run before route handler
    res.locals.error = req.flash('error');
    next();
})

app.get('/fakeUser', async (req, res) => {
    const user = new User({ email: 'tuan@gmail.com', username: 'tuan' });
    const newUser = await User.register(user, 'chicken'); // hash and salt and store the password, hash and salt
    res.send(newUser)
})

app.use('/', userRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes)
app.use('/campgrounds', campgroundRoutes)


/////////////////////////////////////


app.get('/', (req, res) => {
    res.render('home')
})



/////////////////////////////////////


app.all('*', (req, res, next) => {
    next(new ExpressError('Page not found', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'oh no, something went wrong';
    res.status(statusCode).render('error', { err });
})

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`serving on port ${port}`)
})