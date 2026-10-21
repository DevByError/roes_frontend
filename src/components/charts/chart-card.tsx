"use client";

import { useState } from "react";
import { BarChart3, Table2 } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface TableView {
  headers: string[];
  rows: (string | number)[][];
}

export function ChartCard({
  title,
  description,
  actions,
  table,
  children,
  className,
  footer,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  table?: TableView;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}) {
  const [asTable, setAsTable] = useState(false);
  return (
    <Card className={cn("flex flex-col animate-fade-up", className)}>
      <CardHeader className="flex-wrap">
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {table && (
            <Tooltip content={asTable ? "Show chart" : "Show as table"}>
              <button
                type="button"
                aria-pressed={asTable}
                aria-label={asTable ? "Show chart" : "Show as table"}
                onClick={() => setAsTable((v) => !v)}
                className="grid size-8 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                {asTable ? <BarChart3 className="size-4" /> : <Table2 className="size-4" />}
              </button>
            </Tooltip>
          )}
        </div>
      </CardHeader>
      <div className="flex-1 px-3 pb-4 pt-2 sm:px-5">
        {asTable && table ? (
          <div className="scrollbar-thin max-h-72 overflow-y-auto rounded-lg border">
            <Table>
              <THead className="sticky top-0 bg-card">
                <TR className="hover:bg-transparent">
                  {table.headers.map((h) => (
                    <TH key={h}>{h}</TH>
                  ))}
                </TR>
              </THead>
              <TBody>
                {table.rows.map((r, i) => (
                  <TR key={i}>
                    {r.map((c, j) => (
                      <TD key={j} className={cn("py-2", j > 0 && "tabular")}>
                        {c}
                      </TD>
                    ))}
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        ) : (
          children
        )}
      </div>
      {footer && <div className="border-t px-5 py-3 text-xs text-muted-foreground">{footer}</div>}
    </Card>
  );
}
