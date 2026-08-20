"use client";
import React, { useState, useRef } from "react";
import "./FilterDropdown.css";
import { FiChevronDown, FiChevronsDown, FiFilter } from "react-icons/fi";
import { AiFillControl } from "react-icons/ai";
import { HiOutlineAdjustmentsHorizontal } from "react-icons/hi2";
import { BiXCircle } from "react-icons/bi";

interface Option {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  title?: string;
  options: Option[];
  onOptionSelect: (selectedOption: Option) => void;
  className?: string;
  dropdownClassName?: string;
  optionClassName?: string;
  onClearFilter?(): void;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  title = "Filter",
  options,
  onOptionSelect,
  className,
  dropdownClassName,
  optionClassName,
  onClearFilter,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (option: Option) => {
    setSelectedOption(option);
    setIsOpen(false);
    onOptionSelect(option);
  };

  const handleOutsideClick = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Element)
    ) {
      setIsOpen(false);
    }
  };

  return (
    <div className={`filter-dropdown ${className}`} ref={dropdownRef}>
      <button
        className="flex-row"
        onClick={handleToggle}
        style={{
          backgroundColor: "transparent",
          padding: "12px",
          borderRadius: "8px",
          border: "1px solid #C6CED6",
          height: "48px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <HiOutlineAdjustmentsHorizontal size={24} />

        {title}

        {title !== "Filter" ? (
          <BiXCircle size={24} onClick={onClearFilter} />
        ) : (
          <FiChevronDown onClick={handleToggle} />
        )}
      </button>
      {isOpen && (
        <ul className={`dropdown-menu ${dropdownClassName}`}>
          {options.map((option, index) => (
            <li
              key={index}
              className={optionClassName}
              onClick={() => handleOptionClick(option)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FilterDropdown;
