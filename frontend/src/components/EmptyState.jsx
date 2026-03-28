function EmptyState({ title, subtitle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      {subtitle ? <p className="mt-2 text-slate-600 dark:text-slate-300">{subtitle}</p> : null}
    </div>
  );
}

export default EmptyState;
