"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction
} from "react";
import {
  buildSectionAnswersFromSingleModeResponses,
  extractMainQuestions,
  extractQuestionsFromSections,
  getVisibleQuestionsForSection,
  mergePickListWithOtherSectionAnswers
} from "@/utils/utils";
import { sendLogs } from "@/utils/sendAnalytics.utils";
import {
  Question,
  SelectedOptionState,
  QuestionType,
  Section,
  MainQuestion
} from "@/types/pre-test-questions";
import { removeLastElementFromSeparator } from "@/utils/stringUtils";

export type SingleQuestionModeResponse = {
  question: string;
  question_id: string;
  question_type: string;
  section_description: string;
  section_order: number;
  selected_option: string | undefined;
};

export type UseSingleQuestionModeParams = {
  sections: Section[];
  /** When false, progression / completion effects do not run (e.g. quiz overlay hidden). */
  enabled?: boolean;
  /**
   * Called when there are no more questions. Parent handles persistence (e.g. API), navigation, etc.
   */
  onCompleted?: (
    responses: SingleQuestionModeResponse[]
  ) => void | Promise<void>;
};

export type UseSingleQuestionModeReturn = {
  mainQuestions: Record<number, MainQuestion>;
  question: Question;
  currentQuestionIndex: number;
  totalSteps: number;
  selectedOptionText: string;
  selectedOption: number | null | undefined;
  selectedDate: string;
  setSelectedDate: Dispatch<SetStateAction<string>>;
  enableOtherOption: boolean;
  otherValue: string;
  setOtherValue: (value: string) => void;
  handleDateSelect: (date: string) => void;
  handleOptionChange: (
    sectionIndex: number,
    questionIndex: number,
    optionIndex: number,
    optText: string
  ) => void;
  handleMultiOptionsSelected: (
    sectionIndex: number,
    questionIndex: number,
    optionIndex: number,
    optText: string
  ) => void;
  handleDisableNextBtn: () => boolean;
  handlePreviousQuestion: () => void;
  handleNextQuestion: () => Promise<void>;
};

export function useSingleQuestionMode({
  sections,
  enabled = true,
  onCompleted
}: UseSingleQuestionModeParams): UseSingleQuestionModeReturn {
  const onCompletedRef = useRef(onCompleted);
  onCompletedRef.current = onCompleted;

  const [selectedOptions, setSelectedOptions] = useState<SelectedOptionState[]>(
    []
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [enableOtherOption, setEnableOtherOption] = useState(false);
  const [otherValues, setOtherValues] = useState<Record<string, string>>({});
  const [responses, setResponses] = useState<SingleQuestionModeResponse[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");

  const flatQuestions = useMemo(
    () => extractQuestionsFromSections(sections) ?? [],
    [sections]
  );

  const mainQuestions = useMemo(
    () => extractMainQuestions(flatQuestions),
    [flatQuestions]
  );

  const syncMultiSelectSectionAnswers = useCallback(
    (
      base: Record<
        string,
        {
          selectedOptionIndex: number | null;
          selectedOptionText: string;
          selectedDate: string;
          otherValue: string;
        }
      >
    ) => {
      const merged = { ...base };
      for (const q of flatQuestions) {
        const sel = selectedOptions.find(
          (o) => o.question_id === q.question_id
        );
        if (q.question_type === QuestionType.MultiSelectedPickList) {
          merged[q.question_id] = {
            selectedOptionIndex: null,
            selectedOptionText: sel?.selectedOptionText?.trim() ?? "",
            selectedDate: "",
            otherValue: ""
          };
        } else if (
          q.question_type === QuestionType.MultiSelectedPickListWithOther
        ) {
          merged[q.question_id] = {
            selectedOptionIndex: null,
            selectedOptionText: sel?.selectedOptionText?.trim() ?? "",
            selectedDate: "",
            otherValue: otherValues[q.question_id]?.trim() ?? ""
          };
        }
      }
      return merged;
    },
    [flatQuestions, selectedOptions, otherValues]
  );

  const answersRecord = useMemo(() => {
    const base = buildSectionAnswersFromSingleModeResponses(
      responses,
      flatQuestions
    );
    const merged = mergePickListWithOtherSectionAnswers(
      base,
      responses,
      flatQuestions,
      selectedOptions,
      otherValues
    );
    return syncMultiSelectSectionAnswers(merged);
  }, [
    responses,
    flatQuestions,
    selectedOptions,
    otherValues,
    syncMultiSelectSectionAnswers
  ]);

  const visibleQuestions = useMemo(
    () => getVisibleQuestionsForSection(flatQuestions, answersRecord),
    [flatQuestions, answersRecord]
  );

  const question = useMemo((): Question => {
    const q = visibleQuestions[currentStep];
    if (!q) return {} as Question;
    if (
      q.question_type === QuestionType.PickListWithOther &&
      q.options?.includes("Other")
    ) {
      return {
        ...q,
        options: q.options.filter((opt) => opt !== "Other") ?? []
      };
    }
    return q;
  }, [visibleQuestions, currentStep]);

  const totalSteps = visibleQuestions.length;

  const selectedOptionIndex = useMemo(() => {
    if (!question?.question_id) return undefined;
    return selectedOptions.find(
      (opt) => opt.question_id === question.question_id
    )?.selectedOption;
  }, [selectedOptions, question?.question_id]);

  const otherValue = question?.question_id
    ? (otherValues[question.question_id] ?? "")
    : "";

  const selectedOptionText = useMemo(() => {
    if (!question?.question_id) return "";
    return (
      selectedOptions.find((opt) => opt.question_id === question.question_id)
        ?.selectedOptionText ?? ""
    );
  }, [selectedOptions, question?.question_id]);

  const setOtherValue = useCallback(
    (value: string) => {
      if (question?.question_id) {
        setOtherValues((prev) => ({
          ...prev,
          [question.question_id]: value
        }));
      }
    },
    [question?.question_id]
  );

  useEffect(() => {
    if (
      question?.question_type === QuestionType.MultiSelectedPickListWithOther &&
      question?.options
    ) {
      const lastOption = question.options[question.options.length - 1];
      const selections = selectedOptionText.split(";").filter(Boolean);
      const shouldEnableOther = selections.includes(lastOption);

      setEnableOtherOption((prev) =>
        prev !== shouldEnableOther ? shouldEnableOther : prev
      );

      if (!shouldEnableOther && question.question_id) {
        setOtherValues((prev) => {
          if (!prev[question.question_id!]) return prev;
          return { ...prev, [question.question_id!]: "" };
        });
      }
      return;
    }

    if (
      selectedOptionIndex !== undefined &&
      selectedOptionIndex !== null &&
      question?.options
    ) {
      const selectedAnswer = question.options[selectedOptionIndex];
      const isOtherOption =
        (question.question_type === QuestionType.PickListWithOther ||
          question.question_type ===
            QuestionType.MultiSelectedPickListWithOther) &&
        question.options[question.options.length - 1] === selectedAnswer;

      setEnableOtherOption((prev) => {
        if (prev !== isOtherOption) {
          return isOtherOption;
        }
        return prev;
      });
    } else {
      setEnableOtherOption((prev) => {
        if (prev !== false) {
          return false;
        }
        return prev;
      });
    }
  }, [question, selectedOptionIndex, selectedOptionText]);

  const handleDateSelect = useCallback(
    (date: string) => {
      if (!question?.question_id) return;
      sendLogs(`Date selected: ${date}`);
      setSelectedOptions((prev) => {
        const newOptions = prev.filter(
          (opt) => opt.question_id !== question.question_id
        );
        return [
          ...newOptions,
          {
            sectionIndex: question.sectionOrder,
            questionIndex: currentStep,
            question_id: question.question_id,
            selectedOption: null,
            selectedDate: date
          }
        ];
      });
    },
    [question.sectionOrder, question.question_id, currentStep]
  );

  const handleDisableNextBtn = useCallback((): boolean => {
    const currentQuestion = question;
    const isAnswered = currentQuestion?.question_id
      ? selectedOptions.some(
          (opt) => opt.question_id === currentQuestion.question_id
        )
      : false;

    switch (currentQuestion?.question_type) {
      case QuestionType.Date:
      case QuestionType.BirthDate: {
        const currentDateOption = currentQuestion?.question_id
          ? selectedOptions.find(
              (opt) => opt.question_id === currentQuestion.question_id
            )
          : undefined;
        return !(currentDateOption?.selectedDate?.length === 10);
      }
      case QuestionType.Text:
      case QuestionType.Number:
      case QuestionType.Gesture:
        return !otherValue.trim();
      case QuestionType.MultiSelectedPickList: {
        const text =
          selectedOptions.find(
            (opt) => opt.question_id === currentQuestion.question_id
          )?.selectedOptionText ?? "";
        return currentQuestion?.required ? !text.trim() : false;
      }
      case QuestionType.MultiSelectedPickListWithOther: {
        const text =
          selectedOptions.find(
            (opt) => opt.question_id === currentQuestion.question_id
          )?.selectedOptionText ?? "";
        const selections = text.split(";").filter(Boolean);
        if (currentQuestion?.required && selections.length === 0) return true;

        const lastOption =
          currentQuestion.options?.[currentQuestion.options.length - 1];
        if (
          lastOption &&
          selections.includes(lastOption) &&
          !otherValue.trim()
        ) {
          return true;
        }
        return false;
      }
      default:
        if (enableOtherOption) {
          return !otherValue.trim();
        }

        return currentQuestion?.required && !isAnswered;
    }
  }, [question, selectedOptions, otherValue, enableOtherOption]);

  const handleOptionChange = useCallback(
    (
      sectionIndex: number,
      _questionIndex: number,
      optionIndex: number,
      optText: string
    ) => {
      const qid = question.question_id;
      if (!qid) return;

      setSelectedOptions((prev) => {
        const newOptions = prev.filter((opt) => opt.question_id !== qid);
        return [
          ...newOptions,
          {
            sectionIndex,
            questionIndex: currentStep,
            question_id: qid,
            selectedOption: optionIndex,
            selectedOptionText: optText
          }
        ];
      });

      const options = question.options;
      if (
        (question.question_type === QuestionType.PickListWithOther ||
          question.question_type ===
            QuestionType.MultiSelectedPickListWithOther) &&
        options &&
        optText === options[options?.length - 1]
      ) {
        setEnableOtherOption(true);
      } else {
        setEnableOtherOption(false);
        setOtherValue("");
      }
    },
    [question, currentStep, setOtherValue]
  );

  const handleMultiOptionsSelected = useCallback(
    (
      _sectionIndex: number,
      _questionIndex: number,
      _optionIndex: number,
      optText: string
    ) => {
      const qid = question.question_id;
      if (!qid) return;

      const options = question.options ?? [];

      setSelectedOptions((prev) => {
        const existing = prev.find((opt) => opt.question_id === qid);
        const currentValues = (existing?.selectedOptionText ?? "")
          .split(";")
          .filter(Boolean);

        const nextValues = currentValues.includes(optText)
          ? currentValues.filter((value) => value !== optText)
          : [...currentValues, optText];

        const sortedValues = nextValues
          .map((value) => ({ value, index: options.indexOf(value) }))
          .filter((item) => item.index >= 0)
          .toSorted((a, b) => a.index - b.index)
          .map((item) => item.value);

        const joined = sortedValues.join(";");

        if (
          question.question_type ===
            QuestionType.MultiSelectedPickListWithOther &&
          options.length > 0
        ) {
          const lastOption = options[options.length - 1];
          if (!sortedValues.includes(lastOption)) {
            setOtherValues((otherPrev) => {
              if (!otherPrev[qid]) return otherPrev;
              return { ...otherPrev, [qid]: "" };
            });
          }
        }

        return [
          ...prev.filter((opt) => opt.question_id !== qid),
          {
            sectionIndex: question.sectionOrder,
            questionIndex: currentStep,
            question_id: qid,
            selectedOption: null,
            selectedOptionText: joined
          }
        ];
      });
    },
    [question, currentStep]
  );

  const selectedOption = useMemo(() => {
    if (!question?.question_id) return undefined;
    return selectedOptions.find(
      (opt) => opt.question_id === question.question_id
    )?.selectedOption;
  }, [selectedOptions, question.question_id]);

  const handlePreviousQuestion = useCallback(() => {
    if (currentStep <= 0) return;
    setCurrentStep((prev) => prev - 1);
  }, [currentStep]);

  const getAnswer = useCallback(
    (q: Question) => {
      if (!q) return;
      const selected = selectedOptions.find(
        (opt) => opt.question_id === q.question_id
      );
      const optText = selected?.selectedOptionText ?? "";

      switch (q.question_type) {
        case QuestionType.Date:
        case QuestionType.BirthDate:
          return selected?.selectedDate ?? "";
        case QuestionType.Text:
        case QuestionType.Number:
        case QuestionType.Gesture:
          return (otherValues[q.question_id] ?? "").trim();
        case QuestionType.MultiSelectedPickList:
          return optText.trim();
        case QuestionType.MultiSelectedPickListWithOther: {
          const typed = (otherValues[q.question_id] ?? "").trim();
          const formatSelectedOptionText = removeLastElementFromSeparator(
            optText.trim(),
            ";"
          );
          const answerText =
            formatSelectedOptionText.trim() === ""
              ? formatSelectedOptionText.trim()
              : formatSelectedOptionText + ";";

          return typed !== "" ? `${answerText}${typed}` : optText.trim();
        }
        case QuestionType.PickListWithOther: {
          const typed = (otherValues[q.question_id] ?? "").trim();
          return typed !== "" ? typed : optText;
        }
        default:
          if (enableOtherOption) {
            return (otherValues[q.question_id] ?? "").trim();
          }
          return optText;
      }
    },
    [selectedOptions, otherValues, enableOtherOption]
  );

  const handleNextQuestion = useCallback(async () => {
    if (!question?.question_id) return;

    const responseObj: SingleQuestionModeResponse = {
      question: question?.question,
      question_id: question?.question_id,
      question_type: question?.question_type,
      section_description: question.sectionDescription,
      section_order: question.sectionOrder,
      selected_option: getAnswer(question)
    };

    const existingIndex = responses.findIndex(
      (r) => r.question_id === responseObj.question_id
    );

    const updatedResponses =
      existingIndex !== -1
        ? responses.map((r, i) => (i === existingIndex ? responseObj : r))
        : [...responses, responseObj];

    const nextAnswersBase = buildSectionAnswersFromSingleModeResponses(
      updatedResponses,
      flatQuestions
    );
    const nextAnswers = syncMultiSelectSectionAnswers(
      mergePickListWithOtherSectionAnswers(
        nextAnswersBase,
        updatedResponses,
        flatQuestions,
        selectedOptions,
        otherValues
      )
    );
    const nextVisible = getVisibleQuestionsForSection(
      flatQuestions,
      nextAnswers
    );
    const nextStep = currentStep + 1;

    setResponses(updatedResponses);

    if (nextStep >= nextVisible.length) {
      if (enabled && onCompletedRef.current) {
        await onCompletedRef.current(updatedResponses);
      }
    } else {
      setCurrentStep(nextStep);
    }
  }, [
    question,
    responses,
    getAnswer,
    currentStep,
    flatQuestions,
    enabled,
    selectedOptions,
    otherValues,
    syncMultiSelectSectionAnswers
  ]);

  return {
    mainQuestions,
    question,
    currentQuestionIndex: currentStep,
    totalSteps,
    selectedOptionText,
    selectedOption,
    selectedDate,
    setSelectedDate,
    enableOtherOption,
    otherValue,
    setOtherValue,
    handleDateSelect,
    handleOptionChange,
    handleMultiOptionsSelected,
    handleDisableNextBtn,
    handlePreviousQuestion,
    handleNextQuestion
  };
}
