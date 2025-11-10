import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";

const REMEDIES = [
  {
    key: "constipation",
    title: "Constipation",
    remedies: [
      "Eat fiber-rich foods like oats, apples, bananas, and leafy greens.",
      "Drink warm water with lemon every morning.",
      "Include flax seeds or chia seeds in diet.",
    ],
    notes: "Avoid processed foods and stay hydrated.",
  },
  {
    key: "sore-throat",
    title: "Sore Throat",
    remedies: [
      "Gargle with warm salt water twice daily.",
      "Drink honey-lemon tea or ginger tea.",
      "Rest your voice and avoid cold drinks.",
    ],
    notes: "Avoid smoking and dry air exposure.",
  },
  {
    key: "common-cold",
    title: "Common Cold",
    remedies: [
      "Drink ginger and tulsi tea twice daily.",
      "Inhale steam with eucalyptus oil.",
      "Eat light soups and stay warm.",
    ],
    notes: "Avoid cold foods and keep yourself covered.",
  },
  {
    key: "headache",
    title: "Headache",
    remedies: [
      "Massage temples with peppermint or coconut oil.",
      "Stay hydrated and rest in a dark quiet room.",
      "Apply a cold compress on forehead.",
    ],
    notes: "Avoid excessive screen time and skipping meals.",
  },
  {
    key: "acne",
    title: "Acne",
    remedies: [
      "Apply aloe vera or tea tree oil on affected area.",
      "Wash face twice daily with mild cleanser.",
      "Avoid oily and sugary foods.",
    ],
    notes: "Do not squeeze pimples.",
  },
  {
    key: "indigestion",
    title: "Indigestion",
    remedies: [
      "Drink buttermilk with cumin powder.",
      "Eat smaller meals more frequently.",
      "Avoid spicy or fried foods.",
    ],
    notes: "Walk for 10 mins after meals.",
  },
  {
    key: "fatigue",
    title: "Fatigue",
    remedies: [
      "Sleep for 7–8 hours daily.",
      "Eat bananas, nuts, and drink enough water.",
      "Try yoga or breathing exercises.",
    ],
    notes: "Limit caffeine and sugar intake.",
  },
  {
    key: "anxiety-stress",
    title: "Anxiety/Stress",
    remedies: [
      "Practice deep breathing or meditation.",
      "Drink chamomile or green tea.",
      "Go for short walks and get sunlight exposure.",
    ],
    notes: "Maintain a daily routine and sleep on time.",
  },
  {
    key: "cough",
    title: "Cough",
    remedies: [
      "Mix honey and ginger juice, take twice daily.",
      "Drink turmeric milk before sleeping.",
      "Inhale steam for 5 minutes daily.",
    ],
    notes: "Avoid cold water and dusty environments.",
  },
  {
    key: "fever",
    title: "Fever",
    remedies: [
      "Drink plenty of fluids like coconut water and soups.",
      "Apply a cool compress on forehead.",
      "Rest and avoid exertion.",
    ],
    notes: "Consult doctor if fever persists beyond 3 days.",
  },
  {
    key: "dry-skin",
    title: "Dry Skin",
    remedies: [
      "Apply coconut oil or aloe vera gel.",
      "Drink at least 8 glasses of water daily.",
      "Use mild soap and moisturize after bathing.",
    ],
    notes: "Avoid hot showers and harsh chemicals.",
  },
  {
    key: "dandruff",
    title: "Dandruff",
    remedies: [
      "Apply coconut oil mixed with lemon juice.",
      "Rinse hair with apple cider vinegar diluted with water.",
      "Keep scalp clean and avoid excessive shampooing.",
    ],
    notes: "Use anti-dandruff shampoo twice a week.",
  },
  {
    key: "toothache",
    title: "Toothache",
    remedies: [
      "Apply clove oil on the affected area.",
      "Rinse mouth with warm salt water.",
      "Avoid very hot or cold foods.",
    ],
    notes: "Consult dentist if pain continues.",
  },
  {
    key: "back-pain",
    title: "Back Pain",
    remedies: [
      "Apply warm compress or take a warm bath.",
      "Do light stretching or yoga.",
      "Maintain correct posture while sitting.",
    ],
    notes: "Avoid heavy lifting.",
  },
  {
    key: "insomnia",
    title: "Insomnia",
    remedies: [
      "Drink warm milk before bed.",
      "Avoid screens 1 hour before sleeping.",
      "Keep room dark and quiet.",
    ],
    notes: "Follow a consistent sleep schedule.",
  },
  {
    key: "hair-fall",
    title: "Hair Fall",
    remedies: [
      "Apply onion juice or coconut oil to scalp.",
      "Eat protein-rich foods like eggs and lentils.",
      "Massage scalp twice a week.",
    ],
    notes: "Avoid stress and harsh hair treatments.",
  },
  {
    key: "mouth-ulcers",
    title: "Mouth Ulcers",
    remedies: [
      "Apply honey or coconut oil on ulcers.",
      "Rinse mouth with baking soda solution.",
      "Eat cooling foods like curd and cucumber.",
    ],
    notes: "Avoid spicy and acidic foods.",
  },
  {
    key: "eye-strain",
    title: "Eye Strain",
    remedies: [
      "Follow the 20-20-20 rule (every 20 mins, look 20 ft away for 20 seconds).",
      "Apply cold rose water compress.",
      "Get enough sleep.",
    ],
    notes: "Limit screen time.",
  },
  {
    key: "nausea",
    title: "Nausea",
    remedies: [
      "Drink ginger tea or suck on a slice of ginger.",
      "Avoid oily or strong-smelling foods.",
      "Take slow deep breaths.",
    ],
    notes: "Stay upright after eating.",
  },
  {
    key: "menstrual-cramps",
    title: "Menstrual Cramps",
    remedies: [
      "Apply warm compress to lower abdomen.",
      "Drink chamomile or ginger tea.",
      "Do light yoga or stretching.",
    ],
    notes: "Avoid caffeine and processed foods.",
  },
];

const HomeRemedies = () => {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");

  const options = useMemo(
    () => REMEDIES.map((r) => ({ value: r.key, label: r.title })),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sel = selected.trim().toLowerCase();
    return REMEDIES.filter((r) => {
      const matchesQuery = !q || r.title.toLowerCase().includes(q);
      const matchesSelected = !sel || r.key === sel;
      return matchesQuery && matchesSelected;
    });
  }, [query, selected]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Home Remedies</h1>
            <p className="text-muted-foreground mt-1">
              Simple, evidence-informed tips for common issues. This does not replace professional care.
            </p>
          </div>

          <div className="w-full md:w-[520px] grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Search symptom</label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. cold, acne, headache…"
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Select symptom</label>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All</option>
                {options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => setSelected((s) => (s === o.value ? "" : o.value))}
              className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                selected === o.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-foreground hover:bg-accent border-border"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
          {filtered.map((item) => (
            <div key={item.key} className="bg-card border border-border shadow-card rounded-xl p-5 flex flex-col">
              <h3 className="text-lg font-semibold text-foreground mb-3">{item.title}</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
                {item.remedies.map((t, idx) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>
              <div className="mt-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Notes: </span>
                {item.notes}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <a
            href="https://www.1mg.com/ayurveda"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-primary text-primary-foreground font-medium shadow hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Learn More from Ayurveda
          </a>
        </div>
      </div>
    </div>
  );
};

export default HomeRemedies;
