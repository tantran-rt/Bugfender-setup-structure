"use client";

import { useState } from "react";
import { Modal, Button, TextField } from "@/components";
import { SlClose } from "react-icons/sl";
import { Formik } from "formik";
import { mfaSchema } from "@/utils/validations";
import { toast } from "react-toastify";
import Image from "next/image";

interface SessionModalProps {
  show: boolean;
  onClose?: (a?: any) => void;
  setLoginRedirect?: any;
  mobilePhone: any;
}

interface mfaType {
  otp: string;
}

const formatUSPhoneNumber = (phoneNumber: string) => {
  // Remove any non-digit characters from the input
  const digits = phoneNumber.replace(/\D/g, "");

  // Ensure it has at least 10 digits
  if (digits.length < 10) {
    throw new Error("Invalid phone number. It should have at least 10 digits.");
  }

  // Extract the parts of the phone number
  const areaCode = digits.slice(0, 3); // First 3 digits
  const centralOfficeCode = digits.slice(3, 6); // Next 3 digits
  const subscriberNumber = digits.slice(6, 8); // Next 2 digits
  const hiddenPart = "**";

  // Format the number
  return `(${areaCode}) ${centralOfficeCode} - ${hiddenPart}${subscriberNumber}`;
};

const MfaModal = ({
  show,
  onClose,
  setLoginRedirect,
  mobilePhone,
}: SessionModalProps) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const initialValues: mfaType = {
    otp: "",
  };

  const onSubmith = async (values: mfaType) => {
    try {
      const { otp } = values;
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    }
  };

  const onSubmit = async (values: mfaType) => {
    try {
      // const response = await axios.post(
      //   "https://sendotp-9168.twil.io/validate_otp",
      //   {
      //     phoneNumber: "+2348185261301", //participant id should be here
      //   }
      // );
      // const response = await fetch("/api/verifyMfa", {
      const response = await fetch(
        process.env.NEXT_PUBLIC_MFA_VERIFY_OTP_URL ||
          "https://verify-4120-mv6g89.twil.io/check-verify",
        {
          method: "POST",
          body: JSON.stringify({
            to: mobilePhone, //participant_id
            code: parseInt(values.otp),
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      // setSentOtp(response.data.otp); // Store the sent OTP for validation
      if (response.status === 200) {
        setLoginRedirect(true);
        onClose && onClose();
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
    }
  };

  return (
    <Modal show={show}>
      <div className="mfa-modal">
        <div className="close-icon-row" onClick={onClose}>
          <SlClose
            size={30}
            style={{ float: "right" }}
            className="clickable-icon-hover"
          />
        </div>
        <p>
          {/* To ensure the security of your account,
          <br />
          we have sent a verification code
          <br />
          via text message to your
          <br />
          phone number (***) *** - **94.
          <br /> */}
          Please enter the code sent to your phone.
        </p>
        <br />
        <br />
        {/* <h1
          className="sm-text"
          style={{ color: "#009CF9", marginBottom: "16px" }} `{mobilePhone}`
        >
          Enter Otp
        </h1> */}
        <div className="mfa-form">
          <Formik
            initialValues={initialValues}
            validationSchema={mfaSchema}
            onSubmit={onSubmit}
          >
            {({
              values,
              errors,
              touched,
              isSubmitting,
              handleChange,
              handleSubmit,
            }) => (
              <>
                <TextField
                  type="pin"
                  placeholder="Enter Otp"
                  value={values.otp}
                  startIcon={
                    <Image
                      src="/icons/lock.svg"
                      alt="proof image"
                      width={24}
                      height={24}
                      loading="lazy"
                    />
                  }
                  endIcon={true}
                  name="otp"
                  errors={errors}
                  touched={touched}
                  onChange={handleChange("otp")}
                />

                <Button
                  blue
                  disabled={isSubmitting}
                  type="submit"
                  style={{ height: "42px" }}
                  onClick={handleSubmit}
                >
                  Verify
                </Button>
              </>
            )}
          </Formik>
        </div>
      </div>
    </Modal>
  );
};

export default MfaModal;
