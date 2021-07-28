import React, { Component } from "react";
import { Route, Redirect } from "react-router-dom";
import { isAuth } from "../../../class/storage";

const AdminRoute = ({ Component: Component, ...rest }) => (
  <Route
    {...rest}
    render={(props) =>
      isAuth() && isAuth().checkSum === "ad587" ? (
        <Component {...rest} />
      ) : (
        <Redirect to='/pagealert' />
      )
    }></Route>
);

export default AdminRoute;
