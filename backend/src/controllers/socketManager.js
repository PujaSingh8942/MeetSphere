import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL, // ✅ correct origin for dev
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("SOMETHING IS CONNECTED:", socket.id);

    // --- Join call ---
    socket.on("join-call", (path) => {
      if (!connections[path]) {
        connections[path] = [];
      }

      connections[path].push(socket.id);
      timeOnline[socket.id] = Date.now();

      for (let id of connections[path]) {
        io.to(id).emit("user-joined", socket.id, connections[path]);
      }

      if (messages[path]) {
        for (let msg of messages[path]) {
          io.to(socket.id).emit(
            "chat-message",
            msg["data"],
            msg["sender"],
            msg["socket-id-sender"]
          );
        }
      }
    });

    // --- WebRTC signaling ---
    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    // --- Chat message ---
    socket.on("chat-message", (data, sender) => {
      let matchingRoom = null;

      for (const [room, users] of Object.entries(connections)) {
        if (users.includes(socket.id)) {
          matchingRoom = room;
          break;
        }
      }

      if (matchingRoom) {
        if (!messages[matchingRoom]) {
          messages[matchingRoom] = [];
        }

        messages[matchingRoom].push({
          sender,
          data,
          "socket-id-sender": socket.id,
        });

        // ✅ Console log added back (like your first code)
        console.log("message", matchingRoom, ":", sender, data);

        for (let id of connections[matchingRoom]) {
          io.to(id).emit("chat-message", data, sender, socket.id);
        }
      }
    });

    // --- Disconnect ---
    socket.on("disconnect", () => {
      const diffTime = Math.abs((timeOnline[socket.id] || 0) - Date.now());
      delete timeOnline[socket.id];

      for (const [roomKey, users] of Object.entries(connections)) {
        if (users.includes(socket.id)) {
          for (let id of users) {
            io.to(id).emit("user-left", socket.id);
          }

          const index = connections[roomKey].indexOf(socket.id);
          if (index !== -1) {
            connections[roomKey].splice(index, 1);
          }

          if (connections[roomKey].length === 0) {
            delete connections[roomKey];
          }

          break;
        }
      }
    });
  });

  return io;
};
