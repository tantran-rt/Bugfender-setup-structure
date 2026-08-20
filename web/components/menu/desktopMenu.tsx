"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { appData, appDataDump } from "@/redux/slices/appConfig";
import "./menu.css";
import Button from "../button";
import { clearTestData } from "@/redux/slices/drugTest";
import { authToken, logout } from "@/redux/slices/auth";
import { useEffect, useMemo, useState } from "react";
import { hasPermission } from "@/utils/utils";
import DialogBox from "../dialog-box";
import Crypto from "crypto-js";
import { RiBodyScanFill } from "react-icons/ri";

const DesktopMenu = () => {
  const {
    first_name,
    last_name,
    PROOF_Home_Message,
    PROOF_Home_Logo,
    proof_id_value,
  } = useSelector(appData);
  const { participant_id } = useSelector(authToken);
  const pathname = usePathname();
  const user = useSelector(appData);
  const photo = user?.photo;
  const dispatch = useDispatch();
  const router = useRouter();
  const permissions = user?.permissions;
  const [pendingTest, setPendingTest] = useState<string | null>(null);
  const [pendingTestPrompt, setPendingTestPrompt] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedPendingTest = localStorage.getItem("pendingTest");
      if (storedPendingTest) {
        const decryptedPendingTest = JSON.parse(
          Crypto.AES.decrypt(
            storedPendingTest,
            process.env.NEXT_PUBLIC_SECRET_KEY as string
          ).toString(Crypto.enc.Utf8)
        );
        if (decryptedPendingTest.participant_id === participant_id) {
          setPendingTest(storedPendingTest);
        }
      }
    }
  }, []);

  const scrollToView = (to: string) => {
    const element = document.getElementById(to);
    element?.scrollIntoView({
      behavior: "instant",
      block: "end",
      inline: "nearest",
    });
  };

  const view = useMemo(() => pathname.split("/")[1], [pathname]);

  useEffect(() => scrollToView(view), [view]);

  return (
    <nav className="desktop-menu">
      <DialogBox
        show={pendingTestPrompt}
        handleReject={() => setPendingTestPrompt(false)}
        handleAccept={() => router.push("/pending-test")}
        title="Upload Pending Test"
        content1="WARNING: Upload pending test before taking new test."
        rejectText="Cancel"
        acceptText="Ok"
      />

      <Link href="#" className="sub-menu_header">
        <Image
          src={PROOF_Home_Logo || "/icons/pin-icon.svg"}
          className="custome-logo"
          alt="image"
          width={24}
          height={24}
          loading="lazy"
        />
        <p className="greet-text">{"Hello,"}</p>
        <p className="user-name">
          {(first_name || "") + " " + (last_name || "")}
        </p>
      </Link>

      {PROOF_Home_Message && (
        <div
          className="wrap-msg scroller-test"
          style={{
            padding: "12px",
          }}
        >
          {PROOF_Home_Message}
        </div>
      )}

      <div className="menu-items scroller-test">
        <Link
          id="test-collection"
          href={!pendingTest ? "/test-collection" : ""}
          className={`sub-menu ${
            pathname === "/test-collection" ? "active" : ""
          }`}
          onClick={() => pendingTest && setPendingTestPrompt(true)}
        >
          {/* <GoHome size={30} color={pathname === '/home' ? '#009CF9' : '#ADADAD'} /> */}
          {pathname === "/test-collection" ? (
            <Image
              className=""
              src="/icons/test-collection-icon.svg"
              alt="captured Image"
              width={5000}
              height={5000}
              loading="lazy"
            />
          ) : (
            <Image
              className=""
              src="/icons/un-select-test-collection.svg"
              alt="captured Image"
              width={5000}
              height={5000}
              loading="lazy"
            />
          )}
          <p
            className="menu-text"
            style={
              pathname === "/test-collection"
                ? { color: "#ffffff" }
                : { color: "#0C1617" }
            }
          >
            Test/ Collection
          </p>
        </Link>
        {pendingTest && (
          <Link
            id="pending-test"
            href="/pending-test"
            className="sub-menu"
            style={
              pathname === "/pending-test"
                ? {
                    backgroundColor: "#009cf9",
                    borderRadius: "16px",
                    width: "90%",
                  }
                : {}
            }
          >
            {pathname === "/pending-test" ? (
              <Image
                className=""
                src="/icons/pending-test.svg"
                alt="Pending Test Icon"
                width={5000}
                height={5000}
                loading="lazy"
              />
            ) : (
              <Image
                className=""
                src="/icons/un-select-pending-test.svg"
                alt="Pending Test Icon"
                width={5000}
                height={5000}
                loading="lazy"
              />
            )}
            <p
              className="menu-text"
              style={
                pathname === "/pending-test"
                  ? { color: "#ffffff" }
                  : { color: "#0C1617" }
              }
            >
              Pending Test
            </p>
          </Link>
        )}
        {/* {hasPermission("Alcohol BAC test", permissions) && (
          <Link
            id="bac"
            href={
              photo
                ? // ? "/identity-profile/sample-facial-capture"
                  "/bac"
                : "/identity-profile/id-detection/step-1"
            }
            className={`sub-menu ${pathname === "/bac" ? "active" : ""}`}
            onClick={updateRedirection}
          >
            {pathname === "/bac" ? (
              <Image
                className=""
                src="/icons/bac-icon.svg"
                alt="BAC Icon"
                width={5000}
                height={5000}
                loading="lazy"
              />
            ) : (
              <Image
                className=""
                src="/icons/bac-unselected.svg"
                alt="BAC Icon"
                width={5000}
                height={5000}
                loading="lazy"
              />
            )}
            <p
              className="menu-text"
              style={
                pathname === "/bac"
                  ? { color: "#ffffff" }
                  : { color: "#0C1617" }
              }
            >
              Bac Test
            </p>
          </Link>
        )} */}
        <Link
          id="tutorial"
          href="/tutorial"
          className={`sub-menu ${pathname === "/tutorial" ? "active" : ""}`}
        >
          {pathname === "/tutorial" ? (
            <Image
              className=""
              src="/icons/tutorial-icon.svg"
              alt="captured Image"
              width={5000}
              height={5000}
              loading="lazy"
            />
          ) : (
            <Image
              className=""
              src="/icons/tutorial-un-selected.svg"
              alt="captured Image"
              width={5000}
              height={5000}
              loading="lazy"
            />
          )}
          <p
            className="menu-text"
            style={
              pathname === "/tutorial"
                ? { color: "#ffffff" }
                : { color: "#0C1617" }
            }
          >
            Tutorials
          </p>
        </Link>
        <Link
          id="history"
          href={"history"}
          className={`sub-menu ${pathname === "/history" ? "active" : ""}`}
        >
          {pathname === "/history" ? (
            <Image
              className=""
              src="/icons/history-icon.svg"
              alt="history Icon"
              width={26.25}
              height={27}
              loading="lazy"
            />
          ) : (
            <Image
              className=""
              src="/icons/un-select-history.svg"
              alt="history Icon"
              width={5000}
              height={5000}
              loading="lazy"
            />
          )}
          <p
            className="menu-text"
            style={
              pathname === "/history"
                ? { color: "#ffffff" }
                : { color: "#0C1617" }
            }
          >
            History
          </p>
        </Link>
        {hasPermission("PROOF Whats New", permissions) && (
          <Link
            id="what-new"
            href={"what-new"}
            className={`sub-menu ${pathname === "/what-new" ? "active" : ""}`}
          >
            {pathname === "/what-new" ? (
              <Image
                className=""
                src="/icons/what-new-icon.svg"
                alt="What`s New Icon"
                width={25}
                height={25}
                loading="lazy"
              />
            ) : (
              <Image
                className=""
                src="/icons/un-sellect-whatnew-icon.svg"
                alt="What`s New Icon"
                width={5000}
                height={5000}
                loading="lazy"
              />
            )}
            <p
              className="menu-text"
              style={
                pathname === "/what-new"
                  ? { color: "#ffffff" }
                  : { color: "#0C1617" }
              }
            >
              What`s New
            </p>
          </Link>
        )}
        <Link
          id="settings"
          href="/settings"
          className={`sub-menu ${pathname === "/settings" ? "active" : ""}`}
        >
          {pathname === "/settings" ? (
            <Image
              className=""
              src="/icons/settings-icon.svg"
              alt="captured Image"
              width={5000}
              height={5000}
              loading="lazy"
            />
          ) : (
            <Image
              className=""
              src="/icons/settings-un-selected.svg"
              alt="captured Image"
              width={5000}
              height={5000}
              loading="lazy"
            />
          )}
          <p
            className="menu-text"
            style={
              pathname === "/settings"
                ? { color: "#ffffff" }
                : { color: "#0C1617" }
            }
          >
            Settings
          </p>
        </Link>
        <Link
          id="support"
          href="/support"
          className={`sub-menu ${pathname === "/support" ? "active" : ""}`}
        >
          {pathname === "/support" ? (
            <Image
              className=""
              src="/icons/support-icon.svg"
              alt="captured Image"
              width={5000}
              height={5000}
              loading="lazy"
            />
          ) : (
            <Image
              className=""
              src="/icons/support-un-selected.svg"
              alt="captured Image"
              width={5000}
              height={5000}
              loading="lazy"
            />
          )}
          <p
            className="menu-text"
            style={
              pathname === "/support"
                ? { color: "#ffffff" }
                : { color: "#0C1617" }
            }
          >
            Support
          </p>
        </Link>
        {hasPermission("Health Assessment", permissions) && (
          <Link
            id="what-new"
            href={"health-assessment"}
            className={`sub-menu ${pathname === "/profile" ? "active" : ""}`}
          >
            {pathname === "/health-assessment" ? (
              <RiBodyScanFill color="#ffffff" size={32} />
            ) : (
              <RiBodyScanFill color="#0C1617" size={32} />
            )}
            <p
              className="menu-text"
              style={
                pathname === "/health-assessment"
                  ? { color: "#ffffff" }
                  : { color: "#0C1617" }
              }
            >
              Health Assessment
            </p>
          </Link>
        )}
      </div>

      <Button
        classname="logout-btn-dextop-menu"
        onClick={() => {
          dispatch(appDataDump());
          dispatch(clearTestData());
          dispatch(logout());
          router.push("/auth/sign-in");
        }}
      >
        <Image
          src="/icons/exit-icon.svg"
          alt="exit-icon"
          width={20}
          height={20}
        />
        <p className="">Logout</p>
      </Button>
    </nav>
  );
};

export default DesktopMenu;
