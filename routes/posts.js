const express = require('express');
const router = express.Router();

const catchAsync = require('../utils/catchAsync');
const { postSchema } = require('../schemas.js');

const ExpressError = require('../utils/ExpressError');
const Post = require('../models/post');

const validatePost = (req, res, next) => {
    const { error } = postSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

//show all post
router.get('/', catchAsync(async (req, res) => {
    const posts = await Post.find({})
    res.render('posts/index', { posts })
}));
//make new post
router.get('/new', (req, res) => {
    res.render('posts/new');
});
app.post('/', validatePost, catchAsync(async (req, res, next) => {
    const post = new Post(req.body.post);
    await post.save();
    req.flash('success', 'Successfully made a new campground!');
    res.redirect(`/posts/${post._id}`)
}));

//show page
router.get('/:id', catchAsync(async (req, res,) => {
    const post = await Post.findById(req.params.id).populate('reviews');
    if (!post) {
        req.flash('error', 'Cannot find that post!');
        return res.redirect('/posts');
    }
    res.render('posts/show', { post });
}));

//edit
router.get('/:id/edit', catchAsync(async (req, res) => {
    const post = await Post.findById(req.params.id)
    res.render('posts/edit', { post });
}));
router.put('/:id', validatePost, catchAsync(async (req, res) => {
    const { id } = req.params;
    const post = await Post.findByIdAndUpdate(id, { ...req.body.post });
    req.flash('success', 'Successfully updated campground!');
    res.redirect(`/posts/${post._id}`)
}));

//delete
router.delete('/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    await Post.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted campground')
    res.redirect('/posts');
}));