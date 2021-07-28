import React, { useState } from "react";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { updateUrl } from "../../../../../class/helper";
import DialogContent from "@material-ui/core/DialogContent";

import DialogContentText from "@material-ui/core/DialogContentText";
import { TextField } from "@material-ui/core";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import { useTheme } from "@material-ui/core/styles";

const MyComponent = ({ setEditModal, data, setPhoneNumber }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [loader, setLoader] = useState(false);
  const [values, setValues] = useState({
    _id: data._id,
    url: data.url,
    type: data.type,
    buttonText: "Update Site",
    errors: {},
  });
  const { _id, url, type, buttonText, errors } = values;

  const handleChange = (name) => (e) => {
    setValues({ ...values, [name]: e.target.value });
  };

  const searchPayment = async (e) => {
    e.preventDefault();
    if (!url)
      return setValues({
        ...values,
        errors: { url: "Please Enter Url First" },
      });
    if (!type)
      return setValues({
        ...values,
        errors: { type: "Please Enter Type " },
      });

    setLoader(true);
    // setProductReport(await hubReport(date1, date2, status, values, setValues));
    let checkResult = await updateUrl(e, values, setValues);
    if (checkResult) {
      //setPhoneNumber(5);
      setEditModal(false);
      window.location.href = window.location.href;
    }
    setLoader(false);
  };

  const handleClose = () => {
    setEditModal(false);
  };

  return (
    <>
      <DialogContent>
        <DialogContentText>
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
        </DialogContentText>
        <DialogContentText>
          <TextField
            fullWidth={true}
            variant="outlined"
            margin="normal"
            required
            label="Content Type"
            name="type"
            value={type ? type : ""}
            InputLabelProps={{
              shrink: true,
            }}
            onChange={handleChange("type")}
            error={errors.type && errors.type}
            helperText={errors.type && errors.type}
            autoFocus
          />
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={handleClose} color="primary">
          Cancel
        </Button>
        <Button onClick={searchPayment} color="primary" autoFocus>
          Update
        </Button>
      </DialogActions>
    </>
  );
};

export default MyComponent;
