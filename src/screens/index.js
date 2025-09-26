import LandingPage from "./landing_page/index.jsx";
import NotFound from "./NotFound.jsx";
import Dashboard from "./appointment_singlePageTable/dashboard_index.jsx";
import AvailabilityCreate from "./availability_oneToMany/availability_create.jsx";
import AvailabilityEdit from "./availability_oneToMany/availability_edit.jsx";
import AvailabilityView from "./availability_oneToMany/availability_view.jsx";
import DoctorCreate from "./doctor_details/doctor_createForm.jsx";
import DoctorEdit from "./doctor_details/doctor_editForm.jsx";
import DoctorView from "./doctor_details/doctor_view.jsx";
import PatientSinglePageTable from "./patient_singlePageTable/patient_index.jsx";
import PaymentSinglePageTable from "./payment_singlePageTable/payment_index.jsx";
import DoctorStepper from "./doctor_stepper/doctor_stepper_index.js";
import Signup from "./auth/signup.js";
import Login from "./auth/login.js";
import MySchedule from "./mySchedule/index.jsx";
import Appointments from "./appointments/appointments_index.jsx";
import PatientCreate from "./patient_details/patient_createForm.jsx";
import PatientEdit from "./patient_details/patient_editForm.jsx";
import PatientView from "./patient_details/patient_view.jsx";
import PrescriptionCreate from "./prescription_details/prescription_createForm.jsx";
import PrescriptionEdit from "./prescription_details/prescription_editForm.jsx";
import PrescriptionView from "./prescription_details/prescription_view.jsx";
import ApplicantReview from "./applicant_review/index.jsx";

export {
    LandingPage,
    NotFound,
    Dashboard, 
    AvailabilityCreate, AvailabilityEdit, AvailabilityView, 
    DoctorCreate, DoctorEdit, DoctorView, 
    PatientCreate, PatientEdit, PatientView, 
    PatientSinglePageTable, 
    PaymentSinglePageTable,
    DoctorStepper,
    Signup, Login,
    MySchedule, Appointments,
    PrescriptionCreate, PrescriptionEdit, PrescriptionView,
    ApplicantReview
};