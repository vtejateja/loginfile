const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'goodreads.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

// Get Books API
app.get('/books/', async (request, response) => {
  const getBooksQuery = `
  SELECT
    *
  FROM
    book
  ORDER BY
    book_id;`
  const booksArray = await db.all(getBooksQuery)
  response.send(booksArray)
})
//create user API
app.post('/users/', async (request, response) => {
  const {name, username, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)

  const selectuserQuery = `SELECT * FROM user WHERE username='${username}'`

  const dbUser = await db.get(selectuserQuery)

  if (dbUser === undefined) {
    const insertUserQuery = `INSERT INTO user(name,username,password,gender,location) VALUES('${name}','${username}','${hashedPassword}','${gender}','${location}')`
    await db.run(insertUserQuery)
    response.send('User Created Successfully')
  } else {
    response.status(400)
    response.send('User Already Exits')
  }
})

//login user API
app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const finduserQuery = `SELECT * FROM user WHERE username='${username}'`
  const findUser = await db.get(finduserQuery)

  if (findUser === undefined) {
    response.status(400)
    response.send('User Already Exits')
  } else {
    const passwordMatch = await bcrypt.compare(password, findUser.password)
    if (passwordMatch === true) {
      response.send('Login Success')
    } else {
      response.status(400)
      response.send('invalid password')
    }
    const userMatch = await bcrypt.compare(username, findUser.username)
    if (userMatch === true) {
      response.send('Login Success')
    } else {
      response.status(400)
      response.send('invalid username')
    }
  }
})
