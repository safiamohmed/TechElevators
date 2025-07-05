import { Document, Model } from "mongoose";

interface MonthData {
  month: string;
  count: number;
}

export async function generateLast12MothsData<T extends Document>(
  model: Model<T>
): Promise<{ last12Months: MonthData[] }> {
  const last12Months: MonthData[] = [];

  const currentDate = new Date();
  currentDate.setDate(1); 

  for (let i = 11; i >= 0; i--) {
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);

    const count = await model.countDocuments({
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    const monthLabel = startDate.toLocaleString("default", {
      month: "short",
      year: "numeric",
    });

    last12Months.push({ month: monthLabel, count });
  }

  return { last12Months };
}

