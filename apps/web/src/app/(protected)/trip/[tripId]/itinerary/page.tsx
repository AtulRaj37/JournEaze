import { Button } from "@/components/ui/button";

export default async function ItineraryPlannerPage({ params }: { params: Promise<{ tripId: string }> }) {
    const tripId = (await params).tripId;

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Itinerary Planner</h1>
                    <Button>Add Day</Button>
                </div>

                <div className="flex gap-4">
                    <div className="w-1/3 bg-zinc-900 border border-zinc-800 rounded-lg p-4 min-h-[600px]">
                        <h2 className="text-xl font-semibold mb-4">Days</h2>
                        {/* Draggable days would go here */}
                        <div className="p-3 bg-zinc-800 rounded-md mb-2">Day 1</div>
                        <div className="p-3 bg-zinc-800 rounded-md mb-2">Day 2</div>
                    </div>

                    <div className="w-2/3 bg-zinc-900 border border-zinc-800 rounded-lg p-4 min-h-[600px] flex items-center justify-center">
                        {/* Map Integration Placeholder */}
                        <p className="text-zinc-500">Mapbox View</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
