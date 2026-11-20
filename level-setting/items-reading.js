// Reading check content for the Level Setting page. Loaded before check.js.
// In every multiple-choice item the first option is the correct one. Options are shuffled on screen.
var TEST_KIND = "reading";
/* Word check: K–1 match a picture to its word; Grades 2–5 pick the word that finishes a sentence. 6 per level. */
const WORDS = {
  0: [
    { pic: "🐱", label: "cat", o: ["cat", "cot", "hat", "can"] },
    { pic: "🐶", label: "dog", o: ["dog", "dig", "log", "dot"] },
    { pic: "☀️", label: "sun", o: ["sun", "run", "sit", "bun"] },
    { pic: "🐷", label: "pig", o: ["pig", "big", "peg", "pin"] },
    { pic: "🚌", label: "bus", o: ["bus", "bun", "bud", "but"] },
    { pic: "🛏️", label: "bed", o: ["bed", "bad", "red", "bet"] }],
  1: [
    { pic: "🚢", label: "ship", o: ["ship", "shop", "chip", "sheep"] },
    { pic: "🐸", label: "frog", o: ["frog", "from", "flag", "fog"] },
    { pic: "🦆", label: "duck", o: ["duck", "dock", "luck", "deck"] },
    { pic: "🌳", label: "tree", o: ["tree", "three", "true", "trip"] },
    { pic: "🦷", label: "tooth", o: ["tooth", "truth", "touch", "booth"] },
    { pic: "⭐", label: "star", o: ["star", "stair", "stop", "scar"] }],
  2: [
    { s: "We sailed the small ___ across the lake.", o: ["boat", "beat", "bait", "boot"] },
    { s: "Please ___ for me at the corner.", o: ["wait", "west", "wheat", "white"] },
    { s: "The farmer grew corn on his ___.", o: ["farm", "form", "firm", "foam"] },
    { s: "I ___ my bike to school every day.", o: ["ride", "rid", "read", "road"] },
    { s: "She put on her coat because it was ___ outside.", o: ["cold", "could", "cloud", "called"] },
    { s: "The baby bird was too ___ to fly.", o: ["young", "yawn", "yarn", "yellow"] }],
  3: [
    { s: "The ___ flew the plane safely through the storm.", o: ["pilot", "pillow", "polite", "plant"] },
    { s: "Please be ___ when you carry the glass vase.", o: ["careful", "careless", "cheerful", "colorful"] },
    { s: "The scientist used a ___ to look at tiny cells.", o: ["microscope", "microphone", "telescope", "horoscope"] },
    { s: "After the long hike, we were tired and ___.", o: ["hungry", "hurry", "hundred", "happily"] },
    { s: "My grandma likes to ___ seashells from the beach.", o: ["collect", "correct", "connect", "collapse"] },
    { s: "The main ___ in the story is a brave young girl.", o: ["character", "chapter", "charter", "culture"] }],
  4: [
    { s: "The castle was built in ___ times, more than a thousand years ago.", o: ["ancient", "anxious", "angry", "annual"] },
    { s: "The cookies smelled so ___ that we couldn't wait to eat them.", o: ["delicious", "dangerous", "delicate", "distant"] },
    { s: "Use a ruler to ___ the length of the table.", o: ["measure", "treasure", "pleasure", "mention"] },
    { s: "The detective tried to solve the ___ of the missing key.", o: ["mystery", "misery", "mastery", "history"] },
    { s: "Our class will ___ the results of the experiment in a chart.", o: ["record", "recess", "recite", "reckon"] },
    { s: "The two friends decided to ___ and share the work equally.", o: ["cooperate", "compete", "complain", "conclude"] }],
  5: [
    { s: "Plants take in carbon dioxide from the ___.", o: ["atmosphere", "adventure", "attitude", "ambulance"] },
    { s: "It is ___ to wear a helmet when you ride a bike.", o: ["necessary", "nervous", "notorious", "neighborly"] },
    { s: "The bridge is ___ 300 feet long, give or take a few feet.", o: ["approximately", "appropriately", "accidentally", "apparently"] },
    { s: "The firefighter showed great ___ when she ran into the burning building.", o: ["courage", "carriage", "cottage", "coverage"] },
    { s: "The museum will ___ the dinosaur bones in a new glass case.", o: ["display", "dismay", "delay", "deploy"] },
    { s: "Recycling helps protect the ___ by reducing waste.", o: ["environment", "entertainment", "equipment", "experiment"] }]
};

/* Stories: one per level, read silently, then 5 multiple-choice questions. */
const PASSAGES = {
  0: {
    title: "Sam and the Cat", kind: "Story",
    paras: ["Sam has a cat. The cat is big. The cat is black.", "The cat can sit on a mat. Sam can sit on the mat too.", "Sam and the cat nap on the mat."],
    qs: [
      { type: "Recall", q: "Who has a cat?", o: ["Sam", "Pam", "Dad", "Mom"] },
      { type: "Recall", q: "What color is the cat?", o: ["black", "red", "white", "brown"] },
      { type: "Recall", q: "Where does the cat sit?", o: ["on a mat", "in a box", "on a bed", "in a hat"] },
      { type: "Recall", q: "Is the cat big or little?", o: ["big", "little", "wet", "sad"] },
      { type: "Sequence", q: "What do Sam and the cat do at the end?", o: ["nap", "run", "eat", "swim"] }]
  },
  1: {
    title: "Pip and the Big Box", kind: "Story",
    paras: [
      "Pip the pup had a big red box. \"What can I do with this box?\" said Pip.",
      "He got in the box. It was a boat! Pip sailed on the sea. Then the box was a car. Pip went fast up the hill and down the hill.",
      "Then the box was a bed. Pip was sleepy. He curled up in the box and had a nap.",
      "\"This is the best box,\" said Pip. His friend Kit came to play. \"Can I get in the box too?\" asked Kit. \"Yes,\" said Pip. \"There is room for two.\""],
    qs: [
      { type: "Recall", q: "What color was Pip's box?", o: ["red", "blue", "green", "brown"] },
      { type: "Sequence", q: "What was the box first?", o: ["a boat", "a car", "a bed", "a house"] },
      { type: "Recall", q: "What did Pip do when the box was a bed?", o: ["He took a nap.", "He ate lunch.", "He sang a song.", "He went to the sea."] },
      { type: "Recall", q: "Who came to play?", o: ["Kit", "Sam", "Mom", "a cat"] },
      { type: "Inference", q: "How does Pip feel about the box?", o: ["He loves it.", "He is scared of it.", "He wants a new box.", "He is mad at it."] }]
  },
  2: {
    title: "Busy Beavers", kind: "Information",
    paras: [
      "Beavers are animals that live near rivers, ponds, and lakes. They have big front teeth that never stop growing. Beavers use their teeth to cut down small trees. They chew on wood all the time, and that keeps their teeth from getting too long.",
      "Beavers are great builders. They pile up sticks, rocks, and mud to make a dam across a stream. The dam blocks the water and makes a pond. In the middle of the pond, beavers build a home called a lodge. The door to the lodge is under the water. This helps keep the family safe from animals like wolves and bears.",
      "A beaver has a wide, flat tail. When a beaver sees danger, it slaps its tail on the water. The loud smack warns the other beavers to dive and hide."],
    qs: [
      { type: "Recall", q: "What do beavers use their teeth for?", o: ["cutting down small trees", "catching fish", "digging holes", "cracking nuts"] },
      { type: "Recall", q: "What is a beaver's home called?", o: ["a lodge", "a nest", "a den", "a hive"] },
      { type: "Cause", q: "Why is the door to the lodge under the water?", o: ["to keep the family safe", "to keep the lodge warm", "so fish can swim in", "so the dam won't break"] },
      { type: "Recall", q: "What does a beaver do when it sees danger?", o: ["It slaps its tail on the water.", "It climbs a tree.", "It builds a dam.", "It hides its food."] },
      { type: "Inference", q: "What would happen if a beaver stopped chewing wood?", o: ["Its teeth would grow too long.", "Its tail would get flat.", "It would forget how to swim.", "The pond would dry up."] }]
  },
  3: {
    title: "The Fossil in the Creek", kind: "Story",
    paras: [
      "Maya and her grandfather walked along the dry creek bed, looking down at the stones. Grandpa had told her that this land was once covered by a shallow sea, millions of years ago. Maya didn't believe him. How could there be a sea in the middle of a field?",
      "She turned over a flat gray rock and gasped. Pressed into the stone was the shape of a shell, with tiny lines fanning out like the ribs of an umbrella. \"Grandpa, look!\" she shouted.",
      "Grandpa knelt beside her and studied it through his reading glasses. \"That's a brachiopod,\" he said. \"It's a sea animal that lived here long before the dinosaurs. When it died, mud covered it, and over a very long time the mud turned to rock.\"",
      "Maya ran her finger over the ridges. The shell had been waiting in the ground for millions of years, and she was the first person ever to see it. She carefully wrapped the rock in her bandana and tucked it into her backpack.",
      "\"Okay,\" she said, grinning. \"Maybe there really was a sea here.\""],
    qs: [
      { type: "Recall", q: "Who was Maya with?", o: ["her grandfather", "her teacher", "her mother", "her friend"] },
      { type: "Recall", q: "What did Maya find under the rock?", o: ["a fossil of a shell", "a dinosaur bone", "a gold coin", "a living crab"] },
      { type: "Sequence", q: "How did the shell become a fossil?", o: ["Mud covered it and slowly turned to rock.", "Grandpa carved it into the stone.", "The sun baked it into the rock.", "It washed up in the creek last year."] },
      { type: "Vocabulary", q: "Maya gasped when she saw the shell. What does gasped mean?", o: ["breathed in quickly from surprise", "laughed out loud", "whispered softly", "coughed"] },
      { type: "Inference", q: "Why did Maya change her mind about the sea?", o: ["The fossil showed a sea animal once lived there.", "Grandpa showed her a map.", "She saw water in the creek.", "She read about it in a book."] }]
  },
  4: {
    title: "Islands Made of Fire", kind: "Information",
    paras: [
      "The Hawaiian Islands were not always there. Each one was built by volcanoes, one layer of lava at a time.",
      "Deep under the Pacific Ocean is a hot spot, a place where melted rock called magma rises up from inside the Earth. When magma breaks through the ocean floor, it is called lava. The lava cools in the cold seawater and hardens into rock. Over hundreds of thousands of years, eruption after eruption piles the rock higher until a volcano finally rises above the waves as an island.",
      "The hot spot stays in one place, but the ocean floor above it is slowly moving, about three to four inches each year. As the floor moves, it carries each island away from the hot spot, and a new volcano begins to form behind it. This is why the islands form a long chain.",
      "The Big Island of Hawaii, which sits over the hot spot today, is the youngest island and still has active volcanoes. Islands farther to the northwest are older, and wind and waves have worn many of them down."],
    qs: [
      { type: "Recall", q: "What is magma called once it breaks through the ocean floor?", o: ["lava", "ash", "coral", "sand"] },
      { type: "Cause", q: "Why do the Hawaiian Islands form a long chain?", o: ["The ocean floor moves over a hot spot that stays still.", "Waves push the islands into a line.", "Each volcano slides to a new place.", "The islands were once one big island."] },
      { type: "Recall", q: "Which island is the youngest?", o: ["the Big Island of Hawaii", "the island farthest to the northwest", "They are all the same age.", "the smallest island"] },
      { type: "Vocabulary", q: "What is an eruption?", o: ["when lava bursts out of a volcano", "when waves hit the shore", "when an island sinks", "when rock cools down"] },
      { type: "Inference", q: "An island far to the northwest is probably…", o: ["older and worn down", "younger, with active volcanoes", "still under the water", "sitting over the hot spot"] }]
  },
  5: {
    title: "The Longest Commute", kind: "Information",
    paras: [
      "Every year, a small gray-and-white seabird called the Arctic tern makes one of the longest journeys of any animal on Earth. The tern weighs only about as much as a deck of cards, and it nests in the far north, in places like Greenland and Iceland. When summer ends there, the tern does not stay for the long, dark Arctic winter. Instead, it flies all the way to the edge of Antarctica, where summer is just beginning.",
      "For years, scientists could only guess how far these birds traveled. Then, in 2007, researchers attached tiny tracking devices, each lighter than a dime, to terns nesting in Greenland. When the birds returned the next year, the devices revealed something surprising. The terns did not fly in a straight line. They followed an S-shaped path over the Atlantic Ocean, riding the wind patterns to save energy. One round trip averaged about 44,000 miles.",
      "Because the tern lives through two summers each year, it probably sees more daylight than any other animal. A tern can live for 30 years, so over its lifetime it may fly a distance equal to about three trips to the Moon and back."],
    qs: [
      { type: "Recall", q: "Where does the Arctic tern build its nest?", o: ["in the far north", "in Antarctica", "in the desert", "on tall mountains"] },
      { type: "Cause", q: "Why does the tern fly south when the Arctic summer ends?", o: ["to escape the dark winter and find summer", "to find a new mate", "because other birds chase it away", "to lay eggs on the ice"] },
      { type: "Recall", q: "How did scientists learn the tern's real route?", o: ["They attached tiny tracking devices.", "They took photos from airplanes.", "They counted birds on beaches.", "They asked sailors."] },
      { type: "Vocabulary", q: "The devices revealed something surprising. What does revealed mean?", o: ["showed", "hid", "changed", "broke"] },
      { type: "Cause", q: "Why did the terns fly an S-shaped path?", o: ["to ride the wind and save energy", "to stay away from ships", "to visit more islands", "because they got lost"] }]
  }
};
