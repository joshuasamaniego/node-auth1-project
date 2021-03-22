// Require `checkUsernameFree`, `checkUsernameExists` and `checkPasswordLength`
// middleware functions from `auth-middleware.js`. You will need them here!
const router = require('express').Router();
const { checkUsernameFree, checkUsernameExists, checkPasswordLength } = require('./auth-middleware');
const bcrypt = require('bcryptjs');
const Users = require('../users/users-model');
/**
  1 [POST] /api/auth/register { "username": "sue", "password": "1234" }

  response:
  status 200
  {
    "user_id": 2,
    "username": "sue"
  }

  response on username taken:
  status 422
  {
    "message": "Username taken"
  }

  response on password three chars or less:
  status 422
  {
    "message": "Password must be longer than 3 chars"
  }
 */

router.post('/register', checkUsernameFree, checkPasswordLength, async (req, res, next) => {
  const { username, password } = req.body;
  const hash = bcrypt.hashSync(password, 10) // 2^10 hashing
  const userForDB = { username, password: hash}

  try {
    const newUser = await Users.add(userForDB)
    res.json(newUser);
  } catch(err) { next(err) }
  
})


/**
  2 [POST] /api/auth/login { "username": "sue", "password": "1234" }

  response:
  status 200
  {
    "message": "Welcome sue!"
  }

  response on invalid credentials:
  status 401
  {
    "message": "Invalid credentials"
  }
 */

router.post('/login', checkUsernameExists, async (req, res, next) => {
  const { password } = req.body;
  if(req.verifiedUser && bcrypt.compareSync(password, req.verifiedUser.password)) { 
      req.session.user = req.verifiedUser; // save session/set cookie on client
      res.json('Welcome sue!');
  } else { 
      res.status(401).json('Invalid credentials')
  }
  next();
})


/**
  3 [GET] /api/auth/logout

  response for logged-in users:
  status 200
  {
    "message": "logged out"
  }

  response for not-logged-in users:
  status 200
  {
    "message": "no session"
  }
 */

router.get('/logout', (req, res, next) => {
  if(req.session && req.session.user) {
    req.session.destroy(err => {
      if(err) {
        res.json({ message: "no session"})
      } else {
        res.json({ message: "logged out"})
      }
    })
  }
})

 
// Don't forget to add the router to the `exports` object so it can be required in other modules
module.exports = router;