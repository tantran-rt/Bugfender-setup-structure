"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  HomeHeader,
  HomeMain,
  HomeFooter,
  DinamicMenuLayout,
} from "@/components";
import useResponsive from "@/hooks/useResponsive";

const Home = () => {
  const router = useRouter();
  const { isDesktop } = useResponsive();

  useEffect(() => {
    const routeBasedOnScreenSize = () => {
      if (isDesktop) {
        console.log("home push to test-collection");
        router.push("/test-collection");
      }
    };
    routeBasedOnScreenSize();
  }, [router, isDesktop]);

  return (
    <DinamicMenuLayout>
      <div className="tutorial-container">
        {!isDesktop && (
          <>
            <HomeHeader title={"HOME"} greetings={"Hello,"} />
            <HomeMain />
            <HomeFooter />
          </>
        )}
      </div>
    </DinamicMenuLayout>
  );
};

export default Home;
