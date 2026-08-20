"use client";

import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

import styles from "./appHeader.module.css";
import { testData } from "@/redux/slices/drugTest";
interface AppHeaderDesktopProps {
  title: string;
  className?: string;
  currentStep?: number;
  totalSteps?: number;
}

function AppHeaderDesktop({
  title,
  className,
  currentStep,
  totalSteps,
}: AppHeaderDesktopProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { testingKit } = useSelector(testData);

  const handleBack = () => {
    const isSummaryPage = pathname === "/test-collection/collection-summary";
    const isTestCollectionPage = pathname.includes(
      `/test-collection/${testingKit.kit_id}`
    );
    if (isSummaryPage) {
      router.push("/home");
    } else if (isTestCollectionPage) {
      toast.warn("You are taking a test. You cannot go back");
    } else {
      router.back();
    }
  };

  return (
    <div className={styles.appHeaderContainerDesktop}>
      {totalSteps ?? (
        <div className={styles.iconContainer}>
          STEP {currentStep} of {totalSteps}
        </div>
      )}

      <div className={styles.titleContainer}>{title}</div>
    </div>
  );
}

export default AppHeaderDesktop;
