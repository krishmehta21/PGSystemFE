import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, BedDouble, CheckCircle, Settings2, AlertTriangle, Trash2, ChevronDown, ChevronLeft, ChevronRight, Grid } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const getFloorLabel = (roomNumber: string): string => {
  const num = parseInt(roomNumber.replace(/\D/g, ''), 10);
  if (isNaN(num)) return "Other";
  
  if (roomNumber.toLowerCase().includes('gf') || roomNumber.toLowerCase().includes('ground')) {
    return "Ground Floor";
  }
  
  if (num >= 100 && num <= 999) {
    return `Floor ${Math.floor(num / 100)}`;
  }
  if (num >= 1000 && num <= 9999) {
    return `Floor ${Math.floor(num / 100)}`;
  }
  if (num < 100) {
    return "Floor 1";
  }
  
  return "Other";
};

import {
  getRooms, getBeds, getTenants,
  createRoom, updateRoom, deleteRoom,
  createBed, deleteBed, bulkDeleteRooms
} from '../api/endpoints';
import type { Room, Bed, Tenant } from '../api/types';
import { getCache, setCache, invalidateCache } from '../utils/cache';

import RoomCard     from '../components/RoomCard';
import RoomGrid     from '../components/RoomGrid';
import RoomDetailSheet from '../components/RoomDetailSheet';
import AddTenantSheet  from '../components/AddTenantSheet';
import SortControl, { type SortOption } from '../components/SortControl';
import ViewToggle,  { type ViewMode } from '../components/ViewToggle';
import BulkRoomModal from '../components/BulkRoomModal';
import Loader from '../components/Loader';

// ──────────────────────────────────────────────────────────────────────────────
// Mini shared helpers (modals)
// ──────────────────────────────────────────────────────────────────────────────
const Sheet: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => (
  <div className="fixed inset-0 bg-black/60 z-[100] flex items-end justify-center backdrop-blur-sm" onClick={onClose}>
    <div className="bg-white w-full max-w-[500px] rounded-t-[16px] p-6 animate-fade-up" onClick={(e) => e.stopPropagation()}>
      <div className="w-12 h-1 bg-black/10 rounded-full mx-auto mb-6" />
      {children}
    </div>
  </div>
);

const SheetHeader: React.FC<{ title: string; subtitle?: string; onClose: () => void }> = ({ title, subtitle, onClose }) => (
  <div className="flex justify-between items-start mb-6">
    <div>
      <h2 className="font-serif text-2xl text-main-text">{title}</h2>
      {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
    </div>
    <button onClick={onClose} className="w-8 h-8 bg-black/5 rounded-md flex items-center justify-center text-text-secondary hover:bg-black/10 transition-colors">✕</button>
  </div>
);

const ErrorBox: React.FC<{ msg: string }> = ({ msg }) => (
  <div className="bg-danger/10 text-danger p-3 rounded-md mb-4 text-sm font-medium border border-danger/20">{msg}</div>
);

const Field: React.FC<{ label: string; children: React.ReactNode; half?: boolean }> = ({ label, children, half }) => (
  <div className={half ? '' : 'w-full'}>
    <label className="block text-sm font-medium text-main-text mb-2">{label}</label>
    {children}
  </div>
);

const inputCls = (ring?: string) => `input-field${ring ? ` ${ring}` : ''}`;

const PrimaryBtn: React.FC<{
  loading?: boolean; loadingLabel?: string; label: string;
  onClick?: () => void; color?: string; disabled?: boolean;
}> = ({ loading, loadingLabel, label, onClick, color, disabled }) => (
  <button
    onClick={onClick} disabled={loading || disabled}
    className={`${color || 'btn-primary'} w-full flex justify-center items-center gap-2`}
  >
    {loading
      ? <><Loader inline size="sm" />{loadingLabel || 'Loading…'}</>
      : label}
  </button>
);

// ──────────────────────────────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────────────────────────────
const Rooms: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const isVacantFilterActive = useMemo(() => searchParams.get('filter') === 'vacant', [searchParams]);

  // ── Data ───────────────────────────────────────────────────────────────────
  const [rooms, setRooms]             = useState<Room[]>([]);
  const [bedsByRoom, setBedsByRoom]   = useState<Record<string, Bed[]>>({});
  const [tenantByBed, setTenantByBed] = useState<Record<string, Tenant>>({});
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(false);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [viewMode,    setViewMode]    = useState<ViewMode>('grid');
  const [manageMode,  setManageMode]  = useState(false);
  const [search,      setSearch]      = useState('');
  const [sortBy,      setSortBy]      = useState<SortOption>('room_asc');
  const [toast,       setToast]       = useState('');
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  
  // Initialize collapsed floors from localStorage
  const [collapsedFloors, setCollapsedFloors] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('collapsedFloors');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  // Write to localStorage on change
  useEffect(() => {
    localStorage.setItem('collapsedFloors', JSON.stringify(collapsedFloors));
  }, [collapsedFloors]);

  // ── Bulk Delete Confirm ──────────────────────────────────────────────────────
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState<string[] | null>(null);
  const [bulkDeleteForce,  setBulkDeleteForce]  = useState(false);
  const [bulkDeleting,     setBulkDeleting]     = useState(false);
  const [bulkDeleteError,  setBulkDeleteError]  = useState('');


  // ── Room detail sheet (grid tap OR list tap) ───────────────────────────────
  const [detailRoom, setDetailRoom] = useState<Room | null>(null);

  // ── Per-card loading ───────────────────────────────────────────────────────
  const [addingBedRoomId, setAddingBedRoomId] = useState<string | null>(null);
  const [deletingBedId,   setDeletingBedId]   = useState<string | null>(null);

  // ── Tenant Assign Form State (Handled by AddTenantSheet) ─────────────────
  const [assignModal, setAssignModal] = useState<{ room: Room; bed: Bed } | null>(null);

  // ── Add Room modal ──────────────────────────────────────────────────────────
  const [showAddRoom,    setShowAddRoom]    = useState(false);
  const [showBulkModal,  setShowBulkModal]  = useState(false);
  const [roomNumber,     setRoomNumber]     = useState('');
  const [totalBedsInput, setTotalBedsInput] = useState('');
  const [creatingRoom,   setCreatingRoom]   = useState(false);
  const [roomError,      setRoomError]      = useState('');

  // ── Edit Room modal ──────────────────────────────────────────────────────────
  const [editRoom,   setEditRoom]   = useState<Room | null>(null);
  const [editNumber, setEditNumber] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError,  setEditError]  = useState('');

  // ── Delete Room confirm ──────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [deleteForce,  setDeleteForce]  = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [deleteError,  setDeleteError]  = useState('');

  // ── Document Parsing ────────────────────────────────────────────────────────

  // ── Toast helper ────────────────────────────────────────────────────────────
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const openRoomDetail = (room: Room) => {
    setDetailRoom(room);
  };

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async (force = false) => {
    if (!force) {
      const cached = getCache('rooms');
      if (cached) {
        setRooms(cached.rooms); setBedsByRoom(cached.bedsByRoom); setTenantByBed(cached.tenantByBed);
        setLoading(false); return;
      }
    }
    setLoading(true); setError(false);
    try {
      const [fetchedRooms, fetchedTenants, fetchedBeds] = await Promise.all([getRooms(), getTenants(), getBeds()]);
      const bedsMap: Record<string, Bed[]> = {};
      fetchedRooms.forEach((r) => { bedsMap[r.id] = []; });
      fetchedBeds.forEach((b) => {
        if (bedsMap[b.room_id]) {
          bedsMap[b.room_id].push(b);
        }
      });
      const tenantMap: Record<string, Tenant> = {};
      fetchedTenants.forEach((t) => { if (t.bed_id) tenantMap[t.bed_id] = t; });
      setRooms(fetchedRooms); setBedsByRoom(bedsMap); setTenantByBed(tenantMap);
      setCache('rooms', { rooms: fetchedRooms, bedsByRoom: bedsMap, tenantByBed: tenantMap });
    } catch { setError(true); }
    finally { setLoading(false); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadData(); }, [loadData]);

  // Keep detail sheet data fresh when rooms/beds update
  useEffect(() => {
    if (detailRoom) {
      const fresh = rooms.find((r) => r.id === detailRoom.id);
      if (fresh) setDetailRoom(fresh);
    }
  }, [rooms]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived list ──────────────────────────────────────────────────────────
  const displayedRooms = useMemo(() => {
    let list = [...rooms];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => r.room_number.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      if (sortBy === 'room_asc') return a.room_number.localeCompare(b.room_number, undefined, { numeric: true });
      const pctA = (bedsByRoom[a.id]||[]).length ? (bedsByRoom[a.id]||[]).filter((bd)=>bd.is_occupied).length/(bedsByRoom[a.id]||[]).length : 0;
      const pctB = (bedsByRoom[b.id]||[]).length ? (bedsByRoom[b.id]||[]).filter((bd)=>bd.is_occupied).length/(bedsByRoom[b.id]||[]).length : 0;
      return sortBy === 'occupancy_desc' ? pctB - pctA : pctA - pctB;
    });
    return list;
  }, [rooms, bedsByRoom, search, sortBy]);

  const totalBeds    = useMemo(() => Object.values(bedsByRoom).reduce((s,b) => s + b.length, 0), [bedsByRoom]);
  const occupiedBeds = useMemo(() => Object.values(bedsByRoom).reduce((s,b) => s + b.filter((bd)=>bd.is_occupied).length, 0), [bedsByRoom]);

  // Group rooms by floor
  const floorGroups = useMemo(() => {
    const groups: Record<string, Room[]> = {};
    displayedRooms.forEach((r) => {
      const label = getFloorLabel(r.room_number);
      if (!groups[label]) groups[label] = [];
      groups[label].push(r);
    });
    
    // Sort keys logically
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === "Ground Floor") return -1;
      if (b === "Ground Floor") return 1;
      if (a === "Other") return 1;
      if (b === "Other") return -1;
      
      const numA = parseInt(a.replace(/\D/g, ''), 10);
      const numB = parseInt(b.replace(/\D/g, ''), 10);
      return numA - numB;
    });

    if (isVacantFilterActive) {
      Object.keys(groups).forEach(floor => {
        groups[floor].sort((a, b) => {
          const bedsA = bedsByRoom[a.id] || [];
          const freeA = bedsA.filter(bd => !bd.is_occupied).length;
          const bedsB = bedsByRoom[b.id] || [];
          const freeB = bedsB.filter(bd => !bd.is_occupied).length;
          
          if (freeA === 0 && freeB > 0) return 1;
          if (freeB === 0 && freeA > 0) return -1;
          return freeB - freeA;
        });
      });
    }
    
    return { groups, sortedKeys };
  }, [displayedRooms, bedsByRoom, isVacantFilterActive]);

  // Collapsing/expanding logic based on vacant beds filter
  useEffect(() => {
    if (loading || rooms.length === 0) return;
    
    if (isVacantFilterActive) {
      const floorsWithVacancy: string[] = [];
      const floorsWithoutVacancy: string[] = [];
      
      floorGroups.sortedKeys.forEach((floor) => {
        const floorRooms = floorGroups.groups[floor] || [];
        const hasVacancy = floorRooms.some((room) => {
          const beds = bedsByRoom[room.id] || [];
          return beds.some((bed) => !bed.is_occupied);
        });
        
        if (hasVacancy) {
          floorsWithVacancy.push(floor);
        } else {
          floorsWithoutVacancy.push(floor);
        }
      });
      
      // Auto-collapse floors without vacancy, expand floors with vacancy
      setCollapsedFloors(floorsWithoutVacancy);
    }
  }, [isVacantFilterActive, rooms, bedsByRoom, floorGroups.sortedKeys, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleCreateRoom = async () => {
    if (!roomNumber.trim()) { setRoomError('Room number is required.'); return; }
    const count = Number(totalBedsInput);
    if (isNaN(count) || count <= 0) { setRoomError('Total beds must be a positive number.'); return; }
    setCreatingRoom(true); setRoomError('');
    try {
      await createRoom({ room_number: roomNumber.trim(), total_beds: count } as any);
      setShowAddRoom(false); setRoomNumber(''); setTotalBedsInput('');
      invalidateCache('rooms'); invalidateCache('dashboard'); await loadData(true);
      showToast(`Room ${roomNumber.trim()} added!`);
    } catch (err: any) { setRoomError(typeof err.message === 'string' ? err.message : 'Failed to create room.'); }
    finally { setCreatingRoom(false); }
  };

  const openEditRoom = (room: Room) => { setEditRoom(room); setEditNumber(room.room_number); setEditError(''); };

  const handleSaveEdit = async () => {
    if (!editRoom) return;
    if (!editNumber.trim()) { setEditError('Room number is required.'); return; }
    setSavingEdit(true); setEditError('');
    try {
      const updated = await updateRoom(editRoom.id, { room_number: editNumber.trim() });
      setRooms((prev) => prev.map((r) => r.id === editRoom.id ? updated : r));
      if (detailRoom?.id === editRoom.id) setDetailRoom(updated);
      invalidateCache('rooms'); setEditRoom(null);
      showToast(`Room renamed to ${updated.room_number}`);
    } catch (err: any) { setEditError(typeof err.message === 'string' ? err.message : 'Failed to update room.'); }
    finally { setSavingEdit(false); }
  };

  const openDeleteRoom = (room: Room) => { setDeleteTarget(room); setDeleteForce(false); setDeleteError(''); };

  const handleDeleteRoom = async () => {
    if (!deleteTarget) return;
    const beds = bedsByRoom[deleteTarget.id] || [];
    if (beds.some((b) => b.is_occupied) && !deleteForce) {
      setDeleteError('This room has occupied beds. Check the box below to confirm force-delete.'); return;
    }
    setDeleting(true); setDeleteError('');
    try {
      await deleteRoom(deleteTarget.id, deleteForce);
      setRooms((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setBedsByRoom((prev) => { const n = { ...prev }; delete n[deleteTarget.id]; return n; });
      if (detailRoom?.id === deleteTarget.id) setDetailRoom(null);
      invalidateCache('rooms'); invalidateCache('dashboard');
      setDeleteTarget(null); showToast(`Room ${deleteTarget.room_number} deleted`);
    } catch (err: any) { setDeleteError(typeof err.message === 'string' ? err.message : 'Failed to delete room.'); }
    finally { setDeleting(false); }
  };

  const handleAddBed = async (room: Room) => {
    setAddingBedRoomId(room.id);
    try {
      const newBed = await createBed({ room_id: room.id });
      setBedsByRoom((prev) => ({ ...prev, [room.id]: [...(prev[room.id] || []), newBed] }));
      invalidateCache('rooms'); showToast(`${newBed.bed_label} added to Room ${room.room_number}`);
    } catch (err: any) { showToast(`Error: ${typeof err.message === 'string' ? err.message : 'Failed to add bed'}`); }
    finally { setAddingBedRoomId(null); }
  };

  const handleDeleteBed = async (bed: Bed) => {
    if (bed.is_occupied) { showToast('Cannot remove an occupied bed.'); return; }
    setDeletingBedId(bed.id);
    try {
      await deleteBed(bed.id);
      setBedsByRoom((prev) => ({ ...prev, [bed.room_id]: (prev[bed.room_id] || []).filter((b) => b.id !== bed.id) }));
      invalidateCache('rooms'); showToast(`${bed.bed_label || 'Bed'} removed`);
    } catch (err: any) { showToast(`Error: ${typeof err.message === 'string' ? err.message : 'Failed to remove bed'}`); }
    finally { setDeletingBedId(null); }
  };

  const handleToggleSelectRoom = (roomId: string) => {
    setSelectedRooms((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  const handleSelectAllRooms = () => {
    const allIds = displayedRooms.map((r) => r.id);
    const areAllSelected = allIds.every((id) => selectedRooms.includes(id));
    if (areAllSelected) {
      setSelectedRooms((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      setSelectedRooms((prev) => Array.from(new Set([...prev, ...allIds])));
    }
  };

  const openBulkDeleteConfirm = () => {
    if (selectedRooms.length === 0) return;
    setBulkDeleteTarget(selectedRooms);
    setBulkDeleteForce(false);
    setBulkDeleteError('');
  };

  const toggleFloor = (floor: string) => {
    setCollapsedFloors((prev) =>
      prev.includes(floor) ? prev.filter((f) => f !== floor) : [...prev, floor]
    );
  };

  const getFloorStats = (floor: string) => {
    const floorRooms = floorGroups.groups[floor] || [];
    const occupiedRooms = floorRooms.filter((room) =>
      (bedsByRoom[room.id] || []).some((bed) => bed.is_occupied)
    ).length;

    return { rooms: floorRooms.length, occupied: occupiedRooms };
  };

  const renderFloorHeader = (floor: string, isCollapsed: boolean) => {
    const stats = getFloorStats(floor);

    return (
      <button
        type="button"
        onClick={() => toggleFloor(floor)}
        className="w-full flex items-center justify-between py-2 mb-2 tap-target"
        aria-expanded={!isCollapsed}
      >
        <h2 className="text-xs font-bold text-black/40 uppercase tracking-widest px-1">
          {floor} <span className="normal-case ml-2 font-semibold">· {stats.rooms} room{stats.rooms !== 1 ? 's' : ''}</span>
        </h2>
        {isCollapsed ? <ChevronRight size={16} className="text-black/40" /> : <ChevronDown size={16} className="text-black/40" />}
      </button>
    );
  };

  const handleBulkDelete = async () => {
    if (!bulkDeleteTarget || bulkDeleteTarget.length === 0) return;
    
    let occupiedBedsCount = 0;
    bulkDeleteTarget.forEach((roomId) => {
      const beds = bedsByRoom[roomId] || [];
      occupiedBedsCount += beds.filter((b) => b.is_occupied).length;
    });

    if (occupiedBedsCount > 0 && !bulkDeleteForce) {
      setBulkDeleteError(`Selected rooms have ${occupiedBedsCount} occupied bed(s). Check the box below to confirm force-delete.`);
      return;
    }

    setBulkDeleting(true);
    setBulkDeleteError('');
    try {
      await bulkDeleteRooms(bulkDeleteTarget, bulkDeleteForce);
      setRooms((prev) => prev.filter((r) => !bulkDeleteTarget.includes(r.id)));
      setBedsByRoom((prev) => {
        const n = { ...prev };
        bulkDeleteTarget.forEach((id) => { delete n[id]; });
        return n;
      });
      setSelectedRooms([]);
      setBulkDeleteTarget(null);
      invalidateCache('rooms');
      invalidateCache('dashboard');
      showToast(`Successfully deleted ${bulkDeleteTarget.length} room(s)`);
    } catch (err: any) {
      setBulkDeleteError(typeof err.message === 'string' ? err.message : 'Failed to bulk delete rooms.');
    } finally {
      setBulkDeleting(false);
    }
  };



  // Assignment is handled by AddTenantSheet component

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-main-bg pb-28">

      {/* ── Sticky header ──────────────────────────────────────────────────── */}
      <div className="bg-white px-4 pt-5 pb-4 border-b border-main-border sticky top-0 z-10">
        {/* Title row */}
        <div className="h-16 flex items-center justify-center relative mb-3">
          <button aria-label="Go back" onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} className="absolute left-0 p-2 -ml-2 transition-colors active:bg-gray-100 rounded-md tap-target">
            <ChevronLeft size={24} className="text-main-text" />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-lg font-bold text-main-text">Rooms</h1>
            <p className="text-[10px] text-black/60 font-medium mt-0.5">
              {loading ? 'Loading…' : `${occupiedBeds}/${totalBeds} beds · ${rooms.length} room${rooms.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="absolute right-0 pr-4 flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => { setShowBulkModal(true); }}
              className="bg-white text-main-text border border-main-border px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 tap-target hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Grid size={14} /> Bulk Add
            </button>
            <button
              onClick={() => { setRoomError(''); setShowAddRoom(true); }}
              className="bg-main-text text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 tap-target hover:bg-accent transition-colors shadow-sm"
            >
              <Plus size={14} /> Add Room
            </button>
          </div>
        </div>

        {/* View / Manage toggle row */}
        <div className="flex gap-2.5 mb-2.5">
          <div className="flex-1">
            <ViewToggle value={viewMode} onChange={setViewMode} />
          </div>
          {/* Manage pill */}
          <button
            onClick={() => setManageMode((m) => {
              const next = !m;
              if (!next) setSelectedRooms([]);
              return next;
            })}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all flex-shrink-0 ${
              manageMode
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-white border-main-border text-black/60 hover:border-gray-300'
            }`}
          >
            <Settings2 size={13} />
            {manageMode ? 'Managing' : 'Manage'}
          </button>
          {manageMode && selectedRooms.length > 0 && (
            <button
              onClick={openBulkDeleteConfirm}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-all flex-shrink-0"
              title={`Delete Selected (${selectedRooms.length})`}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>

        {/* Sort chips */}
        {!loading && rooms.length > 0 && (
          <div className="mt-4">
            <SortControl value={sortBy} onChange={setSortBy} />
          </div>
        )}
      </div>

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed top-3 left-3 right-3 z-[200] bg-main-text text-white px-4 py-3 rounded-lg font-medium text-sm flex items-center gap-2.5" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
          <CheckCircle size={16} className="flex-shrink-0 text-emerald-400" />
          {toast}
        </div>
      )}

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && !loading && (
        <div className="px-4 pt-4">
          <button onClick={() => loadData(true)} className="w-full text-left card p-4 border-red-200 font-medium text-sm text-red-600 tap-target">
            Failed to load rooms. Tap to retry.
          </button>
        </div>
      )}

      {/* ── Manage mode banner ─────────────────────────────────────────────── */}
      {manageMode && !loading && (
        <div className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-2.5 flex items-center gap-2.5">
          <Settings2 size={14} className="text-amber-600 flex-shrink-0" />
          <p className="text-xs font-medium text-amber-700">
            Manage mode is on — tap a room to edit.
          </p>
        </div>
      )}

      {/* ── Vacant filter banner ───────────────────────────────────────────── */}
      {isVacantFilterActive && !loading && (
        <div className="mx-4 mt-3 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-amber-800 shadow-sm animate-fade-up">
          <span className="flex items-center gap-1.5">
            ✨ Showing floors with vacant beds — {totalBeds - occupiedBeds} beds available across {rooms.filter(r => (bedsByRoom[r.id] || []).some(b => !b.is_occupied)).length} rooms
          </span>
          <button 
            onClick={() => navigate('/rooms')} 
            className="underline hover:text-amber-950 font-bold flex-shrink-0 ml-2"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-3">
        {manageMode && !loading && rooms.length > 0 && (
          <div className="mb-4">
            <button
              onClick={handleSelectAllRooms}
              className="w-full flex items-center justify-between py-3 hover:bg-gray-50/20 active:bg-gray-50/55 transition-colors border-b border-main-border select-none text-left"
            >
              <span className="text-sm font-semibold text-main-text">Select All</span>
              <input
                type="checkbox"
                checked={displayedRooms.length > 0 && displayedRooms.every((r) => selectedRooms.includes(r.id))}
                onChange={handleSelectAllRooms}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 rounded border-main-border text-emerald-600 focus:ring-emerald-500/20 cursor-pointer"
              />
            </button>
          </div>
        )}
        {loading ? (
          <div className="py-12">
            <Loader size="md" />
          </div>
        ) : displayedRooms.length === 0 && search ? (
          /* ── No search results ──────────────────────────────────────────── */
          <div className="flex flex-col items-center text-center pt-16 gap-2">
            <p className="text-base font-semibold text-main-text">No rooms found</p>
            <p className="text-black/60 text-sm">No room matches "<span className="font-semibold">{search}</span>"</p>
            <button onClick={() => setSearch('')} className="mt-1 text-accent font-semibold text-sm">Clear search</button>
          </div>
        ) : rooms.length === 0 ? (
          /* ── True empty state ───────────────────────────────────────────── */
          <div className="card p-8 flex flex-col items-center text-center gap-3 mt-4">
            <div className="w-14 h-14 bg-main-bg rounded-lg flex items-center justify-center border border-main-border">
              <BedDouble size={28} className="text-black/40" />
            </div>
            <div>
              <h2 className="text-base font-bold text-main-text">No rooms added yet</h2>
              <p className="text-black/60 text-sm mt-1 leading-relaxed max-w-[240px]">
                Set up your first room and start assigning tenants to beds.
              </p>
            </div>
            <div className="flex gap-2.5 mt-1">
              <button
                onClick={() => { setShowBulkModal(true); }}
                className="bg-amber-50 text-warning border border-amber-200 px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 tap-target hover:bg-amber-100 transition-colors"
              >
                <Plus size={16} /> Bulk Add Rooms
              </button>
              <button
                onClick={() => { setRoomError(''); setShowAddRoom(true); }}
                className="bg-main-text text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 tap-target hover:bg-accent transition-colors"
              >
                <Plus size={16} /> Add Room
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* ── GRID VIEW ──────────────────────────────────────────────────── */
          <div className="space-y-3">
            {floorGroups.sortedKeys.map((floor) => {
              const isCollapsed = collapsedFloors.includes(floor);

              return (
                <div key={floor} className="space-y-2.5">
                  {renderFloorHeader(floor, isCollapsed)}
                  <div
                    className={isCollapsed ? 'hidden' : 'block'}
                  >
                    <div className="overflow-hidden">
                      <RoomGrid
                        rooms={floorGroups.groups[floor]}
                        bedsByRoom={bedsByRoom}
                        tenantByBed={tenantByBed}
                        onRoomClick={openRoomDetail}
                        manageMode={manageMode}
                        selectedRoomIds={selectedRooms}
                        onToggleSelect={handleToggleSelectRoom}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── LIST VIEW ──────────────────────────────────────────────────── */
          <div className="space-y-3">
            {floorGroups.sortedKeys.map((floor) => {
              const isCollapsed = collapsedFloors.includes(floor);

              return (
                <div key={floor} className="space-y-2.5">
                  {renderFloorHeader(floor, isCollapsed)}
                  <div
                    className={isCollapsed ? 'hidden' : 'block'}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-2.5">
                        {floorGroups.groups[floor].map((room) => (
                          <RoomCard
                            key={room.id}
                            room={room}
                            beds={bedsByRoom[room.id] || []}
                            manageMode={manageMode}
                            onOpen={openRoomDetail}
                            onEditRoom={openEditRoom}
                            onDeleteRoom={openDeleteRoom}
                            selected={selectedRooms.includes(room.id)}
                            onToggleSelect={handleToggleSelectRoom}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ╔═══════════════════════════════════════════════════════╗
          ║  ROOM DETAIL SHEET (grid tap + list tap)             ║
          ╚═══════════════════════════════════════════════════════╝ */}
      {detailRoom && (
        <RoomDetailSheet
          room={detailRoom}
          beds={bedsByRoom[detailRoom.id] || []}
          tenantByBed={tenantByBed}
          manageMode={manageMode}
          addingBed={addingBedRoomId === detailRoom.id}
          deletingBedId={deletingBedId}
          onClose={() => setDetailRoom(null)}
          onAssign={(room, bed) => { setAssignModal({ room, bed }); }}
          onNavigateTenant={(id) => navigate(`/tenants/${id}`)}
          onEditRoom={(room) => { setDetailRoom(null); setTimeout(() => openEditRoom(room), 50); }}
          onDeleteRoom={(room) => { setDetailRoom(null); setTimeout(() => openDeleteRoom(room), 50); }}
          onAddBed={handleAddBed}
          onDeleteBed={handleDeleteBed}
        />
      )}

      {/* ╔═══════════════════════════════════════════════════════╗
          ║  ADD ROOM MODAL                                       ║
          ╚═══════════════════════════════════════════════════════╝ */}
      {showAddRoom && (
        <Sheet onClose={() => setShowAddRoom(false)}>
          <SheetHeader title="Add Room" onClose={() => setShowAddRoom(false)} />
          {roomError && <ErrorBox msg={roomError} />}
          <div className="space-y-3.5 mb-5">
            <Field label="Room Number / Name">
              <input
                type="text" placeholder="e.g. 101, A1, Ground Floor"
                value={roomNumber} autoFocus
                onChange={(e) => setRoomNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
                className={inputCls('focus:ring-accent/20')}
              />
            </Field>
            <Field label="Total Beds">
              <input type="number" placeholder="e.g. 4" min="1" max="20"
                value={totalBedsInput}
                onChange={(e) => setTotalBedsInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
                className={inputCls('focus:ring-accent/20')}
              />
            </Field>
          </div>
          <PrimaryBtn loading={creatingRoom} loadingLabel="Creating…" label="Create Room" onClick={handleCreateRoom} />
        </Sheet>
      )}

      {/* ╔═══════════════════════════════════════════════════════╗
          ║  EDIT ROOM MODAL                                      ║
          ╚═══════════════════════════════════════════════════════╝ */}
      {editRoom && (
        <Sheet onClose={() => setEditRoom(null)}>
          <SheetHeader title="Rename Room" subtitle={`Currently: Room ${editRoom.room_number}`} onClose={() => setEditRoom(null)} />
          {editError && <ErrorBox msg={editError} />}
          <div className="space-y-3.5 mb-5">
            <Field label="New Room Number / Name">
              <input type="text" placeholder="New room number"
                value={editNumber} autoFocus
                onChange={(e) => setEditNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                className={inputCls('focus:ring-accent/20')}
              />
            </Field>
          </div>
          <PrimaryBtn loading={savingEdit} loadingLabel="Saving…" label="Save Changes" onClick={handleSaveEdit} />
        </Sheet>
      )}

      {/* ╔═══════════════════════════════════════════════════════╗
          ║  DELETE ROOM CONFIRM                                  ║
          ╚═══════════════════════════════════════════════════════╝ */}
      {deleteTarget && (
        <Sheet onClose={() => { if (!deleting) setDeleteTarget(null); }}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center border border-red-200">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <div>
                <h2 className="text-base font-bold text-main-text">Delete Room {deleteTarget.room_number}?</h2>
                <p className="text-xs text-black/60 mt-0.5">This cannot be undone</p>
              </div>
            </div>
            <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center text-black/60 font-medium hover:bg-gray-200 transition-colors">✕</button>
          </div>

          {deleteError && <ErrorBox msg={deleteError} />}

          {(() => {
            const beds = bedsByRoom[deleteTarget.id] || [];
            const occ  = beds.filter(b => b.is_occupied).length;
            return (
              <>
                <div className="bg-main-bg rounded-lg p-3 mb-4 space-y-1 text-xs font-medium text-black/60 border border-main-border">
                  <p><span className="font-semibold">{beds.length}</span> beds will be removed</p>
                  {occ > 0 && <p className="text-red-500 font-semibold">⚠ {occ} bed{occ > 1 ? 's are' : ' is'} occupied</p>}
                </div>
                {occ > 0 && (
                  <label className="flex items-start gap-2.5 mb-4 cursor-pointer">
                    <input type="checkbox" checked={deleteForce} onChange={(e) => { setDeleteForce(e.target.checked); setDeleteError(''); }}
                      className="mt-0.5 w-4 h-4 rounded accent-red-500" />
                    <span className="text-xs font-medium text-main-text">Remove all tenants and delete this room</span>
                  </label>
                )}
              </>
            );
          })()}

          <div className="flex gap-2.5">
            <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="flex-1 bg-gray-100 text-black/60 py-3 rounded-lg text-sm font-semibold tap-target disabled:opacity-50 hover:bg-gray-200 transition-colors">Cancel</button>
            <PrimaryBtn loading={deleting} loadingLabel="Deleting…" label="Delete Room" onClick={handleDeleteRoom} color="bg-red-600" />
          </div>
        </Sheet>
      )}

      {assignModal && (
        <AddTenantSheet 
          onClose={() => setAssignModal(null)}
          onSuccess={(name) => {
            showToast(`${name} assigned!`);
            setAssignModal(null);
            invalidateCache('rooms');
            invalidateCache('dashboard');
            loadData(true);
          }}
          preselectedRoom={assignModal.room}
          preselectedBed={assignModal.bed}
        />
      )}

      {showBulkModal && (
        <BulkRoomModal
          onClose={() => setShowBulkModal(false)}
          onSuccess={(result) => {
            setShowBulkModal(false);
            invalidateCache('rooms');
            invalidateCache('dashboard');
            loadData(true);
            showToast(`Added ${result.rooms_created} rooms and ${result.beds_created} beds!`);
          }}
        />
      )}



      {/* ╔═══════════════════════════════════════════════════════╗
          ║  BULK DELETE ROOMS CONFIRM                             ║
          ╚═══════════════════════════════════════════════════════╝ */}
      {bulkDeleteTarget && (
        <Sheet onClose={() => { if (!bulkDeleting) setBulkDeleteTarget(null); }}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center border border-red-200">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <div>
                <h2 className="text-base font-bold text-main-text">Delete {bulkDeleteTarget.length} Rooms?</h2>
                <p className="text-xs text-black/60 mt-0.5">This cannot be undone</p>
              </div>
            </div>
            <button onClick={() => setBulkDeleteTarget(null)} disabled={bulkDeleting} className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center text-black/60 font-medium hover:bg-gray-200 transition-colors">✕</button>
          </div>

          {bulkDeleteError && <ErrorBox msg={bulkDeleteError} />}

          {(() => {
            let totalBedsCount = 0;
            let occupiedBedsCount = 0;
            bulkDeleteTarget.forEach((roomId) => {
              const beds = bedsByRoom[roomId] || [];
              totalBedsCount += beds.length;
              occupiedBedsCount += beds.filter(b => b.is_occupied).length;
            });
            return (
              <>
                <div className="bg-main-bg rounded-lg p-3 mb-4 space-y-1 text-xs font-medium text-black/60 border border-main-border">
                  <p><span className="font-semibold">{totalBedsCount}</span> total beds will be removed across <span className="font-semibold">{bulkDeleteTarget.length}</span> rooms</p>
                  {occupiedBedsCount > 0 && <p className="text-red-500 font-semibold">⚠ {occupiedBedsCount} bed{occupiedBedsCount > 1 ? 's are' : ' is'} occupied by tenants</p>}
                </div>
                {occupiedBedsCount > 0 && (
                  <label className="flex items-start gap-2.5 mb-4 cursor-pointer">
                    <input type="checkbox" checked={bulkDeleteForce} onChange={(e) => { setBulkDeleteForce(e.target.checked); setBulkDeleteError(''); }}
                      className="mt-0.5 w-4 h-4 rounded accent-red-500" />
                    <span className="text-xs font-medium text-main-text">Remove all tenants and force-delete all selected rooms</span>
                  </label>
                )}
              </>
            );
          })()}

          <div className="flex gap-2.5">
            <button onClick={() => setBulkDeleteTarget(null)} disabled={bulkDeleting} className="flex-1 bg-gray-100 text-black/60 py-3 rounded-lg text-sm font-semibold tap-target disabled:opacity-50 hover:bg-gray-200 transition-colors">Cancel</button>
            <PrimaryBtn loading={bulkDeleting} loadingLabel="Deleting…" label={`Delete ${bulkDeleteTarget.length} Rooms`} onClick={handleBulkDelete} color="bg-red-600" />
          </div>
        </Sheet>
      )}
    </div>
  );
};

export default Rooms;

