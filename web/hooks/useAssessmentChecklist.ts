"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";
import { appConfig, appData, historyData } from "@/redux/slices/appConfig";
import { PermissionConfig } from "@/types/constants";
import {
  buildKitChecklist,
  groupByDrugKitName,
  statusOrder
} from "@/utils/assessment_checklist";
import { getDaysRemainingUntilDate } from "@/utils/date";
import { sendLogs } from "@/utils/sendAnalytics.utils";

type DrugTestHistoryRecord = {
  DrugKitName: string;
  submitteddate: string;
};

export function useAssessmentChecklist() {
  const {
    drug_kit,
    checklist_test_screen_title,
    checklist_test_screen_message,
    checklist_end_date
  } = useSelector(appData);
  const history = useSelector(historyData);
  const { permissions } = useSelector(appConfig);
  const isEnabled = permissions.includes(PermissionConfig.CHECKLIST);

  const checklist = useMemo(() => {
    if (!isEnabled || !drug_kit?.length || !checklist_end_date) {
      return [];
    }

    const dTests = (history?.dtests ?? []).filter(
      (item: DrugTestHistoryRecord) =>
        item.DrugKitName && item.DrugKitName !== ""
    );
    const historyByDrugKitName = groupByDrugKitName(dTests);
    const items = buildKitChecklist(
      drug_kit,
      historyByDrugKitName,
      checklist_end_date
    );

    const checklist = [...items];

    sendLogs(`Checklist end_date: ${checklist_end_date}`);
    if (checklist) {
      sendLogs(
        `checklist_generated: ${JSON.stringify(checklist.map((item) => ({ kit_name: item.kit_name, submittedDate: item.submittedDate, checklist_completed: item.checklist_completed })))}`
      );
    }

    return checklist;
  }, [isEnabled, drug_kit, history?.dtests, checklist_end_date]);

  const numberOfCompleted = useMemo(() => {
    return checklist.filter((prev) => prev.checklist_completed === "done")
      .length;
  }, [checklist]);

  const numberOfDaysRemaining = useMemo(() => {
    return getDaysRemainingUntilDate(checklist_end_date);
  }, [checklist_end_date]);

  const isExpired = useMemo(() => {
    return numberOfDaysRemaining < 0;
  }, [numberOfDaysRemaining]);

  return {
    enableAssessmentCheckList: isEnabled,
    checklistTitle: checklist_test_screen_title,
    checklistDescription: checklist_test_screen_message,
    checklist,
    numberOfCompleted,
    numberOfDaysRemaining,
    checklistEndDate: checklist_end_date,
    isExpired
  };
}
