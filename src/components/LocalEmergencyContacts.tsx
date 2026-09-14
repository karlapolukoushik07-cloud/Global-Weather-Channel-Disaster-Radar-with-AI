import React, { useState, useEffect } from "react";
import { GeoLocation, EmergencyContact, EmergencyCategory } from "../types/weather";
import { 
  loadSavedEmergencyContacts, 
  saveEmergencyContacts, 
  resetEmergencyContactsToDefault 
} from "../services/emergencyContactsService";
import { 
  ShieldAlert, 
  Phone, 
  PhoneCall, 
  Flame, 
  Shield, 
  Building2, 
  HeartPulse, 
  Waves, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  RotateCcw, 
  Check, 
  Copy, 
  Clock, 
  MapPin, 
  AlertTriangle,
  Info,
  X
} from "lucide-react";

interface LocalEmergencyContactsProps {
  currentLocation: GeoLocation;
  isCompactModal?: boolean;
  onCloseModal?: () => void;
}

export const LocalEmergencyContacts: React.FC<LocalEmergencyContactsProps> = ({
  currentLocation,
  isCompactModal = false,
  onCloseModal
}) => {
  const [contacts, setContacts] = useState<EmergencyContact[]>(() => {
    return loadSavedEmergencyContacts(currentLocation);
  });

  const [selectedCategory, setSelectedCategory] = useState<"all" | EmergencyCategory>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);

  // New Contact Form State
  const [newCategory, setNewCategory] = useState<EmergencyCategory>("disaster");
  const [newName, setNewName] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newNumber, setNewNumber] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newHours, setNewHours] = useState("24/7 Control Room");

  // Edit Contact Form State
  const [editName, setEditName] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editNumber, setEditNumber] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editHours, setEditHours] = useState("");

  // When location changes, reload contacts for that location
  useEffect(() => {
    const loaded = loadSavedEmergencyContacts(currentLocation);
    setContacts(loaded);
    setIsAddingNew(false);
    setEditingContactId(null);
  }, [currentLocation.name, currentLocation.country, currentLocation.admin1]);

  const handleCopyNumber = (contact: EmergencyContact) => {
    navigator.clipboard.writeText(contact.number);
    setCopiedId(contact.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2200);
  };

  const handleSaveAll = () => {
    saveEmergencyContacts(currentLocation, contacts);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2800);
  };

  const handleResetToDefaults = () => {
    if (window.confirm(`Reset emergency contact numbers for ${currentLocation.name} to verified official defaults?`)) {
      const defaults = resetEmergencyContactsToDefault(currentLocation);
      setContacts(defaults);
      setEditingContactId(null);
      setIsAddingNew(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleDeleteContact = (id: string) => {
    const updated = contacts.filter(c => c.id !== id);
    setContacts(updated);
    saveEmergencyContacts(currentLocation, updated);
  };

  const startEditing = (c: EmergencyContact) => {
    setEditingContactId(c.id);
    setEditName(c.name);
    setEditDepartment(c.department);
    setEditNumber(c.number);
    setEditDescription(c.description);
    setEditHours(c.availableHours);
    setIsAddingNew(false);
  };

  const saveEdit = (id: string) => {
    if (!editNumber.trim()) return;
    const updated = contacts.map(c => {
      if (c.id === id) {
        return {
          ...c,
          name: editName.trim() || c.name,
          department: editDepartment.trim() || c.department,
          number: editNumber.trim(),
          description: editDescription.trim() || c.description,
          availableHours: editHours.trim() || c.availableHours
        };
      }
      return c;
    });
    setContacts(updated);
    saveEmergencyContacts(currentLocation, updated);
    setEditingContactId(null);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleAddNewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber.trim() || !newName.trim()) return;

    const newContact: EmergencyContact = {
      id: `custom-${Date.now()}`,
      category: newCategory,
      name: newName.trim(),
      department: newDepartment.trim() || `${currentLocation.name} Local Emergency`,
      number: newNumber.trim(),
      description: newDescription.trim() || "Local emergency assistance contact",
      availableHours: newHours.trim() || "24/7",
      isCustom: true
    };

    const updated = [newContact, ...contacts];
    setContacts(updated);
    saveEmergencyContacts(currentLocation, updated);

    // Reset form
    setNewName("");
    setNewDepartment("");
    setNewNumber("");
    setNewDescription("");
    setNewHours("24/7 Control Room");
    setIsAddingNew(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const getCategoryIcon = (category: EmergencyCategory) => {
    switch (category) {
      case "police":
        return <Shield className="w-5 h-5 text-blue-400" />;
      case "fire":
        return <Flame className="w-5 h-5 text-rose-400" />;
      case "disaster":
        return <Building2 className="w-5 h-5 text-amber-400" />;
      case "medical":
        return <HeartPulse className="w-5 h-5 text-emerald-400" />;
      case "coastguard":
        return <Waves className="w-5 h-5 text-cyan-400" />;
      default:
        return <ShieldAlert className="w-5 h-5 text-indigo-400" />;
    }
  };

  const getCategoryBadgeClass = (category: EmergencyCategory) => {
    switch (category) {
      case "police":
        return "bg-blue-950/80 text-blue-300 border-blue-600/40";
      case "fire":
        return "bg-rose-950/80 text-rose-300 border-rose-600/40";
      case "disaster":
        return "bg-amber-950/80 text-amber-300 border-amber-600/40";
      case "medical":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-600/40";
      case "coastguard":
        return "bg-cyan-950/80 text-cyan-300 border-cyan-600/40";
      default:
        return "bg-indigo-950/80 text-indigo-300 border-indigo-600/40";
    }
  };

  const filteredContacts = selectedCategory === "all"
    ? contacts
    : contacts.filter(c => c.category === selectedCategory);

  return (
    <section 
      id="emergency-services-contacts-section"
      className={`rounded-2xl bg-gradient-to-br from-slate-900 via-[#0e1628] to-slate-900 border-2 border-red-500/40 shadow-2xl shadow-red-950/30 overflow-hidden relative ${
        isCompactModal ? "p-0" : "mt-6"
      }`}
    >
      {/* Top Warning Accent Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />

      {/* Header Container */}
      <div className="p-5 sm:p-6 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/60 backdrop-blur-sm">
        <div className="flex items-start space-x-3.5">
          <div className="p-3 rounded-2xl bg-red-950/90 text-red-400 border border-red-600/50 shadow-lg shadow-red-950/50 flex-shrink-0">
            <ShieldAlert className="w-7 h-7 animate-pulse text-red-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight font-sans">
                Local Emergency Services & Helplines
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white shadow-sm">
                24/7 SOS Ready
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <span>Location:</span>
              <strong className="text-white font-bold">{currentLocation.name}</strong>
              {currentLocation.admin1 && <span className="text-slate-400">({currentLocation.admin1})</span>}
              <span className="text-slate-400">• {currentLocation.country}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          <button
            id="add-emergency-contact-btn"
            onClick={() => {
              setIsAddingNew(!isAddingNew);
              setEditingContactId(null);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition flex items-center space-x-1.5 shadow-sm active:scale-95"
            title="Add a custom local emergency number"
          >
            {isAddingNew ? <X className="w-4 h-4 text-slate-400" /> : <Plus className="w-4 h-4 text-amber-400" />}
            <span>{isAddingNew ? "Cancel" : "Add Number"}</span>
          </button>

          <button
            id="save-emergency-contacts-btn"
            onClick={handleSaveAll}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md active:scale-95 ${
              saveSuccess 
                ? "bg-emerald-600 text-white border border-emerald-400 shadow-emerald-900/40" 
                : "bg-red-600 hover:bg-red-500 text-white border border-red-500 shadow-red-950/50"
            }`}
            title="Save custom contact numbers to browser storage"
          >
            {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saveSuccess ? "Saved Successfully!" : "Save Numbers"}</span>
          </button>

          <button
            id="reset-emergency-contacts-btn"
            onClick={handleResetToDefaults}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/80 transition"
            title="Reset to official regional helpline numbers"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {isCompactModal && onCloseModal && (
            <button
              onClick={onCloseModal}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80 transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Info & Location Awareness Notice */}
      <div className="bg-slate-950/70 px-5 sm:px-6 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            Numbers automatically calibrated for <strong className="text-white font-bold">{currentLocation.name}</strong>. In immediate life-threatening situations, tap <strong>Call Now</strong>.
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          Saved Locally in Browser
        </span>
      </div>

      {/* Add Custom Emergency Contact Form */}
      {isAddingNew && (
        <div className="p-5 sm:p-6 bg-slate-950/90 border-b border-slate-800 animate-fadeIn">
          <form onSubmit={handleAddNewSubmit} className="space-y-4 max-w-3xl">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold uppercase tracking-wider text-amber-300 flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Save Local Emergency Helpline for {currentLocation.name}</span>
              </h4>
              <button 
                type="button" 
                onClick={() => setIsAddingNew(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
                  Emergency Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as EmergencyCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium text-sm focus:outline-none focus:border-red-500"
                >
                  <option value="police">Police & Law Enforcement</option>
                  <option value="fire">Fire & Rescue Service</option>
                  <option value="disaster">Disaster Management / Control Room (NDRF/SDMA)</option>
                  <option value="medical">Ambulance & Hospital Trauma</option>
                  <option value="coastguard">Coast Guard & Marine Rescue</option>
                  <option value="custom">Custom Helpline / Local Volunteer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
                  Helpline Name / Department *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., District Collector Disaster Control Room"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium text-sm placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
                  Emergency Phone Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 1077 or +91-674-2534177"
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-sm placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
                  Operating Hours / Shift
                </label>
                <input
                  type="text"
                  placeholder="e.g., 24/7 Toll-Free or 24/7 Control Room"
                  value={newHours}
                  onChange={(e) => setNewHours(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium text-sm placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
                  Description / Purpose of Helpline
                </label>
                <input
                  type="text"
                  placeholder="e.g., Cyclone evacuation buses, flood boats, drinking water tankers"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium text-sm placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center space-x-1.5 shadow-md shadow-amber-500/20"
              >
                <Save className="w-4 h-4" />
                <span>Save to Local Directory</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="p-4 sm:p-5 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
        <div className="flex items-center space-x-2 text-xs font-bold">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition border ${
              selectedCategory === "all"
                ? "bg-red-600 text-white border-red-500 shadow-md shadow-red-950/40"
                : "bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800"
            }`}
          >
            All Helplines ({contacts.length})
          </button>

          <button
            onClick={() => setSelectedCategory("police")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition border flex items-center space-x-1.5 ${
              selectedCategory === "police"
                ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-950/40"
                : "bg-slate-900/80 text-blue-300 border-slate-800 hover:bg-slate-800"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Police ({contacts.filter(c => c.category === "police").length})</span>
          </button>

          <button
            onClick={() => setSelectedCategory("fire")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition border flex items-center space-x-1.5 ${
              selectedCategory === "fire"
                ? "bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/40"
                : "bg-slate-900/80 text-rose-300 border-slate-800 hover:bg-slate-800"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Fire & Rescue ({contacts.filter(c => c.category === "fire").length})</span>
          </button>

          <button
            onClick={() => setSelectedCategory("disaster")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition border flex items-center space-x-1.5 ${
              selectedCategory === "disaster"
                ? "bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-950/40"
                : "bg-slate-900/80 text-amber-300 border-slate-800 hover:bg-slate-800"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Disaster Relief ({contacts.filter(c => c.category === "disaster").length})</span>
          </button>

          <button
            onClick={() => setSelectedCategory("medical")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition border flex items-center space-x-1.5 ${
              selectedCategory === "medical"
                ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40"
                : "bg-slate-900/80 text-emerald-300 border-slate-800 hover:bg-slate-800"
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Medical ({contacts.filter(c => c.category === "medical").length})</span>
          </button>

          {contacts.some(c => c.category === "coastguard") && (
            <button
              onClick={() => setSelectedCategory("coastguard")}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition border flex items-center space-x-1.5 ${
                selectedCategory === "coastguard"
                  ? "bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-950/40"
                  : "bg-slate-900/80 text-cyan-300 border-slate-800 hover:bg-slate-800"
              }`}
            >
              <Waves className="w-3.5 h-3.5" />
              <span>Coast Guard</span>
            </button>
          )}
        </div>
      </div>

      {/* Contact Cards Grid */}
      <div className="p-5 sm:p-6">
        {filteredContacts.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <AlertTriangle className="w-10 h-10 text-amber-400/60 mx-auto mb-2" />
            <p className="font-bold text-white">No contacts in this category</p>
            <p className="text-xs mt-1">Tap "Add Number" to register a local station number.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map((contact) => {
              const isEditing = editingContactId === contact.id;

              return (
                <div
                  key={contact.id}
                  className="rounded-xl bg-slate-950/90 border border-slate-800/90 hover:border-slate-700 transition flex flex-col justify-between p-4 sm:p-5 shadow-lg relative group"
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                          {getCategoryIcon(contact.category)}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${getCategoryBadgeClass(contact.category)}`}>
                          {contact.category.toUpperCase()}
                        </span>
                      </div>

                      {/* Card Edit / Delete Actions */}
                      <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition">
                        <button
                          onClick={() => isEditing ? saveEdit(contact.id) : startEditing(contact)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title={isEditing ? "Save changes" : "Edit number or details"}
                        >
                          {isEditing ? <Check className="w-4 h-4 text-emerald-400" /> : <Edit3 className="w-3.5 h-3.5" />}
                        </button>
                        {(contact.isCustom || contacts.length > 3) && (
                          <button
                            onClick={() => handleDeleteContact(contact.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/50 transition"
                            title="Delete this contact"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Title & Department */}
                    {isEditing ? (
                      <div className="space-y-2 mt-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Contact Title"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 text-white font-bold text-sm border border-slate-700"
                        />
                        <input
                          type="text"
                          value={editDepartment}
                          onChange={(e) => setEditDepartment(e.target.value)}
                          placeholder="Department"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 text-slate-300 text-xs border border-slate-700"
                        />
                      </div>
                    ) : (
                      <div className="mt-1">
                        <h4 className="font-extrabold text-white text-base tracking-tight leading-snug">
                          {contact.name}
                        </h4>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          {contact.department}
                        </p>
                      </div>
                    )}

                    {/* Description */}
                    {isEditing ? (
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Description of emergency service"
                        className="w-full px-2.5 py-1.5 mt-2 rounded-lg bg-slate-900 text-slate-300 text-xs border border-slate-700"
                        rows={2}
                      />
                    ) : (
                      <p className="text-xs text-slate-300 mt-2.5 leading-relaxed font-normal">
                        {contact.description}
                      </p>
                    )}
                  </div>

                  {/* Phone Number Display & Dial Button */}
                  <div className="mt-4 pt-3.5 border-t border-slate-800/80">
                    <div className="flex items-center justify-between mb-2.5">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editNumber}
                          onChange={(e) => setEditNumber(e.target.value)}
                          placeholder="Phone Number"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 text-white font-mono font-bold text-base border border-slate-700"
                        />
                      ) : (
                        <div className="flex items-baseline space-x-2">
                          <span className="font-mono text-xl sm:text-2xl font-black text-white tracking-wide">
                            {contact.number}
                          </span>
                        </div>
                      )}
                      
                      {!isEditing && (
                        <button
                          onClick={() => handleCopyNumber(contact)}
                          className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition flex items-center space-x-1"
                          title="Copy phone number"
                        >
                          {copiedId === contact.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-[11px] text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[11px]">Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Operational Hours Tag & Call Now Link */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{contact.availableHours}</span>
                      </span>

                      <a
                        href={`tel:${contact.number.replace(/[^0-9+]/g, "")}`}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-red-600 hover:bg-red-500 text-white transition flex items-center space-x-1.5 shadow-md shadow-red-950/60 active:scale-95 flex-shrink-0"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Call Now</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Safety Notice Footer */}
      <div className="p-4 bg-slate-950/80 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Keep this list accessible during power outages, cyclones, floods, or severe weather conditions.</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSaveAll}
            className="text-amber-400 hover:underline font-bold"
          >
            Save All Changes
          </button>
        </div>
      </div>
    </section>
  );
};
