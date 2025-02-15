import jwt, { JwtPayload } from "jsonwebtoken"
import { WebSocket, WebSocketServer } from 'ws';
import prisma from "@repo/db/client";
import { JWT_SECRET } from "@repo/backend-common/config";
const wss = new WebSocketServer({ port: 8080 });


interface User {
  ws : WebSocket
  rooms : String[],
  userId : String
}

const users :User[] = [];

function checkUser(token : string): string | null{
  try {
    const decoded = jwt.verify(token , JWT_SECRET)
    //the typescript may complain about the decoded - whether stirng or payload ,so
    if(typeof decoded == "string"){
      return null ;
    }
    if(!decoded || !decoded.id ){
    //other way to check decoded is string or jwtpayload - if above typeof check is not performed  
    // if(!decoded || !(decoded as JwtPayload).userId){
      return null;
    }
    return decoded.id;
  }
  catch(e){
    return null;
  }
  
}

wss.on('connection', function connection(ws , request) {
  //extracting token from the query , and allowing user only if he is authorized by the http backend
  //we will use the same token  of http to verify the user  
  const url = request.url ; 
  if(!url) {
    return
  }
  const queryParams = new URLSearchParams(url.split('?')[1]);
  const token = queryParams.get('token') || ""; 
  const userId = checkUser(token);
  if(!userId){
    ws.close();
    return
  }

  users.push({
    userId ,
    rooms : [],
    ws
  })
  ws.on('message',async function message(data) {
    const parsedData =JSON.parse(data as unknown as string); 

    if(parsedData.type=== "join_room"){
      const user = users.find(x => x.ws === ws);
      user?.rooms.push(parsedData.roomID) ;    //checks -> does this room exist? acces control , 
    }

    if(parsedData.type === "leave_room"){
      const user = users.find(x => x.ws === ws);
      if(!user){
        return
      }
      user.rooms = user.rooms.filter(x => x === parsedData.roomId) 
      //removing a user from a specific room
    }

    if(parsedData.type === "chat"){
      const roomId = parsedData.roomID;
      const message = parsedData.messgae ;  //checks : message is not too long, doenst have anythng vulgar etcc.

      //we should put message in db before broadcasting message , coz db call may fail -> better approach is queue
      await prisma.chat.create({
        data : {
          roomId ,
          userId,
          message
        }
      })
      users.forEach(user => {
        if(user.rooms.includes(roomId)){
          user.ws.send(JSON.stringify({
            type : "chat" , 
            message : message , 
            roomId
          }));
        }
      })
    }
  });  
});