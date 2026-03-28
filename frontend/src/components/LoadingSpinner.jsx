function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-500 dark:border-slate-700 dark:border-t-brand-500" />
      <p className="text-sm text-slate-600 dark:text-slate-300">{label}</p>
    </div>
  );
}

export default LoadingSpinner;
