import { createServiceClient } from '@/lib/supabase/service';
import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Confirm Appointment' };

interface Props {
  params: { token: string };
  searchParams: { action?: string };
}

export default async function ConfirmPage({ params, searchParams }: Props) {
  const supabase = createServiceClient();
  const action = searchParams.action ?? 'confirm';

  const { data: appointment, error } = await supabase
    .from('appointments')
    .select('*, client:clients(*), pet:pets(*), appointment_type:appointment_types(*), practice:practices(*)')
    .eq('confirmation_token', params.token)
    .single();

  if (error || !appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <div className="card max-w-sm w-full text-center">
          <div className="text-4xl mb-3">🔍</div>
          <h1 className="text-xl font-semibold text-gray-900">Link not found</h1>
          <p className="mt-2 text-sm text-gray-500">This confirmation link may have expired or already been used.</p>
        </div>
      </div>
    );
  }

  const newStatus = action === 'cancel' ? 'cancelled' : 'confirmed';

  if (appointment.status === 'scheduled' || appointment.status === 'confirmed') {
    await supabase
      .from('appointments')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', appointment.id);
  }

  const isCancel = action === 'cancel';
  const petName = (appointment.pet as any)?.name ?? 'your pet';
  const practiceName = (appointment.practice as any)?.name ?? 'the clinic';
  const apptDate = new Date(appointment.starts_at).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  const apptTime = new Date(appointment.starts_at).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100">
      <div className="card max-w-sm w-full text-center">
        <div className="text-5xl mb-4">{isCancel ? '❌' : '✅'}</div>
        <h1 className="text-xl font-semibold text-gray-900">
          {isCancel ? 'Appointment Cancelled' : 'Appointment Confirmed!'}
        </h1>
        <p className="mt-3 text-sm text-gray-600">
          {isCancel
            ? `We've cancelled ${petName}'s appointment at ${practiceName}. Please call to reschedule.`
            : `${petName}'s appointment at ${practiceName} is confirmed for ${apptDate} at ${apptTime}.`}
        </p>
        {!isCancel && (
          <p className="mt-4 text-xs text-gray-400">
            Need to cancel? Call the clinic directly.
          </p>
        )}
        <p className="mt-6 text-xs text-gray-300">Powered by VetSteady</p>
      </div>
    </div>
  );
}
