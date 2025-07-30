import {
  BriefcaseIcon,
  ClockIcon,
  AlertCircleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  UsersIcon,
} from "lucide-react";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@seeds/ui/card";
import { Badge } from "@seeds/ui/badge";
import { cn } from "@seeds/ui/lib/utils";

interface TrendData {
  direction: "up" | "down" | "neutral";
  percentage: string;
  description: string;
  subtitle: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: TrendData;
  variant?: "default" | "warning" | "success" | "info";
  className?: string;
}

function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: MetricCardProps) {
  const getTrendIcon = () => {
    switch (trend?.direction) {
      case "up":
        return <TrendingUpIcon className="size-3" />;
      case "down":
        return <TrendingDownIcon className="size-3" />;
      case "neutral":
        return <MinusIcon className="size-3" />;
      default:
        return null;
    }
  };

  const getTrendBadgeVariant = () => {
    if (!trend) return "outline";
    switch (variant) {
      case "warning":
        return trend.direction === "up" ? "warning" : "outline";
      case "success":
        return "success";
      case "info":
        return "info";
      default:
        return "outline";
    }
  };

  const getFooterIcon = () => {
    switch (trend?.direction) {
      case "up":
        return <TrendingUpIcon className="size-4" />;
      case "down":
        return <TrendingDownIcon className="size-4" />;
      default:
        return <Icon className="size-4" />;
    }
  };

  return (
    <Card className={cn("@container/card", className)}>
      <CardHeader className="relative">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </CardTitle>
        {trend && (
          <div className="absolute right-4 top-4">
            <Badge
              variant={getTrendBadgeVariant()}
              className="flex gap-1 rounded-lg text-xs"
            >
              {getTrendIcon()}
              {trend.percentage}
            </Badge>
          </div>
        )}
      </CardHeader>
      {trend && (
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {trend.description} {getFooterIcon()}
          </div>
          <div className="text-muted-foreground">{trend.subtitle}</div>
        </CardFooter>
      )}
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
    previousPeriodJobs?: number;
    previousPeriodApplications?: number;
    previousAvgTimeOpen?: number;
  };
}

export function JobMetrics({ metrics }: JobMetricsProps) {
  const calculateTrend = (current: number, previous?: number) => {
    if (!previous || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    const direction: "up" | "down" | "neutral" = change > 0 ? "up" : change < 0 ? "down" : "neutral";
    return {
      direction,
      percentage: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
      change: Math.abs(change)
    };
  };

  const jobsTrend = calculateTrend(metrics.totalJobs, metrics.previousPeriodJobs);
  const applicationsTrend = calculateTrend(metrics.totalApplications, metrics.previousPeriodApplications);
  const timeTrend = calculateTrend(metrics.avgTimeOpen, metrics.previousAvgTimeOpen);

  const getActionsTrendData = (): TrendData => {
    if (metrics.jobsRequiringAction === 0) {
      return {
        direction: "neutral",
        percentage: "All clear",
        description: "No jobs need attention",
        subtitle: "All postings are up to date"
      };
    } else if (metrics.jobsRequiringAction > 5) {
      return {
        direction: "up",
        percentage: `${metrics.jobsRequiringAction} items`,
        description: "High priority actions needed",
        subtitle: "Multiple jobs require immediate attention"
      };
    } else {
      return {
        direction: "up",
        percentage: `${metrics.jobsRequiringAction} items`,
        description: "Some jobs need review",
        subtitle: "Draft or stale postings to update"
      };
    }
  };

  const getTimeTrendDirection = (): "up" | "down" | "neutral" => {
    if (metrics.avgTimeOpen > 45) return "up";
    if (metrics.avgTimeOpen < 20) return "down";
    return "neutral";
  };

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        title="Total Jobs"
        value={metrics.totalJobs}
        icon={BriefcaseIcon}
        trend={jobsTrend ? {
          direction: jobsTrend.direction,
          percentage: jobsTrend.percentage,
          description: jobsTrend.direction === "up" ? "Growing job portfolio" : "Fewer active positions",
          subtitle: `${metrics.activeJobs} currently active`
        } : {
          direction: "neutral",
          percentage: `${metrics.activeJobs} active`,
          description: "Job portfolio status",
          subtitle: "Track hiring pipeline health"
        }}
      />

      <MetricCard
        title="Requiring Action"
        value={metrics.jobsRequiringAction}
        icon={AlertCircleIcon}
        trend={getActionsTrendData()}
        variant={metrics.jobsRequiringAction > 5 ? "warning" : metrics.jobsRequiringAction === 0 ? "success" : "default"}
      />

      <MetricCard
        title="Avg. Time to Hire"
        value={`${metrics.avgTimeOpen}d`}
        icon={ClockIcon}
        trend={timeTrend ? {
          direction: timeTrend.direction,
          percentage: timeTrend.percentage,
          description: timeTrend.direction === "up" ? "Hiring process slower" : "Faster hiring cycle",
          subtitle: "Published to offer accepted"
        } : {
          direction: getTimeTrendDirection(),
          percentage: metrics.avgTimeOpen > 45 ? "Above avg" : metrics.avgTimeOpen < 20 ? "Fast cycle" : "On track",
          description: metrics.avgTimeOpen > 45 ? "Consider process optimization" : metrics.avgTimeOpen < 20 ? "Efficient hiring process" : "Standard hiring timeline",
          subtitle: "Industry benchmark: 30-45 days"
        }}
        variant={metrics.avgTimeOpen > 45 ? "warning" : metrics.avgTimeOpen < 25 ? "success" : "default"}
      />

      <MetricCard
        title="Total Applications"
        value={metrics.totalApplications}
        icon={UsersIcon}
        trend={applicationsTrend ? {
          direction: applicationsTrend.direction,
          percentage: applicationsTrend.percentage,
          description: applicationsTrend.direction === "up" ? "Application volume growing" : "Fewer applications received",
          subtitle: "Across all active positions"
        } : {
          direction: "up",
          percentage: `${Math.round(metrics.totalApplications / Math.max(metrics.activeJobs, 1))} avg`,
          description: "Application pipeline healthy",
          subtitle: "Average applications per job"
        }}
        variant={applicationsTrend?.direction === "up" ? "success" : "default"}
      />
    </div>
  );
}
