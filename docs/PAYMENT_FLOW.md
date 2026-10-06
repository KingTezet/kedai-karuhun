# Payment Flow

## MVP
Payment methods:
- QRIS manual verification
- Bank transfer manual verification
- COD

### QRIS
1. Customer creates order.
2. Order payment_status = pending.
3. Customer sees official QRIS image and total.
4. Customer pays externally.
5. Customer uploads screenshot/photo proof.
6. payment_status = proof_uploaded.
7. Admin checks proof and clicks Verifikasi pembayaran.
8. payment_status = verified.
9. Order status moves to confirmed if still new.

### Transfer
Same as QRIS, using official bank details.

### COD
Order payment_status = cod. No proof needed.

## Future gateway
Implement a payment adapter interface so a provider can be added later. A future provider webhook should be idempotent and should verify authenticity before changing payment_status.
