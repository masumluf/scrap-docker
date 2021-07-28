import React, { useEffect, useState } from "react";
import Info from "../components/record";
import Layout from "../../Layout";
import { Grid, Button, TextField } from "@material-ui/core";
import useMediaQuery from "@material-ui/core/useMediaQuery";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";

import NewModal from "../components/site/NewModal";
import EditModal from "../components/site/EditModal";
import { allRecord, recordHistory } from "../../../../class/helper";

const useStyles = makeStyles((theme) => ({
  buttonShadow: {
    boxShadow: " 2px 2px 6px 0px rgba(0,0,0,0.75)",
  },
  bodyContent: {
    marginTop: 5,
    width: "99%",
    padding: 15,
    background: "#FFFFFF",
    borderRadius: "0.25rem",
    boxShadow: "0 1px 15px rgba(0, 0, 0, 0.04), 0 1px 6px rgba(0, 0, 0, 0.3)",
  },
  blackFont: {
    color: "#000",
  },
  form: {
    width: "100%", // Fix IE 11 issue.
    marginTop: 5,
    textAlign: "center",
    padding: 10,
  },
  inputForm: {
    width: "65%",
    margin: 5,
    marginBottom: 30,
  },
  submit: {
    backgroundColor: "#2ECC71",
    width: "80%",
    padding: 10,
    marginTop: 18,
  },
  buttonClass: {
    backgroundColor: "#50B371",
    color: "#F5F5F5",
  },
  gap: {
    marginTop: 15,
  },
}));

const MyComponent = () => {
  let classes = useStyles();
  const matches = useMediaQuery("(min-width:800px)");
  const [rows, setRows] = useState([]);

  const [values, setValues] = useState({
    date1: null,
    date2: null,
    buttonText: "Search",
    errors: {},
  });
  const { date1, date2, buttonText, errors } = values;

  const handleChange = (name) => (e) => {
    setValues({ ...values, [name]: e.target.value });
  };

  const fetchData = async () => {
    setRows(await allRecord());
  };

  useEffect(() => {
    (async () => {
      await fetchData();
    })();
  }, []);

  const searchPayment = async (e) => {
    e.preventDefault();
    if (!date1)
      return setValues({
        ...values,
        errors: { date1: "Please Select Date First " },
      });
    if (!date2)
      return setValues({
        ...values,
        errors: { date2: "Please Select Date First " },
      });

    // setProductReport(await hubReport(date1, date2, status, values, setValues));
    setRows(await recordHistory(values, setValues));
  };

  return (
    <>
      <Layout>
        <Grid container component={Paper} style={{ padding: 10 }} spacing={2}>
          <form className={classes.form} noValidate>
            <div style={{ display: matches && "flex" }}>
              <Grid item lg={3} sm={12} xs={12}>
                {" "}
                <TextField
                  variant="outlined"
                  margin="normal"
                  required
                  fullWidth
                  label="Date From"
                  name="date1"
                  type="date"
                  id="date1"
                  value={date1 ? date1 : ""}
                  onChange={handleChange("date1")}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  error={errors.date1 && errors.date1}
                  helperText={errors.date1 && errors.date1}
                  autoFocus
                />
              </Grid>
              <Grid item lg={3} sm={12} xs={12}>
                {" "}
                <TextField
                  variant="outlined"
                  margin="normal"
                  required
                  fullWidth
                  label="Date End"
                  name="date2"
                  type="date"
                  id="date"
                  value={date2 ? date2 : ""}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  onChange={handleChange("date2")}
                  error={errors.date2 && errors.date2}
                  helperText={errors.date2 && errors.date2}
                  autoFocus
                />
              </Grid>

              <Grid item lg={3} sm={12} xs={12}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={(e) => searchPayment(e)}
                  className={classes.submit}
                >
                  {buttonText}
                </Button>
              </Grid>
            </div>
          </form>
        </Grid>
        <br /> <br />
        <Grid container>
          <Info rows={rows} />
        </Grid>
      </Layout>
    </>
  );
};

export default MyComponent;
