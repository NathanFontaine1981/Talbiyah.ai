# 📡 Deployed API Endpoints Reference

All edge functions are deployed and active at:
`https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/`

## 🔐 Authentication

All endpoints require authentication via Supabase auth token in the `Authorization` header:
```
Authorization: Bearer <supabase_access_token>
```

## 📋 Available Endpoints

### 1. Get Available Slots
**Endpoint:** `GET /get-available-slots`

**Purpose:** Fetch available time slots for a teacher

**Parameters:**
- `from` - Start date (YYYY-MM-DD)
- `to` - End date (YYYY-MM-DD)
- `teacher_id` - Teacher's user ID (UUID)
- `subject` - Subject ID or slug

**Example:**
```bash
curl "https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/get-available-slots?from=2025-11-08&to=2025-11-15&teacher_id=123e4567-e89b-12d3-a456-426614174000&subject=quran" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "slots": [
    {
      "date": "2025-11-08",
      "time": "09:00",
      "duration": 60,
      "available": true
    }
  ]
}
```

---

### 2. Initiate Booking Checkout
**Endpoint:** `POST /initiate-booking-checkout`

**Purpose:** Create Stripe checkout session for cart items

**Request Body:**
```json
{
  "cartItems": [
    {
      "teacher_id": "prof_123",
      "subject_id": "subj_456",
      "scheduled_time": "2025-11-08T09:00:00Z",
      "duration_minutes": 60,
      "price": 15.00
    }
  ],
  "use_free_session": false
}
```

**Response:**
```json
{
  "success": true,
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_...",
  "sessionId": "cs_test_...",
  "pendingBookingId": "uuid"
}
```

**Frontend Usage:**
```typescript
const { checkoutUrl } = await fetch(
  `${supabaseUrl}/functions/v1/initiate-booking-checkout`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ cartItems, use_free_session })
  }
).then(r => r.json());

window.location.href = checkoutUrl;
```

---

### 3. Create HMS Room
**Endpoint:** `POST /create-hms-room`

**Purpose:** Create 100ms video room with teacher/student codes

**Request Body:**
```json
{
  "roomName": "Quran-2025-11-08-0900",
  "description": "Quran session on 2025-11-08 at 09:00",
  "bookingId": "uuid-optional"
}
```

**Response:**
```json
{
  "success": true,
  "room": {
    "id": "674abc123def456",
    "name": "Quran-2025-11-08-0900",
    "enabled": true,
    "roomCode": "abc-def-ghi",
    "codes": {
      "teacher": "xyz-abc-def",
      "student": "mno-pqr-stu"
    }
  }
}
```

**Note:** This is usually called internally by `create-single-booking-internal`, not directly by frontend.

---

### 4. Create Single Booking Internal
**Endpoint:** `POST /create-single-booking-internal`

**Purpose:** Create individual booking with 100ms room (called by webhook)

**Request Body:**
```json
{
  "user_id": "uuid",
  "teacher_id": "prof_123",
  "date": "2025-11-08",
  "time": "09:00",
  "subject": "quran",
  "duration": 60,
  "price": 15.00,
  "payment_intent_id": "pi_...",
  "use_free_session": false
}
```

**Response:**
```json
{
  "success": true,
  "booking": {
    "id": "uuid",
    "student_id": "uuid",
    "teacher_id": "uuid",
    "subject_id": "uuid",
    "scheduled_date": "2025-11-08",
    "scheduled_time": "09:00",
    "status": "confirmed",
    "payment_status": "paid",
    "room_id": "674abc123def456",
    "teacher_room_code": "xyz-abc-def",
    "student_room_code": "mno-pqr-stu"
  },
  "room": {
    "id": "674abc123def456",
    "codes": { ... }
  }
}
```

**Note:** This endpoint is called internally by the webhook, requires service role key.

---

### 5. Stripe Webhooks
**Endpoint:** `POST /stripe-webhooks`

**Purpose:** Process Stripe payment webhooks

**This is called by Stripe, not your frontend!**

**Webhook URL to configure in Stripe:**
```
https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/stripe-webhooks
```

**Events Handled:**
- `checkout.session.completed` - Payment succeeded, creates bookings

**Stripe Dashboard:**
https://dashboard.stripe.com/webhooks

---

## 🔄 Complete Flow Example

### Frontend: Add to Cart
```typescript
// User adds lesson to cart
await addToCart({
  teacher_id: 'prof_123',
  subject_id: 'subj_456',
  scheduled_time: '2025-11-08T09:00:00Z',
  duration_minutes: 60,
  price: 15.00
});
```

### Frontend: Checkout
```typescript
// User clicks "Proceed to Checkout"
const response = await fetch(
  `${supabaseUrl}/functions/v1/initiate-booking-checkout`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      cartItems: [/* cart items */],
      use_free_session: false
    })
  }
);

const { checkoutUrl } = await response.json();
window.location.href = checkoutUrl; // Redirect to Stripe
```

### Stripe: Payment
User enters payment details on Stripe checkout page.

### Webhook: Process Payment
Stripe sends webhook to `/stripe-webhooks` which:
1. Verifies webhook signature
2. Fetches pending booking
3. Calls `/create-single-booking-internal` for each lesson
4. Updates pending booking status
5. Records payment

### Backend: Create Booking
`create-single-booking-internal`:
1. Validates booking data
2. Calls `/create-hms-room` to create video room
3. Creates booking record with room codes
4. Returns booking details

### Result
- ✅ Booking confirmed in database
- ✅ Payment recorded
- ✅ 100ms room created
- ✅ Teacher and student have room codes
- ✅ User can join lesson

---

## 🔑 Required Environment Variables

### Frontend (.env)
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Supabase Secrets
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
HMS_APP_ACCESS_KEY=...
HMS_APP_SECRET=...
HMS_TEMPLATE_ID=684b54d6033903926e6127a1
```

---

## 📊 Monitoring & Logs

### View Function Logs
```bash
# Set access token
export SUPABASE_ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff"

# View all logs
npx supabase functions logs --project-ref boyrjgivpepjiboekwuu

# View specific function
npx supabase functions logs stripe-webhooks --project-ref boyrjgivpepjiboekwuu
npx supabase functions logs create-hms-room --project-ref boyrjgivpepjiboekwuu

# Tail logs (follow)
npx supabase functions logs stripe-webhooks --project-ref boyrjgivpepjiboekwuu --tail
```

### Supabase Dashboard
https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/functions/logs

### Stripe Dashboard
- **Payments:** https://dashboard.stripe.com/payments
- **Webhooks:** https://dashboard.stripe.com/webhooks
- **Events:** https://dashboard.stripe.com/events

### 100ms Dashboard
https://dashboard.100ms.live/

---

## 🧪 Testing

### Test Card (Test Mode Only)
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

### Test Endpoints
```bash
# Test availability
curl "https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/get-available-slots?from=2025-11-08&to=2025-11-15&teacher_id=XXX&subject=quran" \
  -H "Authorization: Bearer <token>"

# Test checkout (will create real charge in live mode!)
curl -X POST "https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/initiate-booking-checkout" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"cartItems": [...]}'
```

---

## ⚠️ Important Notes

1. **Live Mode Active:** You are using Stripe LIVE keys. All payments are real!
2. **Webhook Required:** Stripe webhook must be configured for bookings to be created
3. **Service Role:** Some endpoints require service role key (internal use only)
4. **Rate Limits:** Be mindful of API rate limits
5. **Error Handling:** Always check `success` field in responses

---

**Last Updated:** November 8, 2025
**Status:** All endpoints active and operational ✅
