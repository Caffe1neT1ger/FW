import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import colors from "colors";
import enableWs from "express-ws";
import https from 'https'
import fs from 'fs';


dotenv.config();


const serverOptions = {
  // key: fs.readFileSync('key.pem'),
  // cert: fs.readFileSync('cert.pem'),
}
const app = express();
const server = https.createServer(serverOptions, app)
const WSServer = enableWs(app,server);
const aWss = WSServer.getWss();

app.use(express.json());
app.use(cors());

app.ws("/api/room/", function (ws, req) {
  ws.on("open", function (message) {});

  ws.on("message", function (message) {
    // console.log("client message: ", message);
    const data = JSON.parse(message);

    switch (data.method) {
      case "create":
        getOwnerStatus(ws, data);
        break;
      case "connection":
        connectionHandler(ws, data);
        break;
      case "watch":
        broadcastConnection(ws, data);
        break;
      case "sync":
        syncHandler(ws, data);
        break;
      case "changeVideo":
        changeVideo(ws, data);
        break;
      case "getUserList":
        getUserList(ws, data);
        break;
    }
  });
  ws.on("close", function (message) {

    broadcastConnection(ws, { method: "removeUser" });
  });
});

function getOwnerStatus(ws, data) {
  // const data = {
  //   userId: "001",
  //   username: "Croak-admin",
  //   roomId: roomId,
  //   isPause: true,
  //   progress: 0,
  // };

  // начальная настрока комнаты

  data.progress = 0;
  data.isPause = true;
  data.owner = true;
  // ws.user = JSON.parse(JSON.stringify(data));
  ws.userId = data.userId;
  ws.username = data.username;
  ws.roomId = data.roomId;
  ws.owner = data.owner;
  ws.isPause = data.isPause;
  ws.progress = data.progress;

  data.message = `Пользователь ${data.username} создал комнату ${data.roomId}`;
  getUserList(ws, data);
  // broadcastConnection(ws, {
  //   ...data,

  //   message: `Пользователь ${data.username} создал комнату ${data.roomId}`,
  // });
}

function connectionHandler(ws, data) {
  // const data = {
  //   userId: "001",
  //   username: "Croak-admin",
  //   roomId: roomId,
  //   isPause: true,
  //   progress: 0,
  // };

  data.owner = false;
  // ws.user = JSON.parse(JSON.stringify(data));
  ws.userId = data.userId;
  ws.username = data.username;
  ws.roomId = data.roomId;
  ws.owner = data.owner;
  ws.isPause = data.isPause;
  ws.progress = data.progress;

  data.message = `Пользователь ${data.username} подключился к комнате`;
  getUserList(ws, data);
  // broadcastConnection(ws, {
  //   ...data,
  //   message: `Пользователь ${data.username} подключился к комнате`,
  // });
}
function getUserList(ws, data) {
  let arr = [];
  aWss.clients.forEach((client) => {
    // let user = JSON.parse(JSON.stringify(client.user));
    console.log(client.username, client.owner);
    if (client.roomId === data.roomId) {
      arr.push({
        userId: client.userId,
        username: client.username,
      });
    }
  });
  console.log(arr);
  data.userList = JSON.parse(JSON.stringify(arr));
  broadcastConnection(ws, data);
}
function syncHandler(ws,data){
  aWss.clients.forEach((client) => {
    // let user = JSON.parse(JSON.stringify(client.user));
    console.log(client.username, client.owner);
    if (client.roomId === data.roomId) {
      if (client.userId === data.syncId){
        let operation ="start"
        if (data.isPause){
            operation="stop"
        }
        client.send(
      
          JSON.stringify({
            ...data,
            method:'watch',
            operation:operation
            
          })
        );
      }
      
    }
  });
}
function broadcastConnection(ws, data) {
  // const user = {
  //   userId: "001",
  //   username: "Croak",
  //   owner:true/false
  //   roomId: roomId,
  //   isPause: true,
  //   progress: 0,
  // };

  // const roomOperating = {
  //   roomId: roomId,
  //   ownerId:'001',
  //   method: "watch",
  //   progress: progress,
  //   isPause: true/false,
  //   operation: isPauseClient ? "start" : "stop",
  //   videoSrc:"videoSrc",
  // };
  console.log(aWss.clients.size);
  aWss.clients.forEach((client) => {
    // let user = JSON.parse(JSON.stringify(client.user));
    console.log(client.username, client.owner);
    if (client.roomId === data.roomId) {
      if (data.method=="connection"){
        if (client.owner){
          client.send(JSON.stringify({
            syncId:data.userId,
            method:"sync"
          }))
        }
      }
    
      // console.log("ws-item: ",client.user)
      // // синхронизация с админом
      // if (client.user.owner == true) {
      //   data.progress = client.user.progress;
      //   data.isPause = client.user.isPause;
      // }

      client.send(
        JSON.stringify({
          ...data,
        })
      );
    }
  });
}

const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`.yellow.bold);
// });
server.listen(PORT);