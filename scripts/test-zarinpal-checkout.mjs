import { zarinpalProvider } from "../src/infrastructure/payment/providers/zarinpal.ts";

try {
  console.log("Calling zarinpalProvider.createCheckout in sandbox mode...");
  const res = await zarinpalProvider.createCheckout({
    checkoutId: "test_checkout_" + Date.now(),
    plan: {
      id: "monthly",
      price: 1500000,
      currency: "IRT",
      intervalMonths: 1,
    },
    email: "test@example.com",
    returnUrl: "http://localhost:3000/api/payments/zarinpal/return?checkout=test123",
  });
  console.log("SUCCESS! Zarinpal returned checkout URL:", res);
} catch (error) {
  console.error("Zarinpal test error:", error);
}
