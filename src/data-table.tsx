import { cn } from "./utils";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  // Per-cell extra classes — apply mono fonts here for ID-style cells.
  cellClassName?: string;
  headerClassName?: string;
  render?: (row: T) => React.ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  className?: string;
  // Optional caption rendered inside the table outline for accessibility.
  caption?: string;
};

// `border` outline, `border-paper` row dividers, `text-2xs` uppercase header,
// sticky header inside scrollable wrapper. Hover row = paper-soft.
// See docs/DESIGN.md → Component conventions.
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  className,
  caption,
}: DataTableProps<T>) {
  return (
    <div className={cn("overflow-x-auto border border-border bg-card", className)}>
      <table className="w-full border-collapse">
        {caption ? (
          <caption className="sr-only">{caption}</caption>
        ) : null}
        <thead className="sticky top-0 z-10 bg-paper-soft">
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  "px-3 py-2 text-left text-2xs font-medium uppercase tracking-[0.08em] text-ink-soft",
                  col.headerClassName
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-b border-border-paper transition-colors duration-[120ms] ease-out last:border-b-0 hover:bg-paper-soft"
            >
              {columns.map((col) => {
                const value = col.render
                  ? col.render(row)
                  : String(
                      (row as Record<string, unknown>)[col.key] ?? ""
                    );
                return (
                  <td
                    key={col.key}
                    className={cn(
                      "px-3 py-2 text-sm text-foreground",
                      col.cellClassName
                    )}
                  >
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
