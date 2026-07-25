import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TitleWithHelpProps {
  title: React.ReactNode;
  description: string;
  titleClassName?: string;
  containerClassName?: string;
  iconClassName?: string;
}

export const TitleWithHelp: React.FC<TitleWithHelpProps> = ({
  title,
  description,
  titleClassName = "font-bold text-stone-900 dark:text-stone-100",
  containerClassName = "inline-flex items-center gap-1.5",
  iconClassName = "w-3.5 h-3.5 text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors shrink-0",
}) => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="relative inline-block max-w-full">
      <div className={containerClassName}>
        <span className={titleClassName}>{title}</span>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            setShowHelp(!showHelp);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              e.preventDefault();
              setShowHelp(!showHelp);
            }
          }}
          className="p-1 -m-1 rounded-full hover:bg-stone-200/60 dark:hover:bg-stone-800/80 transition-colors cursor-pointer group focus:outline-none shrink-0 inline-flex items-center justify-center"
          title="Açıklama"
          aria-label="Açıklama"
        >
          <HelpCircle className={iconClassName} />
        </span>
      </div>

      {showHelp && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-1.5 p-2.5 rounded-xl bg-stone-900/95 dark:bg-stone-100/95 text-stone-100 dark:text-stone-900 text-xs font-normal shadow-xl border border-stone-700 dark:border-stone-200 max-w-[calc(100vw-32px)] sm:max-w-xs z-[60] animate-fade-in relative break-words"
        >
          {description}
        </div>
      )}
    </div>
  );
};
