import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="mx-auto mt-20 max-w-md text-center">
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white">404</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-300">Page not found.</p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-500"
      >
        Go to homepage
      </Link>
    </div>
  );
}

export default NotFoundPage;
