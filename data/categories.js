export const CATEGORIES = [
  "Emotions",
  "Mindset",
  "Character",
  "Learning",
  "Speaking",
  "Lifestyle",
  "Society",
  "Growth",
];

const CATEGORY_ALIASES = {
  Emotion: "Emotions",
  Emotions: "Emotions",
  Mindset: "Mindset",
  Thinking: "Mindset",
  Psychology: "Mindset",
  "Mental Strength": "Mindset",
  Character: "Character",
  Values: "Character",
  Ethics: "Character",
  Responsibility: "Character",
  Learning: "Learning",
  Skill: "Learning",
  Speaking: "Speaking",
  Lifestyle: "Lifestyle",
  Health: "Lifestyle",
  "Mental Health": "Lifestyle",
  Work: "Lifestyle",
  Productivity: "Lifestyle",
  Attention: "Lifestyle",
  Society: "Society",
  Culture: "Society",
  Technology: "Society",
  Relationships: "Society",
  Growth: "Growth",
  Development: "Growth",
  "Self-Improvement": "Growth",
  "Personal Growth": "Growth",
  Success: "Growth",
  Challenges: "Growth",
};

export const normalizeCategory = (category) => {
  if (!category) return "Learning";
  const trimmed = String(category).trim();
  return CATEGORY_ALIASES[trimmed] || CATEGORIES.find((item) => item === trimmed) || "Learning";
};
