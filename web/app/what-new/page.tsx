"use client";
import {
  Menu,
  AppHeader,
  Button,
  DinamicMenuLayout,
  Header,
} from "@/components";
import { appData } from "@/redux/slices/appConfig";
import { useMemo, useState } from "react";

import { useSelector } from "react-redux";
import useGetDeviceInfo from "@/hooks/useGetDeviceInfo";
import dynamic from "next/dynamic";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { GoArrowLeft } from "react-icons/go";

const WhatNew = () => {
  const whatNewData = useSelector(appData);
  const [data, setData] = useState(whatNewData?.WhatNewList);
  const [openItems, setOpenItems] = useState<boolean[]>(
    Array(data?.length).fill(false)
  );
  const device = useGetDeviceInfo();
  const isDesktop = useMemo(() => device?.screenWidth > 700, [device]);

  const toggleInfo = (index: number) => {
    return () => {
      setOpenItems((prevState) => {
        const newState = [...prevState];
        newState[index] = !newState[index];
        return newState;
      });
    };
  };

  const extractLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const links = text.match(urlRegex);
    return links || [];
  };

  return (
    <DinamicMenuLayout>
      <div
        className="tutorial-container what-new-container"
        style={{ minHeight: "100%" }}
      >
        {device?.screenWidth > 700 ? (
          <div className="what-new-dxtp-header">
            <h1 className="set-sec-title">What&apos;s New</h1>
            <p className="settings-title-subtext">
              Need help? Our customer support team is here for you and browse
              our FAQs
            </p>
          </div>
        ) : (
          <Header title="What's New" icon1={<GoArrowLeft />} hasMute={false} />
        )}
        <br /> <br />
        <div
          className="what-new-scroller what-new-bg"
          style={{ padding: "8px" }}
        >
          {data?.map((item: any, index: number) => {
            const isOpen = openItems[index];
            return (
              <article
                className="faq what-new-article"
                key={index}
                style={
                  isOpen
                    ? {
                        borderRadius: "6px",
                        padding: "12px",
                        gap: "8px",
                        border: "2px",
                        backgroundColor: "#FFFFFF",
                      }
                    : {
                        borderRadius: "6px",
                        padding: "12px",
                        gap: "8px",
                        border: "2px",
                        backgroundColor: "#FFFFFF",
                      }
                }
              >
                <header className="faq-header" onClick={toggleInfo(index)}>
                  <h6 className="faq-title">{item?.Title}</h6>
                  <Button classname="faq-btn">
                    {isOpen ? (
                      <FiChevronUp
                        size={20}
                        color={isDesktop ? "#0C1617" : "grey"}
                      />
                    ) : (
                      <FiChevronDown
                        size={20}
                        color={isDesktop ? "#0C1617" : "grey"}
                      />
                    )}
                  </Button>
                </header>
                {isOpen && (
                  <>
                    <div className="faq-body">
                      <p className="faq-text">{item?.Detail}</p>
                    </div>
                    <div className="faq-body">
                      <a
                        className="faq-text what-new-link"
                        href={`${extractLinks(item?.Detail).join(", ")}`}
                        target="_blank"
                      >
                        {extractLinks(item?.Detail).join(", ")}
                      </a>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </DinamicMenuLayout>
  );
};

export default WhatNew;
