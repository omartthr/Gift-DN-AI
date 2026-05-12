export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  language: "tr" | "en";
  stripe_customer_id?: string;
  subscription_status?: string;
  price_id?: string;
  current_period_end?: string;
  created_at: string;
}

export interface InitialChips {
  recipients: string[];
  budget: string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface QuizSession {
  id: string;
  user_id: string;
  initial_chips: InitialChips;
  conversation_history: ConversationMessage[];
  current_turn: number;
  confidence_score: number;
  status: "active" | "completed" | "abandoned";
  language: "tr" | "en";
  created_at: string;
  updated_at: string;
}

export interface SerpResult {
  title: string;
  link: string;
  thumbnail: string;
  price: string;
  source: string;
}

export interface GiftSuggestion {
  id: string;
  session_id: string;
  product_name: string;
  product_description: string;
  reasoning: string;
  serp_results: SerpResult[];
  product_link: string;
  product_image: string;
  current_price: string;
  source_store: string;
  source_icon?: string;
  rating?: number;
  thumbnails?: string[];
  rank: number;
  created_at: string;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  session_id: string;
  suggestion_id: string;
  product_name: string;
  product_image: string;
  product_link: string;
  feedback_text: string;
  recipient_label: string;
  is_anonymous: boolean;
  likes_count: number;
  created_at: string;
  profiles?: Pick<Profile, "full_name" | "avatar_url">;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  post_id: string;
  product_name: string;
  product_link: string;
  product_image: string;
  note: string;
  created_at: string;
}

export interface NextQuestionResponse {
  question: string | null;
  question_type: "text" | "single_choice" | "multi_choice";
  options: string[] | null;
  confidence_score: number;
  turn: number;
  completed: boolean;
  reasoning?: string;
}
