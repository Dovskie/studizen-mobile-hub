interface DividerProps {
  text?: string;
}

export const Divider = ({ text = "Atau" }: DividerProps) => {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-gray-300 dark:border-gray-600" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
          {text}
        </span>
      </div>
    </div>
  );
};