import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function TripWorkspacePage({ params }: { params: Promise<{ tripId: string }> }) {
    const tripId = (await params).tripId;

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-4xl font-bold">Trip Workspace: {tripId}</h1>
                    <Button variant="outline">Settings</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link href={`/trip/${tripId}/itinerary`}>
                        <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition cursor-pointer text-white">
                            <CardHeader>
                                <CardTitle>Itinerary Planner</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-zinc-400">Plan days, add activities, and view routes.</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href={`/trip/${tripId}/expenses`}>
                        <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition cursor-pointer text-white">
                            <CardHeader>
                                <CardTitle>Expense Manager</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-zinc-400">Track spending and settle debts.</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Card className="bg-zinc-900 border-zinc-800 text-white">
                        <CardHeader>
                            <CardTitle>AI Assistant</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-zinc-400">Get recommendations and insights.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
