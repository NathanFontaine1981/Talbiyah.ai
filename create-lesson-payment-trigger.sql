-- Create a trigger to automatically set payment fields for credit-based bookings
-- This bypasses the schema cache issue by setting values AFTER insert

CREATE OR REPLACE FUNCTION set_credit_payment_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a newly booked lesson and payment fields are not set,
  -- assume it was paid with credits (since Stripe bookings come through webhook)
  IF NEW.status = 'booked' THEN
    -- Set booked_at if not already set
    IF NEW.booked_at IS NULL THEN
      NEW.booked_at := NOW();
    END IF;

    -- Set payment_method if not already set
    IF NEW.payment_method IS NULL THEN
      NEW.payment_method := 'credits';
    END IF;

    -- Set payment_status if not already set
    IF NEW.payment_status IS NULL THEN
      NEW.payment_status := 'paid';
    END IF;

    -- Set is_trial if not already set
    IF NEW.is_trial IS NULL THEN
      NEW.is_trial := FALSE;
    END IF;

    -- Set price to default if not set (15.00 GBP)
    IF NEW.price IS NULL THEN
      NEW.price := 15.00;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_credit_payment_defaults_trigger ON lessons;

-- Create trigger that runs BEFORE insert
CREATE TRIGGER set_credit_payment_defaults_trigger
  BEFORE INSERT ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION set_credit_payment_defaults();

-- Verify
SELECT 'Trigger created successfully' as status;
