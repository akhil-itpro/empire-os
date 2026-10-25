// Choices on the /colleges demo form (safe for browser code).

export const DEMO_ROLES = [
  { id: "tpo", label: "Training and placement officer" },
  { id: "placement_staff", label: "Placement cell team" },
  { id: "principal", label: "Principal or director" },
  { id: "faculty", label: "Faculty" },
  { id: "other", label: "Other" },
] as const;

export const BATCH_SIZES = [
  { id: "under_100", label: "Under 100 students" },
  { id: "100_300", label: "100 to 300" },
  { id: "300_600", label: "300 to 600" },
  { id: "over_600", label: "Over 600" },
] as const;
