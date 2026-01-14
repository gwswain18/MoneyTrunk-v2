import { Menu, Search, Plus, Moon, Sun } from 'lucide-react';
import { Button } from '../ui/button';
import { useAppStore } from '../../stores/useAppStore';

interface HeaderProps {
  onMenuClick: () => void;
  onQuickAdd: () => void;
  onSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, onQuickAdd, onSearch }) => {
  const { settings, updateSettings } = useAppStore();

  const toggleDarkMode = () => {
    const newMode = !settings.darkMode;
    updateSettings({ darkMode: newMode });
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 lg:px-6">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden dark:hover:bg-slate-800"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Search button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onSearch}
          className="text-slate-500"
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Dark mode toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          className="text-slate-500"
        >
          {settings.darkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {/* Quick add button */}
        <Button onClick={onQuickAdd} size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Quick Add</span>
        </Button>
      </div>
    </header>
  );
};
