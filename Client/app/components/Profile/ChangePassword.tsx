import { styles } from "@/app/styles/style";
import { useUpdatePasswordMutation } from "@/redux/features/user/userApi";
import React, { FC, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

const ChangePassword: FC = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatePassword, { isSuccess, error }] = useUpdatePasswordMutation();

  const passwordChangeHandler = async (e: any) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
    } else {
      await updatePassword({ oldPassword, newPassword });
    }
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success("Password changed successfully");
    }
    if (error && "data" in error) {
      const errorData = error as any;
      toast.error(errorData.data.message);
    }
  }, [isSuccess, error]);

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg p-6 dark:bg-gray-800">
        <h1 className="text-2xl font-semibold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 pb-4">
          Change Password
        </h1>
        <form onSubmit={passwordChangeHandler} className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 pb-2">
              Enter your old password
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-400 outline-none text-gray-900 dark:text-white bg-white dark:bg-gray-900"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 pb-2">
              Enter your new password
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-400 outline-none text-gray-900 dark:text-white bg-white dark:bg-gray-900"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 pb-2">
              Confirm your new password
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-400 outline-none text-gray-900 dark:text-white bg-white dark:bg-gray-900"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 text-white font-semibold py-2 rounded-lg shadow-md transition duration-300"
          >
            Update
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
