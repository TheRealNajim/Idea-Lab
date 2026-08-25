// Every domain that appears in the archive below must be listed here, otherwise
// cards display collisions the user has no way to select or reproduce.
export const domains = [
  'Anime',
  'Civic Tech',
  'Climate Tech',
  'Cooking',
  'Customer Support',
  'Cybersecurity',
  'Developer Tools',
  'E-commerce',
  'Education',
  'Fashion',
  'Finance',
  'Fitness',
  'Gaming',
  'Hardware',
  'Healthcare',
  'History',
  'Mental Health',
  'Music',
  'Nature',
  'Photography',
  'Productivity',
  'Public Transit',
  'Robotics',
  'Social',
  'Space Travel',
  'Startups',
  'Strategy Games',
  'Travel',
  'Typography',
  'Web3',
  'Writing',
]

export const filters = ['All', 'SaaS Tools', 'Mini-Games', 'Creative Branding', 'Dev Projects']
export const vaultFolders = ['Unsorted', 'Build next', 'Research']
export const formats = ['Any format', 'Web app', 'Mobile app', 'Game', 'Hardware', 'Brand campaign']
export const difficulties = ['Any difficulty', 'Beginner', 'Intermediate', 'Advanced']
export const buildTimes = ['Any timeline', 'Weekend', 'One week', 'One month', 'Startup-scale']

const rawMashups = [
  ['CipherKitchen', 'Cybersecurity', 'Cooking', 'Dev Projects', 'Master defensive cybersecurity concepts through kitchen logic.', 'A recipe-based learning game where every dish maps to a defensive coding principle: salt the hash, sanitize data inputs, and ensure memory safety before service.', 'Junior developers and software students', ['React', 'Node.js', 'WebContainers']],
  ['Liquidity Saga', 'Web3', 'Anime', 'Mini-Games', 'DeFi mechanics, told like an epic shonen arc.', 'A narrative simulator that turns liquidity pools, impermanent loss, and governance into character stats and branching battles.', 'Crypto-curious gamers', ['Phaser', 'Solidity', 'WalletConnect']],
  ['Focus Familiar', 'Productivity', 'Gaming', 'SaaS Tools', 'Your to-do list has a tiny guardian.', 'A focus timer where completed tasks feed and evolve a desktop familiar, making consistent deep work feel like creature progression.', 'Remote workers and students', ['Tauri', 'React', 'Supabase']],
  ['Runway Runtime', 'Fashion', 'Developer Tools', 'Creative Branding', 'A design system dressed for every deployment.', 'A visual identity generator that translates software architecture choices into editorial fashion directions and launch assets.', 'Indie builders and design studios', ['Next.js', 'Canvas API', 'OpenAI']],
  ['Rep Rhapsody', 'Fitness', 'Music', 'SaaS Tools', 'Every workout deserves its own score.', 'An adaptive music engine that shifts tempo, instrumentation, and intensity based on live workout cadence and heart rate.', 'Runners and gym members', ['React Native', 'Web Audio', 'HealthKit']],
  ['Pantry Protocol', 'Cooking', 'Climate Tech', 'SaaS Tools', 'Waste less. Improvise better.', 'A household inventory app that predicts spoilage and creates flexible recipes ranked by carbon impact and ingredients saved.', 'Eco-conscious households', ['Expo', 'FastAPI', 'PostgreSQL']],
  ['Firewall Fables', 'Cybersecurity', 'Education', 'Mini-Games', 'Defend a kingdom one packet at a time.', 'A tower-defense game where network topology is the map and simulated traffic scenarios teach secure routing, system logging, and incident response.', 'High-school CS programs', ['Godot', 'WebSockets', 'SQLite']],
  ['Orbit Office', 'Space Travel', 'Productivity', 'SaaS Tools', 'Async work for teams in different time zones and planets.', 'A collaboration tool that models communication delay, bundles updates, and creates high-context handoff capsules.', 'Globally distributed teams', ['Next.js', 'tRPC', 'PostgreSQL']],
  ['Mood Loom', 'Mental Health', 'Fashion', 'Creative Branding', 'Wear the weather inside your head.', 'A private mood journal that turns emotional patterns into generative textile prints and optional wearable art.', 'Artists and reflective journalers', ['Svelte', 'D3.js', 'Printful API']],
  ['Mecha Mentor', 'Robotics', 'Anime', 'Dev Projects', 'Train your robot like a protagonist.', 'A visual robotics IDE that frames calibration, path planning, and debugging as training arcs with replayable missions.', 'Robotics clubs and makers', ['Electron', 'ROS 2', 'Three.js']],
  ['Proof of Practice', 'Web3', 'Fitness', 'SaaS Tools', 'Verifiable consistency, not speculative calories.', 'A privacy-first credential platform where gyms and coaches issue non-transferable milestones for real training streaks.', 'Coaches and fitness communities', ['React Native', 'Polygon', 'ZK Proofs']],
  ['Syntax Sous-Chef', 'Cooking', 'Education', 'Dev Projects', 'Learn programming through kitchen logic.', 'An interactive course that teaches functions, queues, state, and concurrency by orchestrating a busy virtual kitchen.', 'First-time coding students', ['React', 'XState', 'Monaco Editor']],
  ['Patch Notes IRL', 'Gaming', 'Mental Health', 'Creative Branding', 'Treat personal growth like a balanced live service.', 'A playful weekly reflection tool that publishes private patch notes for habits, boundaries, buffs, and known issues.', 'Young professionals and creators', ['Remix', 'Supabase', 'Resend']],
  ['Carbon Combo', 'Climate Tech', 'Gaming', 'Mini-Games', 'Build the longest low-carbon streak.', 'A cooperative daily challenge where small climate actions chain into team combos, city leaderboards, and unlockable worlds.', 'Schools and community groups', ['Flutter', 'Firebase', 'Mapbox']],
  ['Guardian Wardrobe', 'Cybersecurity', 'Fashion', 'Creative Branding', 'Visual privacy defense for what you wear online.', 'A campaign generator that visualizes digital privacy protection and data hygiene as garments, accessories, and editorial lookbooks.', 'Privacy nonprofits and educators', ['Astro', 'Three.js', 'Stable Diffusion']],
  ['Chord Courier', 'Music', 'Productivity', 'Dev Projects', 'Move tasks through a musical pipeline.', 'A spatial kanban where workflow stages are instruments and project activity composes an ambient team soundtrack.', 'Creative agencies', ['Vue', 'Tone.js', 'Yjs']],
  ['Study Shonen', 'Education', 'Anime', 'Mini-Games', 'Turn the syllabus into your training arc.', 'A study planner that converts modules into sagas, exams into boss fights, and spaced repetition into daily techniques.', 'University students', ['React Native', 'SQLite', 'Notifications API']],
  ['Astro Atelier', 'Space Travel', 'Fashion', 'Creative Branding', 'Dress codes for impossible environments.', 'A speculative design tool that creates clothing systems for Mars dust, lunar temperatures, and zero-gravity movement.', 'Fashion students and sci-fi studios', ['Next.js', 'Three.js', 'Gemini API']],
  ['Garden Ledger', 'Climate Tech', 'Web3', 'SaaS Tools', 'Make neighborhood climate work visible.', 'A community garden platform that turns verified planting, composting, and water-saving actions into transparent local impact records.', 'Neighborhood climate groups', ['React', 'Supabase', 'Mapbox']],
  ['Palette Pilot', 'Music', 'Fashion', 'Creative Branding', 'Turn a song into a visual collection.', 'A tool that translates rhythm, tempo, and tone into color palettes, textures, and campaign directions for independent artists.', 'Musicians and visual designers', ['Next.js', 'Tone.js', 'Canvas API']],
  ['Code Cartographer', 'Education', 'Space Travel', 'Dev Projects', 'Map a codebase like a new planet.', 'An interactive learning environment that turns unfamiliar repositories into explorable maps with missions for tracing features and dependencies.', 'Junior developers and apprentices', ['React', 'D3.js', 'Tree-sitter']],
  ['Pocket Parliament', 'Civic Tech', 'Gaming', 'Mini-Games', 'Practice democracy through play.', 'A multiplayer negotiation game that teaches consensus, tradeoffs, and public budgeting through short civic scenarios.', 'Schools and community organizers', ['Phaser', 'WebSockets', 'PostgreSQL']],
  ['Mindful Metrics', 'Mental Health', 'Productivity', 'SaaS Tools', 'Track what helps, not just what gets done.', 'A reflection-first productivity system that pairs task completion with energy, mood, and recovery signals.', 'Burned-out knowledge workers', ['React Native', 'SQLite', 'Recharts']],
  ['Recipe Relay', 'Cooking', 'Gaming', 'Mini-Games', 'Co-op cooking when nobody shares a kitchen.', 'A timed asynchronous cooking challenge where friends pass ingredients, constraints, and creative decisions between turns.', 'Friends and food communities', ['React', 'Firebase', 'Web Audio']],
  ['Quiet Queue', 'Mental Health', 'Customer Support', 'SaaS Tools', 'Help teams protect attention while staying kind.', 'A support inbox that groups emotionally demanding tickets, schedules recovery windows, and suggests calm response structures.', 'Support leads and service teams', ['Vue', 'FastAPI', 'PostgreSQL']],
  ['Museum of Bugs', 'Cybersecurity', 'History', 'Creative Branding', 'Make software history worth remembering.', 'An interactive archive that turns famous software defects, historic vulnerabilities, and major system outages into annotated stories for engineering culture and education.', 'Engineering teams and educators', ['Astro', 'MDX', 'Three.js']],
  ['Transit Tactics', 'Public Transit', 'Strategy Games', 'Mini-Games', 'Optimize a city without losing the human story.', 'A strategy simulator where players balance routes, accessibility, budgets, and rider satisfaction across a growing city.', 'Urban planners and students', ['Godot', 'Mapbox', 'Rust']],
  ['Invoice Garden', 'Finance', 'Productivity', 'SaaS Tools', 'Grow a calmer cash-flow practice.', 'A freelancer finance app that visualizes invoices as a garden, showing which client relationships need attention before cash gets tight.', 'Freelancers and small studios', ['Svelte', 'Supabase', 'Stripe']],
  ['Signal School', 'Education', 'Music', 'Dev Projects', 'Learn data literacy through sound.', 'An interactive course where charts become melodies and students identify trends, outliers, and patterns by listening and inspecting.', 'Teachers and data beginners', ['React', 'Tone.js', 'Observable Plot']],
  ['Trail Mix OS', 'Fitness', 'Travel', 'SaaS Tools', 'Plan adventures around real energy.', 'A trip planner that combines trail difficulty, sleep, food, recovery, and transport into an adaptive multi-day itinerary.', 'Hikers and active travelers', ['Flutter', 'Mapbox', 'OpenWeather']],
  ['Pixel Pantry', 'Gaming', 'Cooking', 'Creative Branding', 'Build a food brand from a tiny world.', 'A packaging and naming generator that creates playful pixel-art product worlds from recipes and ingredient stories.', 'Food startups and illustrators', ['React', 'Canvas API', 'Supabase']],
  ['Ethical Checkout', 'E-commerce', 'Web3', 'SaaS Tools', 'Show the consequences behind the cart.', 'A checkout layer that explains sourcing, worker impact, delivery emissions, and alternative products before purchase.', 'Conscious online shoppers', ['Next.js', 'Stripe', 'PostgreSQL']],
  ['Story Sprint', 'Writing', 'Productivity', 'Mini-Games', 'Finish the draft one quest at a time.', 'A focused writing room that turns scenes, chapters, and revision goals into short timed challenges with a gentle progress map.', 'Writers and NaNoWriMo groups', ['Tauri', 'React', 'IndexedDB']],
  ['Care Circuit', 'Robotics', 'Healthcare', 'Dev Projects', 'Prototype kinder assistive devices.', 'A no-code simulator for exploring reminder systems, sensors, and routines in assistive robotics without hardware first.', 'Makers and care designers', ['Three.js', 'Web Serial', 'Python']],
  ['Local Legends', 'Travel', 'Anime', 'Creative Branding', 'Turn a city walk into a character arc.', 'A walking tour generator that frames local history, food, and architecture as chapters in a personalized adventure.', 'Tourists and local museums', ['React Native', 'Mapbox', 'Supabase']],
  ['Focus Frequency', 'Music', 'Mental Health', 'SaaS Tools', 'Tune the environment to the moment.', 'A soundscape tool that uses a short check-in to create focus, decompression, or sleep sessions with intentional transitions.', 'Students and remote workers', ['Web Audio', 'React', 'Cloudflare Workers']],
  ['Harvest Hours', 'Climate Tech', 'Productivity', 'SaaS Tools', 'Schedule work around the sun.', 'A calendar that recommends outdoor breaks, daylight sessions, and low-energy workflows based on local weather and seasonality.', 'Remote teams and outdoor workers', ['Next.js', 'OpenWeather', 'Postgres']],
  ['Brand Archaeologist', 'History', 'Fashion', 'Creative Branding', 'Find the future in old visual languages.', 'A research board that connects historical motifs, materials, and typography to contemporary brand directions.', 'Brand strategists and art directors', ['Masonry UI', 'D3.js', 'Cloudinary']],
  ['Security Quest Bingo', 'Cybersecurity', 'Social', 'Mini-Games', 'Make security habits easy to repeat.', 'A team challenge board for practicing password hygiene, suspicious email detection, dependency updates, and resilience drills.', 'Small companies and classrooms', ['React', 'Firebase', 'Notifications API']],
  ['Budget Boss Fight', 'Finance', 'Anime', 'Mini-Games', 'Defeat monthly expenses with better decisions.', 'A personal finance game where spending categories become opponents and users learn by testing scenarios before payday.', 'Young adults learning finance', ['React Native', 'SQLite', 'Reanimated']],
  ['Study Habitat', 'Education', 'Climate Tech', 'Creative Branding', 'Design a learning environment that breathes.', 'A visual study planner that connects room setup, light, temperature, breaks, and learning goals into a personal habitat.', 'Students and libraries', ['Svelte', 'Three.js', 'Supabase']],
  ['Open Mic Mentor', 'Music', 'Education', 'SaaS Tools', 'Feedback without the stage fright.', 'A rehearsal platform that gives structured, encouraging feedback on pitch, rhythm, lyrics, and performance goals.', 'Beginner musicians and teachers', ['Web Audio', 'React', 'Whisper API']],
  ['Repair Quest', 'Hardware', 'Gaming', 'Mini-Games', 'Make fixing things feel like progress.', 'A repair companion that identifies household objects, guides diagnosis, and rewards documented fixes with skill badges.', 'DIY beginners and repair cafes', ['Expo', 'Computer Vision', 'SQLite']],
  ['Orbit Budget', 'Space Travel', 'Finance', 'SaaS Tools', 'Manage money like a mission planner.', 'A financial planning interface that models runway, burn rate, reserves, and risk as a crewed mission with milestones.', 'Startup founders and project leads', ['React', 'Recharts', 'Supabase']],
  ['Therapy Typeface', 'Mental Health', 'Typography', 'Creative Branding', 'Make emotional language visible.', 'A journaling experiment that turns recurring words and feelings into evolving type specimens without exposing private entries.', 'Therapists and reflective creatives', ['Svelte', 'D3.js', 'Local-first storage']],
  ['Farm to Frame', 'Cooking', 'Photography', 'Creative Branding', 'Tell the whole story of a dish.', 'A content planning studio that connects ingredients, growers, recipes, styling, and short-form video into one editorial sequence.', 'Food creators and restaurants', ['Next.js', 'Cloudinary', 'Supabase']],
  ['API Arcade', 'Developer Tools', 'Gaming', 'Dev Projects', 'Learn integrations by playing them.', 'A browser arcade where each level teaches authentication, pagination, webhooks, rate limits, and error handling through missions.', 'Junior developers', ['React', 'Node.js', 'Monaco Editor']],
  ['Civic Canvas', 'Civic Tech', 'Fashion', 'Creative Branding', 'Make public proposals easier to see.', 'A visual identity and explainer generator for community proposals, neighborhood campaigns, and local initiatives.', 'Community organizers', ['Astro', 'Canvas API', 'Markdown']],
  ['Sleep Signals', 'Fitness', 'Space Travel', 'SaaS Tools', 'Plan recovery like a flight path.', 'A recovery dashboard that maps sleep, training load, travel, and time-zone changes into simple readiness decisions.', 'Athletes and frequent travelers', ['React Native', 'HealthKit', 'D3.js']],
  ['Founder Field Guide', 'Startups', 'Nature', 'Dev Projects', 'Navigate uncertainty with better rituals.', 'A lightweight founder operating system that turns experiments, interviews, and decisions into an evolving field guide.', 'Solo founders and startup teams', ['Remix', 'Supabase', 'TipTap']],
]

const enrich = (idea, index = 0) => ({
  ...idea,
  format: idea.format || (idea.type === 'Mini-Games' ? 'Game' : idea.type === 'Creative Branding' ? 'Brand campaign' : 'Web app'),
  difficulty: idea.difficulty || ['Beginner', 'Intermediate', 'Advanced'][index % 3],
  buildTime: idea.buildTime || ['Weekend', 'One week', 'One month'][index % 3],
  businessModel: idea.businessModel || ['Freemium', 'Team subscription', 'Usage-based'][index % 3],
  mvp: idea.mvp || ['Guided onboarding', 'Core mashup workflow', 'Saved results', 'Shareable output'],
  roadmap: idea.roadmap || ['Validate with 10 target users', 'Ship the core loop', 'Add collaboration and integrations'],
  risks: idea.risks || ['The novelty may distract from the core utility', 'Keep the first-use flow focused'],
  whyNow: idea.whyNow || `Creators are looking for fresh ways to apply ${idea.domainA} to ${idea.domainB} as AI makes experimentation faster.`,
  scores: idea.scores || { originality: 78 + (index % 5) * 4, feasibility: 68 + (index % 6) * 4, market: 72 + (index % 4) * 5 },
})

export const mashups = rawMashups.map(([title, domainA, domainB, type, tagline, pitch, audience, stack], index) => enrich({
  id: `${domainA}-${domainB}-${index}`.toLowerCase().replaceAll(' ', '-'),
  title,
  domainA,
  domainB,
  type,
  tagline,
  pitch,
  audience,
  stack,
  prompt: `Build a polished ${type.toLowerCase()} called “${title}” that combines ${domainA} and ${domainB}. ${pitch} The core audience is ${audience}. Use ${stack.join(', ')}. Prioritize an original visual identity, a clear first-use flow, responsive interactions, realistic sample data, and an MVP architecture that can ship in one week.`,
}, index))

const typeCycle = filters.slice(1)

export function createCustomMashups(domainA, domainB, domainC = '') {
  const selectedDomains = [domainA, domainB, domainC].filter(Boolean)
  const pair = selectedDomains.join(' + ')
  const stems = [
    ['Crosswire', 'Turn the unlikely overlap into a daily creative instrument.'],
    ['Signal Garden', 'Make hidden connections visible, useful, and delightful.'],
    ['Odd Circuit', 'A small utility powered by a very unexpected combination.'],
  ]

  return stems.map(([name, tagline], index) => enrich({
    id: `custom-${Date.now()}-${index}`,
    title: `${name} ${String(index + 1).padStart(2, '0')}`,
    domainA,
    domainB,
    domainC,
    type: typeCycle[index % typeCycle.length],
    tagline,
    pitch: `${pair} becomes a focused product that translates the habits and mechanics of ${domainA} into a new workflow for ${domainB}. It starts with a guided generator, then turns the best outputs into reusable challenges and shareable artifacts.`,
    audience: `${domainA} practitioners curious about ${domainB}`,
    stack: ['React', 'Tailwind CSS', index === 0 ? 'Supabase' : 'Framer Motion'],
    prompt: `Design and build “${name}”, a responsive product combining ${domainA} and ${domainB}. Create a distinct visual system derived from both domains, an onboarding flow, a working generator with sample data, saved results, and an accessible mobile experience. Use React, Tailwind CSS, and Framer Motion. Avoid generic dashboard patterns and make the core interaction feel tactile.`,
  }, index))
}
