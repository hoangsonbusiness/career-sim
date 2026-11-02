// SPEC-004 — chuyển một hồ sơ nghề thành nội dung hiển thị. Hàm thuần (R-1): không đọc file, không đổi đối số.
import type { Item, Profession, Source } from "../types/profession";

export type Confidence = "verified" | "single_source" | "needs_verification";

export interface CitationView {
  id: string;
  title: string;
  publisher: string;
  url: string;
  typeLabel: string;
  effectiveDate: string | null;
}

export interface ItemView {
  kind: "fact" | "advice";
  text: string;
  confidence: Confidence | null;
  confidenceLabel: string | null;
  warning: boolean;
  note: string | null;
  citations: CitationView[];
}

export interface GroupView { key: string; heading: string | null; items: ItemView[] }
export interface SectionView { key: string; heading: string; groups: GroupView[] }
export interface LadderStepView { id: string; title: string; description: string | null; items: ItemView[] }

export interface ProfileView {
  id: string;
  name: string;
  aliases: string[];
  groupLabel: string;
  summary: string;
  isDraft: boolean;
  scopeNote: string | null;
  sections: SectionView[];
  ladder: LadderStepView[];
  sources: CitationView[];
  simulationHref: string | null;
}

export class ProfileError extends Error {
  code: "UNKNOWN_SOURCE";
  sourceId: string;
  constructor(sourceId: string) {
    super(`UNKNOWN_SOURCE: ${sourceId}`);
    this.name = "ProfileError";
    this.code = "UNKNOWN_SOURCE";
    this.sourceId = sourceId;
  }
}

// R-5
const CONFIDENCE_LABEL: Record<Confidence, string> = {
  verified: "Đã kiểm chứng",
  single_source: "Một nguồn",
  needs_verification: "Cần kiểm chứng",
};

// R-6
const TYPE_LABEL: Record<Source["type"], string> = {
  law: "Văn bản pháp luật",
  official_stat: "Số liệu chính thức",
  market: "Báo cáo thị trường",
  press: "Báo chí",
  testimony: "Chia sẻ người trong nghề",
  reference: "Tài liệu tham khảo",
};

// R-2: thứ tự và tiêu đề cố định.
const SECTIONS: { key: string; heading: string; groups: [string, string | null][]; pick: (p: Profession) => Record<string, Item[] | undefined> }[] = [
  {
    key: "requirements",
    heading: "Cần học gì để làm nghề này",
    groups: [["thcs", "Ở cấp THCS"], ["thpt", "Ở cấp THPT"], ["higher_ed", "Đại học / Cao đẳng"], ["on_the_job", "Khi đi làm"]],
    pick: (p) => p.requirements,
  },
  {
    key: "working_conditions",
    heading: "Điều kiện làm việc",
    groups: [["schedule", "Thời gian làm việc"], ["income", "Thu nhập"], ["environment", "Môi trường làm việc"]],
    pick: (p) => p.working_conditions,
  },
  { key: "downsides", heading: "Mặt khó của nghề", groups: [["downsides", null]], pick: (p) => ({ downsides: p.downsides }) },
  { key: "future_outlook", heading: "Triển vọng", groups: [["future_outlook", null]], pick: (p) => ({ future_outlook: p.future_outlook }) },
];

function citation(s: Source): CitationView {
  return {
    id: s.id,
    title: s.title,
    publisher: s.publisher,
    url: s.url,
    typeLabel: TYPE_LABEL[s.type],
    effectiveDate: s.effective_date ?? null,
  };
}

export function buildProfileView(p: Profession): ProfileView {
  const byId = new Map(p.sources.map((s) => [s.id, s]));

  const item = (i: Item): ItemView => {
    const confidence = i.confidence ?? null;
    return {
      kind: i.kind,
      text: i.text,
      confidence,
      confidenceLabel: confidence ? CONFIDENCE_LABEL[confidence] : null,
      warning: confidence === "needs_verification", // R-7
      note: i.note ?? null,
      // R-4: giữ thứ tự và phần tử trùng
      citations: (i.source_ids ?? []).map((id) => {
        const s = byId.get(id);
        if (!s) throw new ProfileError(id);
        return citation(s);
      }),
    };
  };

  const sections: SectionView[] = [];
  for (const def of SECTIONS) {
    const data = def.pick(p);
    const groups: GroupView[] = [];
    for (const [key, heading] of def.groups) {
      const items = data[key];
      if (items && items.length > 0) groups.push({ key, heading, items: items.map(item) });
    }
    if (groups.length > 0) sections.push({ key: def.key, heading: def.heading, groups });
  }

  return {
    id: p.id,
    name: p.name,
    aliases: p.aliases ? [...p.aliases] : [],
    groupLabel: p.group.label,
    summary: p.summary,
    isDraft: p.meta.status === "draft",
    scopeNote: p.meta.scope_note ?? null,
    sections,
    ladder: p.career_ladder.nodes.map((n) => ({
      id: n.id,
      title: n.title,
      description: n.description ?? null,
      items: n.requirements.map(item),
    })),
    sources: p.sources.map(citation),
    simulationHref: p.day_simulation ? `/nghe/${p.id}/mot-ngay/` : null, // R-9
  };
}
