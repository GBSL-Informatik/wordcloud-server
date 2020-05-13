const express = require("express");
const bodyParser = require("body-parser");
var cors = require("cors");
const http = require("http");
const morgan = require("morgan");
const socketIo = require("socket.io");
const compression = require("compression");

/**
 * words are objects of the form:
 * {
 *    word: "some text",
 *    created_at: "2020-04.25 12:00"
 * }
 */
const words = [];

const port = process.env.PORT || 4001;

const app = express();

/**
 * CREATE A SERVER OBJECT
 */
const server = http.createServer(app);

/**
 * SERVER CONFIGURATION
 */

// ensure the server can call other domains: enable cross origin resource sharing (cors) 
app.use(cors());

// received packages should be presented in the JSON format
app.use(bodyParser.json());

// show some helpful logs in the commandline
app.use(morgan("dev"));

function shouldCompress(req, res) {
  return false;
}

// disable compression
app.use(compression({ filter: shouldCompress }));
/**
 * HTTP ROUTES
 */
app.get("/words", (req, res) => {
  res.send(words);
});

app.post("/words", (req, res) => {
  words.push(req.body);
  res.send(req.body);
});
app.post("/clear", (req, res) => {
  words.length = 0;
  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.send("Welcome to Wordcloud");
});

/**
 * SOCKET CONFIGURATION
 */
// create socket server
const io = socketIo(server);

io.on("connection", socket => {
  console.log("New client joined: ", socket.id);
  // emit the initial data
  socket.emit("word_data", words);

  // report on disconnect
  socket.on("disconnect", () => console.log("Client disconnected"));

  // when receiving an "add_word" event
  socket.on("add_word", word => {
    // add the new words
    words.push(word);
    // and emit a "word_data" event to all sockets
    // connected to the default namespace "/"
    io.emit("word_data", words)
  });

  socket.on("get_words", () => {
    socket.emit("word_data", words);
  })

  socket.on("clear", () => {
    words.length = 0;
    io.emit("word_data", words)
  });
});


/**
 * START THE SERVER
 */
server.listen(port, () => console.log(`Listening on port ${port}`));
