const express = require('express')
const app = express();
const router = express.Router({ mergeParams: true });
const campgrounds = require('../controllers/campgrounds')

const catchAsync = require('../utils/catchAsync')
const { campgroundSchema } = require('../schemas')
const { isLoggedIn, isAuthor, validateCampground } = require('../middleware')
const multer = require('multer')
const { storage } = require('../cloudinary');
const upload = multer({ storage })
const Campground = require('../models/campground')





router.route('/')
    .get(catchAsync(campgrounds.index))
    .post(isLoggedIn, upload.array('image'), validateCampground, catchAsync(campgrounds.createCampgrround))

router.get('/new', isLoggedIn, campgrounds.renderNewForm) // need to go before :id otherwise 'new' mistaken for 'id'

router.route('/:id')
    .get(catchAsync(campgrounds.showCampground))
    .put(isLoggedIn, isAuthor, upload.array('image'), validateCampground, catchAsync(campgrounds.updateCampground))
    .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground))

router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(campgrounds.renderEditForm))

module.exports = router;