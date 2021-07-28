import React, { useEffect, useState } from "react";
import { Grid, Container, Typography, Divider } from "@material-ui/core";

import DailyCount from "./components/overview/DailyCount";
import TotalCount from "./components/overview/TotalCount";
import TotalSite from "./components/overview/TotalSite";

import CpuCount from "./components/server/CpuCount";
import RamCount from "./components/server/RamCount";
import HardDiskCount from "./components/server/SsdCount";
import FreeRamCount from "./components/server/FreeRamCount";

import ScrappingHistory from "./components/History/ScrappingHistory";
import SiteList from "./components/History/SiteList";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import Layout from "../Layout";

import io from "socket.io-client";
import { dev } from "../../../config";
import { dashboardManagment } from "../../../class/helper";

let socket;
{
  /* server over view component*/
}

const Admin = () => {
  const matches = useMediaQuery("(min-width:600px)");
  const [ram, setRam] = useState(0);
  const [cpu, setCpu] = useState(0);
  const [freeRam, setFreeRam] = useState(0);
  const [ssd, setSsd] = useState(0);
  const [dashboard, setDashboard] = useState({});

  const socketFunction = () => {
    socket = io(`${dev.socket_url}`, {
      reconnectionDelay: 1000,
      reconnection: true,
      reconnectionAttempts: 10,
      transports: ["websocket"],
      agent: false, // [2] Please don't set this to true
      upgrade: false,
      rejectUnauthorized: false,
    });
    socket.on("cpu", ({ cpuLoad, freeRamFound, usedRamFound, ssdFound }) => {
      setRam(usedRamFound);
      setCpu(cpuLoad);
      setSsd(ssdFound);
      setFreeRam(freeRamFound);
    });
  };

  useEffect(() => {
    socketFunction();
    (async () => {
      setDashboard(await dashboardManagment());
    })();
  }, []);

  return (
    <Layout>
      <Typography variant="h5">Data OverView</Typography>
      <Divider />
      <br />
      <Grid container spacing={6} justify="center">
        <Grid item xl={4} md={3} sm={6} xs={12}>
          {Object.keys(dashboard).length > 0 && (
            <TotalCount data={dashboard?.monthHistory} />
          )}
        </Grid>
        <Grid item xl={4} md={3} sm={6} xs={12}>
          {Object.keys(dashboard).length > 0 && (
            <DailyCount data={dashboard?.dayHistory} />
          )}
        </Grid>
        <Grid item xl={4} md={3} sm={6} xs={12}>
          {Object.keys(dashboard).length > 0 && (
            <TotalSite data={dashboard?.siteHistory} />
          )}
        </Grid>
      </Grid>

      {/*Server Monitoring */}

      <div style={{ height: "50px" }}></div>

      <Typography variant="h5">Server Monitoring</Typography>
      <Divider />
      <br />
      <Grid container spacing={6} justify="center">
        <Grid item xl={3} md={3} sm={6} xs={12}>
          <CpuCount cpu={cpu} />
        </Grid>
        <Grid item xl={3} md={3} sm={6} xs={12}>
          <RamCount ram={ram} />
        </Grid>{" "}
        <Grid item xl={3} md={3} sm={6} xs={12}>
          <FreeRamCount freeRam={freeRam} />
        </Grid>
        <Grid item xl={3} md={3} sm={6} xs={12}>
          <HardDiskCount ssd={ssd} />
        </Grid>
      </Grid>

      <div style={{ height: "50px" }}></div>

      {/* Data History */}

      <Typography variant="h5">History</Typography>
      <Divider />
      <br />
      <Grid container>
        <Grid item xl={6} md={6} sm={6} xs={12}>
          <div style={{ marginLeft: matches ? "180px" : "5px" }}>
            {Object.keys(dashboard).length > 0 && (
              <SiteList data={dashboard?.lastTenWeb} />
            )}
          </div>
        </Grid>
        <Grid item xl={6} md={6} sm={6} xs={12}>
          {Object.keys(dashboard).length > 0 && (
            <ScrappingHistory data={dashboard?.lastTenInfo} />
          )}
        </Grid>
      </Grid>
    </Layout>
  );
};

export default Admin;
