import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Phone, CheckCircle, MessageSquareText, Archive, LogOut, X } from 'lucide-react';
import { 
  getTenant, updateTenant, deleteTenant, toggleRentStatus, getMyPG,
  getDocuments, uploadDocument, deleteDocument, settleMoveOut, dispatchReminder
} from '../api/endpoints';
import Loader from '../components/Loader';
import type { Tenant, TenantUpdate } from '../api/types';
import { getCache, setCache, invalidateCache } from '../utils/cache';

const TenantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [pg, setPg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [togglingRent, setTogglingRent] = useState(false);
  const [toggleRentError, setToggleRentError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Move Out State
  const [showMoveOutSheet, setShowMoveOutSheet] = useState(false);
  const [moveOutNoticeDate, setMoveOutNoticeDate] = useState("");
  const [moveOutActualDate, setMoveOutActualDate] = useState(new Date().toISOString().split('T')[0]);
  const [moveOutDepositReturned, setMoveOutDepositReturned] = useState("");
  const [moveOutDeductionReason, setMoveOutDeductionReason] = useState("");
  const [settling, setSettling] = useState(false);
  const [settleError, setSettleError] = useState("");
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };
  const [sendingReminder, setSendingReminder] = useState(false);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRentAmount, setEditRentAmount] = useState("");
  const [editMoveInDate, setEditMoveInDate] = useState("");
  
  const [editAadhaar, setEditAadhaar] = useState("");
  const [editPan, setEditPan] = useState("");
  const [editEmergencyName, setEditEmergencyName] = useState("");
  const [editEmergencyPhone, setEditEmergencyPhone] = useState("");
  const [editEmployer, setEditEmployer] = useState("");
  const [editHometown, setEditHometown] = useState("");
  const [editFood, setEditFood] = useState<"veg" | "non_veg" | "both">("veg");
  const [editVehicle, setEditVehicle] = useState("");
  const [editDeposit, setEditDeposit] = useState("");
  const [editDepositDate, setEditDepositDate] = useState("");
  const [editExpectedMoveOut, setEditExpectedMoveOut] = useState("");
  const [editPoliceVerification, setEditPoliceVerification] = useState(false);
  const [editPoliceDate, setEditPoliceDate] = useState("");
  const [editOccupancy, setEditOccupancy] = useState<"single" | "double" | "triple">("single");
  
  const [showExtendedEdit, setShowExtendedEdit] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState("");

  // Collapsible Tab State
  const [activeSection, setActiveSection] = useState<'stay' | 'emergency' | 'kyc' | 'docs' | null>('stay');

  // Documents State
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docError, setDocError] = useState("");

  const loadTenant = async (force = false) => {
    if (!id) return;

    if (!force) {
      const cached = getCache(`tenant_${id}`);
      const cachedPg = getCache('my_pg');
      if (cached && cachedPg) {
        setTenant(cached);
        setPg(cachedPg);
        setEditName(cached.name);
        setEditPhone(cached.phone);
        setEditRentAmount(cached.rent_amount.toString());
        setEditMoveInDate(cached.move_in_date);
        
        setEditAadhaar(cached.aadhaar_last4 || "");
        setEditPan(cached.pan_number || "");
        setEditEmergencyName(cached.emergency_contact_name || "");
        setEditEmergencyPhone(cached.emergency_contact_phone || "");
        setEditEmployer(cached.employer_or_college || "");
        setEditHometown(cached.hometown || "");
        setEditFood(cached.food_preference || "veg");
        setEditVehicle(cached.vehicle_registration || "");
        setEditDeposit(cached.security_deposit_amount?.toString() || "");
        setEditDepositDate(cached.security_deposit_date || "");
        setEditExpectedMoveOut(cached.expected_move_out_date || "");
        setEditPoliceVerification(cached.police_verification_done || false);
        setEditPoliceDate(cached.police_verification_date || "");
        setEditOccupancy(cached.occupancy_type || "single");
        
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(false);
    try {
      const [data, pgData] = await Promise.all([
        getTenant(id),
        getMyPG()
      ]);
      setTenant(data);
      setPg(pgData);
      setEditName(data.name);
      setEditPhone(data.phone);
      setEditRentAmount(data.rent_amount.toString());
      setEditMoveInDate(data.move_in_date);
      
      setEditAadhaar(data.aadhaar_last4 || "");
      setEditPan(data.pan_number || "");
      setEditEmergencyName(data.emergency_contact_name || "");
      setEditEmergencyPhone(data.emergency_contact_phone || "");
      setEditEmployer(data.employer_or_college || "");
      setEditHometown(data.hometown || "");
      setEditFood(data.food_preference || "veg");
      setEditVehicle(data.vehicle_registration || "");
      setEditDeposit(data.security_deposit_amount?.toString() || "");
      setEditDepositDate(data.security_deposit_date || "");
      setEditExpectedMoveOut(data.expected_move_out_date || "");
      setEditPoliceVerification(data.police_verification_done || false);
      setEditPoliceDate(data.police_verification_date || "");
      setEditOccupancy(data.occupancy_type || "single");

      setCache(`tenant_${id}`, data);
      setCache('my_pg', pgData);
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes('404') || err?.status === 404) {
        setTenant(null);
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    if (!id) return;
    setLoadingDocs(true);
    try {
      const docs = await getDocuments(id);
      setDocuments(docs);
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadTenant();
    loadDocuments();
  }, [id]);

  const handleToggleRent = async () => {
    if (!tenant) return;
    setTogglingRent(true);
    setToggleRentError("");
    try {
      const nextStatus = tenant.rent_status === 'paid' ? 'unpaid' : 'paid';
      const updatedTenant = await toggleRentStatus(tenant.id, nextStatus);
      setTenant(updatedTenant);
      setCache(`tenant_${tenant.id}`, updatedTenant);
      invalidateCache('tenants_all');
      invalidateCache('tenants_unpaid');
      invalidateCache('dashboard');
    } catch (err) {
      console.error("Failed to toggle rent status", err);
      setToggleRentError("Failed to update rent status.");
    } finally {
      setTogglingRent(false);
    }
  };

  const handleRemoveTenant = async () => {
    if (!tenant) return;
    const confirm = window.confirm(`Remove ${tenant.name} from this bed? This cannot be undone.`);
    if (!confirm) return;

    setDeleting(true);
    setDeleteError("");
    try {
      await deleteTenant(tenant.id);
      invalidateCache('rooms');
      invalidateCache('tenants_all');
      invalidateCache('tenants_unpaid');
      invalidateCache('dashboard');
      navigate('/tenants', { replace: true });
    } catch (err) {
      console.error("Failed to delete tenant", err);
      setDeleteError("Failed to remove tenant. Please try again.");
      setDeleting(false);
    }
  };

  const handleSendReminder = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!tenant) return;
    setSendingReminder(true);
    try {
      await dispatchReminder(tenant.id, whatsappLink);
      showToast("WhatsApp reminder logged and dispatched!");
    } catch (err: any) {
      console.error("Failed to log reminder:", err);
      showToast("Dispatched reminder!");
    } finally {
      setSendingReminder(false);
    }
    window.open(whatsappLink, '_blank', 'noopener,noreferrer');
  };

  const handleSettleMoveOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    
    setSettling(true);
    setSettleError("");
    
    try {
      await settleMoveOut(tenant.id, {
        notice_given_date: moveOutNoticeDate || moveOutActualDate,
        actual_move_out_date: moveOutActualDate,
        deposit_returned_amount: Number(moveOutDepositReturned) || 0,
        deposit_deduction_reason: moveOutDeductionReason || undefined
      });
      await loadTenant(true);
      setShowMoveOutSheet(false);
      invalidateCache('tenants_all');
      invalidateCache('dashboard');
      invalidateCache('rooms');
    } catch (err: any) {
      setSettleError(err.message || "Failed to process move-out.");
    } finally {
      setSettling(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!tenant) return;
    
    if (!editName || !editPhone || !editRentAmount || !editMoveInDate) {
      setEditError("All core fields are required.");
      return;
    }

    const aadhaarClean = editAadhaar.trim();
    if (aadhaarClean && !/^\d{4}$/.test(aadhaarClean)) {
      setEditError("Aadhaar must be exactly 4 digits.");
      return;
    }
    const panClean = editPan.trim().toUpperCase();
    if (panClean && !/^[A-Z]{5}\d{4}[A-Z]$/.test(panClean)) {
      setEditError("Invalid PAN format (e.g. ABCDE1234F).");
      return;
    }
    const emPhoneClean = editEmergencyPhone.replace(/\D/g, "");
    if (emPhoneClean && emPhoneClean.length !== 10) {
      setEditError("Emergency contact phone must be 10 digits.");
      return;
    }
    const depositAmt = editDeposit.trim() ? Number(editDeposit) : null;
    if (depositAmt !== null && (isNaN(depositAmt) || depositAmt < 0)) {
      setEditError("Enter a valid deposit amount.");
      return;
    }
    
    setEditing(true);
    setEditError("");
    
    try {
      const payload: TenantUpdate = {
        name: editName,
        phone: editPhone,
        rent_amount: Number(editRentAmount),
        move_in_date: editMoveInDate,
        aadhaar_last4: aadhaarClean || null,
        pan_number: panClean || null,
        emergency_contact_name: editEmergencyName.trim() || null,
        emergency_contact_phone: emPhoneClean || null,
        employer_or_college: editEmployer.trim() || null,
        hometown: editHometown.trim() || null,
        food_preference: editFood,
        vehicle_registration: editVehicle.trim() || null,
        security_deposit_amount: depositAmt,
        security_deposit_date: editDepositDate || null,
        expected_move_out_date: editExpectedMoveOut || null,
        police_verification_done: editPoliceVerification,
        police_verification_date: editPoliceDate || null,
        occupancy_type: editOccupancy
      };
      
      await updateTenant(tenant.id, payload);
      const updatedData = await getTenant(tenant.id);
      setTenant(updatedData);
      setCache(`tenant_${tenant.id}`, updatedData);
      invalidateCache('tenants_all');
      invalidateCache('tenants_unpaid');
      setShowEditModal(false);
    } catch (err: any) {
      console.error(err);
      setEditError(err.message || "Failed to update tenant.");
    } finally {
      setEditing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!id || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      setDocError("Only PDF, JPEG, and PNG are allowed.");
      return;
    }
    if (file.size > 5242880) {
      setDocError("File must be under 5MB.");
      return;
    }

    setUploadingDoc(true);
    setDocError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      await uploadDocument(id, formData);
      await loadDocuments();
    } catch (err: any) {
      console.error(err);
      setDocError(err.message || "Failed to upload document.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDoc = async (filename: string) => {
    if (!id) return;
    const confirm = window.confirm(`Delete document "${filename}"?`);
    if (!confirm) return;

    try {
      await deleteDocument(id, filename);
      await loadDocuments();
    } catch (err: any) {
      console.error(err);
      setDocError(err.message || "Failed to delete document.");
    }
  };

  if (loading) {
    return (
      <div className="py-24">
        <Loader size="lg" label="Loading profile..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 min-h-screen bg-white">
        <header className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/tenants')} className="p-2 transition-colors active:bg-gray-100 rounded-md tap-target">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-lg font-bold">Error</h1>
        </header>
        <button onClick={() => loadTenant(true)} className="w-full text-left card p-4 flex items-center gap-3 border-red-200 tap-target">
          <p className="text-sm font-medium text-red-600">Failed to load tenant details. Tap to retry.</p>
        </button>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-5 min-h-screen bg-white flex flex-col items-center justify-center text-center">
        <h1 className="text-xl font-bold mb-4 text-main-text">Tenant not found</h1>
        <button onClick={() => navigate('/tenants')} className="card text-black/60 font-semibold px-6 py-3 text-sm flex items-center gap-2 tap-target hover:border-gray-300 transition-colors">
          <ChevronLeft size={16} /> Back to tenants
        </button>
      </div>
    );
  }

  const isPaid = tenant.rent_status === 'paid';
  const whatsappMessage = pg?.whatsapp_message_template
    ? pg.whatsapp_message_template
        .replace('{name}', tenant.name)
        .replace('{amount}', tenant.rent_amount.toString())
        .replace('{pgName}', pg.name)
    : `Hi ${tenant.name}, your rent for this month is pending. Please pay today. — ${pg?.name || 'PG'}`;

  // Fixed country prefix for Indian regulatory context
  const whatsappLink = `https://wa.me/91${tenant.phone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="bg-white min-h-screen pb-20">
      {toast && (
        <div className="fixed top-3 left-3 right-3 z-[200] bg-primary-text text-white px-4 py-3 rounded-lg font-medium text-sm flex items-center gap-2.5 animate-fade-up" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
          <CheckCircle size={16} className="flex-shrink-0 text-emerald-400" />
          {toast}
        </div>
      )}
      <header className="h-16 flex items-center justify-center sticky top-0 bg-white z-10 border-b border-main-border relative">
        <button aria-label="Go back" onClick={() => navigate(-1)} className="absolute left-2 p-2 transition-colors active:bg-gray-100 rounded-md tap-target">
          <ChevronLeft size={24} className="text-main-text" />
        </button>
        <h1 className="text-lg font-bold text-main-text">Tenant Details</h1>
      </header>

      <div className="p-5 space-y-5">
        {tenant.is_active === false && (
          <div className="bg-main-bg border border-main-border p-4 rounded-xl flex items-start gap-3 shadow-sm">
            <div className="p-2 bg-white rounded-full text-black/60 shadow-sm border border-main-border">
              <Archive size={20} />
            </div>
            <div>
              <h3 className="font-bold text-main-text text-sm">Archived Tenant</h3>
              <p className="text-xs text-black/60 mt-1 font-medium leading-relaxed">
                Moved out on {tenant.actual_move_out_date || 'Unknown Date'}. 
                {tenant.deposit_returned_amount != null && ` Deposit returned: ₹${tenant.deposit_returned_amount.toLocaleString()}.`}
              </p>
            </div>
          </div>
        )}

        {/* Profile card */}
        <div className="card p-5 text-center space-y-2">
          <h2 className="text-xl font-bold text-main-text">{tenant.name}</h2>
          <a href={`tel:${tenant.phone}`} className="text-emerald-600 font-semibold text-sm flex items-center justify-center gap-1.5 tap-target py-1">
            <Phone size={16} /> {tenant.phone}
          </a>
          <p className="text-black/60 text-xs font-medium">
            Joined: {tenant.move_in_date} · Room {tenant.room_number || 'N/A'}-{tenant.bed_label || 'N/A'}
          </p>
        </div>

        {/* Rent status */}
        <div className={`card p-5 flex flex-col items-center gap-2 ${
          isPaid ? 'border-emerald-200' : 'border-red-200'
        }`}>
          <span className="text-black/60 text-[11px] font-semibold tracking-widest uppercase">Current Month</span>
          {isPaid ? (
            <span className="text-lg font-bold text-emerald-600 flex items-center gap-2">
              Paid <CheckCircle size={20} />
            </span>
          ) : (
            <span className="text-2xl font-bold text-red-600">₹{tenant.rent_amount.toLocaleString()} Due</span>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <a href={`tel:${tenant.phone}`} className="card w-full text-main-text py-3.5 font-semibold text-sm flex items-center justify-center gap-2 tap-target text-center hover:border-black/20 transition-colors">
              <Phone size={16} /> Call
            </a>
            {tenant.is_active !== false ? (
              <button 
                onClick={handleToggleRent}
                disabled={togglingRent}
                className={`w-full py-3.5 rounded-lg font-semibold text-sm tap-target disabled:opacity-70 flex justify-center items-center gap-2 transition-colors ${
                  isPaid 
                    ? 'bg-main-bg text-black/60 border border-main-border hover:bg-black/5' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {togglingRent ? (
                  <>
                    <Loader inline size="sm" />
                    Updating...
                  </>
                ) : (isPaid ? "Mark Unpaid" : "Mark Paid")}
              </button>
            ) : (
              <div className="w-full py-3.5 rounded-lg font-semibold text-sm bg-main-bg text-black/40 border border-main-border flex justify-center items-center">
                Archived
              </div>
            )}
          </div>
          {toggleRentError && <p className="text-red-500 text-xs font-medium text-center">{toggleRentError}</p>}
          {!isPaid && tenant.is_active !== false && (
            <button 
              onClick={handleSendReminder}
              disabled={sendingReminder}
              className="w-full bg-[#25D366] text-white py-3.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 tap-target text-center hover:bg-[#20BD5A] transition-colors cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {sendingReminder ? (
                <>
                  <Loader inline size="sm" />
                  Sending...
                </>
              ) : (
                <>
                  <MessageSquareText size={16} /> Send WhatsApp Reminder
                </>
              )}
            </button>
          )}
        </div>

        {/* Extended details collapsible sections */}
        <div className="space-y-3">
          {/* Stay & Demographics Accordion */}
          <div className="card overflow-hidden">
            <button
              onClick={() => setActiveSection(activeSection === 'stay' ? null : 'stay')}
              className="w-full px-5 py-4 flex justify-between items-center bg-main-bg/30 hover:bg-main-bg/50 transition-colors font-bold text-main-text text-sm tap-target"
            >
              <span>📋 Stay & Demographics</span>
              <span className="text-black/60">{activeSection === 'stay' ? '▲' : '▼'}</span>
            </button>
            {activeSection === 'stay' && (
              <div className="p-5 border-t border-main-border grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                <div>
                  <span className="text-black/60 font-medium block">Occupancy Type</span>
                  <span className="text-main-text font-semibold capitalize">{tenant.occupancy_type || 'Single'}</span>
                </div>
                <div>
                  <span className="text-black/60 font-medium block">Food Preference</span>
                  <span className="text-main-text font-semibold capitalize">{tenant.food_preference || 'Veg'}</span>
                </div>
                <div>
                  <span className="text-black/60 font-medium block">Employer / College</span>
                  <span className="text-main-text font-semibold">{tenant.employer_or_college || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-black/60 font-medium block">Hometown</span>
                  <span className="text-main-text font-semibold">{tenant.hometown || 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-black/60 font-medium block">Vehicle Registration</span>
                  <span className="text-main-text font-semibold">{tenant.vehicle_registration || 'N/A'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Emergency Contact Accordion */}
          <div className="card overflow-hidden">
            <button
              onClick={() => setActiveSection(activeSection === 'emergency' ? null : 'emergency')}
              className="w-full px-5 py-4 flex justify-between items-center bg-main-bg/30 hover:bg-main-bg/50 transition-colors font-bold text-main-text text-sm tap-target"
            >
              <span>🚨 Emergency Contact</span>
              <span className="text-black/60">{activeSection === 'emergency' ? '▲' : '▼'}</span>
            </button>
            {activeSection === 'emergency' && (
              <div className="p-5 border-t border-main-border space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-black/60 font-medium block">Contact Name</span>
                    <span className="text-main-text font-semibold">{tenant.emergency_contact_name || 'N/A'}</span>
                  </div>
                  {tenant.emergency_contact_phone && (
                    <a href={`tel:${tenant.emergency_contact_phone}`} className="bg-emerald-50 text-emerald-600 font-semibold px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1 hover:bg-emerald-100 transition-colors tap-target">
                      <Phone size={12} /> Call
                    </a>
                  )}
                </div>
                <div>
                  <span className="text-black/60 font-medium block">Contact Phone</span>
                  <span className="text-main-text font-semibold">{tenant.emergency_contact_phone || 'N/A'}</span>
                </div>
              </div>
            )}
          </div>

          {/* KYC & Compliance Accordion */}
          <div className="card overflow-hidden">
            <button
              onClick={() => setActiveSection(activeSection === 'kyc' ? null : 'kyc')}
              className="w-full px-5 py-4 flex justify-between items-center bg-main-bg/30 hover:bg-main-bg/50 transition-colors font-bold text-main-text text-sm tap-target"
            >
              <span>🛡️ KYC & Compliance</span>
              <span className="text-black/60">{activeSection === 'kyc' ? '▲' : '▼'}</span>
            </button>
            {activeSection === 'kyc' && (
              <div className="p-5 border-t border-main-border grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                <div>
                  <span className="text-black/60 font-medium block">Aadhaar (Last 4)</span>
                  <span className="text-main-text font-semibold">{tenant.aadhaar_last4 || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-black/60 font-medium block">PAN Number</span>
                  <span className="text-main-text font-semibold">{tenant.pan_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-black/60 font-medium block">Police Verification</span>
                  <span className={`inline-flex items-center gap-1 font-semibold ${tenant.police_verification_done ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {tenant.police_verification_done ? '✅ Done' : '⚠️ Pending'}
                  </span>
                </div>
                <div>
                  <span className="text-black/60 font-medium block">Verification Date</span>
                  <span className="text-main-text font-semibold">{tenant.police_verification_date || 'N/A'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Financials & Documents Accordion */}
          <div className="card overflow-hidden">
            <button
              onClick={() => setActiveSection(activeSection === 'docs' ? null : 'docs')}
              className="w-full px-5 py-4 flex justify-between items-center bg-main-bg/30 hover:bg-main-bg/50 transition-colors font-bold text-main-text text-sm tap-target"
            >
              <span>💰 Financials & Documents</span>
              <span className="text-black/60">{activeSection === 'docs' ? '▲' : '▼'}</span>
            </button>
            {activeSection === 'docs' && (
              <div className="p-5 border-t border-main-border space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <span className="text-black/60 font-medium block">Security Deposit</span>
                    <span className="text-main-text font-semibold">
                      {tenant.security_deposit_amount ? `₹${tenant.security_deposit_amount.toLocaleString()}` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-black/60 font-medium block">Deposit Pay Date</span>
                    <span className="text-main-text font-semibold">{tenant.security_deposit_date || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-black/60 font-medium block">Expected Move-out Date</span>
                    <span className="text-main-text font-semibold text-amber-700">{tenant.expected_move_out_date || 'N/A'}</span>
                  </div>
                </div>

                {/* File Uploads Block */}
                <div className="border-t border-main-border pt-4 space-y-3">
                  <h4 className="font-bold text-main-text text-xs">📎 ID Documents</h4>
                  
                  {docError && <div className="text-red-500 text-xs font-semibold">{docError}</div>}
                  
                  {/* File List */}
                  {loadingDocs ? (
                    <div className="py-6"><Loader size="sm" label="Loading documents..." /></div>
                  ) : documents.length > 0 ? (
                    <div className="space-y-2">
                      {documents.map((doc, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-main-bg/50 p-2.5 rounded-lg border border-main-border">
                          <div className="truncate max-w-[200px]">
                            <span className="font-semibold text-main-text text-xs block truncate">{doc.name}</span>
                            <span className="text-[10px] text-black/60 block">{(doc.size / 1024).toFixed(1)} KB</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {doc.url && (
                              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-semibold px-2 py-1 bg-emerald-50 rounded hover:bg-emerald-100 border border-emerald-100 text-[10px] tap-target">
                                View
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteDoc(doc.name)}
                              className="text-red-600 font-semibold px-2 py-1 bg-red-50 rounded hover:bg-red-100 border border-red-100 text-[10px] tap-target"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-black/60 text-xs">No documents uploaded yet.</p>
                  )}

                  {/* Drag and Drop / Input Block */}
                  <div className="relative border-2 border-dashed border-main-border rounded-xl p-4 text-center hover:border-gray-400 transition-colors cursor-pointer bg-main-bg/10">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      disabled={uploadingDoc}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="space-y-1">
                      <span className="text-main-text font-semibold text-xs block">
                        {uploadingDoc ? "Uploading..." : "Click or drag to upload ID"}
                      </span>
                      <span className="text-[10px] text-black/60 block">PDF, JPG, PNG up to 5MB</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment History */}
        <div>
          <h3 className="text-sm font-bold text-main-text mb-3">Payment History</h3>
          <div className="space-y-2">
            {tenant.last_paid_date ? (
              <div className="card flex items-center justify-between p-4">
                <div>
                  <h4 className="font-semibold text-sm text-main-text">Latest Payment</h4>
                  <p className="text-black/60 text-xs mt-0.5">Paid on {tenant.last_paid_date}</p>
                </div>
                <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-emerald-100">Paid</span>
              </div>
            ) : (
              <p className="text-black/60 text-sm">No payment history available.</p>
            )}
          </div>
        </div>

        {/* Bottom actions */}
        <div className="pt-4 flex flex-col items-center gap-2.5 pb-8">
          <button onClick={() => setShowEditModal(true)} className="w-full card text-black/60 py-3.5 font-semibold text-sm tap-target hover:border-black/20 transition-colors text-center">
            Edit Tenant Details
          </button>
          
          {tenant.is_active !== false && (
            <button 
              onClick={() => setShowMoveOutSheet(true)}
              className="w-full bg-white text-main-text border border-main-border py-3.5 rounded-lg font-semibold text-sm tap-target flex items-center justify-center gap-2 hover:bg-main-bg transition-colors"
            >
              <LogOut size={16} /> Initiate Move-out
            </button>
          )}

          <button onClick={handleRemoveTenant} disabled={deleting} className="w-full bg-red-50 text-red-600 border border-red-200 font-semibold py-3.5 rounded-lg text-sm tap-target disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
            {deleting ? (
              <>
                <Loader inline size="sm" />
                Removing...
              </>
            ) : "Remove Tenant"}
          </button>
          {deleteError && <p className="text-red-500 text-xs font-medium">{deleteError}</p>}
        </div>
      </div>

      {/* Move Out Sheet */}
      {showMoveOutSheet && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMoveOutSheet(false)} />
          <div className="relative bg-white w-full max-w-[500px] mx-auto rounded-t-2xl shadow-2xl animate-fade-up max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-main-border">
              <h2 className="text-lg font-bold text-main-text flex items-center gap-2">
                <LogOut className="text-accent" size={20} />
                Settle & Move Out
              </h2>
              <button aria-label="Close move out sheet" onClick={() => setShowMoveOutSheet(false)} className="text-black/40 hover:text-main-text p-2 rounded-full hover:bg-main-bg transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <div className="bg-amber-50 text-amber-700 p-3 rounded-lg text-xs font-medium border border-amber-200 mb-5 leading-relaxed">
                This will free up the assigned bed and mark this tenant as inactive. This action will be permanently logged.
              </div>

              {settleError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-5 text-sm font-medium border border-red-200">
                  {settleError}
                </div>
              )}

              <form onSubmit={handleSettleMoveOut} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-main-text mb-1.5">Notice Date</label>
                    <input type="date" value={moveOutNoticeDate} onChange={e => setMoveOutNoticeDate(e.target.value)} className="w-full border border-main-border p-3 text-sm rounded-lg focus:outline-none focus:border-accent transition-all" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-main-text mb-1.5">Actual Move Out</label>
                    <input type="date" value={moveOutActualDate} onChange={e => setMoveOutActualDate(e.target.value)} className="w-full border border-main-border p-3 text-sm rounded-lg focus:outline-none focus:border-accent transition-all" required />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-main-text mb-1.5 flex justify-between">
                    <span>Deposit Returned (₹)</span>
                    <span className="text-black/40 text-xs">Original: {tenant.security_deposit_amount || 0}</span>
                  </label>
                  <input type="number" value={moveOutDepositReturned} onChange={e => setMoveOutDepositReturned(e.target.value)} placeholder="0" className="w-full border border-main-border p-3 text-sm rounded-lg focus:outline-none focus:border-accent transition-all" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-main-text mb-1.5">Deduction Reason <span className="text-black/40 font-normal">(Optional)</span></label>
                  <textarea value={moveOutDeductionReason} onChange={e => setMoveOutDeductionReason(e.target.value)} placeholder="e.g. Painting and cleaning charges" rows={2} className="w-full border border-main-border p-3 text-sm rounded-lg focus:outline-none focus:border-accent transition-all resize-none" />
                </div>

                <div className="pt-4">
                  <button type="submit" disabled={settling} className="w-full bg-main-text text-white py-3.5 rounded-lg font-semibold text-sm tap-target disabled:opacity-70 flex justify-center items-center gap-2 hover:bg-main-text/90 transition-colors">
                    {settling ? <Loader inline size="sm" /> : "Confirm Move Out"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-end justify-center flex-col pb-4 backdrop-blur-[2px]">
          <div className="flex-1 w-full" onClick={() => setShowEditModal(false)} />
          <div className="bg-white w-full max-w-[430px] rounded-t-2xl p-5 mx-auto mt-auto max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-main-text">Edit Tenant</h2>
              <button aria-label="Close edit modal" onClick={() => setShowEditModal(false)} className="text-black/40 hover:text-black/60 p-2 rounded-md hover:bg-gray-100 transition-colors">✕</button>
            </div>
            
            {editError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium border border-red-200">
                {editError}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-main-text mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-main-border p-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-main-text mb-1.5">Phone</label>
                <input 
                  type="tel" 
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full border border-main-border p-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-main-text mb-1.5">Monthly Rent (₹)</label>
                  <input 
                    type="number" 
                    value={editRentAmount}
                    onChange={(e) => setEditRentAmount(e.target.value)}
                    className="w-full border border-main-border p-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-main-text mb-1.5">Move-in Date</label>
                  <input 
                    type="date" 
                    value={editMoveInDate}
                    onChange={(e) => setEditMoveInDate(e.target.value)}
                    className="w-full border border-main-border p-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" 
                  />
                </div>
              </div>

              {/* Collapsible Edit Additional Details */}
              <div className="border border-main-border rounded-xl overflow-hidden mt-3">
                <button
                  type="button"
                  onClick={() => setShowExtendedEdit(!showExtendedEdit)}
                  className="w-full bg-main-bg/50 px-4 py-3 flex items-center justify-between text-xs font-semibold text-main-text hover:bg-main-bg transition-colors tap-target"
                >
                  <span>📋 Edit Additional Details</span>
                  <span className="text-black/60 font-bold">{showExtendedEdit ? '▲' : '▼'}</span>
                </button>
                {showExtendedEdit && (
                  <div className="p-3 bg-white border-t border-main-border space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-main-text mb-1">Aadhaar Last 4</label>
                        <input type="text" placeholder="1234" maxLength={4} value={editAadhaar}
                          onChange={(e) => setEditAadhaar(e.target.value.replace(/\D/g, ''))}
                          className="w-full border border-main-border p-2 text-xs rounded-lg focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-main-text mb-1">PAN Number</label>
                        <input type="text" placeholder="ABCDE1234F" maxLength={10} value={editPan}
                          onChange={(e) => setEditPan(e.target.value)}
                          className="w-full border border-main-border p-2 text-xs rounded-lg focus:outline-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-main-text mb-1">Emergency Name</label>
                        <input type="text" placeholder="Contact Name" value={editEmergencyName}
                          onChange={(e) => setEditEmergencyName(e.target.value)}
                          className="w-full border border-main-border p-2 text-xs rounded-lg focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-main-text mb-1">Emergency Phone</label>
                        <input type="tel" placeholder="Contact Phone" maxLength={10} value={editEmergencyPhone}
                          onChange={(e) => setEditEmergencyPhone(e.target.value.replace(/\D/g, ''))}
                          className="w-full border border-main-border p-2 text-xs rounded-lg focus:outline-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-main-text mb-1">Employer / College</label>
                        <input type="text" placeholder="Company/Univ" value={editEmployer}
                          onChange={(e) => setEditEmployer(e.target.value)}
                          className="w-full border border-main-border p-2 text-xs rounded-lg focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-main-text mb-1">Hometown</label>
                        <input type="text" placeholder="Hometown" value={editHometown}
                          onChange={(e) => setEditHometown(e.target.value)}
                          className="w-full border border-main-border p-2 text-xs rounded-lg focus:outline-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-main-text mb-1">Food Preference</label>
                        <select value={editFood} onChange={(e: any) => setEditFood(e.target.value)}
                          className="w-full border border-main-border p-2 text-xs rounded-lg focus:outline-none bg-white">
                          <option value="veg">Veg</option>
                          <option value="non_veg">Non-Veg</option>
                          <option value="both">Both</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-main-text mb-1">Occupancy Type</label>
                        <select value={editOccupancy} onChange={(e: any) => setEditOccupancy(e.target.value)}
                          className="w-full border border-main-border p-2 text-xs rounded-lg focus:outline-none bg-white">
                          <option value="single">Single</option>
                          <option value="double">Double</option>
                          <option value="triple">Triple</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-main-text mb-1">Vehicle Registration</label>
                      <input type="text" placeholder="KA-01-XX-1234" value={editVehicle}
                        onChange={(e) => setEditVehicle(e.target.value)}
                        className="w-full border border-main-border p-2 text-xs rounded-lg focus:outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-main-text mb-1">Security Deposit (₹)</label>
                        <input type="number" placeholder="Deposit Amount" value={editDeposit}
                          onChange={(e) => setEditDeposit(e.target.value)}
                          className="w-full border border-main-border p-2 text-xs rounded-lg focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-main-text mb-1">Deposit Date</label>
                        <input type="date" value={editDepositDate}
                          onChange={(e) => setEditDepositDate(e.target.value)}
                          className="w-full border border-main-border p-2 text-xs rounded-lg focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-main-text mb-1">Expected Move-out</label>
                      <input type="date" value={editExpectedMoveOut}
                        onChange={(e) => setEditExpectedMoveOut(e.target.value)}
                        className="w-full border border-main-border p-2 text-xs rounded-lg focus:outline-none" />
                    </div>
                    
                    {/* Police verification fields */}
                    <div className="border-t border-main-border pt-2 mt-2 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={editPoliceVerification} onChange={(e) => setEditPoliceVerification(e.target.checked)}
                          className="w-4 h-4 rounded accent-emerald-500" />
                        <span className="text-[11px] font-medium text-main-text">Police Verification Done</span>
                      </label>
                      {editPoliceVerification && (
                        <div>
                          <label className="block text-[11px] font-medium text-main-text mb-1">Verification Date</label>
                          <input type="date" value={editPoliceDate}
                            onChange={(e) => setEditPoliceDate(e.target.value)}
                            className="w-full border border-main-border p-2 text-xs rounded-lg focus:outline-none" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={handleEditSubmit}
              disabled={editing}
              className="w-full bg-main-text text-white py-3.5 rounded-lg text-sm font-semibold tap-target disabled:opacity-70 flex justify-center items-center gap-2 hover:bg-accent transition-colors"
            >
              {editing ? (
                <>
                  <Loader inline size="sm" />
                  Saving...
                </>
              ) : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantDetail;

