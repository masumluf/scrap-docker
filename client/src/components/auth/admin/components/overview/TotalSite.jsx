import React from "react";

import {
  Avatar,
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
} from "@material-ui/core";
import ArrowDownwardIcon from "@material-ui/icons/ArrowDownward";
import MoneyIcon from "@material-ui/icons/Money";
import { red } from "@material-ui/core/colors";

import GraphicEqIcon from "@material-ui/icons/GraphicEq";
const Budget = ({ data }) => (
  <Card sx={{ height: "100%" }}>
    <CardContent>
      <Grid container spacing={3} sx={{ justifyContent: "space-between" }}>
        <Grid item>
          <Typography color="textSecondary" gutterBottom variant="h6">
            Total Site Enlisted
          </Typography>
          <Typography
            color="textPrimary"
            variant="caption"
            style={{ fontSize: 17 }}
          >
            {data}
          </Typography>
          <GraphicEqIcon
            style={{
              color: "#58D68D",
              fontSize: 35,
              marginLeft: "20px",
              marginBottom: "-8px",
              fontWeight: 100,
            }}
          />
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

export default Budget;
