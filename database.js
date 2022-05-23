import {MongoClient} from 'mongodb'
import {ChatRoom} from "./utils/messages.js";

const client = new MongoClient('mongodb://localhost:27017');
const users  = 'users'
const chats  = 'chats'
const tokens = 'tokens'
client.connect().then(() => console.log('Connection established!')).catch(err => console.log('Error! -> ' + err))

const database = client.db('moki')
let num
database.collection('system').findOne({prop: 'idcounter'}).then(n => num = n)

export async function saveUserToDB(user) {
    try {
        await database.collection(users).insertOne(user)
        console.log('User saved!')
        console.log(user)
    } catch (e) {
        console.log('ERROR! ' + e)
        throw new Error(e.message)
    }
}

export function findUserBy(finder, wanted) {
    return database.collection(users).findOne({[finder]: wanted})
}

export function deleteAllUsers() {
    database.collection(users).deleteMany({}).catch(() => console.log('Error deleting!'))
}

export function DBAddToken(token) {
    database.collection(tokens).insertOne(token).then(() => console.log('Token inserted!')).catch(e => console.log('!!! ' + e.message))
}

export async function checkForToken(token) {
    return database.collection(tokens).findOne({'refreshToken': token});
}

export async function DBDeleteToken(token) {
    try {
        await database.collection(tokens).deleteMany({'refreshToken': token})
    } catch (e) {
        return false
    }
    console.log('No errors while deleting')
    return true
}

export async function DBSaveMessage(message, chatroom){
    try{
        await database.collection(chats).updateOne({'id': chatroom}, {$push: {messages: message}})
    } catch (e) {
        console.log(e.message)
        await Promise.reject(e)
    }
}

export async function CreateChat(participants, id, name){
    try {
        const chat = new ChatRoom(participants, id, name)
        if (participants.length === 2 && await database.collection(chats).findOne({'participants': participants})) {
            return Promise.reject(new Error('Chat already exists!'))
        } else {
            await database.collection(chats).insertOne(chat)
            return chat
        }
    } catch (e){
        console.log(e.message)
    }
}

export async function GetAllMessagesFrom(chat){
    const wholeChat = await database.collection(chats).findOne({'name': chat})
    return wholeChat.messages
}

export async function IncrementChats(){
    try {
        await database.collection('system').updateOne({prop: 'idcounter'}, { $inc: { value: 1 } })
        return ++num
    } catch (e) {
        console.log(e.message)
        return false
    }
}
