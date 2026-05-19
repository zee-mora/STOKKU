import React from 'react';
import PageContainer from '../../../components/layout/PageContainer';

const DashboardAdmin: React.FC = () => {
    return (
        <PageContainer>
            <h1 className="text-2xl font-bold mb-4">Dashboard Admin</h1>
            <p className="mb-6 text-gray-600">Welcome to the admin dashboard. Here you can view overall system statistics and manage your administrative tasks.</p>
        </PageContainer>
    );
}

export default DashboardAdmin;