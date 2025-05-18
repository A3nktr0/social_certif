'use client';
import LoadingSpinner from "@/components/LoadingSpinner";


export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <LoadingSpinner size="lg" className="text-gray-200" />
        </div>
    );
}