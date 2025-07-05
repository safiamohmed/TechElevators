"use client";
import React, { FC, useEffect, useState } from "react"; 
import { useFormik } from "formik";
import * as Yup from "yup";
import { styles } from "@/app/styles/style";
import { useResetPasswordMutation } from "@/redux/features/auth/authApi";
import { toast } from "react-hot-toast";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai"; 
type Props = {
  setRoute: (route: string) => void;
  email: string;
};

const schema = Yup.object().shape({
  newPassword: Yup.string()
    .required("Please enter your new password!")
    .min(6, "Password must be at least 6 characters!"),
});

const ResetPassword: FC<Props> = ({ setRoute, email }) => {
  const [resetPassword, { isSuccess, error }] = useResetPasswordMutation();
  const [show, setShow] = useState(false); 

  const formik = useFormik({
    initialValues: { newPassword: "" },
    validationSchema: schema,
    onSubmit: async ({ newPassword }) => {
      await resetPassword({ email, newPassword });
    },
  });

  useEffect(() => {
    if (isSuccess) {
      toast.success("Password reset successfully!");
      setRoute("Login");
    }
    if (error && "data" in error) {
      const errorData = error as any;
      toast.error(errorData.data.message);
    }
  }, [isSuccess, error, setRoute]);

  const { errors, touched, values, handleChange, handleSubmit } = formik;

  return (
    <div className="w-full">
      <h1 className={`${styles.title}`}>Reset Password</h1>
      <form onSubmit={handleSubmit}>
        <div className="w-full mt-5 relative mb-1">
          <label className={`${styles.label}`} htmlFor="newPassword">
            Enter your new password
          </label>
          <input
            type={show ? "text" : "password"} 
            id="newPassword"
            name="newPassword"
            value={values.newPassword}
            onChange={handleChange}
            placeholder="Password..."
            className={`${errors.newPassword && touched.newPassword && "border-red-500"} ${styles.input}`}
          />
          
          {show ? (
            <AiOutlineEye
              className="absolute bottom-3 right-2 z-1 cursor-pointer"
              size={20}
              onClick={() => setShow(false)}
            />
          ) : (
            <AiOutlineEyeInvisible
              className="absolute bottom-3 right-2 z-1 cursor-pointer"
              size={20}
              onClick={() => setShow(true)}
            />
          )}
          {errors.newPassword && touched.newPassword && (
            <span className="text-red-500 pt-2 block">{errors.newPassword}</span>
          )}
        </div>
        <div className="w-full mt-5">
          <input type="submit" value="Save" className={`${styles.button}`} />
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

export default ResetPassword;