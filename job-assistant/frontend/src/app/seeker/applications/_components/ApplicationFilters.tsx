import { STATUS_OPTIONS } from "../types";

export function ApplicationFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  hasActiveFilters,
  onClearFilters,
  visibleCount,
  totalCount,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  visibleCount: number;
  totalCount: number;
}) {
  return (
    <div className="mb-4 border border-border rounded-lg p-4 flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          className="flex-1 border border-border rounded p-2 bg-background text-sm"
          placeholder="Search by company or job title..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <select
          className="border border-border rounded p-2 bg-background text-sm"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className="border border-border rounded p-2 bg-background text-sm"
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value)}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="company">Company (A-Z)</option>
        </select>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <label className="text-sm text-muted-foreground flex items-center gap-2">
          From
          <input
            type="date"
            className="border border-border rounded p-2 bg-background text-sm"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
          />
        </label>
        <label className="text-sm text-muted-foreground flex items-center gap-2">
          To
          <input
            type="date"
            className="border border-border rounded p-2 bg-background text-sm"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
          />
        </label>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-sm underline text-muted-foreground self-start sm:self-auto"
          >
            Clear filters
          </button>
        )}
        <span className="text-xs text-muted-foreground sm:ml-auto">
          Showing {visibleCount} of {totalCount}
        </span>
      </div>
    </div>
  );
}
