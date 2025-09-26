import React from "react";
import Session from "shared/session";
import { Navigate, useRoutes } from "react-router-dom"
import {
  LandingPage,
  NotFound,
  Dashboard,
  AvailabilityCreate, AvailabilityEdit, AvailabilityView,
  PatientCreate, PatientEdit, PatientView,  
  DoctorCreate, DoctorEdit, DoctorView, 
  PatientSinglePageTable,
  PaymentSinglePageTable,
  DoctorStepper,
  Login, Signup,
  MySchedule, Appointments,
  PrescriptionCreate, PrescriptionEdit, PrescriptionView,
  ApplicantReview
} from "screens";

function PrivateRoute({ children }) {
    const loggedin = Session.Retrieve("isAuthenticated", true);
    return loggedin ? children : <Navigate to="/login" />;
}

const ProjectRoutes = (props) => {
      const loggedin = Session.Retrieve("isAuthenticated", true);

    let element = useRoutes([
        !loggedin && { path: "/login", element: (<Login />) },
        { path: "/signup", element: (<Signup />) },
        { path: "*", element: (<NotFound />) },

        { path: "/", element: (<PrivateRoute> <Dashboard {...props} title="Dashboard" /> </PrivateRoute>)},
        { path: "/HealthNest_doctor_UI_1/html", element: (<PrivateRoute> <LandingPage {...props} title="LandingPage" nolistbar={true} /> </PrivateRoute>)},
                                    { path: "Availabilities/view/:id", element: (<PrivateRoute> <AvailabilityView {...props} title="View Availability" /> </PrivateRoute>)},
                    { path: "Availabilities/edit/:id", element: (<PrivateRoute> <AvailabilityEdit {...props} title="Edit Availability" /> </PrivateRoute>)},
                    { path: "Availabilities/create", element: (<PrivateRoute> <AvailabilityCreate {...props} title="My Schedule" /> </PrivateRoute>)},
                                    { path: "Doctors/view/:id", element: (<PrivateRoute> <DoctorView {...props} title="View Profile" /> </PrivateRoute>)},
                    { path: "Doctors/edit/:id", element: (<PrivateRoute> <DoctorEdit {...props} title="Edit Profile" /> </PrivateRoute>)},
                    { path: "Doctors/create", element: (<PrivateRoute> <DoctorCreate {...props} title="Create Doctor" /> </PrivateRoute>)},

            { path: "/appointments", element: (<PrivateRoute> <Appointments {...props} title="Appointments" /> </PrivateRoute>)},
            { path: "/dashboard", element: (<PrivateRoute> <Dashboard {...props} title="Dashboard" /> </PrivateRoute>)},
            { path: "/patients", element: (<PrivateRoute> <PatientSinglePageTable {...props} title="Patients" /> </PrivateRoute>)},
            { path: "/payments", element: (<PrivateRoute> <PaymentSinglePageTable {...props} title="Payments" /> </PrivateRoute>)},
            { path: "/doctor/registration", element: (<PrivateRoute> <DoctorStepper {...props} title="Doctor Registration" /> </PrivateRoute>)},
            { path: "/myschedule", element: (<PrivateRoute> <MySchedule {...props} title="My Schedule" /> </PrivateRoute>)},
            { path: "Patients/view", element: (<PrivateRoute> <PatientEdit {...props} title="Patient Profile" /> </PrivateRoute>) },
            { path: "Patients/edit/:id", element: (<PrivateRoute> <PatientEdit {...props} title="Edit Profile" /> </PrivateRoute>) },
            { path: "Patients/create", element: (<PrivateRoute> <PatientCreate {...props} title="Create Profile" /> </PrivateRoute>) },
            { path: "Prescription/view/:id", element: (<PrivateRoute> <PrescriptionView {...props} title="View Prescription" /> </PrivateRoute>)},
            { path: "Prescription/edit/:id", element: (<PrivateRoute> <PrescriptionEdit {...props} title="Edit Prescription" /> </PrivateRoute>)},
            { path: "Prescription/create", element: (<PrivateRoute> <PrescriptionCreate {...props} title="Prescription" /> </PrivateRoute>)},
            { path: "Prescription/create/:id", element: (<PrivateRoute> <PrescriptionCreate {...props} title="Prescription" /> </PrivateRoute>)},
            { path: "review", element: (<PrivateRoute> <ApplicantReview {...props} title="Under Review" /> </PrivateRoute>)},
            { path: "Patients/view/:id", element: (<PrivateRoute> <PatientView {...props} title="Patient Profile" /> </PrivateRoute>) },

              ]);

  return element;
};

export default ProjectRoutes;