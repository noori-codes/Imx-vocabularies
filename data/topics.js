const normalizeList = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) return [value];
  return [];
};

export const createTopic = ({
  title,
  date,
  summary = "",
  notes = "",
  vocabulary = [],
  questions = [],
  favorite = false,
  completed = false,
}) => ({
  title,
  date,
  favorite,
  completed,
  vocabulary: normalizeList(vocabulary),
  summary,
  notes,
  questions: normalizeList(questions),
});

// Add a new topic by copying this pattern and changing the values:
// createTopic({ title: "Your Topic", date: "2026-07-19", summary: "...", vocabulary: ["Word 1", "Word 2"], questions: ["Question 1"] })

export const topicData = [
  createTopic({
    title: "Can Money Change a Person?",
    date: "2026-07-23",
    vocabulary: [
      "Greed",
      "Corruption",
      "Generosity",
      "Influence",
      "Privilege",
      "Integrity",
      "Compassion",
      "Temptation",
      "Perspective",
      "Contentment",
    ],
    summary:
      "This topic explores whether money changes a person's personality or simply reveals their true character. While wealth can provide opportunities, comfort, and influence, it can also bring greed, temptation, and corruption if a person lacks strong values.",
    notes:
      "Money itself is neither good nor bad—it's a tool. Some people become more generous and compassionate after becoming wealthy, while others become selfish or arrogant. Ultimately, character, integrity, and personal values determine how someone uses money.",
    questions: [
      "Can money really change a person's personality?",
      "Does money reveal who people truly are?",
      "Why do some wealthy people become generous while others become greedy?",
      "Can someone remain humble after becoming rich?",
      "What is more important: wealth or character?",
    ],
  }),

  createTopic({
    title: "How Does Failure Build Character?",
    date: "2026-07-22",
    vocabulary: [
      "Failure",
      "Setback",
      "Perseverance",
      "Humility",
      "Accountability",
      "Mindset",
      "Grit",
      "Growth",
      "Resilience",
      "Redemption",
    ],
    summary:
      "This topic explores how failure can become one of life's greatest teachers. Instead of viewing failure as the end of the journey, it shows how setbacks develop resilience, humility, perseverance, and a stronger mindset, ultimately shaping a person's character.",
    notes:
      "Failure is not the opposite of success but part of it. Every mistake provides valuable lessons, builds emotional strength, and encourages personal growth. People who embrace failure often become wiser, more resilient, and better prepared for future challenges.",
    questions: [
      "Can failure make a person stronger?",
      "Why do successful people often fail many times before succeeding?",
      "How should we respond to failure?",
      "Can someone succeed without ever failing?",
      "What is the biggest lesson failure can teach us?",
    ],
  }),

  createTopic({
    title: "Is Modern Life More Stressful Than the Past?",
    date: "2026-07-18",
    vocabulary: [
      "Stress",
      "Burnout",
      "Overwhelmed",
      "Balance",
      "Fast-paced",
      "Deadline",
      "Multitasking",
      "Distraction",
      "Resilience",
      "Well-being",
    ],
    summary:
      "This topic explores whether modern life is more stressful than life in the past, considering technology, work pressure, and changing social expectations.",
    notes:
      "The discussion highlights how modern life can bring more pressure through speed, constant connectivity, and higher expectations, while also offering tools to manage stress and improve well-being.",
    questions: [
      "Is modern life more stressful than the past?",
      "What factors make life feel more demanding today?",
      "How has technology changed the way people experience stress?",
      "Can people still live a balanced life in a fast-paced world?",
      "What habits help people reduce stress and improve well-being?",
    ],
  }),

  createTopic({
    title: "Would You Rather Live in the Past or the Future?",
    date: "2026-07-16",
    vocabulary: [
      "Nostalgia",
      "Innovation",
      "Tradition",
      "Progress",
      "Uncertainty",
      "Perspective",
      "Legacy",
      "Adaptability",
      "Civilization",
      "Foresight",
    ],
    summary:
      "This topic explores whether life would be better in the past or the future. The past offers history, tradition, and simplicity, while the future promises innovation, technology, and new opportunities.",
    notes:
      "The past teaches us valuable lessons, while the future inspires hope and innovation. Instead of wishing to live in one or the other, we should learn from history, prepare for tomorrow, and make the most of today.",
    questions: [
      "Would you rather live in the past or the future? Why?",
      "What advantages did people have in the past?",
      "What opportunities might the future bring?",
      "Is modern technology making life better?",
      "Can we learn more from history or from imagining the future?",
      "Why is it important to live in the present even while thinking about the past and future?",
    ],
  }),

  createTopic({
    title: "Why Do We Regret the Past?",
    date: "2026-07-14",
    vocabulary: [
      "Regret",
      "Remorse",
      "Nostalgia",
      "Reflection",
      "Acceptance",
      "Forgiveness",
      "Hindsight",
      "Reconciliation",
      "Burden",
      "Closure",
    ],
    summary:
      "A presentation about how regret can teach us important lessons, and how acceptance turns reflection into growth.",
    notes:
      "I used personal stories to connect the audience with the idea that regret is a sign of care and a chance to learn.",
    questions: [
      "How can we use regret to make better choices?",
      "What is the difference between regret and guilt?",
      "Can forgiveness change how you view the past?",
    ],
  }),

  createTopic({
    title: "How Daily Practice Builds Confidence",
    date: "2026-07-10",
    favorite: true,
    vocabulary: [
      "Confidence",
      "Consistency",
      "Momentum",
      "Fluency",
      "Clarity",
      "Insight",
    ],
    summary:
      "A talk on how small, daily actions create a growing sense of confidence in language learning.",
    notes:
      "I emphasized that consistency beats motivation and that confidence comes from preparation.",
    questions: [
      "What routines help people practice consistently?",
      "Why does confidence feel different from competence?",
    ],
  }),

  createTopic({
    title: "The Power of Vocabulary in Presentation",
    date: "2026-07-05",
    vocabulary: ["Vocabulary", "Expression", "Precision", "Growth", "Impact"],
    summary:
      "Discussing how choosing the right words makes every presentation more memorable and effective.",
    notes:
      "Showed examples of weak vs strong wording and how word choice shapes meaning.",
    questions: [
      "How can vocabulary change the tone of a message?",
      "What is one word you can use instead of ‘important’?",
    ],
  }),
];
