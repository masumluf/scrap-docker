import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { Link, Redirect, useHistory } from "react-router-dom";
import { isAuth, signout } from "../../class/storage";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import Drawer from "@material-ui/core/Drawer";
import CssBaseline from "@material-ui/core/CssBaseline";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import List from "@material-ui/core/List";
import Typography from "@material-ui/core/Typography";
import Divider from "@material-ui/core/Divider";
import IconButton from "@material-ui/core/IconButton";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import MenuIcon from "@material-ui/icons/Menu";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import AccountCircleIcon from "@material-ui/icons/AccountCircle";
import ListIcon from "@material-ui/icons/List";
import ExitToAppIcon from "@material-ui/icons/ExitToApp";
import EqualizerIcon from "@material-ui/icons/BarChart";
import CalendarTodayIcon from "@material-ui/icons/CalendarToday";
import MemoryIcon from "@material-ui/icons/Memory";
import SpeedIcon from "@material-ui/icons/Speed";
import HomeIcon from "@material-ui/icons/Home";
import AlarmIcon from "@material-ui/icons/Alarm";
import { Box } from "@material-ui/core";
import EventNoteIcon from "@material-ui/icons/EventNote";
import io from "socket.io-client";
import { dev } from "../../config";
const drawerWidth = 240;
let socket;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
  },
  appBar: {
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  hide: {
    display: "none",
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
  drawerHeader: {
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    justifyContent: "flex-end",
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: -drawerWidth,
  },
  contentShift: {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  },
  boxAlign: {
    display: "flex",
  },
}));

export default function PersistentDrawerLeft({ children }) {
  const classes = useStyles();
  const matches = useMediaQuery("(min-width:600px)");
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  let history = useHistory();

  const [ram, setRam] = useState(0);
  const [cpu, setCpu] = useState(0);
  const [status, setStatus] = useState(null);

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
    });
    socket.on("work-process", ({ data }) => {
      if (!data) {
        setStatus(null);
      } else {
        setStatus(data);
      }
      console.log(data);
    });
  };

  useEffect(() => {
    socketFunction();
  }, []);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar
        position="fixed"
        className={clsx(classes.appBar, {
          [classes.appBarShift]: open,
        })}
        style={{ backgroundColor: "#2ECC71" }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            className={clsx(classes.menuButton, open && classes.hide)}
          >
            <MenuIcon />
          </IconButton>
          <Box flexGrow={1}>
            {matches ? (
              <Typography variant="h6" noWrap>
                V-4 Scrapping Panel
              </Typography>
            ) : (
              <Typography variant="h6" noWrap>
                V-4
              </Typography>
            )}
          </Box>
          <Box>
            <IconButton
              aria-label="add to favorites"
              style={{ color: "#fff", fontSize: "17px", fontWeight: "bold" }}
            >
              <SpeedIcon /> &nbsp; {cpu} %
            </IconButton>
          </Box>
          &nbsp;&nbsp; | &nbsp;
          <Box>
            {/*<MemoryIcon fontSize="small" />*/}
            {/*<Typography variant="button" style={{ fontSize: 21 }}>*/}
            {/*  54%*/}
            {/*</Typography>*/}
            <IconButton
              aria-label="add to favorites"
              style={{ color: "#fff", fontSize: "17px", fontWeight: "bold" }}
            >
              <MemoryIcon /> &nbsp; {ram} GB
            </IconButton>
          </Box>
          &nbsp;&nbsp; | &nbsp;
          {status != null && (
            <Box>
              {/*<MemoryIcon fontSize="small" />*/}
              {/*<Typography variant="button" style={{ fontSize: 21 }}>*/}
              {/*  54%*/}
              {/*</Typography>*/}
              <IconButton
                aria-label="add to favorites"
                style={{ color: "#fff", fontSize: "17px", fontWeight: "bold" }}
              >
                <AlarmIcon /> &nbsp; {status}
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        className={classes.drawer}
        variant="persistent"
        anchor="left"
        open={open}
        classes={{
          paper: classes.drawerPaper,
        }}
      >
        <div className={classes.drawerHeader}>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === "ltr" ? (
              <ChevronLeftIcon />
            ) : (
              <ChevronRightIcon />
            )}
          </IconButton>
        </div>
        <Divider />
        <List>
          <Link
            to="/auth/admin"
            style={{ textDecoration: "none", color: "#3F51B5" }}
          >
            <ListItem button>
              <ListItemIcon>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
          </Link>

          <Link
            to="/auth/site"
            style={{ textDecoration: "none", color: "#3F51B5" }}
          >
            <ListItem button>
              <ListItemIcon>
                <ListIcon />
              </ListItemIcon>
              <ListItemText primary="All Site" />
            </ListItem>
          </Link>

          <Link
            to="/auth/archive"
            style={{ textDecoration: "none", color: "#3F51B5" }}
          >
            <ListItem button>
              <ListItemIcon>
                <EventNoteIcon />
              </ListItemIcon>
              <ListItemText primary="Fetch Old Data" />
            </ListItem>
          </Link>

          <Link
            to="/auth/record"
            style={{ textDecoration: "none", color: "#3F51B5" }}
          >
            <ListItem button>
              <ListItemIcon>
                <EqualizerIcon />
              </ListItemIcon>
              <ListItemText primary="All Record" />
            </ListItem>
          </Link>

          <Link
            to="/auth/data"
            style={{ textDecoration: "none", color: "#3F51B5" }}
          >
            <ListItem button>
              <ListItemIcon>
                <CalendarTodayIcon />
              </ListItemIcon>
              <ListItemText primary="Report" />
            </ListItem>
          </Link>

          <Link
            to="/admin/user"
            style={{ textDecoration: "none", color: "#3F51B5" }}
          >
            <ListItem button>
              <ListItemIcon>
                <AccountCircleIcon />
              </ListItemIcon>
              <ListItemText primary="User" />
            </ListItem>
          </Link>

          <Link
            to="/"
            onClick={() => {
              signout(() => {
                history.push("/");
              });
            }}
            style={{ textDecoration: "none", color: "#3F51B5" }}
          >
            <ListItem button>
              <ListItemIcon>
                <ExitToAppIcon />
              </ListItemIcon>
              <ListItemText primary="Log Out" />
            </ListItem>
          </Link>
        </List>
      </Drawer>
      <main
        className={clsx(classes.content, {
          [classes.contentShift]: open,
        })}
      >
        <div className={classes.drawerHeader} />
        {children}
      </main>
    </div>
  );
}
