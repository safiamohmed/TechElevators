import Ratings from "@/app/utils/Ratings";
import Image from "next/image";
import React from "react";

type Props = {
  item: any;
};

const ReviewCard = (props: Props) => {
  return (
    <div className="w-full h-[250px] pb-4 dark:bg-slate-500 dark:bg-opacity-[0.20] border border-[#00000028] dark:border-[#ffffff1d] backdrop-blur shadow-[bg-slate-700] rounded-lg p-3 shadow-inner flex flex-col">
      <div className="flex w-full">
        <Image
          src={props.item.avatar}
          alt=""
          width={50}
          height={50}
          className="w-[50px] h-[50px] rounded-full object-cover"
        />
        <div className="pl-4 flex flex-col">
          <h5 className="text-[20px] text-black dark:text-white">
            {props.item.name}
          </h5>
          <h6 className="text-[16px] text-[#000] dark:text-[#ffffffab]">
            {props.item.profession}
          </h6>
        </div>
      </div>
      <p
        className="pt-2 px-2 font-Poppins text-black dark:text-white overflow-y-auto flex-1"
      >
        {props.item.comment}
      </p>
    </div>
  );
};

export default ReviewCard;
