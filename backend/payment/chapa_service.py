import requests
import logging
import uuid
from decimal import Decimal
from typing import Dict, Optional, Tuple
from django.conf import settings

logger = logging.getLogger(__name__)

class ChapaException(Exception):
    pass


class ChapaService:
    
    BASE_URL = "https://api.chapa.co/v1"
    
    def __init__(self):
        self.secret_key = getattr(settings, "CHAPA_SECRET_KEY", None)
        self.callback_url = getattr(settings, "CHAPA_CALLBACK_URL", None)
        
        if not self.secret_key:
            raise ChapaException("CHAPA_SECRET_KEY is not configured in settings")
        if not self.callback_url:
            raise ChapaException("CHAPA_CALLBACK_URL is not configured in settings")
    
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers with authentication"""
        return {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json",
        }
    
    def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        timeout: int = 10
    ) -> Tuple[bool, Dict]:
        """
        Make HTTP request to Chapa API
        
        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint path (without base URL)
            data: Request payload
            timeout: Request timeout in seconds
            
        Returns:
            Tuple of (success: bool, response: dict)
        """
        url = f"{self.BASE_URL}/{endpoint}"
        
        try:
            response = requests.request(
                method=method,
                url=url,
                json=data,
                headers=self._get_headers(),
                timeout=timeout
            )
            
            response.raise_for_status()
            return True, response.json()
            
        except requests.exceptions.Timeout:
            logger.error(f"Timeout during Chapa API request to {endpoint}")
            return False, {"error": "Request timeout"}
        except requests.exceptions.ConnectionError:
            logger.error(f"Connection error during Chapa API request to {endpoint}")
            return False, {"error": "Connection error"}
        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP Error from Chapa: {e.response.status_code} - {e.response.text}")
            try:
                return False, e.response.json()
            except:
                return False, {"error": str(e)}
        except Exception as e:
            logger.error(f"Unexpected error during Chapa API request: {str(e)}")
            return False, {"error": str(e)}
    
    def initialize_payment(
        self,
        amount: Decimal,
        email: str,
        order_id: int,
        customer_name: str = "",
        return_url: str = ""
    ) -> Tuple[bool, Optional[str], Dict]:
        """
        Initialize payment with Chapa
        
        Args:
            amount: Payment amount in ETB
            email: Customer email
            order_id: Order ID from database
            customer_name: Optional customer name
            return_url: Optional return URL after payment
            
        Returns:
            Tuple of (success: bool, checkout_url: Optional[str], response: dict)
        """
        # Generate unique transaction reference
        tx_ref = f"chapa-{order_id}-{uuid.uuid4().hex[:8]}"
        
        payload = {
            "amount": str(amount),
            "currency": "ETB",
            "email": email,
            "tx_ref": tx_ref,
            "callback_url": self.callback_url,
            "return_url": return_url or self.callback_url,
            "customization": {
                "title": f"E-Shop Order #{order_id}",
                "description": f"Payment for order #{order_id}",
            }
        }
        
        if customer_name:
            payload["first_name"] = customer_name.split()[0] if customer_name else "Customer"
            if len(customer_name.split()) > 1:
                payload["last_name"] = " ".join(customer_name.split()[1:])
        
        logger.info(f"Initializing Chapa payment for order {order_id}: tx_ref={tx_ref}")
        
        success, response = self._make_request("POST", "transaction/initialize", payload)
        
        checkout_url = None
        if success and response.get("status") == "success":
            checkout_url = response.get("data", {}).get("checkout_url")
            logger.info(f"Payment initialized successfully: {tx_ref}")
        else:
            logger.warning(f"Chapa initialization failed for order {order_id}: {response}")
        
        # Return tx_ref in response for reference
        response["tx_ref"] = tx_ref
        return success, checkout_url, response
    
    def verify_payment(self, tx_ref: str) -> Tuple[bool, Dict]:
        """
        Verify payment status with Chapa
        
        Args:
            tx_ref: Transaction reference from Chapa
            
        Returns:
            Tuple of (success: bool, response: dict)
        """
        logger.info(f"Verifying payment with Chapa: {tx_ref}")
        
        success, response = self._make_request(
            "GET",
            f"transaction/verify/{tx_ref}"
        )
        
        if success:
            logger.info(f"Payment verified successfully: {tx_ref} - Status: {response.get('data', {}).get('status')}")
        else:
            logger.warning(f"Payment verification failed for {tx_ref}: {response}")
        
        return success, response
    
    def check_payment_status(self, tx_ref: str) -> Optional[str]:
        """
        Check if payment was successful
        
        Args:
            tx_ref: Transaction reference
            
        Returns:
            Payment status if successful, None otherwise
        """
        success, response = self.verify_payment(tx_ref)
        
        if success and response.get("data", {}).get("status") == "success":
            return "success"
        
        return None


# Singleton instance
def get_chapa_service() -> ChapaService:
    """Get Chapa service instance"""
    try:
        return ChapaService()
    except ChapaException as e:
        logger.error(f"Failed to initialize Chapa service: {str(e)}")
        raise
