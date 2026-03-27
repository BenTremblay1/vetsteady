'use client';

export default function BookingErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-50 border-4 border-red-200 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Booking unavailable</h1>
          <p className="text-gray-500 mt-2 text-sm">{message}</p>
        </div>
        <p className="text-sm text-gray-500">Please contact the practice directly to schedule your appointment.</p>
        <p className="text-xs text-gray-400 pt-4">Powered by <span className="font-semibold text-[#0D7377]">VetSteady</span></p>
      </div>
    </div>
  );
}
