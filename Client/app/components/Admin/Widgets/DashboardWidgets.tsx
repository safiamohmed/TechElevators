'use client'
import React, { FC, useEffect, useState } from "react";
import UserAnalytics from "../Analytics/UserAnalytics";
import { BiBorderLeft } from "react-icons/bi";
import { PiUsersFourLight } from "react-icons/pi";
import { Box, CircularProgress } from "@mui/material";
import OrdersAnalytics from "../Analytics/OrdersAnalytics";
import AllInvoices from "../Order/AllInvoices";
import {
  useGetOrdersAnalyticsQuery,
  useGetUsersAnalyticsQuery,
} from "@/redux/features/analytics/analyticsApi";

// تعريف نوع Props بشكل صريح
type ProgressProps = {
  value?: number;
  open?: boolean;
};

const CircularProgressWithLabel: FC<ProgressProps> = ({ open, value }) => {
  return (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <CircularProgress
        variant="determinate"
        value={value !== undefined ? value : 0}
        size={45}
        color={value && value > 50 ? "success" : "error"}
        thickness={4}
        style={{ zIndex: open ? -1 : 1 }}
      />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: "absolute",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: value && value > 50 ? "#4caf50" : "#f44336",
        }}
      >
        {`${Math.round(value || 0)}%`}
      </Box>
    </Box>
  );
};

type DashboardProps = {
  open?: boolean;
};

const DashboardWidgets: FC<DashboardProps> = ({ open }) => {
  const [ordersComparePercentage, setOrdersComparePercentage] = useState<any>();
  const [userComparePercentage, setUserComparePercentage] = useState<any>();

  const { data, isLoading } = useGetUsersAnalyticsQuery({});
  const { data: ordersData, isLoading: ordersLoading } =
    useGetOrdersAnalyticsQuery({});

  useEffect(() => {
    if (isLoading || ordersLoading) return;
    if (data && ordersData) {
      const usersLastTwoMonths = data.users.last12Months.slice(-2);
      const ordersLastTwoMonths = ordersData.orders.last12Months.slice(-2);

      if (usersLastTwoMonths.length === 2 && ordersLastTwoMonths.length === 2) {
        const usersCurrentMonth = usersLastTwoMonths[1].count;
        const usersPreviousMonth = usersLastTwoMonths[0].count;
        const ordersCurrentMonth = ordersLastTwoMonths[1].count;
        const ordersPreviousMonth = ordersLastTwoMonths[0].count;

        const usersPercentChange =
          usersPreviousMonth !== 0
            ? ((usersCurrentMonth - usersPreviousMonth) / usersPreviousMonth) * 100
            : 100;
        const ordersPercentChange =
          ordersPreviousMonth !== 0
            ? ((ordersCurrentMonth - ordersPreviousMonth) / ordersPreviousMonth) *
              100
            : 100;

        setUserComparePercentage({
          currentMonth: usersCurrentMonth,
          previousMonth: usersPreviousMonth,
          percentChange: usersPercentChange,
        });
        setOrdersComparePercentage({
          currentMonth: ordersCurrentMonth,
          previousMonth: ordersPreviousMonth,
          percentChange: ordersPercentChange,
        });
      }
    }
  }, [isLoading, ordersLoading, data, ordersData]);

  return (
    <div className="min-h-screen p-6">
      <div className="grid grid-cols-2 gap-6 mt-4">
  <div className="p-4 bg-white dark:bg-[#111C43] rounded-lg shadow-md">
    <UserAnalytics isDashboard={true} />
  </div>
  <div className="p-2 bg-white dark:bg-[#111C43] rounded-lg shadow-md flex flex-col gap-6">
    <div className="p-4 bg-gray-100 dark:bg-[#2d3a4e] rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <BiBorderLeft className="dark:text-[#45CBA0] text-black text-[30px]" />
          <h5 className="pt-2 font-Poppins dark:text-white text-black text-[20px]">
            {ordersComparePercentage?.currentMonth || 0}
          </h5>
          <h5 className="py-2 font-Poppins dark:text-[#45CBA0] text-black text-[16px] font-[400]">
            Sales Obtained
          </h5>
        </div>
        <div>
          <CircularProgressWithLabel
            value={
              ordersComparePercentage?.percentChange !== undefined
                ? Math.min(100, Math.abs(ordersComparePercentage?.percentChange))
                : 0
            }
            open={open}
          />
          <h5 className="text-center pt-2 text-[14px]">
            {ordersComparePercentage?.percentChange !== undefined
              ? `${ordersComparePercentage?.percentChange > 0 ? "+" : ""}${
                  ordersComparePercentage?.percentChange.toFixed(2)
                }%`
              : "0.00%"}
          </h5>
        </div>
      </div>
    </div>
    <div className="p-4 bg-gray-100 dark:bg-[#2d3a4e] rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <PiUsersFourLight className="dark:text-[#45CBA0] text-black text-[30px]" />
          <h5 className="pt-2 font-Poppins dark:text-white text-black text-[20px]">
            {userComparePercentage?.currentMonth || 0}
          </h5>
          <h5 className="py-2 font-Poppins dark:text-[#45CBA0] text-black text-[16px] font-[400]">
            New Users
          </h5>
        </div>
        <div>
          <CircularProgressWithLabel
            value={
              userComparePercentage?.percentChange !== undefined
                ? Math.min(100, Math.abs(userComparePercentage?.percentChange))
                : 0
            }
            open={open}
          />
          <h5 className="text-center pt-2 text-[14px]">
            {userComparePercentage?.percentChange !== undefined
              ? `${userComparePercentage?.percentChange > 0 ? "+" : ""}${
                  userComparePercentage?.percentChange.toFixed(2)
                }%`
              : "0.00%"}
          </h5>
        </div>
      </div>
    </div>
  </div>
</div>

      <div className="grid grid-cols-2 gap-6 mt-6">
        <div className="p-4 bg-white dark:bg-[#111C43] rounded-lg shadow-md h-[40vh]">
          <OrdersAnalytics isDashboard={true} />
        </div>
        <div className="p-4 bg-white dark:bg-[#111C43] rounded-lg shadow-md">
          <h5 className="dark:text-white text-black text-[20px] font-[400] font-Poppins pb-3">
            Recent Transactions
          </h5>
          <AllInvoices isDashboard={true} />
        </div>
      </div>
    </div>
  );
};

export default DashboardWidgets;