const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const app = express();

const morgan = require("morgan");
const cors = require("cors");
const { cpuMonitor } = require("./controller/OS");
const { initSocket } = require("./controller/authController");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const authRouter = require("./routes/auth");
const allUrlRoute = require("./routes/url");
const cornJob = require("./controller/scheduleJob");

//const userRouter=require('./routes/userRoute')

require("dotenv").config();
const httpServer = http.createServer(app);
const io = socketIO(httpServer);

app.set("io", io);
cpuMonitor(io);
initSocket(io);
app.use(bodyParser.json());

//setInterval(calculateDailyHistoryAPI, 100);

//app middleware

app.set("trust proxy", true);

app.use(morgan("dev"));
//app.use(cors())

if (process.env.NODE_ENV === "development") {
  app.use(cors({ origin: `http://localhost:3000` }));
} else {
  app.use(cors({ origin: `http://localhost:3000` }));
}

app.use("/api", authRouter);
app.use("/api", allUrlRoute);

// /app.use('/api',userRouter)

cornJob.CheckExpressProduct(io);
cornJob.fivePmJob(io);
cornJob.sixPmJob(io);
cornJob.sevenPmJob(io);
cornJob.eightPmJob(io);
cornJob.sevenTeenPmJob(io);
cornJob.eighteenPmJob(io);
cornJob.nineTeenPmJob(io);

//cornJob.twentyPmJob(io);
cornJob.tenAmJob(io);

//import db
require("./DB/index");

app.get("/", (req, res) => {
  console.log(req.ip);
  res.send("Hello World!");
});
const port = process.env.PORT || 9000;

httpServer.listen(port, () =>
  console.log(`Server listening at http://localhost:${port}`)
);
