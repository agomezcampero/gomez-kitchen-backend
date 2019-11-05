const request = require('supertest')
const mongoose = require('mongoose')
const {User} = require('../../../models/user')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const config = require('config')
let server

describe('/api/auth', () => {
  let email
  let password

  beforeEach(async () => {
    server = require('../../../index')
      email = 'email@test.com'
      password = '12345678'

      const salt = await bcrypt.genSalt(10)
      hashedPassword = await bcrypt.hash(password, salt)

      user = new User ({
        name: 'name1',
        email: email,
        password: hashedPassword
      })
      await user.save()
  })

  afterEach(async () => { 
    await server.close()
    await User.deleteMany({})
  })

  const exec = () => {
    return request(server)
        .post('/api/auth')
        .send({email, password})
  }

  describe('/POST', () => {

    it('should return 400 if invalid email is sent', async () => {
      email = '123456'

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 400 if password is less than 6 characters', async () => {
      email = '123'

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 400 if email doesnt exist', async () => {
      email = 'other@test.com'

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 400 if password is not correct', async () => {
      password = 'abcdefghi'

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 200 if request is valid', async () => {
      const res = await exec()

      expect(res.status).toBe(200)
    })

    it('should return a valid jwt if the request is valid', async () => {
      const res = await exec()

      const decoded = jwt.verify(res.body.token, config.get('jwtPrivateKey'))
      const userInDb = await User.findById(decoded)

      expect(userInDb.email).toBe(email)
    })



  })

})