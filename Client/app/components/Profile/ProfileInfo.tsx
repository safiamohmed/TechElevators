import Image from "next/image";
import { styles } from "../../../app/styles/style";
import React, { FC, useEffect, useState } from "react";
import { AiOutlineCamera } from "react-icons/ai";
import avatarIcon from "../../../public/assests/avatar.png";
import {
  useEditProfileMutation,
  useUpdateAvatarMutation,
} from "@/redux/features/user/userApi";
import { useLoadUserQuery } from "@/redux/features/api/apiSlice";
import { toast } from "react-hot-toast";

type Props = {
  avatar: string | null;
  user: any;
};

const ProfileInfo: FC<Props> = ({ avatar, user }) => {
  const [name, setName] = useState(user?.name || "");
  const [localAvatar, setLocalAvatar] = useState<string | null>(null); // الحالة المحلية للصورة
  const [updateAvatar, { isSuccess, error, isLoading }] = useUpdateAvatarMutation();
  const [editProfile, { isSuccess: success, error: updateError }] = useEditProfileMutation();
  const [loadUser, setLoadUser] = useState(false);
  const { data: userData, refetch, isUninitialized } = useLoadUserQuery(undefined, {
    skip: !loadUser,
  });

  const imageHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        if (fileReader.readyState === 2) {
          const imageData = fileReader.result as string;
          setLocalAvatar(imageData); // تحديث الصورة محليًا
          updateAvatar(imageData); // إرسال الصورة إلى الخادم
        }
      };
      fileReader.readAsDataURL(e.target.files[0]);
    }
  };

  useEffect(() => {
    if (isSuccess) {
      setLoadUser(true); // تفعيل إعادة تحميل بيانات المستخدم
      if (!isUninitialized) {
        refetch(); // إعادة جلب البيانات فقط إذا كان الاستعلام قد بدأ
      }
     toast.success("Avatar updated successfully!");
    }
    if (success) {
      setLoadUser(true);
      if (!isUninitialized) {
        refetch();
      }
      toast.success("Profile updated successfully!");
    }
    if (error) {
      if ("data" in error) {
        const errorData = error as any;
        toast.error(errorData.data.message);
        setLocalAvatar(null); // إعادة الحالة المحلية إذا فشل التحديث
      }
    }
    if (updateError) {
      if ("data" in updateError) {
        const errorData = updateError as any;
        toast.error(errorData.data.message);
      }
    }
  }, [isSuccess, error, success, updateError, refetch, isUninitialized]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (name.trim()) {
      await editProfile({ name });
    }
  };

  return (
    <div className="p-8 max-w-lg w-full mx-auto shadow-lg rounded-xl bg-white dark:bg-gray-800 dark:text-white">
      <div className="flex flex-col items-center w-full p-4">
        <div className="relative w-[130px] h-[130px]">
          <Image
            src={localAvatar || user?.avatar?.url || avatar || avatarIcon} // استخدام الصورة المحلية أولاً
            alt="User Avatar"
            width={130}
            height={130}
            className="rounded-full border-4 border-[#37a39a] object-cover"
          />
          <input
            type="file"
            id="avatar"
            className="hidden"
            onChange={imageHandler}
            accept="image/png,image/jpg,image/jpeg,image/webp"
            disabled={isLoading}
          />
          <label htmlFor="avatar" className="absolute bottom-2 right-2 bg-gray-800 p-2 rounded-full cursor-pointer">
            <AiOutlineCamera size={22} className="text-white" />
          </label>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-md mt-6">
          <div className="mb-4">
            <label className="block text-sm font-medium pb-1">Full Name</label>
            <input
              type="text"
              className={`${styles.input} w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 dark:text-white`}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium pb-1">Email Address</label>
            <input
              type="text"
              readOnly
              className={`${styles.input} w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 dark:text-white cursor-not-allowed`}
              value={user?.email || ""}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 rounded-md hover:opacity-90 transition"
            disabled={isLoading}
          >
            Update Profile
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileInfo;