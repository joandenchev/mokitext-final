import express from 'express';
import encryptor from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import MokiUser from "./utils/users.js";
import cors from 'cors';
import {checkForToken, DBAddToken, DBDeleteToken, findUserBy, saveUserToDB} from "./database.js";

const app = express()
app.use(express.json())
app.use(cors())
dotenv.config()

//on register is required json object with fields { username, phone, password }
app.post('/register', (async (req, res) => {
    const regError = await registerCheck(req.body)
    if (!regError) {
        try {
            await createNewUser(req.body)
            res.status(201).send('Registered successfully!')
        } catch (e) {
            res.status(500).send('Registration error! ' + e)
        }
    } else {
        res.status(418).send(regError)
    }
}))

app.post('/login', async (req, res) => {
    try {
        console.log(req.headers.origin)
        const userInput = req.body
        const token = await login(userInput)
        res.json(token)
        console.log('A user logged in!')
    } catch (e) {
        res.status(500).send('Login failed! ' + e.message)
    }
})

app.post('/token', (async (req, res) => {
    const refreshToken = req.body.token
    if (refreshToken == null) return res.sendStatus(401)
    if (!await checkForToken(refreshToken)) return res.sendStatus(403)
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY, undefined, (e, user) => {
        if (e) return res.sendStatus(403)
        console.log(user)
        const accessToken = generateToken({username: user.username,
            hashedPassword: user.hashedPassword,
            phone: user.phone
        })
        res.json({accessToken: accessToken})
        console.log('A token has been refreshed!')
    })
}))

app.delete('/logout',  async (req, res) => {
    if (await DBDeleteToken(req.body.token)) res.sendStatus(204)
    else res.sendStatus(500)
})

app.listen(6305)

async function createNewUser(input) {
    try {
        const hashedPassword = await encryptor.hash(input.password, 12)
        const newUser = new MokiUser(input.username, hashedPassword, input.phone)
        await saveUserToDB(newUser)
    } catch (e) {
        console.dir(e)
    }
}

async function login(input) {
    const user = await findUserBy(isPhoneNumber(input.user) ? 'phone' : 'username' , input.user)
    if (!user) return {'Error': 'User doesn\'t exist'}
    if(!user) throw new Error('User doesn\'t exist!')
    try {
        if(await encryptor.compare(input.password, user.hashedPassword)) {
            const accessToken  = generateToken(user)
            const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_KEY, undefined, undefined)
            DBAddToken({refreshToken: refreshToken})
            return {accessToken: accessToken, refreshToken: refreshToken, username: user.username}
        } else {
            return Promise.reject(new Error('Wrong username or password!'))
        }
    } catch (e) {
        throw new Error(e.message)
    }
}

function generateToken(user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_KEY, {expiresIn: '15m'}, undefined)
}

//returns error message if input isn't valid
async function registerCheck(input) {
    const userQueryResult = await findUserBy('username', input.username)
    if (userQueryResult) return 'There\'s an already existing account with this username!'
    if (await findUserBy('phone', input.phone)) return 'There\'s an existing account with this phone number!'
    if (!input.username || !/[a-zA-Z]+/i.test(input.username)) return 'Username should contain at least 1 letter!'
    if (!/^\w{4,20}$/i.test(input.username)) return 'Username should be between 4 and 20 word characters! (a-z, A-Z, 0-9 and _)'
    if (!input.phone || !isPhoneNumber(input.phone)) return 'Invalid phone number!'
    if (!input.password || !/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/.test(input.password))
        return 'Password should be more than 7 characters and include at least 1 capital letter, 1 lowercase letter and 1 digit!'
}

function isPhoneNumber(string) {
    return /^\+?\d{10,}$/i.test(string)
}
