/* SINH TỰ ĐỘNG — không sửa tay. Nguồn: schema/profession.schema.json. Sinh lại: npm run types */

export type Item = {
  kind: "fact" | "advice";
  text: string;
  source_ids?: string[];
  confidence?: "verified" | "single_source" | "needs_verification";
  /**
   * Bỏ trống = mọi đối tượng
   */
  audience?: ("thcs" | "thpt" | "sinh_vien")[];
  /**
   * Công thức tính, mâu thuẫn nguồn, việc cần kiểm chứng thêm
   */
  note?: string;
};
/**
 * Dành cho học sinh THCS: nên mạnh gì, đi đường nào
 */
export type ItemList = Item[];
/**
 * Tổ hợp môn, ngành học
 */
export type ItemList1 = Item[];
/**
 * Bằng cấp, chứng chỉ bắt buộc
 */
export type ItemList2 = Item[];
/**
 * Tuyển dụng, thử thách, chuẩn nghề nghiệp khi đi làm
 */
export type ItemList3 = Item[];
export type ItemList4 = Item[];
/**
 * Fact có nguồn chứng minh công việc này có thật
 */
export type Item1 = {
  kind: "fact" | "advice";
  text: string;
  source_ids?: string[];
  confidence?: "verified" | "single_source" | "needs_verification";
  /**
   * Bỏ trống = mọi đối tượng
   */
  audience?: ("thcs" | "thpt" | "sinh_vien")[];
  /**
   * Công thức tính, mâu thuẫn nguồn, việc cần kiểm chứng thêm
   */
  note?: string;
};
export type Task = {
  type: "sequence" | "choice" | "drag_sort" | "spot_error" | "dialogue" | "time_budget";
  prompt: string;
  duration_sec?: number;
};
/**
 * @minItems 3
 */
export type ItemList5 = [Item, Item, Item, ...Item[]];

/**
 * Hồ sơ một nghề. Mọi dữ kiện (Item kind=fact) phải trỏ tới sources[]. Xem CLAUDE.md mục R1–R7.
 */
export interface Profession {
  id: string;
  name: string;
  aliases?: string[];
  group: {
    /**
     * Nhóm ngành hiển thị, ví dụ 'Giáo dục & Đào tạo'
     */
    label: string;
    /**
     * Mã Danh mục nghề nghiệp VN (QĐ 34/2020/QĐ-TTg) nếu đã xác minh
     */
    vsco_code?: string;
  };
  /**
   * RIASEC, sắp theo mức độ phù hợp giảm dần
   *
   * @minItems 1
   * @maxItems 3
   */
  holland:
    | ["R" | "I" | "A" | "S" | "E" | "C"]
    | ["R" | "I" | "A" | "S" | "E" | "C", "R" | "I" | "A" | "S" | "E" | "C"]
    | ["R" | "I" | "A" | "S" | "E" | "C", "R" | "I" | "A" | "S" | "E" | "C", "R" | "I" | "A" | "S" | "E" | "C"];
  summary: string;
  /**
   * @minItems 1
   */
  sources: [Source, ...Source[]];
  requirements: {
    thcs: ItemList;
    thpt: ItemList1;
    higher_ed: ItemList2;
    on_the_job: ItemList3;
  };
  working_conditions: {
    schedule: ItemList4;
    income: ItemList4;
    environment?: ItemList4;
  };
  day_simulation?: DaySimulation;
  career_ladder: CareerLadder;
  downsides: ItemList5;
  future_outlook?: ItemList4;
  meta: {
    status: "draft" | "reviewed";
    researched_at: string;
    researched_by: string;
    reviewed_by?: string;
    reviewed_at?: string;
    /**
     * Phạm vi áp dụng, ví dụ 'Áp dụng cho trường công lập'
     */
    scope_note?: string;
  };
}
export interface Source {
  id: string;
  type: "law" | "official_stat" | "market" | "press" | "testimony" | "reference";
  title: string;
  /**
   * Cơ quan ban hành hoặc trang đăng
   */
  publisher: string;
  url: string;
  accessed: string;
  issued_date?: string;
  /**
   * Bắt buộc với type=law (validator kiểm tra)
   */
  effective_date?: string;
  /**
   * Văn bản bị thay thế, nếu có
   */
  supersedes?: string;
  note?: string;
}
export interface DaySimulation {
  /**
   * Nhân vật người chơi nhập vai
   */
  persona: string;
  setting: string;
  time_is_illustrative: true;
  /**
   * @minItems 2
   * @maxItems 4
   */
  stats: [Stat, Stat] | [Stat, Stat, Stat] | [Stat, Stat, Stat, Stat];
  /**
   * @minItems 6
   */
  segments: [Segment, Segment, Segment, Segment, Segment, Segment, ...Segment[]];
  reflection_questions?: string[];
}
export interface Stat {
  id: string;
  label: string;
  initial: number;
}
export interface Segment {
  id: string;
  time: string;
  title: string;
  /**
   * Hư cấu minh họa (R6)
   */
  narrative: string;
  basis: Item1;
  task: Task;
}
export interface CareerLadder {
  /**
   * @minItems 2
   */
  nodes: [LadderNode, LadderNode, ...LadderNode[]];
  edges: {
    from: string;
    to: string;
    type: "promotion" | "management" | "lateral";
    label?: string;
  }[];
}
export interface LadderNode {
  id: string;
  title: string;
  description?: string;
  requirements: ItemList4;
}
