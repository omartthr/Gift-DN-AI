import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing STRIPE_SECRET_KEY in environment variables.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16', // Ensure you are using the correct API version or update to latest if needed
  appInfo: {
    name: 'Gift DN-AI',
    version: '0.1.0',
  },
});
