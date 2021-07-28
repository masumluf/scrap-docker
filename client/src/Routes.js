import React from "react";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import App from "./App";

import PrivateRoute from "./components/auth/protected/PrivateRoute";

import Admin from "./components/auth/admin/Admin";
import Site from "./components/auth/admin/Sites";
import Record from "./components/auth/admin/Record";
import DataReport from "./components/auth/admin/DataReport";
import AdminRoute from "./components/auth/protected/AdminRoute";

import Dashboard from "./components/auth/Dashboard";
import Archive from "./components/auth/admin/Archive";

const Routes = () => {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/" exact component={App} />

        <AdminRoute path="/auth/admin" Component={Admin} />
        <AdminRoute path="/auth/record" Component={Record} />
        <AdminRoute path="/auth/data" Component={DataReport} />
        <AdminRoute path="/auth/site" Component={Site} />
        <AdminRoute path="/auth/archive" Component={Archive} />
        <PrivateRoute path="/auth/dashboard" Component={Dashboard} />
      </Switch>
    </BrowserRouter>
  );
};

export default Routes;
