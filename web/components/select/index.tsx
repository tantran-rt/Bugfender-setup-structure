"use client";

import React from "react";
import Select, { StylesConfig, SingleValue } from "react-select";
import { AiOutlineDown, AiOutlineUp } from "react-icons/ai";
import "./select.css";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

interface Option {
  id: number;
  value: string;
  label: string;
}

interface SelectProps {
  className?: string;
  disabled?: boolean;
  link?: string;
  style?: React.CSSProperties;
  data: Option[];
  placeholder: string;
  name: string;
  value: Option | null;
  onChange: (selectedOption: SingleValue<Option>) => void;
}

const customStyles: StylesConfig<Option, false> = {
  control: (base, state) => ({
    ...base,
    border: "1px",
    boxShadow: "none",
    // borderRadius: "8px",
    borderRadius: 0,
    borderBottom: "2px solid rgba(234, 238, 245, 1)",
    backgroundColor: "transparent",
    color: "#0C1617",
    height: "60px",
    paddingLeft: 0,
    "&:hover": {
      cursor: "pointer",
    },
    "&:focus": {
      outline: "none",
      backgroundColor: "#fafafa",
    },
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "#EAEAEA",
  }),
  placeholder: (base) => ({
    ...base,
    color: "#b0b0b0",
    textAlign: "left",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#0C1617",
    textAlign: "left",
  }),
  menu: (base) => ({
    ...base,
    boxShadow: "none",
    border: "2px solid rgba(234,238,245,1)",
    borderTop: "none",
    borderRadius: "0 0 5px 5px",
    borderBottom: "2px solid rgba(234,238,245,1)",
    marginTop: "-8px",
  }),
  valueContainer: (base) => ({
    paddingLeft: 0,
  }),
};

const SelectComponent = ({
  className,
  disabled,
  link,
  style,
  data,
  placeholder,
  name,
  value,
  onChange,
}: SelectProps) => {
  return (
    <Select
      classNamePrefix="react-select"
      className={className}
      options={data}
      isDisabled={disabled}
      styles={customStyles}
      onChange={(selectedOption) => {
        onChange(selectedOption);
      }}
      placeholder={placeholder}
      value={value}
      components={{
        IndicatorSeparator: () => null,
        DropdownIndicator: ({ selectProps }) =>
          selectProps.menuIsOpen ? (
            <FiChevronUp size={20} color={"#0C1617"} />
          ) : (
            <FiChevronDown size={20} color={"#0C1617"} />
          ),
      }}
      menuPlacement="auto"
      menuPosition="absolute"
      menuPortalTarget={typeof document !== "undefined" ? document.body : null}
      menuShouldScrollIntoView={false}
    />
  );
};

export default SelectComponent;
