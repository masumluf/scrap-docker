import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import Avatar from "@material-ui/core/Avatar";
import ImageIcon from "@material-ui/icons/Image";
import WorkIcon from "@material-ui/icons/Work";
import moment from "moment";

import ArrowForwardIosIcon from "@material-ui/icons/InsertLink";
import { Divider } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    maxWidth: 460,
    backgroundColor: theme.palette.background.paper,
  },
}));

export default function FolderList({ data }) {
  const classes = useStyles();

  return (
    <List className={classes.root}>
      <ListItem>
        <ListItemText primary="Last 10 Enrolled Sites" />
      </ListItem>
      <Divider />
      {data.map((d, i) => (
        <>
          <ListItem key={i}>
            <ListItemAvatar>
              <ArrowForwardIosIcon />
            </ListItemAvatar>
            <ListItemText
              primary={d.url}
              secondary={moment(d.createdAt).format("MMM Do YY")}
            />
          </ListItem>
          <Divider component="li" />
        </>
      ))}
    </List>
  );
}
