import {
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Textarea,
} from "@chakra-ui/react";
import { useField } from "formik";
import React from "react";

type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  textarea?: boolean 
};

export const InputField: React.FC<InputFieldProps> = ({
  label,
  textarea,
  size: _,
  ...props
}) => {
  let InputOrTextarea = Input;
  if(textarea){
    InputOrTextarea = Textarea;
  }
  const [field, { error }] = useField(props);
  {
    /*this is a special hook from formik*/
  }
  return (
    <FormControl isInvalid={!!error}>
      {" "}
      {/*The !!error is there because error will be a string and !! converts to boolean */}
  
      <FormLabel htmlFor={field.name}>{label}</FormLabel>
      <InputOrTextarea
        {...field}
        {...props}
        id={field.name}
        placeholder={props.placeholder}
      />
      {error ? <FormErrorMessage> {error} </FormErrorMessage> : null}
    </FormControl>
  );
};
