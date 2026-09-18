// Hotel, wedding and wallet payments share one PhonePe connector with the taxi
// app. It reads the live keys from Admin -> Payment Gateways -> PhonePe and
// falls back to the WH_PHONEPE_* .env keys when PhonePe is not set up there.
// Same interface as the SDK client these callers used: pay(),
// getOrderStatus() and validateCallback().
export { phonepeCheckoutClient as phonepeClient } from '../../../services/phonepeCheckout.js';
