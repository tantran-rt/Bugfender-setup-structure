"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Formik, Form } from "formik";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { Modal, Button, TextField } from "@/components";
import { setPinSchema } from "@/utils/validations";
import { useSelector } from "react-redux";
import { authToken } from "@/redux/slices/auth";

interface SessionModalProps {
  show: boolean;
  onClick(): void;
}

interface SetNewPinType {
  pin: number | string;
  confirm_pin: number | string;
}

const ChangePinModal = ({ show, onClick }: SessionModalProps) => {
  const { participant_id } = useSelector(authToken);
  const initialValues: SetNewPinType = {
    pin: "",
    confirm_pin: "",
  };

  const onSubmit = async (values: SetNewPinType) => {
    try {
      const { pin, confirm_pin } = values;

      const response = await fetch("/api/change-pin", {
        method: "POST",
        headers: {
          participant_id: participant_id as string,
          pin: pin as string,
          pin_new: confirm_pin as string,
        },
      });

      const data = await response.json();

      if (data.data.statusCode === 200) {
        toast.success("Pin changed successfully!");
        onClick();
      } else {
        toast.warning(`Error ${data.data.statusCode}: ${data.data.message}`);
        onClick();
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    }
  };

  return (
    <Modal show={show} onClose={onClick}>
      <div className="cp-modal">
        <h1
          className="sm-text"
          style={{ color: "#009CF9", marginBottom: "30px" }}
        >
          Change PIN
        </h1>
        <Formik
          initialValues={initialValues}
          validationSchema={setPinSchema}
          onSubmit={onSubmit}
        >
          {({ values, errors, touched, isSubmitting, handleChange }) => (
            <Form>
              <div className="auth-form">
                <div>
                  <TextField
                    type="password"
                    placeholder="Old PIN"
                    value={values.pin}
                    startIcon={
                      <Image
                        src="/icons/lock.svg"
                        alt="image"
                        width={24}
                        height={24}
                        loading="lazy"
                      />
                    }
                    endIcon={true}
                    name="pin"
                    errors={errors}
                    touched={touched}
                    onChange={handleChange("pin")}
                  />
                  <TextField
                    type="password"
                    placeholder="New PIN"
                    value={values.confirm_pin}
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
                    name="confirm_pin"
                    errors={errors}
                    touched={touched}
                    onChange={handleChange("confirm_pin")}
                  />
                </div>
                <Button
                  blue
                  disabled={isSubmitting}
                  type="submit"
                  style={{ height: "50px" }}
                >
                  Save
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </Modal>
  );
};

export default ChangePinModal;
