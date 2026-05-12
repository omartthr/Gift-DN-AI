import { Metadata } from 'next';
import HistoryClient from './HistoryClient';

export const metadata: Metadata = {
  title: 'Geçmiş Sohbetler · Gift DN-AI',
};

export default function HistoryPage() {
  return <HistoryClient />;
}
