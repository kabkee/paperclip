import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { issuesApi } from "../api/issues";
import { authApi } from "../api/auth";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { StatusIcon } from "../components/StatusIcon";
import { PriorityIcon } from "../components/PriorityIcon";
import { EntityRow } from "../components/EntityRow";
import { EmptyState } from "../components/EmptyState";
import { PageSkeleton } from "../components/PageSkeleton";
import { formatDate } from "../lib/utils";
import { ListTodo } from "lucide-react";

const ACTIVE_STATUSES = "todo,in_progress,blocked,in_review";

export function MyIssues() {
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([{ label: "My Issues" }]);
  }, [setBreadcrumbs]);

  const { data: session } = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => authApi.getSession(),
  });

  const isAuthenticated = Boolean(session?.user?.id);

  const { data: issues, isLoading, error } = useQuery({
    queryKey: [...queryKeys.issues.list(selectedCompanyId!), "my-issues"],
    queryFn: () =>
      issuesApi.list(selectedCompanyId!, {
        assigneeUserId: "me",
        status: ACTIVE_STATUSES,
      }),
    enabled: !!selectedCompanyId && isAuthenticated,
  });

  if (!selectedCompanyId) {
    return <EmptyState icon={ListTodo} message="Select a company to view your issues." />;
  }

  if (isLoading) {
    return <PageSkeleton variant="list" />;
  }

  const myIssues = issues ?? [];

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error.message}</p>}

      {myIssues.length === 0 && (
        <EmptyState icon={ListTodo} message="No active issues assigned to you." />
      )}

      {myIssues.length > 0 && (
        <div className="border border-border rounded-md overflow-hidden">
          {myIssues.map((issue) => (
            <EntityRow
              key={issue.id}
              identifier={issue.identifier ?? issue.id.slice(0, 8)}
              title={issue.title}
              to={`/issues/${issue.identifier ?? issue.id}`}
              leading={
                <StatusIcon status={issue.status} />
              }
              trailing={
                <div className="flex items-center gap-2">
                  <PriorityIcon priority={issue.priority} />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(issue.updatedAt)}
                  </span>
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
