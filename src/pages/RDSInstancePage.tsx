import { RDSInstanceList } from '../components/RDSInstanceList';

export function RDSInstancePage() {
    return (
        <div className="space-y-6 px-4 sm:px-6 md:px-8">
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        RDS Instance Management
                    </h2>
                </div>
            </div>

            <RDSInstanceList />
        </div>
    );
}