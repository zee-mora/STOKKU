import React from "react";
import PageContainer from "../../../components/layout/PageContainer";

const DashboardStaff: React.FC = () => {
    return (
        <PageContainer>
            <h1 className="text-2xl font-bold mb-4">Dashboard Staff</h1>
            <p className="mb-6 text-gray-600">Welcome to the staff dashboard. Here you can view your recent activities and manage your tasks.</p>
        </PageContainer>
    );
}

export default DashboardStaff