import React from 'react';
import { Filter, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import {
  FilterCriteria,
  Priority,
  Reminder,
  ReminderCategory,
  SnoozeDuration,
} from '../types/reminder';
import { filterAndSortReminders } from '../utils/reminderLogic';
import { ReminderCard } from './ReminderCard';

interface SearchFilterViewProps {
  reminders: Reminder[];
  categories: ReminderCategory[];
  criteria: FilterCriteria;
  use24Hour: boolean;
  onChangeCriteria: (next: FilterCriteria) => void;
  onResetCriteria: () => void;
  onToggleComplete: (reminder: Reminder) => void;
  onSelectDetail: (reminder: Reminder) => void;
  onEdit: (reminder: Reminder) => void;
  onDuplicate: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
  onSnooze: (reminder: Reminder, minutes: SnoozeDuration) => void;
  onTriggerTestAlarm: (reminder: Reminder) => void;
}

export const SearchFilterView: React.FC<SearchFilterViewProps> = ({
  reminders,
  categories,
  criteria,
  use24Hour,
  onChangeCriteria,
  onResetCriteria,
  onToggleComplete,
  onSelectDetail,
  onEdit,
  onDuplicate,
  onDelete,
  onSnooze,
  onTriggerTestAlarm,
}) => {
  const filtered = filterAndSortReminders(reminders, criteria);
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      {/* Search & Filter Controls Panel */}
      <div className="rounded-[28px] liquid-glass p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Search & Advanced Filters
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Search by title or description and filter by category, priority, date, or completion
              status
            </p>
          </div>

          <button
            type="button"
            onClick={onResetCriteria}
            className="px-3.5 py-2 rounded-xl liquid-btn-secondary text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 self-start sm:self-auto whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <label htmlFor="search-reminders-input" className="sr-only">
            Search reminders by title or description
          </label>
          <input
            id="search-reminders-input"
            type="search"
            value={criteria.query}
            onChange={(e) => onChangeCriteria({ ...criteria, query: e.target.value })}
            placeholder="Search reminders by title or description..."
            className="w-full rounded-2xl liquid-glass-input pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-2 focus:outline-blue-600"
          />
        </div>

        {/* Filter Selectors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div>
            <label
              htmlFor="filter-status-select"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1"
            >
              Status
            </label>
            <select
              id="filter-status-select"
              value={criteria.status}
              onChange={(e) =>
                onChangeCriteria({
                  ...criteria,
                  status: e.target.value as FilterCriteria['status'],
                })
              }
              className="w-full rounded-xl liquid-glass-input px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="OVERDUE">Overdue</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-category-select"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1"
            >
              Category
            </label>
            <select
              id="filter-category-select"
              value={criteria.categoryId}
              onChange={(e) =>
                onChangeCriteria({ ...criteria, categoryId: e.target.value })
              }
              className="w-full rounded-xl liquid-glass-input px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-priority-select"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1"
            >
              Priority
            </label>
            <select
              id="filter-priority-select"
              value={criteria.priority}
              onChange={(e) =>
                onChangeCriteria({
                  ...criteria,
                  priority: e.target.value as Priority | 'ALL',
                })
              }
              className="w-full rounded-xl liquid-glass-input px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-date-input"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1"
            >
              Specific Date
            </label>
            <input
              id="filter-date-input"
              type="date"
              value={criteria.dateFilter === 'ALL' ? '' : criteria.dateFilter}
              onChange={(e) =>
                onChangeCriteria({
                  ...criteria,
                  dateFilter: e.target.value ? e.target.value : 'ALL',
                })
              }
              className="w-full rounded-xl liquid-glass-input px-3 py-2 text-xs font-medium text-slate-900 dark:text-white tabular-nums"
            />
          </div>

          <div>
            <label
              htmlFor="filter-sort-select"
              className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1"
            >
              <SlidersHorizontal className="w-3 h-3" />
              Sort By
            </label>
            <select
              id="filter-sort-select"
              value={criteria.sortBy}
              onChange={(e) =>
                onChangeCriteria({
                  ...criteria,
                  sortBy: e.target.value as FilterCriteria['sortBy'],
                })
              }
              className="w-full rounded-xl liquid-glass-input px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
            >
              <option value="UPCOMING_TIME">Upcoming Due Time</option>
              <option value="CREATED_DATE">Creation Date (Newest)</option>
              <option value="PRIORITY">Highest Priority First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
            Matching Reminders ({filtered.length})
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-[28px] liquid-glass p-12 text-center space-y-2">
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
              No reminders match your active filters
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Try clearing your search query or resetting the category and status filters.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <ReminderCard
                key={r.id}
                reminder={r}
                category={categoryMap.get(r.categoryId)}
                use24Hour={use24Hour}
                onToggleComplete={onToggleComplete}
                onSelectDetail={onSelectDetail}
                onEdit={onEdit}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                onSnooze={onSnooze}
                onTriggerTestAlarm={onTriggerTestAlarm}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
