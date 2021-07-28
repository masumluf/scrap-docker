import React, { useState, useEffect } from "react";
import axios from "axios";

import { Grid, Paper, Typography, Button, TextField } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { signIn } from "../class/helper";
const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
  },
  containerCenter: {
    alignItems: "center",
    justifyContent: "center",
    width: "70%",
    padding: theme.spacing(5),
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
}));

export default function UserRegistration() {
  const classes = useStyles();
  const bull = <span className={classes.bullet}>•</span>;

  const [loader, setLoader] = useState(false);
  const [open, setOpen] = useState(false);

  const [values, setValues] = useState({
    username: "",
    password: "",
    ip: null,
    buttonText: "Login",
  });

  const [filedError, setFieldError] = useState({
    ...values,
  });

  const error = { ...filedError };

  const { username, password, ip, buttonText } = values;

  const handleChange = (name) => (e) => {
    setValues({ ...values, [name]: e.target.value });

    switch (name) {
      case "username":
        error.name =
          e.target.value.length > 0 && e.target.value.length < 3
            ? "Minimum 3 characaters required"
            : "";
        break;

      case "password":
        error.password =
          e.target.value.length > 0 && e.target.value.length < 3
            ? "Password Required"
            : "";
        break;

      default:
        break;
    }

    setFieldError({
      ...error,
    });
  };

  const bodyChange = (body) => {
    setValues({ ...values, body: body });
  };

  const onChangeHandler = (e) => {
    setValues({ ...values, images: e.target.files });
  };

  const disableButton = username.length > 3 && password.length > 0;
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1036px)");
    if (mediaQuery.matches) {
      ///console.log("mobile");
      setOpen(true);
    } else {
      //console.log("desktop");
      setOpen(false);
    }
    mediaQuery.addListener((mq) => {
      if (mq.matches) {
        //console.log("mobile 2");
        setOpen(true);
      } else {
        //console.log("desktop 2");
        setOpen(false);
      }
    });
  }, []);

  const getIpAddress = async () => {
    //https://geolocation-db.com
    try {
      let result = await axios({
        method: "GET",
        url: `https://geolocation-db.com/json/e4f42070-ad2d-11eb-adf1-cf51da9b3410`,
      });
      if (result) {
        ///console.log(result?.data?.IPv4);
        setValues({ ...values, ip: result?.data?.IPv4 });
      }
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    getIpAddress();
  }, []);

  return (
    <>
      <Paper
        className={classes.containerCenter}
        style={{ marginLeft: open ? 150 : 6, marginTop: 40 }}
      >
        <Grid container>
          <Grid item xs={12}>
            <Typography
              variant="h5"
              gutterBottom
              style={{
                fontWeight: "400",
                fontFamily: ["Yeseva One"],
                lineHeight: 1.2,
                color: "#25283A",
                textTransform: "capitalize",
              }}
            >
              Login Area..
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              value={username ? username : ""}
              onChange={handleChange("username")}
              id="name"
              label="Username"
              name="username"
              error={filedError.username !== ""}
              helperText={
                filedError.username !== "" ? `${filedError.username}` : ""
              }
              autoFocus
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              type="password"
              value={password ? password : ""}
              onChange={handleChange("password")}
              id="password"
              label="Password"
              name="password"
              error={filedError.password !== ""}
              helperText={
                filedError.password !== "" ? `${filedError.password}` : ""
              }
              autoFocus
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              type="submit"
              fullWidth
              disabled={!disableButton}
              variant="contained"
              color="primary"
              className={classes.submit}
              onClick={(e) => {
                signIn(e, values, setValues);
              }}
            >
              {buttonText}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </>
  );
}
