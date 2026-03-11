export type SceneType =
  | "title"
  | "text_reveal"
  | "stat_card"
  | "tool_showcase"
  | "comparison"
  | "list_reveal"
  | "quote"
  | "cta"
  | "transition"
  | "key_insight"
  | "testimonial_card"
  | "split_screen";

export interface BaseScene {
  type: SceneType;
  duration: number; // seconds
}

export interface TitleScene extends BaseScene {
  type: "title";
  text: string;
  subtitle?: string;
  background?: "gradient" | "solid";
  colors?: string[];
}

export interface TextRevealScene extends BaseScene {
  type: "text_reveal";
  heading: string;
  body: string;
  animation?: "typewriter" | "fade" | "slide";
  emphasis_words?: string[];
}

export interface StatCardScene extends BaseScene {
  type: "stat_card";
  stat: string;
  label: string;
  source?: string;
  animation_style?: "count_up" | "scale_in" | "flip";
}

export interface ToolShowcaseScene extends BaseScene {
  type: "tool_showcase";
  tool_name: string;
  description: string;
  price?: string;
  time_saved?: string;
  visual_style?: "product_card" | "terminal_mockup" | "browser_frame";
}

export interface ComparisonScene extends BaseScene {
  type: "comparison";
  before_label: string;
  before_items: string[];
  after_label: string;
  after_items: string[];
}

export interface ListRevealScene extends BaseScene {
  type: "list_reveal";
  heading: string;
  items: string[];
}

export interface QuoteScene extends BaseScene {
  type: "quote";
  text: string;
  attribution?: string;
}

export interface CtaScene extends BaseScene {
  type: "cta";
  text: string;
  subtext?: string;
}

export interface TransitionScene extends BaseScene {
  type: "transition";
  style?: "fade" | "wipe" | "zoom";
}

export interface KeyInsightScene extends BaseScene {
  type: "key_insight";
  text: string;
  subtext?: string;
  animation?: "word_by_word" | "scale_up" | "fade";
}

export interface TestimonialCardScene extends BaseScene {
  type: "testimonial_card";
  quote: string;
  name: string;
  role: string;
  company: string;
  result_metric?: string;
}

export interface SplitScreenScene extends BaseScene {
  type: "split_screen";
  left_heading: string;
  left_content: string;
  right_heading: string;
  right_content: string;
  highlight_side?: "left" | "right";
}

export type Scene =
  | TitleScene
  | TextRevealScene
  | StatCardScene
  | ToolShowcaseScene
  | ComparisonScene
  | ListRevealScene
  | QuoteScene
  | CtaScene
  | TransitionScene
  | KeyInsightScene
  | TestimonialCardScene
  | SplitScreenScene;

export type VideoCompositionProps = Record<string, unknown> & {
  scenes: Scene[];
};
