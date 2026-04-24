import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import paymentApi from "../api/paymentApi";
import { getApiErrorMessage } from "../api/error";
import LoadingSpinner from "../components/LoadingSpinner";

function PaymentCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("checking"); // checking, success, failed
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        // Extract order_id from URL params or session
        const orderId = searchParams.get("order_id") || sessionStorage.getItem("last_order_id");

        if (!orderId) {
          setStatus("failed");
          setError("Order ID not found. Please try again.");
          return;
        }

        // Store order ID for reference
        sessionStorage.setItem("last_order_id", orderId);

        // Check payment status with retry logic
        const result = await paymentApi.verifyPaymentCompletion(orderId, 15, 1500);

        if (result.success) {
          setStatus("success");
          setOrderData(result.status);
          toast.success("Payment successful! Your order is being processed.");
          
          // Redirect to orders page after 3 seconds
          setTimeout(() => {
            navigate("/orders");
          }, 3000);
        } else {
          setStatus("failed");
          setOrderData(result.status);
          setError(
            result.status === "TIMEOUT"
              ? "Payment verification timeout. Please check your order status."
              : "Payment verification failed. Please contact support if you were charged."
          );
        }
      } catch (error) {
        setStatus("failed");
        const errorMessage = getApiErrorMessage(error, "Error checking payment status");
        setError(errorMessage);
        toast.error(errorMessage);
      }
    };

    // Small delay to ensure Chapa has processed the payment
    const timer = setTimeout(checkPaymentStatus, 1000);
    return () => clearTimeout(timer);
  }, [searchParams, navigate]);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <h2 className="mt-4 text-xl font-semibold">Verifying Payment</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Please wait while we confirm your payment...
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-900">
        {status === "success" ? (
          <div className="text-center">
            <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg
                className="h-8 w-8 text-green-600 dark:text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-green-600 dark:text-green-400">Payment Successful!</h1>
            <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">
              Your payment has been confirmed and your order is being processed.
            </p>

            {orderData && (
              <div className="mt-6 space-y-2 rounded-lg bg-slate-50 p-4 text-left dark:bg-slate-800/50">
                <p className="flex justify-between">
                  <span className="font-medium text-slate-700 dark:text-slate-200">Order ID:</span>
                  <span className="text-slate-600 dark:text-slate-300">#{orderData.order_id}</span>
                </p>
                <p className="flex justify-between">
                  <span className="font-medium text-slate-700 dark:text-slate-200">Transaction Ref:</span>
                  <span className="font-mono text-sm text-slate-600 dark:text-slate-300">
                    {orderData.tx_ref}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="font-medium text-slate-700 dark:text-slate-200">Amount:</span>
                  <span className="text-slate-600 dark:text-slate-300">ETB {orderData.amount}</span>
                </p>
                <p className="flex justify-between">
                  <span className="font-medium text-slate-700 dark:text-slate-200">Status:</span>
                  <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    {orderData.status}
                  </span>
                </p>
              </div>
            )}

            <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
              You will be redirected to your orders page in a few seconds...
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <Link
                to="/orders"
                className="rounded-lg bg-brand-600 px-6 py-2 font-semibold text-white hover:bg-brand-500"
              >
                View Orders
              </Link>
              <Link
                to="/"
                className="rounded-lg border border-slate-300 px-6 py-2 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg
                className="h-8 w-8 text-red-600 dark:text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-red-600 dark:text-red-400">Payment Failed</h1>
            <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">
              {error || "Your payment could not be processed."}
            </p>

            {orderData && (
              <div className="mt-6 space-y-2 rounded-lg bg-slate-50 p-4 text-left dark:bg-slate-800/50">
                <p className="flex justify-between">
                  <span className="font-medium text-slate-700 dark:text-slate-200">Order ID:</span>
                  <span className="text-slate-600 dark:text-slate-300">#{orderData.order_id}</span>
                </p>
                <p className="flex justify-between">
                  <span className="font-medium text-slate-700 dark:text-slate-200">Status:</span>
                  <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-300">
                    {orderData.status}
                  </span>
                </p>
              </div>
            )}

            <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
              If you were charged, please contact our support team.
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <Link
                to="/orders"
                className="rounded-lg bg-brand-600 px-6 py-2 font-semibold text-white hover:bg-brand-500"
              >
                View Orders
              </Link>
              <Link
                to="/checkout"
                className="rounded-lg border border-slate-300 px-6 py-2 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Try Again
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default PaymentCallbackPage;
