import { Button } from "@/components/ui/button";

export default async function ExpenseManagerPage({ params }: { params: Promise<{ tripId: string }> }) {
    const tripId = (await params).tripId;

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Expense Ledger</h1>
                    <Button>Add Expense</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between p-3 bg-zinc-800 rounded-md">
                                <div>
                                    <p className="font-medium">Dinner at Paris</p>
                                    <p className="text-sm text-zinc-400">Paid by Alice</p>
                                </div>
                                <div className="font-bold">€120</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Balances</h2>
                        <div className="flex justify-between p-3 bg-zinc-800 rounded-md">
                            <p>You owe Bob</p>
                            <p className="text-red-400 font-bold">€40</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
