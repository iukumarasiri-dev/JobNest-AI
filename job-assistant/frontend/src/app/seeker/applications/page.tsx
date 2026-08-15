"use client";

import { ApplicationFilters } from "./_components/ApplicationFilters";
import { ApplicationList } from "./_components/ApplicationList";
import { NewApplicationForm } from "./_components/NewApplicationForm";
import { useApplications } from "./useApplications";

export default function ApplicationsPage() {
  const {
    applications,
    resumes,
    companyName,
    setCompanyName,
    jobTitle,
    setJobTitle,
    jobDescription,
    setJobDescription,
    jobUrl,
    setJobUrl,
    resumeId,
    setResumeId,
    loading,
    savingStatusId,
    pageLoading,
    loadError,
    formError,
    actionError,
    extracting,
    extractError,
    extractNotice,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    sortBy,
    setSortBy,
    loadAll,
    handleSubmit,
    handleExtract,
    handleDelete,
    handleStatusChange,
    hasActiveFilters,
    clearFilters,
    visibleApplications,
  } = useApplications();

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Applications</h1>

      <NewApplicationForm
        companyName={companyName}
        onCompanyNameChange={setCompanyName}
        jobTitle={jobTitle}
        onJobTitleChange={setJobTitle}
        jobDescription={jobDescription}
        onJobDescriptionChange={setJobDescription}
        jobUrl={jobUrl}
        onJobUrlChange={setJobUrl}
        resumeId={resumeId}
        onResumeIdChange={setResumeId}
        resumes={resumes}
        loading={loading}
        formError={formError}
        extracting={extracting}
        extractError={extractError}
        extractNotice={extractNotice}
        onExtract={handleExtract}
        onSubmit={handleSubmit}
      />

      {actionError && <p className="text-sm text-destructive mb-4">{actionError}</p>}

      {pageLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-border rounded p-4 animate-pulse">
              <div className="h-4 w-48 bg-muted rounded mb-2" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
          ))}
        </div>
      )}

      {!pageLoading && loadError && (
        <div className="border border-destructive/30 bg-destructive/10 text-destructive rounded p-4 text-sm">
          <p className="mb-2">{loadError}</p>
          <button onClick={loadAll} className="underline">
            Try again
          </button>
        </div>
      )}

      {!pageLoading && !loadError && applications.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No applications yet. Fill out the form above to add your first one.
        </p>
      )}

      {!pageLoading && !loadError && applications.length > 0 && (
        <ApplicationFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          visibleCount={visibleApplications.length}
          totalCount={applications.length}
        />
      )}

      {!pageLoading && !loadError && applications.length > 0 && visibleApplications.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No applications match your filters.{" "}
          <button type="button" onClick={clearFilters} className="underline">
            Clear filters
          </button>
        </p>
      )}

      {!pageLoading && !loadError && visibleApplications.length > 0 && (
        <ApplicationList
          applications={visibleApplications}
          savingStatusId={savingStatusId}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
