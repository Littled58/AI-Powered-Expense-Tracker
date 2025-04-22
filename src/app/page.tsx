import {SpendingForm} from '@/components/spending-form';
import {SpendingSummary} from '@/components/spending-summary';

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">TrackWise - Your Spending Tracker</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Spending Form (Income, Expenses, Categories, Budget Goals) */}
        <div className="bg-secondary rounded-lg p-4">
          <SpendingForm />
        </div>

        {/* Spending Summary and AI Insights */}
        <div className="bg-secondary rounded-lg p-4">
          <SpendingSummary />
        </div>
      </div>
    </div>
  );
}
