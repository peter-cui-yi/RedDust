export type DayArtAsset = {
  key: string;
  day: number;
  branch?: "rescue" | "lighthouse";
  title: string;
  role: string;
  source: "image2" | "story-art-fallback";
  path: string;
  uiPath: string;
  status: "integrated" | "needed";
};

export const dayArtAssets = {
  rd_day00_aura_reboot_img2: {
    key: "rd_day00_aura_reboot_img2",
    day: 0,
    title: "Day 0 AURA reboot",
    role: "Prologue daily plan art",
    source: "image2",
    path: "assets/day-art/rd_day00_aura_reboot_img2.png",
    uiPath: "/assets/day-art/rd_day00_aura_reboot_img2.png",
    status: "integrated"
  },
  rd_day01_public_rules_img2: {
    key: "rd_day01_public_rules_img2",
    day: 1,
    title: "Day 1 public rules and sealed door",
    role: "Daily plan art",
    source: "image2",
    path: "assets/day-art/rd_day01_public_rules_img2.png",
    uiPath: "/assets/day-art/rd_day01_public_rules_img2.png",
    status: "integrated"
  },
  rd_day02_water_hygiene_img2: {
    key: "rd_day02_water_hygiene_img2",
    day: 2,
    title: "Day 2 water and hygiene zones",
    role: "Daily plan art",
    source: "image2",
    path: "assets/day-art/rd_day02_water_hygiene_img2.png",
    uiPath: "/assets/day-art/rd_day02_water_hygiene_img2.png",
    status: "integrated"
  },
  rd_day03_medical_ventilation_img2: {
    key: "rd_day03_medical_ventilation_img2",
    day: 3,
    title: "Day 3 medical ventilation pressure",
    role: "Daily plan art",
    source: "image2",
    path: "assets/day-art/rd_day03_medical_ventilation_img2.png",
    uiPath: "/assets/day-art/rd_day03_medical_ventilation_img2.png",
    status: "integrated"
  },
  rd_day04_signal_trap_img2: {
    key: "rd_day04_signal_trap_img2",
    day: 4,
    title: "Day 4 signal or trap",
    role: "Daily plan art",
    source: "image2",
    path: "assets/day-art/rd_day04_signal_trap_img2.png",
    uiPath: "/assets/day-art/rd_day04_signal_trap_img2.png",
    status: "integrated"
  },
  rd_day05_route_care_img2: {
    key: "rd_day05_route_care_img2",
    day: 5,
    title: "Day 5 route and care bag",
    role: "Daily plan art",
    source: "image2",
    path: "assets/day-art/rd_day05_route_care_img2.png",
    uiPath: "/assets/day-art/rd_day05_route_care_img2.png",
    status: "integrated"
  },
  rd_day06_authority_boundary_img2: {
    key: "rd_day06_authority_boundary_img2",
    day: 6,
    title: "Day 6 authority boundary",
    role: "Daily plan art",
    source: "image2",
    path: "assets/day-art/rd_day06_authority_boundary_img2.png",
    uiPath: "/assets/day-art/rd_day06_authority_boundary_img2.png",
    status: "integrated"
  },
  rd_day07_branch_council_img2: {
    key: "rd_day07_branch_council_img2",
    day: 7,
    title: "Day 7 public branch council",
    role: "Daily plan art",
    source: "image2",
    path: "assets/day-art/rd_day07_branch_council_img2.png",
    uiPath: "/assets/day-art/rd_day07_branch_council_img2.png",
    status: "integrated"
  },
  rd_day08a_rescue_contact_img2: {
    key: "rd_day08a_rescue_contact_img2",
    day: 8,
    branch: "rescue",
    title: "Day 8A rescue active contact",
    role: "Branch daily plan art",
    source: "image2",
    path: "assets/day-art/rd_day08a_rescue_contact_img2.png",
    uiPath: "/assets/day-art/rd_day08a_rescue_contact_img2.png",
    status: "integrated"
  },
  rd_day08b_lighthouse_low_power_img2: {
    key: "rd_day08b_lighthouse_low_power_img2",
    day: 8,
    branch: "lighthouse",
    title: "Day 8B low-power autonomy",
    role: "Branch daily plan art",
    source: "image2",
    path: "assets/day-art/rd_day08b_lighthouse_low_power_img2.png",
    uiPath: "/assets/day-art/rd_day08b_lighthouse_low_power_img2.png",
    status: "integrated"
  },
  rd_day09a_rescue_privacy_img2: {
    key: "rd_day09a_rescue_privacy_img2",
    day: 9,
    branch: "rescue",
    title: "Day 9A beacon privacy cost",
    role: "Branch daily plan art",
    source: "image2",
    path: "assets/day-art/rd_day09a_rescue_privacy_img2.png",
    uiPath: "/assets/day-art/rd_day09a_rescue_privacy_img2.png",
    status: "integrated"
  },
  rd_day09b_lighthouse_rules_img2: {
    key: "rd_day09b_lighthouse_rules_img2",
    day: 9,
    branch: "lighthouse",
    title: "Day 9B water medicine rules",
    role: "Branch daily plan art",
    source: "image2",
    path: "assets/day-art/rd_day09b_lighthouse_rules_img2.png",
    uiPath: "/assets/day-art/rd_day09b_lighthouse_rules_img2.png",
    status: "integrated"
  },
  rd_day10a_rescue_rendezvous_img2: {
    key: "rd_day10a_rescue_rendezvous_img2",
    day: 10,
    branch: "rescue",
    title: "Day 10A rendezvous crisis",
    role: "Branch daily plan art",
    source: "image2",
    path: "assets/day-art/rd_day10a_rescue_rendezvous_img2.png",
    uiPath: "/assets/day-art/rd_day10a_rescue_rendezvous_img2.png",
    status: "integrated"
  },
  rd_day10b_lighthouse_override_img2: {
    key: "rd_day10b_lighthouse_override_img2",
    day: 10,
    branch: "lighthouse",
    title: "Day 10B manual override boundary",
    role: "Branch daily plan art",
    source: "image2",
    path: "assets/day-art/rd_day10b_lighthouse_override_img2.png",
    uiPath: "/assets/day-art/rd_day10b_lighthouse_override_img2.png",
    status: "integrated"
  },
  rd_day11_storm_inventory_img2: {
    key: "rd_day11_storm_inventory_img2",
    day: 11,
    title: "Day 11 storm inventory seal",
    role: "Daily plan art",
    source: "image2",
    path: "assets/day-art/rd_day11_storm_inventory_img2.png",
    uiPath: "/assets/day-art/rd_day11_storm_inventory_img2.png",
    status: "integrated"
  },
  rd_day12_final_audit_img2: {
    key: "rd_day12_final_audit_img2",
    day: 12,
    title: "Day 12 final audit",
    role: "Daily final audit art",
    source: "image2",
    path: "assets/day-art/rd_day12_final_audit_img2.png",
    uiPath: "/assets/day-art/rd_day12_final_audit_img2.png",
    status: "integrated"
  }
} as const satisfies Record<string, DayArtAsset>;

export const dayArtByKey = dayArtAssets as Record<string, DayArtAsset>;

export function dayArtFor(day: number, branch?: "rescue" | "lighthouse") {
  const assets = Object.values(dayArtAssets) as DayArtAsset[];
  return (
    assets.find((asset) => asset.day === day && asset.branch === branch) ??
    assets.find((asset) => asset.day === day && !asset.branch)
  );
}
