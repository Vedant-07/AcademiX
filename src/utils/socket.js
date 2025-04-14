const { Server } = require("socket.io");
const Chat = require("../Schema/Chat");
//const socket=require("socket.io")

const initializeSocket = (server) => {
  const io = new Server(server, {
    // here socket is used???? yes amigo
    cors: {
      origin: ["http://localhost:3000"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("joinChat", ({ fullName, groupId }) => {
      //to avoid confusion, lets name it as roomId for now
      const roomId = groupId;
      console.log(fullName + " is joing romm --> ", roomId);
      socket.join(roomId);
    });

    socket.on(
      "sendMessage",
      async ({ userId, fullName, groupId, content, timestamp }) => {
        try {
          const roomId = groupId;
          console.log(
            "userId" +
              userId +
              " --- " +
              fullName +
              " joined roooooooooooooooomm    --> " +
              roomId +
              " message ==> " +
              content,
          );

          let chat = await Chat.findOne({ group_id: groupId });

          if (!chat) {
            chat = new Chat({
              group_id: groupId,
              messages: [],
            });
          }

          chat.messages.push({
            user_id: userId,
            content,
          });

          await chat.save();

          io.to(roomId).emit("messageReceived", {
            userId,
            fullName,
            content,
            timestamp,
          });
        } catch (e) {
          console.error("error in socket.on");
          console.log(e);
        }

        // try to save this in schema
      },
    );
    socket.on("disconnect", () => {});
  });
};

module.exports = initializeSocket;
