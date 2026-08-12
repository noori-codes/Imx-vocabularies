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
    title: "Do Our Choices Define Who We Are?",
    date: "2026-08-12",
    completed: false,
    vocabulary: [
      "Consequence",
      "Integrity",
      "Intention",
      "Compromise",
      "Priorities",
      "Accountability",
      "Character",
      "Temptation",
      "Conviction",
      "Dilemma",
    ],
    summary:
      "This topic explores whether our choices reveal and shape our identity. It examines how decisions, values, consequences, social pressure, and difficult situations influence the person we become.",
    notes:
      "Our choices are influenced by our values, circumstances, emotions, and other people, so a single decision does not necessarily define an entire person. However, repeated choices can form habits, reveal priorities, and gradually shape character. The topic also considers whether people should be judged by their worst decisions or by their willingness to take responsibility and change.",
    questions: [
      "Do our choices reveal our true character?",
      "Can one bad decision define a person's identity?",
      "How much do circumstances influence our choices?",
      "Should people be judged by their intentions or their consequences?",
      "Can changing our choices change who we become?",
    ],
  }),

  createTopic({
    title: "How Does Learning Change the Brain?",
    date: "2026-08-11",
    completed: false,
    vocabulary: [
      "Neuroplasticity",
      "Neural Pathway",
      "Retention",
      "Recall",
      "Adaptation",
      "Concentration",
      "Cognitive",
      "Reinforcement",
      "Stimulate",
      "Acquisition",
    ],
    summary:
      "This topic explores how learning physically and functionally changes the brain. It explains how repeated practice strengthens neural connections, how memory develops, and why concentration, repetition, and active recall can make learning more effective.",
    notes:
      "The brain is not a fixed structure. When we learn something new, neurons communicate in new ways and existing connections can become stronger. This ability, known as neuroplasticity, allows the brain to adapt throughout life. Repetition and practice can strengthen neural pathways, while sleep and active recall help the brain retain and retrieve information more effectively.",
    questions: [
      "What happens to the brain when we learn?",
      "Can the brain change at any age?",
      "Why does repetition make learning easier?",
      "How does sleep affect memory?",
      "What is the most effective way to strengthen learning?",
    ],
  }),

  createTopic({
    title: "Why Do People Seek Approval?",
    date: "2026-08-08",
    completed: false,
    vocabulary: [
      "Validation",
      "Acceptance",
      "Reassurance",
      "Insecurity",
      "Self-Worth",
      "Conformity",
      "Recognition",
      "Criticism",
      "Rejection",
      "Independence",
    ],
    summary:
      "This topic explores why people care about other people's opinions and seek approval from friends, family, colleagues, and society. It examines the role of belonging, insecurity, self-worth, social pressure, and the desire for recognition.",
    notes:
      "Humans are social beings, so wanting acceptance is a natural part of life. However, constantly depending on other people's approval can weaken confidence and make people change their behavior simply to please others. Healthy relationships involve caring about other people's opinions without allowing those opinions to determine our identity or self-worth.",
    questions: [
      "Why do people care about others' opinions?",
      "Why is approval especially important during adolescence?",
      "Can seeking approval become unhealthy?",
      "How does social media increase the need for validation?",
      "How can people become less dependent on approval?",
    ],
  }),

  createTopic({
    title: "Is Knowledge More Powerful Than Strength?",
    date: "2026-08-06",
    completed: false,
    vocabulary: [
      "Wisdom",
      "Strategy",
      "Influence",
      "Judgment",
      "Authority",
      "Dominance",
      "Foresight",
      "Competence",
      "Persuasion",
      "Discernment",
    ],
    summary:
      "This topic explores whether knowledge is ultimately more powerful than physical strength. It compares intelligence, strategy, and wisdom with force, showing how informed decisions and critical thinking have shaped history, leadership, science, and society.",
    notes:
      "Throughout history, physical strength has been important for survival and protection. However, knowledge has consistently transformed civilizations through science, technology, medicine, and innovation. Great leaders and inventors often succeeded because of their wisdom, strategy, and ability to influence others rather than their physical power. The discussion examines how knowledge and strength complement each other while arguing that knowledge often has the greater long-term impact.",
    questions: [
      "Can knowledge defeat physical strength?",
      "Why is strategy often more effective than force?",
      "How has knowledge changed human history?",
      "Can strength exist without intelligence?",
      "Which is more valuable in today's world: knowledge or strength?",
    ],
  }),

  createTopic({
    title: "Can Anyone Become an Expert?",
    date: "2026-08-05",
    completed: false,
    vocabulary: [
      "Expertise",
      "Mastery",
      "Competence",
      "Deliberate Practice",
      "Dedication",
      "Consistency",
      "Refinement",
      "Proficiency",
      "Aptitude",
      "Mentorship",
    ],
    summary:
      "This topic explores whether expertise is something people are born with or something they develop through consistent effort. It examines the roles of practice, talent, discipline, mentorship, and continuous improvement in becoming highly skilled.",
    notes:
      "While natural talent may provide an advantage, research suggests that becoming an expert depends far more on deliberate practice, consistency, and the willingness to learn from mistakes. Experts are not simply people who know more—they are people who have spent years refining their skills through focused effort and continuous feedback.",
    questions: [
      "Can anyone become an expert with enough practice?",
      "Is talent more important than hard work?",
      "What is deliberate practice, and why is it effective?",
      "How does mentorship accelerate learning?",
      "How many years does it usually take to master a skill?",
    ],
  }),

  createTopic({
    title: "Are Humans Naturally Curious?",
    date: "2026-08-04",
    completed: false,
    vocabulary: [
      "Fascination",
      "Intrigue",
      "Questioning",
      "Exploration",
      "Reasoning",
      "Discovery",
      "Wonder",
      "Observation",
      "Inquiry",
      "Inventiveness",
    ],
    summary:
      "This topic explores whether curiosity is an inborn human trait or a skill shaped by experience. It discusses how curiosity has influenced human evolution, scientific progress, creativity, and lifelong learning, while also examining the factors that encourage or suppress our desire to explore the unknown.",
    notes:
      "Humans begin exploring the world from infancy by observing, experimenting, and asking questions. Throughout history, curiosity has driven major discoveries, technological advances, and philosophical ideas. However, routine, fear of failure, and rigid education can weaken curiosity. The discussion asks whether humans are naturally curious or whether curiosity must be continually nurtured.",
    questions: [
      "Are humans born with curiosity?",
      "Why are children generally more curious than adults?",
      "Can curiosity be lost over time?",
      "How has curiosity contributed to human progress?",
      "Should schools encourage curiosity more than memorization?",
    ],
  }),

  createTopic({
    title: "What Makes Life Truly Valuable?",
    date: "2026-08-03",
    completed: false,
    vocabulary: [
      "Significance",
      "Altruism",
      "Virtue",
      "Transcendence",
      "Fulfillment",
      "Resonance",
      "Stewardship",
      "Conviction",
      "Flourishing",
      "Eudaimonia",
    ],
    summary:
      "This topic explores the deeper sources of a meaningful life beyond wealth, fame, or pleasure. It examines philosophical and psychological ideas about virtue, selflessness, personal growth, and the lasting impact we leave on others.",
    notes:
      "Throughout history, philosophers such as Aristotle argued that a truly valuable life is built on virtue, wisdom, and contribution rather than material success. Modern psychology supports this idea, showing that people experience greater well-being through meaningful relationships, purposeful work, personal growth, and helping others. A valuable life is measured not by what we own, but by who we become and the positive influence we have on the world.",
    questions: [
      "Can a person have a valuable life without being wealthy?",
      "What matters more: happiness or meaning?",
      "How does helping others increase the value of our own lives?",
      "What kind of legacy should a person try to leave behind?",
      "How can someone live a life with greater significance?",
    ],
  }),

  createTopic({
    title: "Can a Person Change Their Destiny?",
    date: "2026-08-02",
    completed: false,
    vocabulary: [
      "Destiny",
      "Fate",
      "Free Will",
      "Determination",
      "Perseverance",
      "Opportunity",
      "Potential",
      "Transformation",
      "Conviction",
      "Resilience",
    ],
    summary:
      "This topic explores whether people's lives are determined by fate or shaped by their own choices. It examines the roles of free will, determination, opportunity, and resilience in achieving personal goals and overcoming obstacles.",
    notes:
      "Some believe destiny is fixed, while others believe every decision influences the future. Hard work, perseverance, and a willingness to change can transform a person's life, even when circumstances seem impossible. Although we cannot control everything that happens to us, we can control how we respond.",
    questions: [
      "Can people truly change their destiny?",
      "Is success determined by fate or by personal effort?",
      "How do our daily choices shape our future?",
      "Can one decision completely change a person's life?",
      "What role does resilience play in changing someone's destiny?",
    ],
  }),

  createTopic({
    title: "Is Technology Solving Problems or Creating New Ones?",
    date: "2026-07-25",
    completed: false,
    vocabulary: [
      "Automation",
      "Dependency",
      "Cybersecurity",
      "Innovation",
      "Efficiency",
      "Surveillance",
      "Misinformation",
      "Ethics",
      "Connectivity",
      "Sustainability",
    ],
    summary:
      "This topic examines the double-edged nature of technology. While technological advancements improve healthcare, education, communication, and productivity, they also introduce challenges such as cybersecurity threats, misinformation, privacy concerns, and increasing dependence on digital devices.",
    notes:
      "Technology is a powerful tool, but its impact depends on how people use it. It can solve complex global problems and improve quality of life, yet it also creates ethical, social, and environmental challenges. The goal should not be to reject technology but to use it responsibly.",
    questions: [
      "Has technology improved our quality of life?",
      "What new problems has technology created?",
      "Can society become too dependent on technology?",
      "Should governments regulate new technologies more strictly?",
      "How can we ensure technology benefits future generations?",
    ],
  }),

  createTopic({
    title: "Is Curiosity the Key to Intelligence?",
    date: "2026-07-24",
    vocabulary: [
      "Curiosity",
      "Inquiry",
      "Insight",
      "Reasoning",
      "Analytical",
      "Innovation",
      "Observation",
      "Exploration",
      "Comprehension",
      "Wisdom",
    ],
    summary:
      "This topic examines whether curiosity is the foundation of intelligence. It discusses how asking questions, exploring new ideas, and seeking knowledge help people develop critical thinking, creativity, and lifelong learning.",
    notes:
      "Intelligence is not just about knowing many facts; it is also about the desire to learn. Curious people ask questions, investigate problems, and continuously expand their understanding. Curiosity drives innovation, strengthens reasoning, and often leads to wisdom.",
    questions: [
      "Can a curious person become more intelligent?",
      "Why do children ask so many questions?",
      "Is intelligence possible without curiosity?",
      "How does curiosity lead to innovation?",
      "Should schools encourage curiosity more than memorization?",
    ],
  }),

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
