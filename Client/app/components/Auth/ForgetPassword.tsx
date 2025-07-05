"use client";
import React, { FC, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { styles } from "@/app/styles/style";
import { useForgetPasswordMutation } from "@/redux/features/auth/authApi";
import { toast } from "react-hot-toast";

type Props = {
  setRoute: (route: string) => void;
  setEmail: (email: string) => void;
  email?: string;
};

const schema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email!")
    .required("Please enter your email!"),
});

const ForgetPassword: FC<Props> = ({ setRoute, setEmail }) => {
  const [forgetPassword, { isSuccess, error }] = useForgetPasswordMutation();

  const formik = useFormik({
    initialValues: { email: "" },
    validationSchema: schema,
    onSubmit: async ({ email }) => {
      await forgetPassword({ email });
    },
  });

  useEffect(() => {
    if (isSuccess) {
      toast.success("Reset code sent to your email!");
      console.log("ForgetPassword - Email sent:", formik.values.email); 
      if (typeof setEmail === "function") {
        setEmail(formik.values.email); 
      } else {
        console.error("setEmail is not a function:", setEmail);
      }
      setRoute("Verify-Reset-Code");
    }
    if (error && "data" in error) {
      const errorData = error as any;
      toast.error(errorData.data.message);
    }
  }, [isSuccess, error, setRoute, setEmail]);

  const { errors, touched, values, handleChange, handleSubmit } = formik;

  return (
    <div className="w-full">
      <h1 className={`${styles.title}`}>Forget Password</h1>
      <form onSubmit={handleSubmit}>
        <label className={`${styles.label}`} htmlFor="email">
          Enter your email
        </label>
        <input
          type="email"
          name="email"
          value={values.email}
          onChange={handleChange}
          id="email"
          placeholder="Your Email"
          className={`${errors.email && touched.email && "border-red-500"} ${styles.input}`}
        />
        {errors.email && touched.email && (
          <span className="text-red-500 pt-2 block">{errors.email}</span>
        )}
        <div className="w-full mt-5">
          <input type="submit" value="Send" className={`${styles.button}`} />
        </div>
        <h5 className="text-center pt-4 font-Poppins text-[14px]">
          Back to{" "}
          <span
            className="text-[#2190ff] pl-1 cursor-pointer"
            onClick={() => setRoute("Login")}
          >
            Sign in
          </span>
        </h5>
      </form>
    </div>
  );
};

export default ForgetPassword;