import React from 'react';
import Routes from "./Routes";
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import { Header, Wrapper, Drawer, AlertMessage } from 'components';
import { Box, CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { DefaultTheme } from "./theme";
import TimerSession from "shared/useTimerSession";
import Helper from "shared/helper";
import Session from "shared/session";
import * as Api from "shared/services";

global.Busy = (bBool) => {
  var x = document.getElementById("busyloader");
  if (x) x.className = bBool ? "loader display-block" : "loader display-none";
};

global.AlertPopup = (type, msg) => {
  sessionStorage.setItem('alert', JSON.stringify({ msg, type }));
};

const fullScreenRoutes  = ['/doctor/registration', '/login', '/signup', '/review'];

const shouldShowLayout = (pathname) => {
  const isFullScreen = fullScreenRoutes.some(path => pathname.startsWith(path));
   const isAuthenticated = Session.Retrieve("isAuthenticated", true);
  return !isFullScreen && isAuthenticated;
}

function App() {
  const [open, setOpen] = React.useState(true);
  const [customTheme, setCustomTheme] = React.useState(DefaultTheme);
  const [row, setRow] = React.useState({});

  const [isAuthenticated] = TimerSession('isAuthenticated', true);
  const location = useLocation();
  const showLayout = shouldShowLayout(location.pathname);


  const OnDrawerClicked = () => { setOpen(!open); }

  const fetchDoctor = async () => {
      return new Promise(async (resolve) => {
          global.Busy(true);
          let query = null, _row = {};

          const username = Session.Retrieve("Username");
          query = `$filter=UserKey eq '${username}'`

          await Api.GetDoctorsMulti(query)
              .then(async (res) => {
                  if(res.status) {
                      const rslt = res.values?.at(0);
                      Session.Store("Id", rslt.DoctorId);
                      _row = rslt;
                  }
              });
                _row?.DoctorDoctorImage &&
                  await Api.GetDocumentSingleMedia(_row?.DoctorDoctorImage, true, null).then((resI) => {
                      _row = { ..._row, logo: resI.values };
                  })

              setRow(_row);
              global.Busy(false);
          });
    }

    React.useEffect(() => { if(isAuthenticated) fetchDoctor(); }, [isAuthenticated])

  return (
      <ThemeProvider theme={customTheme}>
          <CssBaseline />
              <Box sx={{ flexGrow: 1 }}>
                  {showLayout ? (
                      <>
                          <Header open={open} onDrawerClicked={OnDrawerClicked} Id={row.DoctorId} row={row} />
                          <Drawer open={open} />
                          <Wrapper open={open}>
                          <Routes />
                          </Wrapper>
                      </>
                  ) : (
                      <Routes />
                  )}
                <AlertMessage />
              </Box>
      </ThemeProvider>
  );
}

export default App;