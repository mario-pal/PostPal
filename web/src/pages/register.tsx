import React from "react";
import { Form, Formik } from "formik";
import { valueScaleCorrection } from "framer-motion/types/render/dom/layout/scale-correction";
import {
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Box,
  Button,
} from "@chakra-ui/react";
import { Wrapper } from "../components/Wrapper";
import { InputField } from "../components/InputField";
import { useMutation } from "urql";
import { useRegisterMutation } from "../generated/graphql";
import { toErrorMap } from "../utils/toErrorMap";

import {useRouter} from "next/router";
interface registerProps {}

const REGISTER_MUT = `mutation register($username: String!, $password:String!){
    register(options: {username: $username, password: $password}){
        errors{
            field
            message
        }
        user{
            id
            username
        }
    }
}`;

const Register: React.FC<registerProps> = ({}) => {
  const router = useRouter();
  const [_, register] = useRegisterMutation();
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ username: "", password: "" }}
        onSubmit={async (values, { setErrors }) => {
          const response = await register(values);
          if (response.data?.register.errors) {
            setErrors(toErrorMap(response.data.register.errors));
          } else if(response.data?.register.user){
              //it worked
              router.push("/");
          }
        }}
      >
        {({ values, handleChange }) => (
          <Form>
            {/*<FormControl>
            <FormLabel htmlFor="username">Username</FormLabel>
            <Input
              value={values.username}
              onChange={handleChange}
              id="username"
              placeholder="username"
            />
           
          </FormControl>
          */}
            <InputField
              name="username"
              placeholder="username"
              label="Username"
            />
            <Box mt={4}>
              <InputField
                name="password"
                placeholder="password"
                label="Password"
                type="password"
              />
            </Box>
            <Button type="submit" mt={4} colorScheme="blue">
              register
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default Register;
