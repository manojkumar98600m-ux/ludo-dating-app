# Ludo Dating — Razorpay Test Setup

Membership plan: ₹50 (5000 paise) for 6 months.

## Important
- Do not put RAZORPAY_KEY_SECRET in website JavaScript, Android app code, GitHub files, or chat.
- These API routes require a serverless Node.js host such as Vercel. GitHub Pages alone cannot run them.
- This starter creates an order and verifies the checkout signature. It does NOT store a user membership or activate access.
- Before real payments, also check the payment is captured and save the membership expiry in a trusted database. Add webhook handling and abuse protection before public launch.

## Deploy on Vercel
1. Import this GitHub repository into Vercel.
2. In Vercel Project Settings → Environment Variables, add:
   - RAZORPAY_KEY_ID = your Test Mode key ID (starts with rzp_test_)
   - RAZORPAY_KEY_SECRET = your Test Mode secret (never share it)
3. Use the repository root as the project root and deploy.
4. Test the API endpoint using a POST request to /api/create-order. It should return an order ID only when the server variables are configured.

## Test mode
Use Razorpay Test Mode credentials and test payment methods from Razorpay's official test documentation. No real money should be charged in Test Mode.

## Before launch
Do not switch to Live Mode until the backend verifies captured payments, stores membership records securely, handles webhooks, and the actual app checkout is connected to these endpoints.
