import React from 'react';
import type { Room, Bed, Tenant } from '../api/types';
import RoomTile from './RoomTile';

interface RoomGridProps {
  rooms: Room[];
  bedsByRoom: Record<string, Bed[]>;
  tenantByBed: Record<string, Tenant>;
  onRoomClick: (room: Room) => void;
  manageMode?: boolean;
  selectedRoomIds?: string[];
  onToggleSelect?: (roomId: string) => void;
}

const RoomGrid: React.FC<RoomGridProps> = ({
  rooms,
  bedsByRoom,
  onRoomClick,
  manageMode = false,
  selectedRoomIds = [],
  onToggleSelect,
}) => (
  <div className="grid grid-cols-2 gap-3">
    {rooms.map((room) => (
      <RoomTile
        key={room.id}
        room={room}
        beds={bedsByRoom[room.id] || []}
        onClick={() => onRoomClick(room)}
        manageMode={manageMode}
        selected={selectedRoomIds.includes(room.id)}
        onToggleSelect={onToggleSelect}
      />
    ))}
  </div>
);

export default RoomGrid;
