import React, { useState } from 'react';
import { FolderPlus, Plus, Trash2 } from 'lucide-react';
import { Reminder, ReminderCategory } from '../types/reminder';

interface CategoriesViewProps {
  categories: ReminderCategory[];
  reminders: Reminder[];
  onCreateCategory: (name: string, emoji: string, colorHex: string) => void;
  onDeleteCustomCategory: (id: string) => void;
  onSelectCategoryFilter: (categoryId: string) => void;
  onOpenAddWithCategory: (categoryId: string) => void;
}

const PRESET_EMOJIS = [
  '✨',
  '🎸',
  '🐾',
  '🌱',
  '✈️',
  '🧹',
  '🎧',
  '🎨',
  '🚗',
  '🧘',
  '🏠',
  '⚡',
];

const PRESET_COLORS = [
  '#2563EB',
  '#8B5CF6',
  '#06B6D4',
  '#22C55E',
  '#F59E0B',
  '#EC4899',
  '#EF4444',
  '#14B8A6',
];

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  reminders,
  onCreateCategory,
  onDeleteCustomCategory,
  onSelectCategoryFilter,
  onOpenAddWithCategory,
}) => {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [colorHex, setColorHex] = useState('#2563EB');
  const [error, setError] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a category name.');
      return;
    }
    onCreateCategory(name.trim(), emoji || '✨', colorHex);
    setName('');
    setError(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left 4 Columns: Create Unlimited Custom Categories Form */}
      <div className="lg:col-span-4 rounded-[28px] liquid-glass p-6 space-y-5">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Create Custom Category
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Design custom categories with your own name, icon, and accent color.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}

          <div>
            <label
              htmlFor="cat-name-input"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Category Name *
            </label>
            <input
              id="cat-name-input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g., Guitar Practice, Pet Care, Plants"
              className="w-full rounded-xl liquid-glass-input px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-2 focus:outline-blue-600"
            />
          </div>

          <div>
            <label
              htmlFor="cat-emoji-input"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Choose or Type Icon
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                id="cat-emoji-input"
                type="text"
                maxLength={4}
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className="w-16 rounded-xl liquid-glass-input px-3 py-2 text-center text-lg"
              />
              <span className="text-xs text-slate-500">Or pick a preset below:</span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {PRESET_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmoji(em)}
                  aria-label={`Select icon ${em}`}
                  className={`h-10 rounded-xl flex items-center justify-center text-base transition-colors ${
                    emoji === em
                      ? 'liquid-glass-interactive ring-2 ring-blue-500/80'
                      : 'liquid-btn-secondary'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="cat-color-input"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Category Accent Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setColorHex(hex)}
                  aria-label={`Select color ${hex}`}
                  className={`w-8 h-8 rounded-xl border-2 transition-transform shadow-xs ${
                    colorHex === hex
                      ? 'border-slate-900 dark:border-white scale-110'
                      : 'border-white/70 dark:border-white/20'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
              <input
                id="cat-color-input"
                type="color"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="w-9 h-8 rounded-lg liquid-glass-input cursor-pointer"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl liquid-btn-primary text-white text-sm font-semibold"
          >
            Save Custom Category
          </button>
        </form>
      </div>

      {/* Right 8 Columns: Categories Grid */}
      <div className="lg:col-span-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              All Categories ({categories.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Includes 13 default life categories plus your custom categories
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const totalInCat = reminders.filter((r) => r.categoryId === cat.id).length;
            const pendingInCat = reminders.filter(
              (r) => r.categoryId === cat.id && !r.isCompleted
            ).length;

            return (
              <div
                key={cat.id}
                className="rounded-[24px] liquid-glass-interactive p-4 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 border border-white/60 dark:border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.75)]"
                      style={{ backgroundColor: `${cat.colorHex}20`, color: cat.colorHex }}
                    >
                      {cat.emoji}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
                        {pendingInCat} pending · {totalInCat} total
                      </p>
                    </div>
                  </div>

                  {!cat.isDefault && (
                    <button
                      type="button"
                      onClick={() => onDeleteCustomCategory(cat.id)}
                      aria-label={`Delete custom category ${cat.name}`}
                      className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/50 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => onSelectCategoryFilter(cat.id)}
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    View Reminders
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenAddWithCategory(cat.id)}
                    aria-label={`Add reminder in ${cat.name}`}
                    className="px-2.5 py-1.5 rounded-lg liquid-btn-secondary hover:text-blue-600 text-slate-800 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
