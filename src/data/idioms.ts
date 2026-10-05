import type { Idiom } from "../types/models";

const normalizeList = (value: string[] | string | undefined): string[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

/** Full idiom definitions. Topics reference these by phrase in `idioms: [...]`. */
export const createIdiom = ({
  idiom,
  date = "",
  meaning = "",
  pronunciation = "",
  example = "",
  usage = "",
  summary = "",
  notes = "",
  questions = [],
  favorite = false,
  completed = false,
}: {
  idiom: string;
  date?: string;
  meaning?: string;
  pronunciation?: string;
  example?: string;
  usage?: string;
  summary?: string;
  notes?: string;
  questions?: string[] | string;
  favorite?: boolean;
  completed?: boolean;
}): Idiom => ({
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

const q = (...items: string[]) => items;

export const idiomData: Idiom[] = [
  // Comparing yourself — 2026-10-05
  createIdiom({
    idiom: "The grass is always greener",
    date: "2026-10-05",
    pronunciation: "ðə ɡrɑːs ɪz ˈɔːlweɪz ˈɡriːnə",
    meaning: "Other people's situations always seem better than your own.",
    example: "She keeps changing jobs because she believes the grass is always greener somewhere else.",
    usage: "Use when someone idealizes another life or choice.",
    questions: q(
      "When have you felt the grass was greener somewhere else?",
      "Does this idiom warn us against comparison?",
    ),
  }),
  createIdiom({
    idiom: "Keep up with the Joneses",
    date: "2026-10-05",
    pronunciation: "kiːp ʌp wɪð ðə ˈdʒəʊnzɪz",
    meaning: "To try to match the lifestyle, possessions, or status of people around you.",
    example: "They bought a bigger car just to keep up with the Joneses.",
    usage: "Often about social pressure and spending.",
    questions: q(
      "Is keeping up with the Joneses more common online now?",
      "What does this habit do to happiness?",
    ),
  }),
  createIdiom({
    idiom: "Green with envy",
    date: "2026-10-05",
    pronunciation: "ɡriːn wɪð ˈenvi",
    meaning: "Extremely envious of someone else's success or advantages.",
    example: "He was green with envy when his colleague got the promotion.",
    usage: "Informal; strong envy.",
    questions: q(
      "Can being green with envy ever push someone to grow?",
      "How do you handle envy without becoming bitter?",
    ),
  }),
  createIdiom({
    idiom: "Apples and oranges",
    date: "2026-10-05",
    pronunciation: "ˈæplz ənd ˈɒrɪndʒɪz",
    meaning: "Two things that are too different to be fairly compared.",
    example: "Comparing your quiet progress with their public success is apples and oranges.",
    usage: "Use when a comparison is unfair or meaningless.",
    questions: q(
      "When is comparing two lives just apples and oranges?",
      "Why do people still make unfair comparisons?",
    ),
  }),
  createIdiom({
    idiom: "Raise the bar",
    date: "2026-10-05",
    pronunciation: "reɪz ðə bɑː",
    meaning: "To set a higher standard than before.",
    example: "Her discipline raised the bar for everyone on the team.",
    usage: "Can be motivating when the standard is personal, not competitive.",
    questions: q(
      "Is raising the bar healthier than competing with others?",
      "Who should raise the bar for your life: you or other people?",
    ),
  }),

  // Liked or Respected — 2026-09-24
  createIdiom({
    idiom: "Put someone on a pedestal",
    date: "2026-09-24",
    pronunciation: "pʊt ˈsʌmwʌn ɒn ə ˈpedɪstl",
    meaning: "To admire someone so much that you treat them as perfect or better than ordinary people.",
    example: "Fans often put celebrities on a pedestal and ignore their mistakes.",
    usage: "Use when admiration becomes unrealistic or excessive.",
    questions: q(
      "Have you ever put someone on a pedestal?",
      "Is it healthy to put people on a pedestal?",
    ),
  }),
  createIdiom({
    idiom: "Win someone over",
    date: "2026-09-24",
    pronunciation: "wɪn ˈsʌmwʌn ˈəʊvə",
    meaning: "To persuade someone to like you, support you, or agree with you.",
    example: "She won the team over with honesty and hard work, not charm alone.",
    usage: "Use when trust or support is gained gradually.",
    questions: q(
      "What usually helps you win someone over?",
      "Can you win people over without changing who you are?",
    ),
  }),
  createIdiom({
    idiom: "Look up to",
    date: "2026-09-24",
    pronunciation: "lʊk ʌp tuː",
    meaning: "To admire and respect someone.",
    example: "Many students look up to teachers who are both kind and demanding.",
    usage: "Use for genuine respect, often toward role models.",
    questions: q(
      "Who do you look up to, and why?",
      "Is looking up to someone different from wanting to be liked by them?",
    ),
  }),
  createIdiom({
    idiom: "Be in someone's good books",
    date: "2026-09-24",
    pronunciation: "biː ɪn ˈsʌmwʌnz ɡʊd bʊks",
    meaning: "To be liked or approved of by someone at the moment.",
    example: "He is in the manager's good books after finishing the project early.",
    usage: "Informal; often about temporary approval.",
    questions: q(
      "Is being in someone's good books the same as being respected?",
      "How quickly can you fall out of someone's good books?",
    ),
  }),
  createIdiom({
    idiom: "Go along to get along",
    date: "2026-09-24",
    pronunciation: "ɡəʊ əˈlɒŋ tə ɡet əˈlɒŋ",
    meaning: "To agree or stay quiet just to keep peace, even if you do not fully agree.",
    example: "She went along to get along in the meeting, but she was not convinced.",
    usage: "Use when people choose harmony over honesty.",
    questions: q(
      "When is going along to get along wise, and when is it weak?",
      "Does this habit make people like you more or respect you less?",
    ),
  }),

  // Control Your Thoughts — 2026-09-23
  createIdiom({
    idiom: "Hit the nail on the head",
    date: "2026-09-23",
    pronunciation: "hɪt ðə neɪl ɒn ðə hed",
    meaning: "To describe something exactly right.",
    example: "When she said we were avoiding the hard decision, she hit the nail on the head.",
    usage: "Use when someone names the truth precisely.",
    questions: q(
      "Can you remember a time when someone hit the nail on the head?",
      "Is exact honesty always welcome?",
    ),
  }),
  createIdiom({
    idiom: "Food for thought",
    date: "2026-09-23",
    pronunciation: "fuːd fə θɔːt",
    meaning: "An idea that is interesting and worth thinking about carefully.",
    example: "His question about habits gave us real food for thought.",
    usage: "Use after hearing an idea that deserves reflection.",
    questions: q(
      "What recent idea gave you food for thought?",
      "Does food for thought always change your behavior?",
    ),
  }),
  createIdiom({
    idiom: "Cross your mind",
    date: "2026-09-23",
    pronunciation: "krɒs jɔː maɪnd",
    meaning: "To come into your thoughts briefly.",
    example: "It crossed my mind that I might be overthinking the situation.",
    usage: "Use for sudden or passing thoughts.",
    questions: q(
      "What kinds of thoughts cross your mind when you are stressed?",
      "Should we act on every thought that crosses our mind?",
    ),
  }),
  createIdiom({
    idiom: "Lost in thought",
    date: "2026-09-23",
    pronunciation: "lɒst ɪn θɔːt",
    meaning: "So focused on your thinking that you do not notice what is around you.",
    example: "She was lost in thought and almost missed her stop.",
    usage: "Use for deep or distracted thinking.",
    questions: q(
      "When do you usually get lost in thought?",
      "Is being lost in thought helpful or unhelpful?",
    ),
  }),
  createIdiom({
    idiom: "On your mind",
    date: "2026-09-23",
    pronunciation: "ɒn jɔː maɪnd",
    meaning: "Occupying your thoughts, often because you are worried or concerned.",
    example: "You seem quiet today. Is something on your mind?",
    usage: "Common in caring check-ins and everyday conversation.",
    questions: q(
      "How do you know when something is really on your mind?",
      "Does talking about what is on your mind make it lighter?",
    ),
  }),

  // Truly Attractive — 2026-09-22
  createIdiom({
    idiom: "Catch someone's eye",
    date: "2026-09-22",
    pronunciation: "kætʃ ˈsʌmwʌnz aɪ",
    meaning: "To attract someone's attention, often because of appearance or presence.",
    example: "His calm confidence caught everyone's eye as soon as he entered.",
    usage: "Use for first attention, not necessarily deep attraction.",
    questions: q(
      "What usually catches your eye first in a person?",
      "Can personality catch someone's eye as much as appearance?",
    ),
  }),
  createIdiom({
    idiom: "Turn heads",
    date: "2026-09-22",
    pronunciation: "tɜːn hedz",
    meaning: "To attract a lot of attention because you look impressive or unusual.",
    example: "She turned heads at the event, but her kindness left a stronger impression.",
    usage: "Often about appearance; can be positive or superficial.",
    questions: q(
      "Is turning heads the same as being attractive long-term?",
      "What makes someone turn heads for reasons beyond looks?",
    ),
  }),
  createIdiom({
    idiom: "Have a way with people",
    date: "2026-09-22",
    pronunciation: "hæv ə weɪ wɪð ˈpiːpl",
    meaning: "To be naturally skilled at communicating with and attracting others.",
    example: "He has a way with people that makes strangers feel comfortable quickly.",
    usage: "Use for social ease and interpersonal skill.",
    questions: q(
      "Do you think having a way with people is natural or learned?",
      "How is this different from being fake?",
    ),
  }),
  createIdiom({
    idiom: "Wear your heart on your sleeve",
    date: "2026-09-22",
    pronunciation: "weə jɔː hɑːt ɒn jɔː sliːv",
    meaning: "To show your feelings openly instead of hiding them.",
    example: "She wears her heart on her sleeve, so people always know how she feels.",
    usage: "Use for emotional openness and vulnerability.",
    questions: q(
      "Is wearing your heart on your sleeve attractive or risky?",
      "When should people hide their feelings instead?",
    ),
  }),
  createIdiom({
    idiom: "Fall for someone",
    date: "2026-09-22",
    pronunciation: "fɔːl fə ˈsʌmwʌn",
    meaning: "To start feeling romantic attraction or love for someone.",
    example: "He fell for her after noticing how thoughtfully she treated others.",
    usage: "Informal; romantic contexts.",
    questions: q(
      "What makes people fall for someone beyond first impressions?",
      "Can you fall for someone's character more than their appearance?",
    ),
  }),

  // Love and leave — 2026-09-20
  createIdiom({
    idiom: "Bite the bullet",
    date: "2026-09-20",
    pronunciation: "baɪt ðə ˈbʊlɪt",
    meaning: "To force yourself to do something difficult or unpleasant because it is necessary.",
    example: "They bit the bullet and ended the relationship kindly but clearly.",
    usage: "Use for hard but necessary decisions.",
    questions: q(
      "When is leaving someone a case of biting the bullet?",
      "Does delaying a hard goodbye make it easier or harder?",
    ),
  }),
  createIdiom({
    idiom: "Call it quits",
    date: "2026-09-20",
    pronunciation: "kɔːl ɪt kwɪts",
    meaning: "To decide to stop doing something, especially a relationship or effort.",
    example: "After months of conflict, they finally called it quits.",
    usage: "Informal; endings and stop decisions.",
    questions: q(
      "How do people know it is time to call it quits?",
      "Can calling it quits still be an act of care?",
    ),
  }),
  createIdiom({
    idiom: "Go your separate ways",
    date: "2026-09-20",
    pronunciation: "ɡəʊ jɔː ˈseprət weɪz",
    meaning: "To end a relationship or partnership and live different lives.",
    example: "They still cared for each other, but they needed to go their separate ways.",
    usage: "Use for mutual or inevitable endings.",
    questions: q(
      "Is going your separate ways always a failure?",
      "Can love remain after people go their separate ways?",
    ),
  }),
  createIdiom({
    idiom: "Have a soft spot for",
    date: "2026-09-20",
    pronunciation: "hæv ə sɒft spɒt fə",
    meaning: "To feel special affection or kindness toward someone.",
    example: "She still had a soft spot for him even after they broke up.",
    usage: "Use for lasting fondness that may not equal a healthy relationship.",
    questions: q(
      "Can you have a soft spot for someone and still leave them?",
      "Does a soft spot make leaving harder?",
    ),
  }),
  createIdiom({
    idiom: "A blessing in disguise",
    date: "2026-09-20",
    pronunciation: "ə ˈblesɪŋ ɪn dɪsˈɡaɪz",
    meaning: "Something that seems bad at first but later leads to a good result.",
    example: "Ending that relationship was a blessing in disguise for both of them.",
    usage: "Use after setbacks that later prove helpful.",
    questions: q(
      "Can leaving someone become a blessing in disguise?",
      "Why is it hard to see blessings in disguise at the time?",
    ),
  }),

  // Impossible to forget — 2026-09-16
  createIdiom({
    idiom: "Stick in your mind",
    date: "2026-09-16",
    pronunciation: "stɪk ɪn jɔː maɪnd",
    meaning: "To be remembered clearly for a long time.",
    example: "That conversation stuck in my mind for years.",
    usage: "Use for strong, lasting memories.",
    questions: q(
      "What kinds of people stick in your mind?",
      "Do painful memories stick more than happy ones?",
    ),
  }),
  createIdiom({
    idiom: "Ring a bell",
    date: "2026-09-16",
    pronunciation: "rɪŋ ə bel",
    meaning: "To sound familiar, even if you cannot remember the details.",
    example: "His name rings a bell, but I cannot remember where we met.",
    usage: "Use for partial or uncertain recognition.",
    questions: q(
      "Why do some names ring a bell years later?",
      "Is ringing a bell the same as truly remembering someone?",
    ),
  }),
  createIdiom({
    idiom: "Slip your mind",
    date: "2026-09-16",
    pronunciation: "slɪp jɔː maɪnd",
    meaning: "To be forgotten, usually temporarily.",
    example: "Sorry I didn't reply — your message completely slipped my mind.",
    usage: "Use for ordinary forgetting, not deep emotional memory.",
    questions: q(
      "What usually slips your mind when you are busy?",
      "Why do unimportant details slip our minds more easily?",
    ),
  }),
  createIdiom({
    idiom: "Trip down memory lane",
    date: "2026-09-16",
    pronunciation: "trɪp daʊn ˈmeməri leɪn",
    meaning: "To spend time remembering pleasant experiences from the past.",
    example: "Looking at old photos sent us on a trip down memory lane.",
    usage: "Usually positive nostalgia.",
    questions: q(
      "When do you take a trip down memory lane?",
      "Can nostalgia make someone harder to forget?",
    ),
  }),
  createIdiom({
    idiom: "Come back to haunt you",
    date: "2026-09-16",
    pronunciation: "kʌm bæk tə hɔːnt juː",
    meaning: "To cause problems later because of something from the past.",
    example: "Unfinished conversations can come back to haunt you years later.",
    usage: "Use for past events that return emotionally or practically.",
    questions: q(
      "Can people we try to forget come back to haunt us?",
      "How do we stop the past from haunting the present?",
    ),
  }),

  // Kept from original seed for Money topic later / general use
  createIdiom({
    idiom: "Break the ice",
    date: "2026-09-24",
    pronunciation: "breɪk ði aɪs",
    meaning: "To make people feel more comfortable in a social situation.",
    example: "He told a short funny story to break the ice at the start of the meeting.",
    usage: "Use when people meet for the first time or feel awkward.",
    questions: q(
      "What is a natural way to break the ice with someone new?",
      "Is humor always a good way to break the ice?",
    ),
  }),
  // Money and happiness — 2026-09-08
  createIdiom({
    idiom: "Cost an arm and a leg",
    date: "2026-09-08",
    pronunciation: "kɒst ən ɑːm ənd ə leɡ",
    meaning: "To be extremely expensive.",
    example: "The tickets cost an arm and a leg, so we decided to travel another week.",
    usage: "Informal; high prices.",
    questions: q(
      "What costs an arm and a leg but still feels worth it?",
      "When does a high price become unreasonable?",
    ),
  }),
  createIdiom({
    idiom: "Money does not grow on trees",
    date: "2026-09-08",
    pronunciation: "ˈmʌni dʌz nɒt ɡrəʊ ɒn triːz",
    meaning: "Money is limited and should not be wasted.",
    example: "We cannot buy every gadget — money does not grow on trees.",
    usage: "Often said when advising someone to spend carefully.",
    questions: q(
      "When did you last hear that money does not grow on trees?",
      "Does this saying encourage healthy spending or fear?",
    ),
  }),
  createIdiom({
    idiom: "Tighten your belt",
    date: "2026-09-08",
    pronunciation: "ˈtaɪtn jɔː belt",
    meaning: "To spend less money because you need to save or have less income.",
    example: "After rent went up, they had to tighten their belt for a few months.",
    usage: "Use for temporary financial discipline.",
    questions: q(
      "When is it wise to tighten your belt?",
      "Can tightening your belt improve happiness?",
    ),
  }),
  createIdiom({
    idiom: "Live beyond your means",
    date: "2026-09-08",
    pronunciation: "lɪv bɪˈjɒnd jɔː miːnz",
    meaning: "To spend more money than you can afford.",
    example: "Living beyond your means can create stress even if your lifestyle looks impressive.",
    usage: "Use for unsustainable spending habits.",
    questions: q(
      "Why do people live beyond their means?",
      "Is social pressure a major cause?",
    ),
  }),
  createIdiom({
    idiom: "Pay the price",
    date: "2026-09-08",
    pronunciation: "peɪ ðə praɪs",
    meaning: "To suffer the consequences of a decision or action.",
    example: "If you chase status too hard, you may pay the price with your peace of mind.",
    usage: "Can be financial or emotional consequences.",
    questions: q(
      "Have you ever paid the price for a money decision?",
      "Can happiness make us pay a price too?",
    ),
  }),
];
