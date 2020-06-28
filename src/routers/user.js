const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const { sendWelcomeEmail, sendGoodbyeEmail } = require('../emails/account')
const router = new express.Router()


const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Upload a jpg, jpeg or png only'))
        }
        cb(null, true)
    }
})

// Create user or Signup
// Password hashing happens here
router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try{
        await user.save()
        //Send welcome email to new user
        sendWelcomeEmail(user.email, user.name)

        const token = await user.generateAuthToken()

        res.status(201).send({ user, token })
    } catch(e) {
        res.status(400).send(e)
    }
})

// User login end-point
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (e) {
        res.status(400).send()
    }
})
// User logout end-point
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token)

        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})
// User login all users end-point
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})


// Read or Get a user
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

//Update users
// Password hashing happens here too
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every(update => allowedUpdates.includes(update))

    if(!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!'})
    }

    try {
        updates.forEach(update => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

// Delete user
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        // Send Goodbye email to user
        sendGoodbyeEmail(req.user.email, req.user.name)

        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

// Upload user avatar
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    // normalize every image uploaded
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()

    req.user.avatar = buffer
    await req.user.save()
    res.send('File Uploaded Succeccful')
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

// Delete user avatar
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    req.user.save()
    res.send()
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        //find the user by id
        const user = await User.findById(req.params.id)

        if(!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)

    } catch(e) {
        res.status(404).send()
    }
})

module.exports = router
