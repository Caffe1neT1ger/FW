import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import colors from "colors";
import enableWs from "express-ws";

dotenv.config();

const app = express();
const WSServer = enableWs(app);
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
    }
  });
  ws.on('close',function(message){
   
    
  })
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


  broadcastConnection(ws, {
    ...data,

    message: `Пользователь ${data.username} создал комнату ${data.roomId}`,
  });
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
  broadcastConnection(ws, {
    ...data,
    message: `Пользователь ${data.username} подключился к комнате`,
  });
}

// function syncHandler(ws, data) {
//   // const user = {
//   //   userId: "001",
//   //   username: "Croak-admin",
//   //   owner:false
//   //   roomId: roomId,
//   //   isPause: true,
//   //   progress: 0,
//   // };
//   aWss.clients.forEach((client) => {
//     // let clientUser = JSON.parse(JSON.stringify(client));
//     // console.log(clientUser.user)
//     if (client.user.roomId === data.roomId) {
//       // console.log("ws-item: ",client.user)
//       // // синхронизация с админом
//       if (client.user.owner == true) {
//         data.progress = client.user.progress;
//         data.isPause = client.user.isPause;
//       }
//       ws.send(
//         JSON.stringify({
//           ...data,
//         })
//       );
//     }
//   });
// }
// function changeVideo(ws, data) {
//   // const roomOperating = {
//   //   roomId: roomId,
//   //   ownerId:'001',
//   //   method: "watch",
//   //   progress: progress,
//   //   isPause: true/false,
//   //   operation: isPauseClient ? "start" : "stop",
//   //   videoSrc:"videoSrc",
//   // };
//   aWss.clients.forEach((client) => {
//     let clientUser = JSON.parse(JSON.stringify(client));
//     console.log(clientUser.user)
//     if (clientUser.user.roomId === data.roomId) {
//       client.send(
//         JSON.stringify({
//           ...data,
//         })
//       );
//     }
//   });
// }
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
  console.log(aWss.clients.size)
  aWss.clients.forEach((client) => {
    // let user = JSON.parse(JSON.stringify(client.user));
    console.log(client.username, client.owner);
    if (client.roomId === data.roomId) {
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`.yellow.bold);
});
