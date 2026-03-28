function StatCard({ title, value, accent = "brand" }) {
  const accentClasses = {
    brand: "border-brand-200 bg-brand-50 text-brand-800 dark:border-brand-900/40 dark:bg-brand-900/20 dark:text-brand-200",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200",
    violet: "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/40 dark:bg-violet-900/20 dark:text-violet-200",
    amber: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200",
  };

  return (
    <article className={`rounded-xl border p-4 ${accentClasses[accent] || accentClasses.brand}`}>
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="mt-2 text-3xl font-extrabold">{value}</p>
    </article>
  );
}

export default StatCard;
