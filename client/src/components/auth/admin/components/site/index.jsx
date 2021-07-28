import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import { Button } from "@material-ui/core";
import moment from "moment";
import {
  deleteUrl,
  disableExecutation,
  startFetchingData,
} from "../../../../../class/helper";

import CreateIcon from "@material-ui/icons/Create";
import DeleteIcon from "@material-ui/icons/Delete";
import ReplayIcon from "@material-ui/icons/Replay";
import IconButton from "@material-ui/core/IconButton";
import HighlightOffIcon from "@material-ui/icons/HighlightOff";
import EditModal from "./EditModal";
const useStyles = makeStyles({
  table: {
    minWidth: 650,
  },
  buttonShadow: {
    boxShadow: " 2px 2px 6px 0px rgba(0,0,0,0.75)",
    backgroundColor: "#2ECC71",
    color: "#fff",
    width: "20px",
  },
});

function createData(name, calories, fat, carbs, protein) {
  return { name, calories, fat, carbs, protein };
}

// const rows = [
//   createData("Frozen yoghurt", true, 6.0, 24, 4.0),
//   createData("Ice cream sandwich", true, 9.0, 37, 4.3),
//   createData("Eclair", false, 16.0, 24, 6.0),
//   createData("Cupcake", true, 3.7, 67, 4.3),
//   createData("Gingerbread", false, 16.0, 49, 3.9),
// ];

export default function BasicTable({ rows, setPhoneNumber }) {
  const classes = useStyles();
  const [editModal, setEditModal] = useState(false);
  const [posts, setPosts] = useState({});

  const setPost = (e, row) => {
    e.preventDefault();
    setEditModal(true);
    setPosts(row);
  };

  const fetchData = async (e, url) => {
    e.preventDefault();

    let regex = /(?:https?:\/\/)?(?:www\.)?(.*)\.(?=[\w.]{1})/;
    let matches = regex.exec(url);
    let finalUrl = matches[1];
    await startFetchingData(finalUrl);
  };

  const removeData = async (e, id) => {
    e.preventDefault();
    let result = await deleteUrl(e, id);
    if (result) {
      window.location.href = window.location.href;
    }
  };
  const stopExecution = (e) => {
    e.preventDefault();

    disableExecutation();
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table className={classes.table} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Website Name</TableCell>
              <TableCell align="right">IsFetched ?</TableCell>
              <TableCell align="right">Date</TableCell>
              <TableCell align="right">Type</TableCell>
              <TableCell align="right">Fetch Now</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.name}>
                <TableCell component="th" scope="row">
                  {row.url}
                </TableCell>
                <TableCell align="right">
                  {row.isCompleted ? "Yes" : "No"}
                </TableCell>
                <TableCell align="right">
                  {moment(row.createdAt).format("LLL")}
                </TableCell>
                <TableCell align="right">{row.type}</TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    aria-label="upload picture"
                    component="span"
                  >
                    <ReplayIcon
                      fontSize="large"
                      style={{ color: "#2ECC71" }}
                      onClick={(e) => {
                        fetchData(e, row.url);
                      }}
                    />
                  </IconButton>
                  <IconButton
                    color="primary"
                    aria-label="upload picture"
                    component="span"
                  >
                    <HighlightOffIcon
                      fontSize="large"
                      style={{ color: "#2ECC71" }}
                      onClick={(e) => {
                        stopExecution(e, row.url);
                      }}
                    />
                  </IconButton>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    aria-label="upload picture"
                    component="span"
                  >
                    <CreateIcon
                      style={{ color: "#7F8180" }}
                      onClick={(e) => {
                        setPost(e, row);
                      }}
                    />
                  </IconButton>
                  <IconButton
                    color="primary"
                    aria-label="upload picture"
                    component="span"
                  >
                    <DeleteIcon
                      style={{ color: "#7F8180" }}
                      onClick={(e) => {
                        removeData(e, row._id);
                      }}
                    />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <EditModal
        editModal={editModal}
        setEditModal={setEditModal}
        data={posts}
        setPhoneNumber={setPhoneNumber}
      />
    </>
  );
}
