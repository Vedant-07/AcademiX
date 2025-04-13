const { Server } = require("socket.io");
//const socket=require("socket.io")

const initializeSocket = (server) => {
  const io = new Server(server, {
    // here socket is used????
    cors: {
      origin: ["http://localhost:3000"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("joinChat", ({ groupId }) => {
      //to avoid confusion, lets name it as roomId for now
      const roomId = groupId;
      console.log("joing roooomm    --> ", roomId);
      socket.join(roomId);
    });
    socket.on("sendMessage", () => {});
    socket.on("disconnect", () => {});
  });
};

module.exports = initializeSocket;
