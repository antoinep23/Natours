import axios from 'axios';
import { showAlert } from './alert';

export const bookTour = async (tourId) => {
  const stripe = Stripe(
    'pk_test_51PQFIeKzUxvPcK6NKu6fsbeZDtIDxMJRjCQ34WNPFL5lzxBmEEKAEkUOzrVbceWSsq4abxLJ6X04fOJcKgsaLqMj00W3DUh6R2'
  );

  try {
    // 1) Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    // 2) Create checkout form + chanre credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    showAlert('error', err);
  }
};
