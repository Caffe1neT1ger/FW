import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import colors from "colors";
import enableWs from "express-ws";

// dataBase config
import { connectDB } from "./config/dataBase.js";

// routes
import userRoutes from "./routes/userRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import expressAsyncHandler from "express-async-handler";

dotenv.config();

connectDB();

const app = express();
const WSServer = enableWs(app);
const aWss = WSServer.getWss();

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.json());
app.use(cors());

app.use("/api/users", userRoutes);
app.use("/api/room/", roomRoutes);
// app.post('/api/room/:id',expressAsyncHandler(async(req,res)=>{
//   try {
//     const {roomId,isPause,progress} = req.body;
    
//   }catch (error){
//     console.log(error);
//     return res.status(500,"error")
//   }
// }))
app.ws("/api/room/:id/", function (ws, req) {
  ws.on("open", function (message) {});

  ws.on("message", function (message) {
    // console.log(message);
    const data = JSON.parse(message);
    const ownerData ={};
    
    switch (data.method) {
      case "connection":
        connectionHandler(ws, data);
        break;
      case "watch":
        broadcastConnection(ws, data);
        break;
      case "sync":
        syncHandler(ws,data);
        break;
  
    }
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  );
});

function connectionHandler(ws, data) {
  ws.roomId = data.roomId;
  ws.owner = data.owner;
  ws.id = data.id;

  broadcastConnection(ws, data);
}


function broadcastConnection(ws, data) {
  aWss.clients.forEach((client) => {
    if (client.roomId === data.roomId) {
      // if (data.owner ==true) {
      //   ws.isPause = data.isPause;
      //   ws.progress = data.progress
      // }
      if (data.ownerId ==client.id && client.owner == true){
        console.log(client)
        // ws.isPause = client.isPause;
        // ws.progress = client.progress
        // data.isPause = client.isPause;
        // data.progress = client.progress;
      }
      // if(client.owner ==true){
      //   data.isPause = client.isPause;
      //   data.progress = client.progress;
      // }
 
      client.send(
        JSON.stringify({
          ...data,
          message: `Пользователь ${data.username} подключился к комнате`,
        })
      );
    }
  });
}
