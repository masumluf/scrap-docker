import React, { useEffect, useState } from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { useTheme } from "@material-ui/core/styles";
import { TextField } from "@material-ui/core";
import { addUrl } from "../../../../../class/helper";

export default function ResponsiveDialog({
  newModal,
  setNewModal,
  setPhoneNumber,
}) {
  const [open, setOpen] = React.useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [loader, setLoader] = useState(false);
  const [values, setValues] = useState({
    url: null,
    type: null,
    buttonText: "Add Site",
    errors: {},
  });
  const { url, type, buttonText, errors } = values;

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
    let checkResult = await addUrl(e, values, setValues);
    if (checkResult) {
      //setPhoneNumber(5);
      window.location.href = window.location.href;
      setNewModal(false);
    }
    setLoader(false);
  };

  const handleClose = () => {
    setNewModal(false);
  };

  return (
    <div>
      <Dialog
        disableBackdropClick
        disableEscapeKeyDown
        fullScreen={fullScreen}
        fullWidth={true}
        open={newModal}
        onClose={handleClose}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle id="responsive-dialog-title">
          {"Use Google's location service?"}
        </DialogTitle>
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
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
