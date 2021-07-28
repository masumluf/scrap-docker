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
import Edit from "./Edit";

export default function ResponsiveDialog({
  editModal,
  setEditModal,
  data,
  setPhoneNumber,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const handleClose = () => {
    setEditModal(false);
  };

  return (
    <div>
      <Dialog
        disableBackdropClick
        disableEscapeKeyDown
        fullScreen={fullScreen}
        fullWidth={true}
        open={editModal}
        onClose={handleClose}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle id="responsive-dialog-title">
          {"Use Google's location service?"}
        </DialogTitle>
        <Edit
          setEditModal={setEditModal}
          data={data}
          setPhoneNumber={setPhoneNumber}
        />
      </Dialog>
    </div>
  );
}
