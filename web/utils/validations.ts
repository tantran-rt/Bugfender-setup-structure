import * as Yup from "yup";

//Validation schema for signin
export const signinSchema = Yup.object().shape({
  participant_id: Yup.string().required("Participant ID is required"),
  pin: Yup.string().required("Pin is required"),
});

//Validation schema for forgot pin
export const forgotPinSchema = Yup.object().shape({
  participant_id: Yup.number().required("Participant ID is required"),
});

//Validation schema for otp
export const otpSchema = Yup.object().shape({
  otp: Yup.string().required("OTP is required"),
});

//Validation schema for set pin
export const setPinSchema = Yup.object().shape({
  pin: Yup.number().required("Pin is required"),
  confirm_pin: Yup.number().required("Pin is required"),
});

//Validation schema for otp
export const mfaSchema = Yup.object().shape({
  otp: Yup.string().required("OTP is required"),
});

//Validation schema for ID card details
export const IDSchema = Yup.object().shape({
  first_name: Yup.string().required("First Name is required"),
  last_name: Yup.string().required("Last Name is required"),
  date_of_birth: Yup.string().required("Date of Birth is required"),
  address: Yup.string().required("address is required"),
  city: Yup.string().required("City is required"),
  state: Yup.string().required("State is required"),
  zipcode: Yup.string().required("Zipcode is required"),
});
