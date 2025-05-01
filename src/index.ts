import http from 'http'
import { Server } from 'socket.io'
import express from 'express'
import cors from 'cors'


const app = express()
app.use(cors())
app.use(express.json())
const server = http.createServer(app)

const rooms:roomsType={}

app.use(cors({
    origin: ['https://tick-tak-to.vercel.app/'],
    methods: ['GET', 'POST'],
    credentials: true
  }))
  // ...existing code...
  
  const io = new Server(server, {
    cors: {
      origin: ['https://tick-tak-to.vercel.app/'],
      methods: ['GET', 'POST'],
      credentials: true
    },
  })

io.on('connection',(socket) => {
    console.log('a user connected with socket id:', socket.id);
    socket.on('join-room', (data) => {
        const { roomId, symbol } = data

        if(!rooms[roomId]){
            rooms[roomId] ={ player: [], board: Array(9).fill(null) };
        }
        if(rooms[roomId].player.length<2){
            if(rooms[roomId].player.length===0){
                rooms[roomId].player.push({socketId:socket.id,symbol:'o'})
                socket.join(roomId)
                io.to(socket.id).emit('joined-room', {roomId,   symbol: "o"});
            }
            else  {
                 rooms[roomId].player.push({socketId:socket.id,symbol:'x'})
                  socket.join(roomId)
                  io.to(socket.id).emit('joined-room', {roomId,symbol: "x"});
            }

            if(rooms[roomId].player.length===2){
                setTimeout(()=>{
                    io.to(roomId).emit('start-game');
                    const allowMove=rooms[roomId].player.filter((player)=>player.symbol!=symbol);
                    io.to(allowMove[0].socketId).emit('allow');
                },1000)
            }
            console.log('Player joined room:', roomId, 'with symbol:', symbol)
        }
        else {
            socket.emit('room-full', {message: 'Room is full'})
        }
    })
    socket.on('make-move',(data)=>{
        const {roomId,index,symbol} = data
        if(!rooms[roomId].board[index]){
            rooms[roomId].board[index]=symbol
            io.to(roomId).emit('move-made', {board:rooms[roomId].board})
            const nextMove=rooms[roomId].player.filter((player)=>player.symbol!=symbol);
            io.to(nextMove[0].socketId).emit('allow');
        }
    })
    socket.on('winner',(data)=>{
        console.log('winner event received')
        const {roomId,symbol} = data
        io.to(roomId).emit('game-winner', {symbol:symbol});
    })
    socket.on('play-again',(data)=>{
        const {roomId}=data;
        rooms[roomId].board=Array(9).fill(null);
        io.to(roomId).emit('reset-game',{board:rooms[roomId].board})
        const allowMove=rooms[roomId].player[0].socketId
        io.to(allowMove[0]).emit('allow');
    })
    socket.on('disconnect', () => {
        for(const roomId in rooms){
            rooms[roomId].player=rooms[roomId].player.filter((player)=>socket.id===player.socketId)
            if(rooms[roomId].player.length===0){
                delete rooms[roomId]
            }
        }
        
    })
})




const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

