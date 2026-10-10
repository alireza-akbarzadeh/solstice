import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL);
const [row] = await sql`SELECT value FROM solstice_setting WHERE key = 'payments'`;
await sql.end();

console.log("Payment settings:", JSON.stringify(row?.value, null, 2));

// Test calling Zarinpal Sandbox API
console.log("\nCalling Zarinpal Sandbox payment request...");
const body = {
  merchant_id: "00000000-0000-0000-0000-000000000000",
  amount: 1500000,
  currency: "IRT",
  callback_url: "http://localhost:3000/api/payments/zarinpal/return?checkout=test123",
  description: "Monthly Sanctuary Pass test payment",
  metadata: { email: "student@example.com" },
};

const resp = await fetch("https://sandbox.zarinpal.com/pg/v4/payment/request.json", {
  method: "POST",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  body: JSON.stringify(body),
});

const data = await resp.json();
console.log("Zarinpal Sandbox Response Status:", resp.status);
console.log("Zarinpal Sandbox Response Body:", JSON.stringify(data, null, 2));
if (data.data?.authority) {
  console.log("\n>>> Redirect URL: https://sandbox.zarinpal.com/pg/StartPay/" + data.data.authority);
}
