
const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  socket.on("join", (rawName) => {
    const name = String(rawName || "Vendég").trim().slice(0, 24);
    if (!name) return;

    socket.data.name = name;
    socket.emit("joined", { id: socket.id, name });
    socket.broadcast.emit("notice", `${name} csatlakozott.`);
  });

  socket.on("message", (rawText) => {
    if (!socket.data.name) return;
    const text = String(rawText || "").trim().slice(0, 1000);
    if (!text) return;

    io.emit("message", {
      name: socket.data.name,
      text,
      time: new Date().toLocaleTimeString("hu-HU", {
        hour: "2-digit",
        minute: "2-digit"
      })
    });
  });

  socket.on("call:join", () => {
    if (!socket.data.name) return;

    const room = "sulismc-call";
    const peers = [...(io.sockets.adapter.rooms.get(room) || [])]
      .filter(id => id !== socket.id);

    socket.join(room);
    socket.emit("call:peers", peers);
    socket.to(room).emit("call:peer-joined", {
      id: socket.id,
      name: socket.data.name
    });
  });

  socket.on("call:signal", ({ to, data } = {}) => {
    if (typeof to !== "string" || !data) return;
    io.to(to).emit("call:signal", {
      from: socket.id,
      data
    });
  });

  socket.on("call:leave", () => {
    socket.to("sulismc-call").emit("call:peer-left", {
      id: socket.id
    });
    socket.leave("sulismc-call");
  });

  socket.on("disconnect", () => {
    socket.to("sulismc-call").emit("call:peer-left", {
      id: socket.id
    });

    if (socket.data.name) {
      io.emit("notice", `${socket.data.name} kilépett.`);
    }
  });
});

const port = process.env.PORT || 3000;
server.listen(port, "0.0.0.0", () => {
  console.log("Sulismc elindult!");
});
