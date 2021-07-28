import React, { useEffect, useState } from "react";
import {
  Grid,
  Container,
  Typography,
  Divider,
  TextField,
  Button,
  Paper,
} from "@material-ui/core";

import useMediaQuery from "@material-ui/core/useMediaQuery";
import Layout from "../Layout";
import { startFetchingOldData } from "../../../class/helper";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
  },
  containerCenter: {
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(5),
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
}));

const Admin = () => {
  const matches = useMediaQuery("(min-width:600px)");

  const classes = useStyles();
  const bull = <span className={classes.bullet}>•</span>;

  const [loader, setLoader] = useState(false);
  const [open, setOpen] = useState(false);

  const [values, setValues] = useState({
    url: "",
    topicName: "",
    buttonText: "Start Fetching Old Data",
    errors: {},
  });

  const { url, topicName, errors, buttonText } = values;

  const handleChange = (name) => (e) => {
    setValues({ ...values, [name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url)
      return setValues({
        ...values,
        errors: { url: "Please Enter Url First" },
      });
    if (!topicName)
      return setValues({
        ...values,
        errors: { topicName: "Please Enter Topic Name " },
      });

    await startFetchingOldData(url, topicName);
  };

  return (
    <Layout>
      <Paper
        className={classes.containerCenter}
        style={{ marginLeft: open ? 150 : 6, marginTop: 40 }}
      >
        <Grid container style={{ textAlign: "center" }}>
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
              Fetch Old Data
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth={true}
              variant="outlined"
              margin="normal"
              required
              label="Site Url"
              name="url"
              value={url ? url : ""}
              InputLabelProps={{
                shrink: true,
              }}
              onChange={handleChange("url")}
              error={errors.url && errors.url}
              helperText={errors.url && errors.url}
              autoFocus
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth={true}
              variant="outlined"
              margin="normal"
              required
              label="Topic Name"
              name="topicName"
              value={topicName ? topicName : ""}
              InputLabelProps={{
                shrink: true,
              }}
              onChange={handleChange("topicName")}
              error={errors.topicName && errors.topicName}
              helperText={errors.topicName && errors.topicName}
              autoFocus
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
              onClick={handleSubmit}
            >
              {buttonText}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/*Server Monitoring */}
    </Layout>
  );
};

export default Admin;
