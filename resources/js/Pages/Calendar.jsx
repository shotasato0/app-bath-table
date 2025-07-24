import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Calendar from '@/Components/Calendar/Calendar';
import { Head } from '@inertiajs/react';

export default function CalendarPage({ auth }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={null}
        >
            <Head title="カレンダー" />
            
            <div className="min-h-screen bg-gray-900 text-gray-100">
                <Calendar />
            </div>
        </AuthenticatedLayout>
    );
}