const si = require("systeminformation");

// promises style - new since version 3
// (async () => {
//   let result = await si.currentLoad();
//   let cpuLoad = Math.round(result.currentLoad);
//   let freeRam = await si.mem();
//   let freeRamFound = Math.round(freeRam.free / Math.pow(1024, 3));
//   let usedRamFound = Math.round(freeRam.used / Math.pow(1024, 3));
//
//   let ssd = await si.fsSize();
//
//   let ssdFound = Math.round(ssd[0].used / Math.pow(1024, 3));
//
//   console.log(ssdFound);
//
//
// })();
// var osu = require("node-os-utils");
// var netstat = osu.netstat;
//
// netstat.stats().then((info) => {
//   console.log(info);
// });
// os.cpuUsage(function (v) {
//   console.log("CPU Usage (%): " + Math.ceil(v * 100));
// });

//os.cpuFree( callback );

// console.log(Math.ceil(os.freemem()));
// console.log(os.totalmem());
// console.log(Math.ceil(os.freememPercentage() * 100));
// console.log(os.sysUptime());
//

// function checkCpu(v) {
//   //return Math.ceil(v * 100);
//   console.log(Math.ceil(v * 100));
// }
// os.cpuUsage(checkCpu);

// (() => {
//   os.cpuUsage(function (v) {
//     console.log("CPU Usage (%): " + Math.ceil(v * 100));
//   });
// })();

exports.cpuMonitor = (socket) => {
  setInterval(async () => await getApiAndEmit(socket), 1000);
};

const getApiAndEmit = async (socket) => {
  try {
    let result = await si.currentLoad();
    let ssd = await si.fsSize();
    let freeRam = await si.mem();
    let cpuLoad = Math.round(result.currentLoad);

    let freeRamFound = Math.round(freeRam.free / Math.pow(1024, 3));
    let usedRamFound = Math.round(freeRam.used / Math.pow(1024, 3));

    let ssdFound = Math.round(ssd[0].used / Math.pow(1024, 3));

    // Emitting a new message. Will be consumed by the client
    socket.emit("cpu", { cpuLoad, freeRamFound, usedRamFound, ssdFound });
  } catch (error) {
    //console.log(error);
  }
};
