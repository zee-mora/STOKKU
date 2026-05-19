import React from "react";
import PageContainer from "../../../components/layout/PageContainer";

const RequestBarang: React.FC = () => {
    return (
        <PageContainer>
            <h1 className="text-2xl font-bold text-gray-800">Request Barang</h1>
            <p className="mt-4 text-gray-600">Welcome to the request barang page. Here you can submit requests for new inventory items.</p>
        </PageContainer>
    );
}

export default RequestBarang;