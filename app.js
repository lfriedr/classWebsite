//connect express
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const { postSchema, reviewSchema } = require('./schemas.js');
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const Post = require('./models/post');
const Review = require('./models/review');



//connect to database
mongoose.connect('mongodb://localhost:27017/yelp-camp', {});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();

//ejs
app.engine('ejs', ejsMate)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));


const validatePost = (req, res, next) => {
    const { error } = postSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

const validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

//basic route
app.get('/', (req, res) => {
    res.render('home')
})
//show all post
app.get('/posts', catchAsync(async (req, res) => {
    const posts = await Post.find({})
    res.render('posts/index', { posts })
}));
//make new post
app.get('/posts/new', (req, res) => {
    res.render('posts/new');
});
app.post('/posts', validatePost, catchAsync(async (req, res, next) => {
    const post = new Post(req.body.post);
    await post.save();
    res.redirect(`/posts/${post._id}`)
}));

//show page
app.get('/posts/:id', catchAsync(async (req, res,) => {
    const post = await Post.findById(req.params.id).populate('reviews');
    res.render('posts/show', { post });
}));

//edit
app.get('/posts/:id/edit', catchAsync(async (req, res) => {
    const post = await Post.findById(req.params.id)
    res.render('posts/edit', { post });
}));
app.put('/posts/:id', validatePost, catchAsync(async (req, res) => {
    const { id } = req.params;
    const post = await Post.findByIdAndUpdate(id, { ...req.body.post });
    res.redirect(`/posts/${post._id}`)
}));

//delete
app.delete('/posts/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    await Post.findByIdAndDelete(id);
    res.redirect('/posts');
}));

//reviews
app.post('/posts/:id/reviews', validateReview, catchAsync(async (req, res) => {
    const post = await Post.findById(req.params.id);
    const review = new Review(req.body.review);
    post.reviews.push(review);
    await review.save();
    await post.save();
    res.redirect(`/posts/${post._id}`);
}))
//delete reviews
app.delete('/posts/:id/reviews/:reviewId', catchAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await Post.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/posts/${id}`);
}))

//errors
app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
})

app.listen(3000, () => {
    console.log("Serving on port 3000")
})