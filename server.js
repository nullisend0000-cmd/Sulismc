
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  socket.on("join", (name) => {
    socket.data.name =
      String(name || "Vendég").trim().slice(0, 24) || "Vendég";

    io.emit("notice", `${socket.data.name} csatlakozott.`);
  });

  socket.on("message", (text) => {
    if (!socket.data.name) return;

    text = String(text || "").trim().slice(0, 1000);
    if (!text) return;

    io.emit("message", {
      name: socket.data.name,
      text
    });
  });

  socket.on("disconnect", () => {
    if (socket.data.name) {
      io.emit("notice", `${socket.data.name} kilépett.`);
    }
  });
});

const port = process.env.PORT || 3000;
server.listen(port, "0.0.0.0", () => {
  console.log("SulisMC elindult!");
});
