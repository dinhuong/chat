const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const { urlencoded } = require('body-parser')
const multer = require('multer')
const mongoose = require('mongoose')
const session = require('express-session')

const User = require('./models/user')

const chatRouter = require('./routes/chat');
const authRouter = require('./routes/auth')

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser(urlencoded({ extended: false })))

app.use(session({
    secret: 'true',
    resave: false,
    saveUninitialized: false,
}))

const publicDirectoryPath = path.join(__dirname, './views')
app.use(express.static(publicDirectoryPath))

app.use('/', authRouter)

app.use('/chat', chatRouter)

mongoose
    .connect('mongodb+srv://dinhuong:matkhaumoi@cluster0.umv7k.mongodb.net/messenger?retryWrites=true&w=majority')
    .then(result => {
        console.log('Connected!')
        User.findOne()
            .then(user => {
                if (!user) {
                    const user = new User({
                        username: 'test1',
                        password: 'test',
                        chats: []
                    })
                    user.save()
                }
            })
            .catch(e => console.log(e))
    })


const server = app.listen(3000)
const io = require('./socket').init(server)
const socketRouter = require('./routes/socket')
io.on('connection', socket => {
    console.log('client!')
    socket.emit('server-message', 'Client connected!')

    socket.on('USER_ONLINE', chatId => {
        socket.join(chatId)
        io.to(chatId).emit('a new user join the room')
    })

    socket.on('SEND_MESSAGE', (chatId, msg) => {
        console.log('message: ', msg)
        io.to(chatId).emit('NEW_MESSAGE', msg)
    })
})
