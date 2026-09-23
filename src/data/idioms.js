const normalizeList = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

export const createIdiom = ({
  idiom,
  date,
  meaning = "",
  pronunciation = "",
  example = "",
  usage = "",
  summary = "",
  notes = "",
  questions = [],
  favorite = false,
  completed = false,
}) => ({
  idiom,
  date,
  meaning,
  pronunciation,
  example,
  usage,
  summary,
  notes,
  questions: normalizeList(questions),
  favorite,
  completed,
});

// Newest first. Add daily idioms with createIdiom({ ... }).
export const idiomData = [
  createIdiom({
    idiom: "Break the ice",
    date: "2026-09-24",
    pronunciation: "breɪk ði aɪs",
    meaning: "To do or say something that makes people feel more comfortable and less shy in a social situation.",
    example: "He told a short funny story to break the ice at the start of the meeting.",
    usage: "Use when people meet for the first time or feel awkward and need a friendly start.",
    summary:
      "First conversations can feel stiff. Breaking the ice helps people relax so real discussion can begin.",
    notes:
      "Think about workplaces, parties, classes, and online meetings. What works better: humor, a question, or a shared activity?",
    questions: [
      "What is a natural way to break the ice with someone new?",
      "Have you ever been in a situation where nobody broke the ice?",
      "Is humor always a good way to break the ice?",
      "How does breaking the ice change the rest of a conversation?",
      "Do different cultures break the ice in different ways?",
    ],
  }),

  createIdiom({
    idiom: "Hit the nail on the head",
    date: "2026-09-23",
    pronunciation: "hɪt ðə neɪl ɒn ðə hed",
    meaning: "To describe a situation exactly right, or to say something that is completely accurate.",
    example: "When she said we were avoiding the hard decision, she hit the nail on the head.",
    usage: "Use when someone expresses the exact truth in a clear and precise way.",
    summary:
      "Sometimes one sentence captures the whole problem. Hitting the nail on the head means naming reality without distraction.",
    notes:
      "Compare vague comments with precise ones. When does accuracy help a discussion, and when does it feel too blunt?",
    questions: [
      "Can you remember a time when someone hit the nail on the head?",
      "Is it better to be exact or polite when giving feedback?",
      "Why do some people avoid saying the exact truth?",
      "How can you hit the nail on the head without sounding rude?",
      "Does hitting the nail on the head always move a conversation forward?",
    ],
  }),

  createIdiom({
    idiom: "Bite the bullet",
    date: "2026-09-22",
    pronunciation: "baɪt ðə ˈbʊlɪt",
    meaning: "To force yourself to do something difficult or unpleasant because it is necessary.",
    example: "I finally bit the bullet and booked the dentist appointment.",
    usage: "Use when delaying is no longer helpful and action is required despite discomfort.",
    summary:
      "Some tasks stay hard no matter how long we wait. Biting the bullet is choosing courage over avoidance.",
    notes:
      "Discuss work deadlines, difficult conversations, health decisions, and moments when waiting made things worse.",
    questions: [
      "What have you been delaying that you should bite the bullet on?",
      "Does biting the bullet feel easier after you start?",
      "How do you decide when it is time to stop waiting?",
      "Can preparing too much become another form of avoidance?",
      "What helps people find the courage to bite the bullet?",
    ],
  }),

  createIdiom({
    idiom: "A blessing in disguise",
    date: "2026-09-21",
    pronunciation: "ə ˈblesɪŋ ɪn dɪsˈɡaɪz",
    meaning: "Something that seems bad or unlucky at first, but later leads to a good result.",
    example: "Losing that job was a blessing in disguise because it pushed her toward a better career.",
    usage: "Use when an apparent failure or setback later reveals a positive outcome.",
    summary:
      "Not every setback is purely negative. Sometimes disappointment opens a better path that we could not see at the time.",
    notes:
      "Talk about failed plans, rejected applications, broken routines, and moments that looked like losses but taught something valuable.",
    questions: [
      "Have you experienced a blessing in disguise?",
      "Why is it hard to recognize a blessing in disguise in the moment?",
      "Does every difficult experience become a blessing later?",
      "How can optimism help us reinterpret setbacks?",
      "What is the difference between hope and pretending something is fine?",
    ],
  }),

  createIdiom({
    idiom: "Cost an arm and a leg",
    date: "2026-09-20",
    pronunciation: "kɒst ən ɑːm ənd ə leɡ",
    meaning: "To be extremely expensive.",
    example: "The tickets cost an arm and a leg, so we decided to travel another week.",
    usage: "Use informally when the price of something feels unreasonably high.",
    summary:
      "Price is not only a number — it is also a feeling about value. This idiom captures how expensive something can feel.",
    notes:
      "Discuss travel, education, technology, and lifestyle choices. When is a high price worth it, and when is it just wasteful?",
    questions: [
      "What is something that costs an arm and a leg but still feels worth it?",
      "When does a high price become unreasonable?",
      "Do expensive things always offer better quality?",
      "How do people decide what they can afford emotionally, not just financially?",
      "Would you rather save money or pay more for convenience?",
    ],
  }),
];
