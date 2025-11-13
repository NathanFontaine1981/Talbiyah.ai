# 💯 Owner Discount Code - 100OWNER

## ✅ Code Details

Your 100% discount code is **active and ready to use!**

- **Code:** `100OWNER`
- **Discount:** 100% off (completely free!)
- **Status:** ✅ Active
- **Duration:** Forever (no expiration)
- **Restrictions:** None
- **Max Redemptions:** Unlimited
- **Times Used:** 39 times so far
- **Valid:** Yes ✅

## 🎯 How to Use

### Step 1: Add Lessons to Cart
1. Browse teachers or courses
2. Select your teacher and subject
3. Choose time slots
4. Add lessons to cart

### Step 2: Proceed to Checkout
1. Click "Proceed to Checkout"
2. You'll be redirected to Stripe checkout page

### Step 3: Apply Discount Code
1. On the Stripe checkout page, look for the "Promotion code" or "Discount code" field
2. Enter: `100OWNER`
3. Click "Apply"
4. Your total will change to **£0.00** (100% off!)

### Step 4: Complete Payment
1. Enter any valid payment card details (required even for £0.00)
2. Complete the checkout
3. Your booking will be created immediately

## ✨ What Happens When You Use It

When you apply the `100OWNER` code:

1. **Total becomes £0.00**
   - Original price: £15.00 (or whatever the total was)
   - Discount: -£15.00 (100% off)
   - Final total: **£0.00**

2. **No charge to your card**
   - Stripe still requires card details for validation
   - But no actual charge will be made
   - You can use any valid card

3. **Booking is created normally**
   - Booking confirmed in database
   - 100ms room created
   - Room codes generated
   - You can join the lesson
   - Teacher can join the lesson

4. **Payment recorded as successful**
   - Payment status: "succeeded"
   - Amount: £0.00
   - Discount applied: 100%

## 📊 Stripe Dashboard

You can view all uses of this code in your Stripe dashboard:

**Promotion Code Dashboard:**
https://dashboard.stripe.com/promotion_codes

**Code Details:**
- **ID:** `promo_1RmVs0HppuewJezLo7YcJkvv`
- **Coupon ID:** `100OWNER`
- **Coupon Name:** "OWNERCOUPON"

## 🔧 Technical Details

### Checkout Configuration
The `initiate-booking-checkout` edge function already has promotion codes enabled:

```javascript
allow_promotion_codes: 'true'  // Line 533 in index.ts
```

This means:
- ✅ Promotion code field automatically appears on checkout
- ✅ Users can enter codes during checkout
- ✅ Stripe validates the code in real-time
- ✅ Discount applies before payment

### How It Works Behind the Scenes

1. **Frontend:** User clicks "Proceed to Checkout"
2. **Edge Function:** `initiate-booking-checkout` creates Stripe session with `allow_promotion_codes: true`
3. **Stripe:** Checkout page displays promotion code field
4. **User:** Enters `100OWNER` and applies
5. **Stripe:** Validates code, applies 100% discount
6. **Payment:** Processes £0.00 transaction
7. **Webhook:** Receives `checkout.session.completed` event
8. **Backend:** Creates booking with HMS room
9. **Result:** Booking confirmed, lesson ready!

## 🎁 Alternative: Free Sessions System

You also have a built-in free sessions system:

### Automatic Free Sessions
- New users get free trial sessions
- Tracked in `profiles.free_sessions_remaining`
- Used via `use_free_session` flag in booking

### When to Use What

**Use `100OWNER` code when:**
- You (owner) want to book free sessions
- Testing the payment flow
- Creating demo bookings
- Giving gifts to specific users

**Use free session system when:**
- Giving trial sessions to all new users
- Running promotions for everyone
- Tracking free session usage per user

## 🧪 Testing the Code

### Test End-to-End Flow

1. **Start Fresh:**
   ```bash
   # Your dev server should be running
   # Navigate to http://localhost:5173/
   ```

2. **Book a Session:**
   - Go to Teachers or Courses
   - Select any teacher
   - Add a lesson to cart
   - Click "Proceed to Checkout"

3. **Apply Code:**
   - On Stripe checkout page
   - Find "Add promotion code" link
   - Enter `100OWNER`
   - Click Apply
   - Total should show £0.00

4. **Complete Payment:**
   - Enter test card: 4242 4242 4242 4242 (or real card)
   - Expiry: 12/25, CVC: 123, ZIP: 12345
   - Complete checkout
   - You'll be redirected to success page

5. **Verify Booking:**
   - Check your upcoming sessions
   - Booking should be confirmed
   - Room codes should be generated
   - Join lesson button should work

## 📈 Usage Statistics

As of deployment:
- **Total Uses:** 39 times
- **Current Status:** Active
- **Lifetime:** Since creation
- **Success Rate:** 100%

## 🔐 Security

**Important Notes:**
1. This code is **public** - anyone who knows it can use it
2. Consider creating **single-use codes** for specific users if needed
3. The code has **unlimited redemptions** - it can be used forever
4. You can **deactivate** it anytime in Stripe dashboard

### Create Single-Use Codes

If you need a one-time code for a specific user:

```bash
# Use the deployed edge function
curl -X POST "https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/create-discount-code" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "GIFT2025",
    "percentOff": 100,
    "name": "One-time Gift"
  }'
```

Then set max_redemptions=1 in Stripe dashboard.

## 💡 Tips

1. **Share the code privately** - send via email, DM, or in person
2. **Monitor usage** - check Stripe dashboard regularly
3. **Create event-specific codes** - e.g., "RAMADAN2025" for special occasions
4. **Track conversions** - see how many bookings use the code
5. **Combine with marketing** - use codes for referral programs

## 🎊 You're All Set!

Your `100OWNER` discount code is:
- ✅ Created and active
- ✅ Configured for 100% discount
- ✅ Enabled in checkout flow
- ✅ Ready to use immediately

**Go ahead and test it out!** Book a session and use the code to verify everything works as expected.

---

**Last Updated:** November 8, 2025
**Code Status:** Active ✅
**Discount:** 100% off
**Usage:** Unlimited
