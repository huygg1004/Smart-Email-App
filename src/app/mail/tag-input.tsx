"use client";
import React from "react";
import Select, { components } from "react-select";
import { api } from "@/trpc/react";
import useThreads from "@/hooks/use-threads";
import Avatar from "react-avatar";

type OptionType = {
  label: string; // label must be a string for serialization
  value: string;
};

type Props = {
  defaultValues?: OptionType[];
  placeholder: string;
  label: string;
  onChange: (values: OptionType[]) => void;
  value: OptionType[];
};

const formatOptionLabel = (option: OptionType) => (
  <div className="flex items-center gap-2">
    <Avatar
      name={option.label}
      size="25"
      textSizeRatio={2}
      round={true}
    />
    <span>{option.label}</span>
  </div>
);

const TagInput: React.FC<Props> = ({
  placeholder,
  label,
  onChange,
  value,
}) => {
  const { accountId } = useThreads();
  const [inputValue, setInputValue] = React.useState("");

  const { data: suggestions } = api.account.getSuggestions.useQuery({
    accountId: accountId!,
  }, { enabled: !!accountId });

  // Options must be simple objects with string labels for correct serialization
  const options: OptionType[] = suggestions?.map((suggestion) => ({
    label: suggestion.address, // Label is now a simple string
    value: suggestion.address,
  })) ?? [];
  
  // Handle custom email entry
  if (inputValue && !options.some(opt => opt.value === inputValue)) {
      options.push({ label: inputValue, value: inputValue });
  }

  return (
    <div className="flex items-center rounded-md border bg-white">
      <span className="ml-3 text-sm text-gray-700">{label}</span>
      <Select
        onInputChange={(value) => setInputValue(value)}
        value={value}
        onChange={(selectedOptions) => onChange(selectedOptions as OptionType[])}
        className="w-full flex-1"
        options={options}
        formatOptionLabel={formatOptionLabel} // Use this prop for custom rendering
        placeholder={placeholder}
        isMulti
        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
        menuPosition="fixed"
        menuShouldScrollIntoView={false}
        classNames={{
          control: () => "!border-none !outline-none !ring-0 !shadow-none focus:border-none focus:outline-none focus:ring-0 focus:shadow-none",
          multiValue: () => "bg-gray-100",
          multiValueLabel: () => "text-black bg-gray-100 rounded-md font-bold",
        }}
        styles={{
          menu: (base) => ({
            ...base,
            zIndex: 9999,
            backgroundColor: "white",
            color: "black",
            maxHeight: "200px",
            overflowY: "auto",
            fontSize: "0.875rem",
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? "#f3f4f6" : "white",
            color: "#1f2937",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "0.875rem",
          }),
          multiValue: (base) => ({
            ...base,
            backgroundColor: "#e5e7eb",
            fontSize: "0.75rem",
          }),
          multiValueLabel: (base) => ({
            ...base,
            color: "#1f2937",
            fontWeight: "bold",
            fontSize: "0.75rem",
          }),
          input: (base) => ({ ...base, color: "#374151", fontWeight: "bold", fontSize: "0.875rem" }),
          placeholder: (base) => ({ ...base, color: "#4b5563", fontWeight: "bold", fontSize: "0.875rem" }),
        }}
      />
    </div>
  );
};

export default TagInput;
