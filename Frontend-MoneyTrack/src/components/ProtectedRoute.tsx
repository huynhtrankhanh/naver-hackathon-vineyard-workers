import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { authApi } from '../services/api';

interface ProtectedRouteProps extends RouteProps {
  component: any;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ component: Component, ...rest }) => {
  return (
    <Route
      {...rest}
      render={(props) =>
        authApi.isAuthenticated() ? (
          <Component {...props} />
        ) : (
          <Redirect to={{ pathname: '/login', state: { from: props.location } }} />
        )
      }
    />
  );
};

export default ProtectedRoute;
