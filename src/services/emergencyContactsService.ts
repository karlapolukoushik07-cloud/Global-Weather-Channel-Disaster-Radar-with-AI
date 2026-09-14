import { GeoLocation, EmergencyContact } from "../types/weather";

export function getLocationStorageKey(location: GeoLocation): string {
  // Use country and admin1/name to group locally
  const country = (location.country || "Global").trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
  const area = (location.admin1 || location.name || "Default").trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
  return `emergency_contacts_${country}_${area}`;
}

export function getGeneralLocationKey(location: GeoLocation): string {
  const country = (location.country || "Global").trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
  return `emergency_contacts_${country}`;
}

export function getDefaultEmergencyContacts(location: GeoLocation): EmergencyContact[] {
  const country = (location.country || "").toLowerCase();
  const countryCode = (location.countryCode || "").toUpperCase();
  const lat = location.latitude;
  const lon = location.longitude;
  const locName = (location.name || "").toLowerCase();
  const admin1 = (location.admin1 || "").toLowerCase();

  const isIndia = 
    country.includes("india") || 
    countryCode === "IN" || 
    (lat >= 6 && lat <= 38 && lon >= 68 && lon <= 98) ||
    admin1.includes("odisha") || admin1.includes("bengal") || admin1.includes("tamil") || admin1.includes("andhra") ||
    admin1.includes("maharashtra") || admin1.includes("kerala") || admin1.includes("gujarat") || admin1.includes("delhi");

  const isUSA = 
    country.includes("united states") || 
    country.includes("usa") || 
    countryCode === "US" ||
    (lat >= 24 && lat <= 50 && lon >= -125 && lon <= -66);

  const isUK = 
    country.includes("united kingdom") || 
    country.includes("uk") || 
    country.includes("britain") ||
    countryCode === "GB";

  const isAustralia = 
    country.includes("australia") || 
    countryCode === "AU" ||
    (lat >= -45 && lat <= -10 && lon >= 110 && lon <= 155);

  const isCanada = 
    country.includes("canada") || 
    countryCode === "CA";

  const isJapan = 
    country.includes("japan") || 
    countryCode === "JP";

  if (isIndia) {
    return [
      {
        id: "in-police-112",
        category: "police",
        name: "National Emergency Police (ERSS)",
        department: "Ministry of Home Affairs / State Police Control",
        number: "112",
        description: "Unified pan-India emergency number for immediate police, quick response vehicles (PCR), and patrol units.",
        availableHours: "24/7 Toll-Free"
      },
      {
        id: "in-fire-101",
        category: "fire",
        name: "Fire & Rescue Brigade",
        department: "Fire and Emergency Rescue Services",
        number: "101",
        description: "Urban, industrial and rural fire suppression, structural collapse rescue, and high-water rescue operations.",
        availableHours: "24/7 Toll-Free"
      },
      {
        id: "in-disaster-ndrf-1078",
        category: "disaster",
        name: "National Disaster Response Force (NDRF)",
        department: "NDRF Headquarters & Regional Battalions",
        number: "1078",
        description: "Specialized cyclone landfall evacuation, deep flood rescue boats, storm surge response, and disaster mitigation.",
        availableHours: "24/7 Control Room (011-24363260)"
      },
      {
        id: "in-disaster-sdma-1070",
        category: "disaster",
        name: "State Disaster Management Authority (SDMA / SEOC)",
        department: "State Relief Commissioner & Disaster Cell",
        number: "1070",
        description: "State-level emergency operations center, multi-hazard early warning broadcasts, and cyclone shelter allocation.",
        availableHours: "24/7 Toll-Free"
      },
      {
        id: "in-disaster-ddma-1077",
        category: "disaster",
        name: "District Disaster Management Authority (DDMA)",
        department: "District Magistrate / Collector Emergency Control",
        number: "1077",
        description: "District-level control room for local relief distribution, evacuation transport, de-watering pumps, and shelter camps.",
        availableHours: "24/7 Toll-Free"
      },
      {
        id: "in-medical-108",
        category: "medical",
        name: "Emergency Medical & Critical Ambulance",
        department: "National Health Mission / EMRI 108",
        number: "108",
        description: "Rapid response ambulance with emergency oxygen, trained paramedics, and direct trauma center admission.",
        availableHours: "24/7 Toll-Free"
      },
      {
        id: "in-coastguard-1554",
        category: "coastguard",
        name: "Indian Coast Guard Maritime Search & Rescue",
        department: "Ministry of Defence / Maritime Rescue Center",
        number: "1554",
        description: "Dedicated maritime distress helpline for fishermen, coastal vessels, storm surge evacuations, and sea rescue.",
        availableHours: "24/7 Toll-Free"
      }
    ];
  }

  if (isUSA) {
    return [
      {
        id: "us-police-911",
        category: "police",
        name: "Emergency Police Dispatch",
        department: "Local Police / Sheriff Dept",
        number: "911",
        description: "Immediate emergency law enforcement dispatch and active crime response.",
        availableHours: "24/7 Toll-Free"
      },
      {
        id: "us-fire-911",
        category: "fire",
        name: "Fire & Heavy Rescue Service",
        department: "Municipal Fire Department",
        number: "911",
        description: "Structural fire suppression, vehicle extrication, hazardous materials, and flood rescue.",
        availableHours: "24/7 Toll-Free"
      },
      {
        id: "us-disaster-fema",
        category: "disaster",
        name: "FEMA Disaster Assistance & Relief",
        department: "Federal Emergency Management Agency",
        number: "1-800-621-3362",
        description: "Federal disaster recovery, temporary emergency housing, grants, and flood relief registration.",
        availableHours: "24/7 Toll-Free"
      },
      {
        id: "us-disaster-community-211",
        category: "disaster",
        name: "Community Disaster & Shelter Helpline",
        department: "Emergency Management & United Way",
        number: "211",
        description: "Local shelter locations, cooling/warming centers, evacuation routes, food distribution, and crisis resources.",
        availableHours: "24/7 Toll-Free"
      },
      {
        id: "us-medical-911",
        category: "medical",
        name: "Paramedic & Emergency Medical Services (EMS)",
        department: "Emergency Medical Transport",
        number: "911",
        description: "Advanced life support ambulances and hospital emergency transport.",
        availableHours: "24/7 Toll-Free"
      },
      {
        id: "us-coastguard-sar",
        category: "coastguard",
        name: "US Coast Guard Search & Rescue Command",
        department: "Department of Homeland Security",
        number: "1-800-323-7233",
        description: "Offshore maritime distress, coastal hurricane search & rescue, and marine flood response.",
        availableHours: "24/7 Toll-Free"
      }
    ];
  }

  if (isUK) {
    return [
      {
        id: "uk-emergency-999",
        category: "police",
        name: "Emergency Police Dispatch",
        department: "Police Service",
        number: "999",
        description: "Primary emergency number for urgent police dispatch (112 also works).",
        availableHours: "24/7 Toll-Free"
      },
      {
        id: "uk-fire-999",
        category: "fire",
        name: "Fire and Rescue Service",
        department: "County Fire Brigade",
        number: "999",
        description: "Firefighting, flood rescue, road traffic collisions, and chemical incidents.",
        availableHours: "24/7 Toll-Free"
      },
      {
        id: "uk-disaster-floodline",
        category: "disaster",
        name: "Environment Agency Floodline",
        department: "UK Environment Agency",
        number: "0345 988 1188",
        description: "24-hour river flood warnings, sea surge barriers, and sandbag distribution advice.",
        availableHours: "24/7 National Hotline"
      },
      {
        id: "uk-medical-999",
        category: "medical",
        name: "NHS Ambulance & Paramedic Service",
        department: "National Health Service",
        number: "999",
        description: "Emergency ambulance transport for life-threatening medical emergencies.",
        availableHours: "24/7 Toll-Free"
      },
      {
        id: "uk-police-nonemergency",
        category: "police",
        name: "Non-Emergency Police Inquiry",
        department: "Local Constabulary",
        number: "101",
        description: "Reporting storm damage, localized road blockages, and non-life-threatening incidents.",
        availableHours: "24/7 Nationwide"
      }
    ];
  }

  if (isAustralia) {
    return [
      {
        id: "au-emergency-000",
        category: "police",
        name: "Police Emergency (Triple Zero)",
        department: "State Police Service",
        number: "000",
        description: "Immediate emergency police response across all Australian states and territories.",
        availableHours: "24/7 Toll-Free"
      },
      {
        id: "au-fire-000",
        category: "fire",
        name: "Fire and Rescue / Bushfire Service",
        department: "Fire & Rescue / Rural Fire Service (RFS)",
        number: "000",
        description: "Bushfire containment, urban structural fires, and catastrophic wildfire warnings.",
        availableHours: "24/7 Toll-Free"
      },
      {
        id: "au-disaster-ses-132500",
        category: "disaster",
        name: "State Emergency Service (SES Flood & Storm)",
        department: "State Emergency Service (SES)",
        number: "132 500",
        description: "Emergency flood response, tarping damaged roofs, fallen trees on houses, and sandbagging.",
        availableHours: "24/7 Toll-Free"
      },
      {
        id: "au-medical-000",
        category: "medical",
        name: "Ambulance Emergency Service",
        department: "State Ambulance Service",
        number: "000",
        description: "Emergency paramedics and mobile intensive care ambulances.",
        availableHours: "24/7 Toll-Free"
      }
    ];
  }

  if (isCanada) {
    return [
      {
        id: "ca-emergency-911",
        category: "police",
        name: "Emergency Police Dispatch",
        department: "RCMP / Regional Police",
        number: "911",
        description: "Immediate emergency police response across Canada.",
        availableHours: "24/7 Toll-Free"
      },
      {
        id: "ca-fire-911",
        category: "fire",
        name: "Fire & Rescue Service",
        department: "Municipal Fire Department",
        number: "911",
        description: "Wildfire and structural fire suppression, ice and water rescue.",
        availableHours: "24/7 Toll-Free"
      },
      {
        id: "ca-disaster-211",
        category: "disaster",
        name: "Community & Disaster Support Helpline",
        department: "Provincial Emergency Management",
        number: "211",
        description: "Evacuation center information, flood support, and emergency assistance.",
        availableHours: "24/7 Toll-Free"
      },
      {
        id: "ca-medical-911",
        category: "medical",
        name: "Emergency Paramedic Services",
        department: "Ambulance Operations",
        number: "911",
        description: "Emergency medical transport and paramedics.",
        availableHours: "24/7 Toll-Free"
      }
    ];
  }

  if (isJapan) {
    return [
      {
        id: "jp-police-110",
        category: "police",
        name: "Police Emergency (Keisatsu)",
        department: "National Police Agency",
        number: "110",
        description: "Immediate police emergency response and traffic safety.",
        availableHours: "24/7 Toll-Free"
      },
      {
        id: "jp-fire-119",
        category: "fire",
        name: "Fire & Rescue Service (Shobou)",
        department: "Municipal Fire Department",
        number: "119",
        description: "Firefighting, disaster response, and rescue during typhoons and earthquakes.",
        availableHours: "24/7 Toll-Free"
      },
      {
        id: "jp-disaster-171",
        category: "disaster",
        name: "Disaster Emergency Message Dial",
        department: "Disaster Information Network",
        number: "171",
        description: "Voice message service used when phone lines are congested following severe earthquakes or typhoons.",
        availableHours: "Activated During Disasters"
      },
      {
        id: "jp-medical-119",
        category: "medical",
        name: "Ambulance Emergency (Kyukyu)",
        department: "Emergency Medical Transport",
        number: "119",
        description: "Emergency ambulance transport to certified acute medical centers.",
        availableHours: "24/7 Toll-Free"
      },
      {
        id: "jp-coastguard-118",
        category: "coastguard",
        name: "Japan Coast Guard (Kaijou Hoan-chou)",
        department: "Ministry of Land, Infrastructure & Transport",
        number: "118",
        description: "Maritime rescue, storm surge alerts, and accidents at sea.",
        availableHours: "24/7 Toll-Free"
      }
    ];
  }

  // Universal Global Default
  return [
    {
      id: "global-emergency-112",
      category: "police",
      name: "Universal Emergency Police & Dispatch",
      department: "Emergency Response Center",
      number: "112",
      description: "Standard international emergency telephone number routed to nearest police emergency center.",
      availableHours: "24/7 Toll-Free"
    },
    {
      id: "global-fire-112",
      category: "fire",
      name: "Fire and Heavy Rescue Operations",
      department: "Local Fire & Emergency Brigade",
      number: "112",
      description: "Emergency fire suppression, structural safety, and rapid flood water rescue.",
      availableHours: "24/7 Toll-Free"
    },
    {
      id: "global-disaster-management",
      category: "disaster",
      name: "Disaster Management & Civil Protection",
      department: "Regional Civil Defense Authority",
      number: "112",
      description: "National emergency coordination during severe cyclones, floods, tsunamis, and severe weather.",
      availableHours: "24/7 Emergency Cell"
    },
    {
      id: "global-medical-112",
      category: "medical",
      name: "Emergency Medical Ambulance",
      department: "Health Emergency Transport",
      number: "112",
      description: "Urgent paramedic assistance and trauma transport.",
      availableHours: "24/7 Toll-Free"
    }
  ];
}

export function loadSavedEmergencyContacts(location: GeoLocation): EmergencyContact[] {
  const specificKey = getLocationStorageKey(location);
  const generalKey = getGeneralLocationKey(location);

  const specificSaved = localStorage.getItem(specificKey);
  if (specificSaved) {
    try {
      const parsed = JSON.parse(specificSaved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.warn("Failed to parse saved emergency contacts:", e);
    }
  }

  const generalSaved = localStorage.getItem(generalKey);
  if (generalSaved) {
    try {
      const parsed = JSON.parse(generalSaved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.warn("Failed to parse saved general emergency contacts:", e);
    }
  }

  return getDefaultEmergencyContacts(location);
}

export function saveEmergencyContacts(location: GeoLocation, contacts: EmergencyContact[]): void {
  const specificKey = getLocationStorageKey(location);
  const generalKey = getGeneralLocationKey(location);
  const jsonStr = JSON.stringify(contacts);
  localStorage.setItem(specificKey, jsonStr);
  localStorage.setItem(generalKey, jsonStr);
}

export function resetEmergencyContactsToDefault(location: GeoLocation): EmergencyContact[] {
  const specificKey = getLocationStorageKey(location);
  const generalKey = getGeneralLocationKey(location);
  localStorage.removeItem(specificKey);
  localStorage.removeItem(generalKey);
  return getDefaultEmergencyContacts(location);
}
