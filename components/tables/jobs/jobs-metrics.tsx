import {
  BriefcaseIcon,
  ClockIcon,
  AlertCircleIcon,
  TrendingUpIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "neutral";
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p
            className={`text-xs ${
              trend === "up"
                ? "text-green-600"
                : trend === "down"
                  ? "text-red-600"
                  : "text-muted-foreground"
            }`}
          >
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface JobMetricsProps {
  metrics: {
    totalJobs: number;
    activeJobs: number;
    jobsRequiringAction: number;
    avgTimeOpen: number;
    totalApplications: number;
  };
}

export function JobMetrics({ metrics }: JobMetricsProps) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Jobs"
        value={metrics.totalJobs}
        subtitle={`${metrics.activeJobs} active`}
        icon={BriefcaseIcon}
      />
      <MetricCard
        title="Requiring Action"
        value={metrics.jobsRequiringAction}
        subtitle="Draft + stale postings"
        icon={AlertCircleIcon}
        trend={metrics.jobsRequiringAction > 0 ? "up" : "neutral"}
      />
      <MetricCard
        title="Avg. Time Open"
        value={`${metrics.avgTimeOpen}d`}
        subtitle="Published to offer"
        icon={ClockIcon}
      />
      <MetricCard
        title="Total Applications"
        value={metrics.totalApplications}
        subtitle="Across all jobs"
        icon={TrendingUpIcon}
      />
    </div>
  );
}
