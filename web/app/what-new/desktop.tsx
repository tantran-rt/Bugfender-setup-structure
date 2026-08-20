"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AiOutlineDown, AiOutlineUp } from "react-icons/ai";
import { useSelector } from "react-redux";

import { AppHeader, Button, DinamicMenuLayout } from "@/components";
import { appData } from "@/redux/slices/appConfig";
import useGetDeviceInfo from "@/hooks/useGetDeviceInfo";

const WhatNew = () => {
  const whatNewData = useSelector(appData);
  const [data, setData] = useState(whatNewData?.WhatNewList);
  const [openItems, setOpenItems] = useState<boolean[]>(
    Array(data?.length).fill(false)
  );
  const device = useGetDeviceInfo();

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
      <div className="tutorial-container">
        {device?.screenWidth > 700 ? (
          <div className="what-new-dxtp-header">
            <h1>What`s New</h1>
            <p>
              Need help? Our customer support team is here for you and browse
              our FAQs
            </p>
          </div>
        ) : (
          <AppHeader title={"What`s New"} hasMute={false} />
        )}
        <br /> <br />
        <div
          className="what-new-scroller what-new-bg"
          style={{ padding: "16px" }}
        >
          {data?.map((item: any, index: number) => {
            const isOpen = openItems[index];
            return (
              <article
                className="faq"
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
                      <AiOutlineUp size={20} color="grey" />
                    ) : (
                      <AiOutlineDown size={20} color="grey" />
                    )}
                  </Button>
                </header>
                {isOpen && (
                  <>
                    <div className="faq-body">
                      <p className="faq-text">{item?.Detail}</p>
                    </div>
                    <div className="faq-body">
                      <p className="faq-text what-new-link">
                        {extractLinks(item?.Detail).join(", ")}
                      </p>
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

// export default WhatNew;
export default dynamic(() => Promise.resolve(WhatNew), {
  ssr: false,
});
