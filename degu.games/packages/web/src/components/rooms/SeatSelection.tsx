"use client";

interface SeatSelectionProps {
    maxPlayers: number;
    occupiedSeats: { seatNumber: number | null; userName?: string | null; userId: string }[];
    selectedSeat: number | null;
    onSelectSeat: (seatNumber: number) => void;
}

export function SeatSelection({
    maxPlayers,
    occupiedSeats,
    selectedSeat,
    onSelectSeat,
}: SeatSelectionProps) {
    const seats = Array.from({ length: maxPlayers }, (_, i) => i);

    const isSeatOccupied = (seatNum: number) => {
        return occupiedSeats.some(p => p.seatNumber === seatNum);
    };

    const getSeatPlayer = (seatNum: number) => {
        return occupiedSeats.find(p => p.seatNumber === seatNum);
    };

    return (
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            {seats.map((seatNum) => {
                const occupied = isSeatOccupied(seatNum);
                const player = getSeatPlayer(seatNum);
                const selected = selectedSeat === seatNum;

                return (
                    <button
                        key={seatNum}
                        onClick={() => !occupied && onSelectSeat(seatNum)}
                        disabled={occupied}
                        className={`
                            p-6 rounded-lg border-2 transition-all
                            ${occupied
                                ? 'bg-gray-700 border-gray-600 cursor-not-allowed'
                                : selected
                                ? 'bg-indigo-600 border-indigo-400'
                                : 'bg-gray-800 border-gray-600 hover:border-indigo-500'
                            }
                        `}
                    >
                        <div className="text-center">
                            <div className="text-2xl font-bold mb-2">
                                Seat {seatNum + 1}
                            </div>
                            {occupied && player ? (
                                <div className="text-sm text-gray-400">
                                    {player.userName || 'Player'}
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500">Available</div>
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
