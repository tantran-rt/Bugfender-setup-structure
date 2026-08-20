"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Form } from "formik";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import Crypto from "crypto-js";
import {
  appData,
  setAppData,
  fetchS3Image,
  setOraltoxSecondaryTest,
  setQuiktoxSecondaryTest,
  setEditOraltoxResult,
  setEditQuiktoxResult,
  setShowRapidResult
} from "@/redux/slices/appConfig";
import { TextField, CheckBox, Button, Loader } from "@/components";
import { login } from "@/redux/slices/auth";
import { signinSchema } from "@/utils/validations";
import { AppDispatch } from "@/redux/store";
import MfaModal from "@/components/modals/mfaModal";
import useResponsive from "@/hooks/useResponsive";
import styles from "./sigin.module.css";
import { setProofID } from "@/redux/slices/drugTest";
import * as Sentry from "@sentry/browser";
import { Browser, PermissionConfig } from "@/types/constants";
import {
  checkAvailableStorage,
  extractIdFromPermissionsForKey
} from "@/utils/utils";
import { sendLogs, setBugfenderDeviceId } from "@/utils/sendAnalytics.utils";
import useGetDeviceInfo from "@/hooks/useGetDeviceInfo";

interface SignInType {
  participant_id: string;
  pin: string;
}

function LoginForm() {
  const [loginError, setLoginError] = useState<string>("");
  const landingCookie = Cookies.get("welView");
  const { PROOF_Home_Logo } = useSelector(appData);
  const router = useRouter();
  const dispatch = useDispatch();
  const appDispatch = useDispatch<AppDispatch>();
  const {
    osName,
    osVersion,
    browserName,
    browserVersion,
    deviceModel,
    deviceType,
    deviceVendor
  } = useGetDeviceInfo();
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  // Instead of separate localId/localPin, use one state for saved credentials.
  const [savedCredentials, setSavedCredentials] = useState<SignInType>({
    participant_id: "",
    pin: ""
  });
  const [checked, setChecked] = useState(false);
  const [mfaModal, setMfaModal] = useState(false);
  const [loginRedirect, setLoginRedirect] = useState(false);
  const [loginData, setLoginData] = useState<any>();
  const [mobileNo, setMobileNo] = useState("");
  const { isDesktop, isLoading } = useResponsive();
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [privateModeMessage, setPrivateModeMessage] = useState("");

  // initialValues come directly from savedCredentials.
  const initialValues: SignInType = savedCredentials;

  // Toggle "Remember me". When unchecked, clear localStorage and savedCredentials.
  const handleCheckBox = () => {
    if (checked) {
      localStorage.removeItem("participant_id");
      localStorage.removeItem("pin");
      setSavedCredentials({ participant_id: "", pin: "" });
      setChecked(false);
    } else {
      setChecked(true);
    }
  };

  const onSubmit = async (values: SignInType) => {
    try {
      setLoginError(""); // ⬅️ clear any previous error
      const participant_id = values.participant_id.trim();
      const { pin } = values;
      sendLogs(
        `Login credential participant_id: '${participant_id}' - pin: '${pin}'`
      );
      if (checked && typeof window !== "undefined") {
        if (
          localStorage.getItem("participant_id") === null &&
          localStorage.getItem("pin") === null
        ) {
          const encryptedId = Crypto.AES.encrypt(
            participant_id,
            process.env.NEXT_PUBLIC_SECRET_KEY as string
          ).toString();
          const encryptedPin = Crypto.AES.encrypt(
            pin,
            process.env.NEXT_PUBLIC_SECRET_KEY as string
          ).toString();
          localStorage.setItem("participant_id", encryptedId);
          localStorage.setItem("pin", encryptedPin);
        }
      }

      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          participant_id,
          pin
        }
      });
      const data = await response.json();

      if (data.data.statusCode === 200) {
        setMobileNo(
          data.data?.mobile_phone ? `+${data?.data?.mobile_phone}` : ""
        );

        const permissions = data.data?.permissions
          ? data.data?.permissions.split(";")
          : [];

        const oralToxPositiveTestPermission = extractIdFromPermissionsForKey(
          PermissionConfig.ORALTOX_POSITIVE,
          permissions
        );
        const oralToxInconclusiveTestPermission =
          extractIdFromPermissionsForKey(
            PermissionConfig.ORALTOX_INCONCLUSIVE,
            permissions
          );

        const quikToxPositiveTestPermission = extractIdFromPermissionsForKey(
          PermissionConfig.QUIKTOX_POSITIVE,
          permissions
        );
        const quikToxInconclusiveTestPermission =
          extractIdFromPermissionsForKey(
            PermissionConfig.QUIKTOX_INCONCLUSIVE,
            permissions
          );

        if (
          oralToxPositiveTestPermission ||
          oralToxInconclusiveTestPermission
        ) {
          dispatch(
            setOraltoxSecondaryTest({
              positive: oralToxPositiveTestPermission,
              inconclusive: oralToxInconclusiveTestPermission
            })
          );
        }

        if (
          quikToxPositiveTestPermission ||
          quikToxInconclusiveTestPermission
        ) {
          dispatch(
            setQuiktoxSecondaryTest({
              positive: quikToxPositiveTestPermission,
              inconclusive: quikToxInconclusiveTestPermission
            })
          );
        }

        if (permissions?.includes(PermissionConfig.SHOW_RAPID_RESULT)) {
          dispatch(setShowRapidResult(true));
        }
        if (permissions?.includes(PermissionConfig.HIDE_RAPID_RESULT)) {
          dispatch(setShowRapidResult(false));
        }

        if (permissions?.includes(PermissionConfig.EDIT_ORALTOX_RESULTS)) {
          dispatch(setEditOraltoxResult(true));
        }

        if (permissions?.includes(PermissionConfig.EDIT_QUIKTOX_RESULTS)) {
          dispatch(setEditQuiktoxResult(true));
        }

        if (permissions?.includes("2FA")) {
          // const mfaResponse = await fetch("/api/mfa", {
          const mfaResponse = await fetch(
            process.env.NEXT_PUBLIC_MFA_SEND_OTP_URL ||
              "https://verify-4120-mv6g89.twil.io/start-verify",
            // "https://sendotp-9168.twil.io/send_otp",
            {
              method: "POST",
              body: JSON.stringify({
                to: `+1${data?.data?.mobile_phone}`
              }),
              headers: {
                "Content-Type": "application/json"
              }
            }
          );

          if (mfaResponse?.status === 200) {
            // console.log(participant_id, pin, "participant_id, pin - 1");
            setLoginData({ ...data.data, participant_id, pin });
            toast.success("OTP sent");
            setMfaModal(true);
          } else {
            toast.error("Error sending OTP");
          }
        } else {
          dispatch(
            login({
              token: true,
              participant_id,
              pin,
              loggedOut: false
            })
          );
          dispatch(setAppData({ ...data.data }));
          if (data.data.proof_id_value) {
            dispatch(
              setProofID(
                data.data.proof_id_value.includes(".png")
                  ? data.data.proof_id_value
                  : `${data.data.proof_id_value}.png`
              )
            );
            const userPhoto = data.data.photo?.includes(".png")
              ? data.data.photo
              : `${data.data.photo}.png`;
            appDispatch(fetchS3Image(userPhoto));
          }
          Sentry.setUser({ id: participant_id });
          setBugfenderDeviceId(participant_id);

          landingCookie !== undefined && landingCookie === "true"
            ? router.push("/")
            : router.push("/home");
        }
      } else {
        // ⬅️ detect invalid creds and show inline message
        const msg: string = (data?.data?.message ?? "").toString();
        const isInvalid =
          data?.data?.statusCode === 401 ||
          /invalid|wrong|unauthorized/i.test(msg);

        if (isInvalid) {
          setLoginError("Invalid participant ID or PIN.");
        } else {
          // keep your toast for other errors
          toast.warning(`Error ${data.data.statusCode}: ${msg}`);
        }
        // toast.warning(`Error ${data.data.statusCode}: ${data.data.message}`);
        sendLogs(
          `Login failed for participant_id: ${participant_id}, pin: ${pin}, statusCode: ${data.data.statusCode}, message: ${data.data.message}`
        );
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
      sendLogs(`Login error ${error}`);
    }
  };

  useEffect(() => {
    if (loginRedirect) {
      // console.log(loginData, "loginData - 2");
      dispatch(
        login({
          token: true,
          participant_id: loginData?.participant_id,
          pin: loginData?.pin
        })
      );
      dispatch(setAppData({ ...loginData }));
      appDispatch(fetchS3Image(loginData?.proof_id_value));
      if (loginData?.participant_id) {
        Sentry.setUser({ id: loginData.participant_id });
        setBugfenderDeviceId(loginData.participant_id);
      }
      landingCookie !== undefined && landingCookie === "true"
        ? router.push("/")
        : router.push("/home");
    }
  }, [appDispatch, dispatch, landingCookie, loginData, loginRedirect, router]);

  const checkPrivateMode = useCallback(async () => {
    try {
      if (
        browserName?.toLowerCase() === "duckduckgo" ||
        browserName?.toLowerCase() === "gsa"
      ) {
        setIsPrivateMode(true);
        setPrivateModeMessage(
          `It looks like you opened the web app in ${browserName}’s ${"private"} browsing mode. For the best testing experience, please open the app in a regular browser window`
        );
        sendLogs(
          `Private mode detected for ${browserName}. Please use a regular browser window for the best experience.`
        );
        return;
      }
      const result = await checkAvailableStorage();
      if (!result) {
        sendLogs(`checkPrivateMode failed ${result}`);
        return;
      }
      sendLogs(
        `IsPrivateMode ${result?.isIncognito} - Storage available ${result?.storagePercentage}`
      );
      if (result?.isIncognito) {
        setIsPrivateMode(result?.isIncognito);
        setPrivateModeMessage(
          `It looks like you opened the web app in ${browserName}’s ${
            browserName === Browser.Chrome ||
            browserName === Browser.MobileChrome
              ? "incognito"
              : "private"
          } browsing mode. For the best testing experience, please open the app in a regular browser window`
        );
      }
    } catch (error) {
      sendLogs(`checkPrivateMode error ${error}`);
    }
  }, [browserName]);

  // On mount, check for saved credentials in localStorage and first visit status
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedId = localStorage.getItem("participant_id");
    const storedPin = localStorage.getItem("pin");
    const hasVisitedBefore = localStorage.getItem("hasVisitedBefore");

    setIsFirstVisit(!hasVisitedBefore);

    if (!hasVisitedBefore) {
      localStorage.setItem("hasVisitedBefore", "true");
    }

    if (storedId && storedPin) {
      const decryptedId = Crypto.AES.decrypt(
        storedId,
        process.env.NEXT_PUBLIC_SECRET_KEY as string
      ).toString(Crypto.enc.Utf8);
      const decryptedPin = Crypto.AES.decrypt(
        storedPin,
        process.env.NEXT_PUBLIC_SECRET_KEY as string
      ).toString(Crypto.enc.Utf8);
      setSavedCredentials({
        participant_id: decryptedId,
        pin: decryptedPin
      });
      if (decryptedId && decryptedPin) {
        setChecked(true);
      }
    }
  }, []);

  // Log device info and check private mode only once device info is resolved
  useEffect(() => {
    if (typeof window === "undefined" || !browserName) return;

    sendLogs(
      `Device Model: ${deviceModel} - Device Type: ${deviceType} - Device Vendor: ${deviceVendor}  - OS: ${osName} - OS Version: ${osVersion} - Browser: ${browserName} - Browser Version: ${browserVersion}`
    );
    sendLogs(`Screen: w${window.innerWidth} x h${window.innerHeight}`);
    checkPrivateMode();
  }, [
    browserName,
    browserVersion,
    deviceModel,
    deviceType,
    deviceVendor,
    osName,
    osVersion,
    checkPrivateMode
  ]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="auth_container">
      <div className="container" style={{ padding: "48px" }}>
        <div className="items-wrap_auth">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flexGrow: 1,
              minHeight: "10px"
            }}
          >
            <Image
              className={styles.siginPrLogo}
              src={PROOF_Home_Logo || "/icons/pr-logo.svg"}
              alt="image"
              width={3000}
              height={3000}
              priority
            />
            <div style={{ marginTop: "auto", marginBottom: "auto" }}>
              <div className="sign-header">
                <h1>{isFirstVisit ? "Welcome 👋" : "Welcome Back 👋"}</h1>
                <p
                  style={{
                    fontSize: isDesktop ? "18px" : "12px",
                    fontWeight: "400"
                  }}
                >
                  Enter your user name and password to access your account
                </p>
              </div>
              <Formik
                initialValues={initialValues}
                enableReinitialize
                validationSchema={signinSchema}
                onSubmit={onSubmit}
              >
                {({ values, errors, touched, isSubmitting, handleChange }) => (
                  <Form className="gap-item-auth">
                    <TextField
                      type="text"
                      placeholder="Participant ID"
                      name="participant_id"
                      value={values.participant_id}
                      onChange={handleChange}
                      startIcon={
                        <Image
                          className="w-[24] h-[24]"
                          src="/icons/participant-id-icon.svg"
                          alt="image"
                          width={24}
                          height={24}
                          loading="lazy"
                        />
                      }
                      errors={errors}
                      touched={touched}
                    />
                    <TextField
                      type="password"
                      placeholder="Pin"
                      name="pin"
                      value={values.pin}
                      onChange={handleChange}
                      startIcon={
                        <Image
                          src="/icons/pin-icon.svg"
                          alt="image"
                          width={24}
                          height={24}
                          loading="lazy"
                        />
                      }
                      endIcon={true}
                      errors={errors}
                      touched={touched}
                    />
                    <div className="check-wrap">
                      <div>
                        <CheckBox
                          label={"Remember me"}
                          checked={checked}
                          onChange={handleCheckBox}
                        />
                      </div>
                      <div className="forgot-pin">
                        <Link href="/auth/forgot-pin">Forgot PIN?</Link>
                      </div>
                    </div>
                    {loginError && (
                      <p
                        style={{
                          marginTop: "14px",
                          color: "#D14343", // red
                          fontSize: "16px", // ⬅️ slightly larger than before
                          fontWeight: "500", // ⬅️ makes it stand out a bit more
                          textAlign: "center" // ⬅️ center align under buttons
                        }}
                        aria-live="polite"
                      >
                        {loginError}
                      </p>
                    )}
                    <br />
                    {privateModeMessage && (
                      <p
                        style={{
                          marginTop: "14px",
                          color: "#D14343", // red
                          fontSize: "16px", // ⬅️ slightly larger than before
                          fontWeight: "500", // ⬅️ makes it stand out a bit more
                          textAlign: "center" // ⬅️ center align under buttons
                        }}
                        aria-live="polite"
                      >
                        {privateModeMessage}
                      </p>
                    )}
                    {!isPrivateMode && (
                      <Button blue disabled={isSubmitting} type="submit">
                        {isSubmitting ? "signing in..." : "Sign in"}
                      </Button>
                    )}
                    <br />
                    <Link
                      href="https://proofapp.my.salesforce-sites.com/New2Proof"
                      className="links"
                    >
                      <Button classname="custom-button-1">
                        {"New to PROOF?"}
                      </Button>
                    </Link>
                    {/* ⬇️ Inline error shown BELOW the New to PROOF button */}
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        </div>
      </div>
      <div
        className="wrap-login-img"
        style={{ background: "linear-gradient(#E9F0FC, #A7BEDD)" }}
      >
        <div
          className="auth-img"
          style={{
            backgroundImage: 'url("../images/sign-in.png")'
          }}
        ></div>
      </div>
      <MfaModal
        show={mfaModal}
        onClose={() => setMfaModal(false)}
        setLoginRedirect={setLoginRedirect}
        mobilePhone={mobileNo}
      />
    </div>
  );
}

export default LoginForm;
