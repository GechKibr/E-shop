/**
 * Payment API client
 * Handles all payment-related API calls
 */
import axiosClient from "./axiosClient";

const paymentApi = {
  /**
   * Initiate payment for an order
   * @param {number} orderId - Order ID
   * @param {string} returnUrl - URL to return after payment
   * @returns {Promise} - Response with checkout_url
   */
  initiatePayment: async (orderId, returnUrl = "") => {
    const response = await axiosClient.post(`/payments/initiate/${orderId}/`, {
      return_url: returnUrl,
    });
    return response.data;
  },

  /**
   * Get payment status for an order
   * @param {number} orderId - Order ID
   * @returns {Promise} - Payment status response
   */
  getPaymentStatus: async (orderId) => {
    const response = await axiosClient.get(`/payments/order/${orderId}/status/`);
    return response.data;
  },

  /**
   * Verify payment completion
   * Polls the server to check if payment was completed
   * @param {number} orderId - Order ID
   * @param {number} maxAttempts - Maximum retry attempts
   * @param {number} delayMs - Delay between attempts in milliseconds
   * @returns {Promise} - Payment verification result
   */
  verifyPaymentCompletion: async (orderId, maxAttempts = 10, delayMs = 2000) => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const status = await paymentApi.getPaymentStatus(orderId);
        
        if (status.status === "COMPLETED") {
          return { success: true, status };
        }
        
        if (status.status === "FAILED") {
          return { success: false, status };
        }
        
        // Still pending, wait and retry
        if (i < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        // Retry on error
        if (i < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          throw error;
        }
      }
    }
    
    return { success: false, status: "TIMEOUT" };
  },
};

export default paymentApi;
