"use client";

import { useEffect, useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Activity, 
  DashboardStats, 
  getDashboardStats, 
  getRecentActivity 
} from "@/services/api";
import { 
  Plus, 
  Download, 
  TrendingUp, 
  Users, 
  CreditCard, 
  Activity as ActivityIcon,
  Loader2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsData, activityData] = await Promise.all([
        getDashboardStats(),
        getRecentActivity()
      ]);
      setStats(statsData);
      setActivities(activityData);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back, admin. Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
             {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TrendingUp className="mr-2 h-4 w-4" />}
             Refresh
          </Button>
          <AddUserModal />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Revenue" 
          value={stats?.totalRevenue} 
          description="+20.1% from last month" 
          icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
          loading={isLoading}
        />
        <StatCard 
          title="Active Users" 
          value={stats?.activeUsers} 
          description="+180.1% from last month" 
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          loading={isLoading}
        />
        <StatCard 
          title="Subscriptions" 
          value={stats?.newSubscriptions} 
          description="+19% from last month" 
          icon={<ActivityIcon className="h-4 w-4 text-muted-foreground" />}
          loading={isLoading}
        />
        <StatCard 
          title="Active Now" 
          value={stats?.churnRate} 
          description="+201 since last hour" 
          icon={<ActivityIcon className="h-4 w-4 text-muted-foreground" />}
          loading={isLoading}
        />
      </div>

      {/* Activity Table */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm border-none bg-white">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>You made 265 sales this month.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
               <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
               </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div className="font-medium">{activity.user}</div>
                        <div className="text-sm text-muted-foreground hidden md:inline">{activity.email}</div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          activity.status === "success" ? "bg-green-50 text-green-700 border-green-200" :
                          activity.status === "pending" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                          "bg-red-50 text-red-700 border-red-200"
                        }`}>
                          {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>{activity.date}</TableCell>
                      <TableCell className="text-right font-semibold">{activity.amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions / Chart Mockup */}
        <Card className="col-span-3 shadow-sm border-none bg-blue-50/50">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Your analytics at a glance.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="h-[200px] w-full flex items-end gap-2 px-2">
               <div className="bg-blue-600 w-full h-[40%] rounded-t-sm animate-pulse"></div>
               <div className="bg-blue-500 w-full h-[70%] rounded-t-sm animate-pulse delay-75"></div>
               <div className="bg-blue-400 w-full h-[55%] rounded-t-sm animate-pulse delay-100"></div>
               <div className="bg-blue-600 w-full h-[90%] rounded-t-sm animate-pulse delay-150"></div>
               <div className="bg-blue-500 w-full h-[30%] rounded-t-sm animate-pulse delay-200"></div>
               <div className="bg-blue-400 w-full h-[65%] rounded-t-sm animate-pulse delay-300"></div>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Weekly Summary</h4>
              <p className="text-sm text-muted-foreground">
                This week you&apos;ve increased your user retention by <span className="text-green-600 font-bold">12.5%</span>. 
                Keep it up to reach your monthly goal.
              </p>
              <Button className="w-full bg-blue-600">View Detailed Report</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function StatCard({ title, value, description, icon, loading }: { 
  title: string, 
  value?: string, 
  description: string, 
  icon: React.ReactNode,
  loading: boolean
}) {
  return (
    <Card className="shadow-sm border-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24 mb-1" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function AddUserModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-blue-600">
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" value="Pedro Duarte" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">Username</Label>
            <Input id="username" value="@peduarte" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <Input id="email" type="email" value="pedro@duarte.com" className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" className="bg-blue-600">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
