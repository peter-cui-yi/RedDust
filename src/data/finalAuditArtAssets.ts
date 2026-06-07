export type FinalAuditArtAsset = {
  key: string;
  title: string;
  role: "audit_hero" | "ending" | "support";
  path: string;
  uiPath: string;
  source: "image2";
  status: "integrated";
  storyArtKey?: string;
};

export const finalAuditArtAssets = {
  rd_day12_final_audit_hero_img2: {
    key: "rd_day12_final_audit_hero_img2",
    title: "Day 12 final audit storm pressure",
    role: "audit_hero",
    path: "assets/final-audit-art/rd_day12_final_audit_hero_img2.png",
    uiPath: "/assets/final-audit-art/rd_day12_final_audit_hero_img2.png",
    source: "image2",
    status: "integrated",
    storyArtKey: "rd_story_day12_final_audit"
  },
  rd_ending_lighthouse_success_img2: {
    key: "rd_ending_lighthouse_success_img2",
    title: "Inside Lighthouse ending",
    role: "ending",
    path: "assets/final-audit-art/rd_ending_lighthouse_success_img2.png",
    uiPath: "/assets/final-audit-art/rd_ending_lighthouse_success_img2.png",
    source: "image2",
    status: "integrated",
    storyArtKey: "rd_ending_lighthouse_success"
  },
  rd_ending_blue_zone_return_img2: {
    key: "rd_ending_blue_zone_return_img2",
    title: "Blue-Zone Return ending",
    role: "ending",
    path: "assets/final-audit-art/rd_ending_blue_zone_return_img2.png",
    uiPath: "/assets/final-audit-art/rd_ending_blue_zone_return_img2.png",
    source: "image2",
    status: "integrated",
    storyArtKey: "rd_ending_blue_zone_return"
  },
  rd_ending_aura_destroyed_img2: {
    key: "rd_ending_aura_destroyed_img2",
    title: "AURA Destroyed ending",
    role: "ending",
    path: "assets/final-audit-art/rd_ending_aura_destroyed_img2.png",
    uiPath: "/assets/final-audit-art/rd_ending_aura_destroyed_img2.png",
    source: "image2",
    status: "integrated",
    storyArtKey: "rd_ending_aura_destroyed"
  },
  rd_ending_aura_revoked_img2: {
    key: "rd_ending_aura_revoked_img2",
    title: "AURA Revoked ending",
    role: "ending",
    path: "assets/final-audit-art/rd_ending_aura_revoked_img2.png",
    uiPath: "/assets/final-audit-art/rd_ending_aura_revoked_img2.png",
    source: "image2",
    status: "integrated",
    storyArtKey: "rd_ending_aura_revoked"
  },
  rd_ending_sinking_img2: {
    key: "rd_ending_sinking_img2",
    title: "Sinking ending",
    role: "ending",
    path: "assets/final-audit-art/rd_ending_sinking_img2.png",
    uiPath: "/assets/final-audit-art/rd_ending_sinking_img2.png",
    source: "image2",
    status: "integrated",
    storyArtKey: "rd_ending_sinking"
  },
  rd_day12_evidence_chains_img2: {
    key: "rd_day12_evidence_chains_img2",
    title: "Day 12 evidence chains",
    role: "support",
    path: "assets/final-audit-art/rd_day12_evidence_chains_img2.png",
    uiPath: "/assets/final-audit-art/rd_day12_evidence_chains_img2.png",
    source: "image2",
    status: "integrated"
  },
  rd_day12_failure_debt_img2: {
    key: "rd_day12_failure_debt_img2",
    title: "Day 12 failure debt",
    role: "support",
    path: "assets/final-audit-art/rd_day12_failure_debt_img2.png",
    uiPath: "/assets/final-audit-art/rd_day12_failure_debt_img2.png",
    source: "image2",
    status: "integrated"
  }
} as const satisfies Record<string, FinalAuditArtAsset>;

export const finalAuditArtByKey = finalAuditArtAssets as Record<string, FinalAuditArtAsset>;
const finalAuditAssetList = Object.values(finalAuditArtAssets) as FinalAuditArtAsset[];

export const finalAuditArtByStoryKey = Object.fromEntries(
  finalAuditAssetList
    .filter((asset) => asset.storyArtKey)
    .map((asset) => [asset.storyArtKey, asset])
) as Record<string, FinalAuditArtAsset>;

export const finalAuditSupportArt = {
  evidenceChains: finalAuditArtAssets.rd_day12_evidence_chains_img2,
  failureDebt: finalAuditArtAssets.rd_day12_failure_debt_img2
} as const;

export function finalAuditArtFor(storyArtKey?: string) {
  if (!storyArtKey) return undefined;
  return finalAuditArtByStoryKey[storyArtKey];
}
