import React from "react";
import Select from "react-select";
import { api } from "@/trpc/react";
import useThreads from "@/hooks/use-threads";
import Avatar from "react-avatar";
import type { ReactNode } from "react";

type OptionType = {
  label: string;
  value: string;
};

type Props = {
  defaultValues?: OptionType[];
  placeholder: string;
  label: string;
  onChange: (values: OptionType[]) => void;
  value: OptionType[];
};

const TagInput: React.FC<Props> = ({
  placeholder,
  label,
  onChange,
  value,
}: Props) => {
  const { accountId } = useThreads();

  const { data: suggestions } = api.account.getSuggestions.useQuery({
    accountId: accountId!,
  });

  const [inputValue, setInputValue] = React.useState("");

  const options = suggestions?.map((suggestion) => ({
    label: (
      <span className="flex items-center gap-2">
        <Avatar
          name={suggestion.address}
          size="25"
          textSizeRatio={2}
          round={true}
        />
        {suggestion.address}
      </span>
    ),
    value: suggestion.address,
  }));

  const customOptions =
    inputValue && inputValue.trim().length > 0
      ? [
          ...(options ?? []),
          {
            label: <span>{inputValue}</span>,
            value: inputValue,
          },
        ]
      : options;

  return (
    <div className="flex items-center rounded-md border bg-white">
      <span className="ml-3 text-sm text-gray-700">{label}</span>
      <Select
        onInputChange={(value) => setInputValue(value)}
        value={value}
        //@ts-ignore
        onChange={onChange}
        className="w-full flex-1"
        // @ts-ignore
        options={customOptions}
        placeholder={placeholder}
        isMulti
        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
        menuPosition="fixed"
        menuShouldScrollIntoView={false}
        classNames={{
          control: () =>
            "!border-none !outline-none !ring-0 !shadow-none focus:border-none focus:outline-none focus:ring-0 focus:shadow-none",
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
    fontSize: "0.875rem", // text-sm
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? "#f3f4f6" : "white",
    color: "#1f2937", // gray-800
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.875rem", // text-sm
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "#e5e7eb", // gray-200
    fontSize: "0.75rem", // text-xs
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: "#1f2937", // gray-800
    fontWeight: "bold",
    fontSize: "0.75rem", // text-xs
  }),
  input: (base) => ({
    ...base,
    color: "#374151", // gray-700
    fontWeight: "bold",
    fontSize: "0.875rem", // text-sm
  }),
  placeholder: (base) => ({
    ...base,
    color: "#4b5563", // gray-600
    fontWeight: "bold",
    fontSize: "0.875rem", // text-sm
  }),
}}

      />
    </div>
  );
};

export default TagInput;
