"use client";

export interface DashboardStats {
  totalRevenue: string;
  activeUsers: string;
  newSubscriptions: string;
  churnRate: string;
}

export interface Activity {
  id: string;
  user: string;
  email: string;
  amount: string;
  status: "success" | "pending" | "failed";
  date: string;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  return {
    totalRevenue: "$45,231.89",
    activeUsers: "+2350",
    newSubscriptions: "+12,234",
    churnRate: "+573",
  };
};

export const getRecentActivity = async (): Promise<Activity[]> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800));
  
  return [
    {
      id: "1",
      user: "Olivia Martin",
      email: "olivia.martin@email.com",
      amount: "+$1,999.00",
      status: "success",
      date: "2023-01-23",
    },
    {
      id: "2",
      user: "Jackson Lee",
      email: "jackson.lee@email.com",
      amount: "+$39.00",
      status: "success",
      date: "2023-01-24",
    },
    {
      id: "3",
      user: "Isabella Nguyen",
      email: "isabella.nguyen@email.com",
      amount: "+$299.00",
      status: "pending",
      date: "2023-01-25",
    },
    {
      id: "4",
      user: "William Kim",
      email: "will@email.com",
      amount: "+$99.00",
      status: "success",
      date: "2023-01-26",
    },
    {
      id: "5",
      user: "Sofia Davis",
      email: "sofia.davis@email.com",
      amount: "+$1,250.00",
      status: "failed",
      date: "2023-01-27",
    },
  ];
};
