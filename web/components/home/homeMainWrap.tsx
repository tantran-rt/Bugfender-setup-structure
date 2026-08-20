"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Switch, HomeGridView, HomeListView, DialogBox } from "@/components";
import Crypto from "crypto-js";
import {
  appData,
  setPageRedirect,
  setReDirectToBac,
} from "@/redux/slices/appConfig";
import {
  getPreferenceViewSettingKey,
  hasPermission,
  setCookie,
} from "@/utils/utils";
import { authToken } from "@/redux/slices/auth";
import { PreferenceViewType } from "@/types/constants";
import { RiBodyScanFill } from "react-icons/ri";

const HomeMain = () => {
  const appDataState = useSelector(appData);
  const { proof_id_value } = appDataState;
  const { participant_id } = useSelector(authToken);
  const permissions = appDataState?.permissions;
  const [pendingTest, setPendingTest] = useState<string | null>(null);
  const homeViewCookie = Cookies.get("homeView");
  const [isGridView, setIsGridView] = useState(true);
  const [isListView, setIsListView] = useState(false);
  const [checked, setChecked] = useState(
    homeViewCookie === "true" ? true : false
  );
  const [pendingTestPrompt, setPendingTestPrompt] = useState<boolean>(false);
  const appPermissions = permissions ? permissions.split(";") : undefined;
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(appData);
  const photo = user?.photo;
  const PREFERNCE_SETTING_KEY = getPreferenceViewSettingKey(
    participant_id as string
  );

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
  }, [participant_id]);

  useEffect(() => {
    const storedPreference =
      localStorage.getItem(PREFERNCE_SETTING_KEY) ||
      PreferenceViewType.LIST_VIEW;

    setIsGridView(storedPreference === PreferenceViewType.GRID_VIEW);
    setIsListView(storedPreference === PreferenceViewType.LIST_VIEW);
    localStorage.setItem(PREFERNCE_SETTING_KEY, storedPreference);
  }, [PREFERNCE_SETTING_KEY]);

  const handleSwitch = () => {
    if (homeViewCookie === "false") {
      setCookie("homeView", "true", 2000);
      setChecked(true);
    } else {
      setCookie("homeView", "false", 2000);
      setChecked(false);
    }
  };

  const updateRedirection = async () => {
    dispatch(setReDirectToBac(true));
    dispatch(setPageRedirect("/bac"));
  };

  const handleToggleGridView = () => {
    setIsGridView(true);
    setIsListView(false);
    localStorage.setItem(PREFERNCE_SETTING_KEY, PreferenceViewType.GRID_VIEW);
    // setChecked(false);
  };

  const handleToggleListView = () => {
    setIsListView(true);
    setIsGridView(false);
    localStorage.setItem(PREFERNCE_SETTING_KEY, PreferenceViewType.LIST_VIEW);
    // setChecked(true);
  };

  return (
    <div className="home-main-body">
      <DialogBox
        show={pendingTestPrompt}
        handleReject={() => setPendingTestPrompt(false)}
        handleAccept={() => router.push("/pending-test")}
        title="Upload Pending Test"
        content1="WARNING: Upload pending test before taking new test."
        rejectText="Cancel"
        acceptText="Ok"
      />
      <div className="home-switch-wrap">
        <Switch
          onToggleGridView={handleToggleGridView}
          onToggleListView={handleToggleListView}
          switchGridView={isGridView}
          switchListView={isListView}
        />
      </div>
      {isGridView ? (
        <div className="home-sub-wrap-grid">
          {hasPermission("Test", permissions) && (
            <Link
              href={!pendingTest ? "/test-collection" : ""}
              className=""
              onClick={() => pendingTest && setPendingTestPrompt(true)}
            >
              <HomeGridView
                imgUrl="/icons/un-select-test-collection-colored.svg"
                title={"Test/Collection"}
              />
            </Link>
          )}

          {/* {hasPermission('Test', permissions) && (
                        <Link
                            href={
                                photo &&
                                !appPermissions.includes(
                                    'ID Capture with Rear Camera',
                                )
                                    ? '/identity-profile/sample-facial-capture'
                                    : photo &&
                                      appPermissions.includes(
                                          'ID Capture with Rear Camera',
                                      )
                                    ? '/identity-profile/id-detection/id-capture'
                                    : '/identity-profile'
                            }
                            className=""
                            onClick={updateRedirection}
                        >
                            <HomeGridView
                                imgUrl="/icons/bac-icon.svg"
                                title={'Bac Test'}
                            />
                        </Link>
                    )} */}

          {pendingTest && (
            <Link href="/pending-test" className="">
              <HomeGridView
                imgUrl="/icons/pending-test.svg"
                title={"Pending Test"}
              />
            </Link>
          )}

          <Link href="/history" className="">
            <HomeGridView
              imgUrl="/icons/history-colored.svg"
              title={"History"}
            />
          </Link>
          {hasPermission("PROOF Whats New", permissions) && (
            <Link href="/what-new" className="">
              <HomeGridView
                imgUrl="/icons/un-sellect-whatnew-icon-colored.svg"
                title={"What`s New"}
              />
            </Link>
          )}
          {hasPermission("Health Assessment", permissions) && (
            <Link href="/health-assessment" className="">
              <div className={"home-grid-card"}>
                <div className={"home-grid-card-img"}>
                  <RiBodyScanFill color="#009cf9" size={50} />
                </div>
                <p>{"Health Assessment"}</p>
              </div>
            </Link>
          )}
        </div>
      ) : (
        <div className="list-wrap">
          {hasPermission("Test", permissions) && (
            <Link href="/test-collection" className="home-link">
              <HomeListView
                imgUrl="/icons/un-select-test-collection-colored.svg"
                title={"Test/Collection"}
              />
            </Link>
          )}
          {/* {hasPermission("Test", permissions) && (
            <Link
              href={
                photo
                  ? "/identity-profile/sample-facial-capture"
                  : "/identity-profile/id-detection/step-1"
              }
              className="home-link"
              onClick={updateRedirection}
            >
              <HomeListView imgUrl="/icons/bac-icon.svg" title={"Bac Test"} />
            </Link>
          )} */}
          {pendingTest && (
            <Link href="/pending-test" className="home-link">
              <HomeListView
                imgUrl="/icons/pending-test.svg"
                title={"Pending Test"}
              />
            </Link>
          )}
          <Link href="/history" className="home-link">
            <HomeListView
              imgUrl="/icons/history-colored.svg"
              title={"History"}
            />
          </Link>
          {hasPermission("PROOF Whats New", permissions) && (
            <Link href="/what-new" className="home-link">
              <HomeListView
                imgUrl="/icons/un-sellect-whatnew-icon-colored.svg"
                title={"What`s New"}
              />
            </Link>
          )}
          {hasPermission("Health Assessment", permissions) && (
            <Link href="/health-assessment" className="home-link">
              <div className="home-list-card">
                <div className="home-card-img">
                  <RiBodyScanFill color="#009cf9" size={40} />
                </div>
                <p>Health Assessment</p>
              </div>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};
export default HomeMain;
