import React from "react";

import {
  Avatar,
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
} from "@material-ui/core";

import MultilineChartIcon from "@material-ui/icons/MultilineChart";

const Budget = ({ data }) => (
  <Card sx={{ height: "100%" }}>
    <CardContent>
      <Grid container spacing={3} sx={{ justifyContent: "space-between" }}>
        <Grid item>
          <Typography color="textSecondary" gutterBottom variant="h6">
            Total Collection
          </Typography>
          <Typography
            color="textPrimary"
            variant="caption"
            style={{ fontSize: 17 }}
          >
            {data}
          </Typography>
          <MultilineChartIcon
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
