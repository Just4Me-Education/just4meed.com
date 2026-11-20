// Math check content for the Level Setting page. Loaded before check.js.
// Six areas, Kindergarten to Grade 8. Each level has a skill, a home tip and 3 questions.
// In every multiple-choice question the first option is correct; options are shuffled on screen.
var TEST_KIND = "math";
const MATH = [
{ id: "num", name: "Numbers and place value", min: 0, max: 8, levels: {
  0: { skill: "counting objects and comparing numbers to 20", tip: "Count real things together (spoons, stairs, toy cars), then ask which group has more.", items: [
    { q: "How many dots?", t: "num", ans: 7, fig: { t: "dots", n: 7 } },
    { q: "Which number is the biggest?", t: "mc", o: ["9", "6", "4"] },
    { q: "What number comes right after 13?", t: "num", ans: 14 }] },
  1: { skill: "tens and ones in numbers to 100", tip: "Bundle straws or craft sticks into groups of ten, then count the tens and ones.", items: [
    { q: "How many in all?", t: "num", ans: 46, fig: { t: "base", tens: 4, ones: 6 }, say: "Each long stick is ten. Each small square is one. How many in all?" },
    { q: "Which number is 7 tens and 3 ones?", t: "mc", o: ["73", "37", "10"] },
    { q: "Which number is the biggest?", t: "mc", o: ["61", "59", "16"] }] },
  2: { skill: "hundreds, tens and ones; skip counting", tip: "Use play money ($1, $10 and $100 bills) to build and read 3-digit numbers.", items: [
    { q: "What number is 3 hundreds, 0 tens, and 8 ones?", t: "num", ans: 308 },
    { q: "Count by 5s: 35, 40, 45, ___", t: "num", ans: 50 },
    { q: "In 472, what is the value of the 7?", t: "mc", o: ["70", "7", "700"] }] },
  3: { skill: "rounding to the nearest 10 and 100", tip: "Find numbers on a number line and decide which ten or hundred they are closer to.", items: [
    { q: "Round 46 to the nearest ten.", t: "num", ans: 50 },
    { q: "Round 732 to the nearest hundred.", t: "num", ans: 700 },
    { q: "Which number rounds to 300 (nearest hundred)?", t: "mc", o: ["329", "351", "249"] }] },
  4: { skill: "place value and rounding in large numbers", tip: "Read big numbers aloud from sports stats or maps and name the value of each digit.", items: [
    { q: "In 58,214, what is the value of the 8?", t: "mc", o: ["8,000", "800", "80,000"] },
    { q: "Round 36,482 to the nearest thousand.", t: "num", ans: 36000 },
    { q: "Which number is the greatest?", t: "mc", o: ["40,105", "40,051", "4,510"] }] },
  5: { skill: "decimal place value", tip: "Compare decimal prices and measurements, like 0.5 and 0.45, and explain which is bigger and why.", items: [
    { q: "Which number is the greatest?", t: "mc", o: ["0.5", "0.45", "0.405"] },
    { q: "In 3.172, what is the value of the 7?", t: "mc", o: ["7 hundredths", "7 tenths", "7 thousandths"] },
    { q: "Round 4.68 to the nearest tenth.", t: "num", ans: 4.7 }] },
  6: { skill: "negative numbers and absolute value", tip: "Use a thermometer or a number line to compare temperatures above and below zero.", items: [
    { q: "Which temperature is the coldest?", t: "mc", o: ["−8°F", "−3°F", "2°F"] },
    { q: "|−12| = ?", t: "num", ans: 12, say: "What is the absolute value of negative 12?" },
    { q: "What number is at the red dot?", t: "num", ans: -3, neg: true, fig: { t: "numline", lo: -5, hi: 5, at: -3 } }] },
  7: { skill: "adding and subtracting negative numbers", tip: "Make a number line on the floor. Step forward to add, step backward to subtract.", items: [
    { q: "−6 + 9 = ?", t: "num", ans: 3, neg: true },
    { q: "4 − 10 = ?", t: "num", ans: -6, neg: true },
    { q: "−5 − (−2) = ?", t: "mc", o: ["−3", "−7", "3"], say: "negative 5 minus negative 2" }] },
  8: { skill: "exponents, square roots and scientific notation", tip: "Practice powers of 10 and perfect squares, then write big measurements, like distances in space, in scientific notation.", items: [
    { q: "3⁴ = ?", t: "num", ans: 81, say: "3 to the 4th power" },
    { q: "√64 = ?", t: "num", ans: 8, say: "the square root of 64" },
    { q: "Which number is 4.2 × 10⁵?", t: "mc", o: ["420,000", "42,000", "4,200,000"], say: "Which number is 4.2 times 10 to the 5th power?" }] }
}},
{ id: "add", name: "Adding and subtracting", min: 0, max: 5, levels: {
  0: { skill: "adding and taking away within 5", tip: "Act out adding and taking away with fingers or small toys.", items: [
    { q: "2 + 3 = ?", t: "num", ans: 5 },
    { q: "You have 4 apples. You eat 1. How many are left?", t: "num", ans: 3 },
    { q: "Which one makes 5?", t: "mc", o: ["4 + 1", "3 + 1", "2 + 2"] }] },
  1: { skill: "adding and subtracting within 20", tip: "Practice making 10 (7 + 3, 6 + 4), then use it: 8 + 5 is 8 + 2 + 3.", items: [
    { q: "8 + 7 = ?", t: "num", ans: 15 },
    { q: "13 − 5 = ?", t: "num", ans: 8 },
    { q: "Sam has 9 stickers. He gets some more. Now he has 14. How many did he get?", t: "num", ans: 5 }] },
  2: { skill: "adding and subtracting within 100 with regrouping", tip: "Add the tens first, then the ones, with a hundreds chart or play money.", items: [
    { q: "47 + 36 = ?", t: "num", ans: 83 },
    { q: "72 − 28 = ?", t: "num", ans: 44 },
    { q: "A book has 64 pages. Maya read 39 pages. How many pages are left?", t: "num", ans: 25 }] },
  3: { skill: "adding and subtracting within 1,000", tip: "Line up numbers by place value on grid paper, and check answers by adding back.", items: [
    { q: "358 + 467 = ?", t: "num", ans: 825 },
    { q: "602 − 275 = ?", t: "num", ans: 327 },
    { q: "What is the best estimate of 498 + 203?", t: "mc", o: ["700", "600", "800"] }] },
  4: { skill: "multi-digit adding and subtracting", tip: "Use real numbers, like trip miles or game scores, and check with an estimate first.", items: [
    { q: "4,385 + 2,947 = ?", t: "num", ans: 7332 },
    { q: "7,003 − 2,468 = ?", t: "num", ans: 4535 },
    { q: "A library had 1,250 books. It gave away 380 and bought 615. How many books does it have now?", t: "num", ans: 1485 }] },
  5: { skill: "adding and subtracting decimals", tip: "Add and subtract money amounts, lining up the decimal points.", items: [
    { q: "3.75 + 2.5 = ?", t: "num", ans: 6.25 },
    { q: "10 − 4.36 = ?", t: "num", ans: 5.64 },
    { q: "0.8 + 0.25 = ?", t: "mc", o: ["1.05", "0.33", "1.5"] }] }
}},
{ id: "mul", name: "Multiplying and dividing", min: 2, max: 7, levels: {
  2: { skill: "equal groups and arrays", tip: "Build arrays with coins or cereal and count them by rows.", items: [
    { q: "How many stars?", t: "num", ans: 12, fig: { t: "array", r: 3, c: 4 } },
    { q: "Which one shows 4 groups of 5?", t: "mc", o: ["5 + 5 + 5 + 5", "4 + 5", "5 + 5 + 5 + 5 + 5"] },
    { q: "There are 6 pairs of socks. How many socks is that?", t: "num", ans: 12 }] },
  3: { skill: "multiplication and division facts", tip: "Practice a few facts a day with fact families: 6 × 7 = 42 and 42 ÷ 7 = 6.", items: [
    { q: "6 × 7 = ?", t: "num", ans: 42 },
    { q: "36 ÷ 4 = ?", t: "num", ans: 9 },
    { q: "3 friends share 24 cookies equally. How many cookies does each friend get?", t: "num", ans: 8 }] },
  4: { skill: "multi-digit multiplying and dividing with remainders", tip: "Draw area models (a rectangle split into parts) to multiply bigger numbers.", items: [
    { q: "34 × 6 = ?", t: "num", ans: 204 },
    { q: "23 × 15 = ?", t: "num", ans: 345 },
    { q: "29 ÷ 4 = ?", t: "mc", o: ["7 R1", "7 R2", "6 R5"], say: "29 divided by 4" }] },
  5: { skill: "long division and multiplying decimals", tip: "Practice division with real sharing problems, and check each answer by multiplying.", items: [
    { q: "864 ÷ 12 = ?", t: "num", ans: 72 },
    { q: "0.6 × 4 = ?", t: "num", ans: 2.4 },
    { q: "246 × 37 = ?", t: "num", ans: 9102 }] },
  6: { skill: "dividing multi-digit numbers and decimals", tip: "Work out unit prices at the store: divide the cost by the number of items.", items: [
    { q: "3,451 ÷ 17 = ?", t: "num", ans: 203 },
    { q: "7.2 ÷ 0.3 = ?", t: "num", ans: 24 },
    { q: "1.5 × 0.4 = ?", t: "mc", o: ["0.6", "6", "0.06"] }] },
  7: { skill: "multiplying and dividing negative numbers", tip: "Find the sign rules from a pattern: 3 × −2, 2 × −2, 1 × −2, 0 × −2, −1 × −2.", items: [
    { q: "−6 × 4 = ?", t: "num", ans: -24, neg: true },
    { q: "−45 ÷ (−9) = ?", t: "num", ans: 5, neg: true, say: "negative 45 divided by negative 9" },
    { q: "−2 × (−3) × (−5) = ?", t: "mc", o: ["−30", "30", "−10"], say: "negative 2 times negative 3 times negative 5" }] }
}},
{ id: "frac", name: "Fractions, ratios and percents", min: 1, max: 7, levels: {
  1: { skill: "halves and fourths of shapes", tip: "Fold paper or cut sandwiches into halves and fourths and name the pieces.", items: [
    { q: "How much is shaded?", t: "mc", o: ["one half", "one fourth", "one third"], fig: { t: "circle", p: 2, s: 1 } },
    { q: "How much is shaded?", t: "mc", o: ["one fourth", "one half", "one third"], fig: { t: "rect", p: 4, s: 1 } },
    { q: "A pizza is cut into 4 equal pieces. How many pieces make the whole pizza?", t: "num", ans: 4 }] },
  2: { skill: "halves, thirds and fourths", tip: "Share snacks into equal parts and talk about which pieces are bigger: halves, thirds or fourths.", items: [
    { q: "How much is shaded?", t: "mc", o: ["two thirds", "one third", "two halves"], fig: { t: "circle", p: 3, s: 2 } },
    { q: "Which piece of the same pizza is biggest?", t: "mc", o: ["one half", "one third", "one fourth"] },
    { q: "How many fourths make one whole?", t: "num", ans: 4, fig: { t: "rect", p: 4, s: 4 } }] },
  3: { skill: "fractions as parts of a whole and simple equal fractions", tip: "Make paper fraction strips and line them up to see that 2/4 and 1/2 are the same size.", items: [
    { q: "What fraction is shaded?", t: "mc", o: ["3/8", "3/5", "5/8"], fig: { t: "rect", p: 8, s: 3 } },
    { q: "Which fraction is the biggest?", t: "mc", o: ["1/3", "1/4", "1/6"] },
    { q: "Which fraction is equal to 1/2?", t: "mc", o: ["3/6", "2/3", "1/4"] }] },
  4: { skill: "equal fractions and adding fractions with the same denominator", tip: "Use fraction strips to add pieces of the same size, like 2/8 + 3/8.", items: [
    { q: "3/8 + 4/8 = ?", t: "mc", o: ["7/8", "7/16", "1/8"] },
    { q: "Which fraction is equal to 2/3?", t: "mc", o: ["8/12", "2/6", "3/4"] },
    { q: "Which fraction is the biggest?", t: "mc", o: ["5/6", "3/4", "2/3"] }] },
  5: { skill: "adding unlike fractions and multiplying fractions", tip: "Find common denominators with fraction strips, and use recipes to multiply, like half of 3/4 cup.", items: [
    { q: "1/2 + 1/3 = ?", t: "mc", o: ["5/6", "2/5", "2/6"] },
    { q: "2/3 × 6 = ?", t: "num", ans: 4 },
    { q: "1/2 × 3/4 = ?", t: "mc", o: ["3/8", "4/6", "3/6"] }] },
  6: { skill: "dividing fractions, ratios and percent of a number", tip: "Use recipes and sale signs to practice ratios and percents of a number.", items: [
    { q: "3/4 ÷ 1/8 = ?", t: "num", ans: 6 },
    { q: "What is 25% of 80?", t: "num", ans: 20 },
    { q: "A recipe uses 2 cups of flour for every 3 cups of milk. How many cups of flour go with 9 cups of milk?", t: "num", ans: 6 }] },
  7: { skill: "proportions, percent discounts and negative fractions", tip: "Work out discounts, tax and tips together when shopping or eating out.", items: [
    { q: "A $40 shirt is 15% off. What is the sale price in dollars?", t: "num", ans: 34 },
    { q: "3 notebooks cost $4.50. How much do 7 notebooks cost, in dollars?", t: "num", ans: 10.5 },
    { q: "−3/4 + 1/2 = ?", t: "mc", o: ["−1/4", "1/4", "−5/4"], say: "negative 3 fourths plus 1 half" }] }
}},
{ id: "alg", name: "Patterns and equations", min: 1, max: 8, levels: {
  1: { skill: "finding a missing number and the meaning of =", tip: "Play \"I'm thinking of a number\": 5 plus what makes 9?", items: [
    { q: "5 + ___ = 9", t: "num", ans: 4 },
    { q: "___ − 3 = 7", t: "num", ans: 10 },
    { q: "Which one is true?", t: "mc", o: ["6 = 2 + 4", "6 = 6 + 2", "2 + 4 = 7"] }] },
  2: { skill: "number patterns and odd and even numbers", tip: "Look for patterns on a hundreds chart, like counting by 10s from any number.", items: [
    { q: "What comes next? 15, 25, 35, 45, ___", t: "num", ans: 55 },
    { q: "Which number is even?", t: "mc", o: ["14", "9", "17"] },
    { q: "What comes next? 80, 70, 60, ___", t: "num", ans: 50 }] },
  3: { skill: "unknown numbers in multiplying and dividing; patterns", tip: "Use fact families to find missing numbers, like ___ × 6 = 48.", items: [
    { q: "___ × 6 = 48", t: "num", ans: 8 },
    { q: "63 ÷ ___ = 9", t: "num", ans: 7 },
    { q: "A pattern adds 4 each time: 3, 7, 11, 15, ___", t: "num", ans: 19 }] },
  4: { skill: "pattern rules, factors and multi-step word problems", tip: "Make input and output tables (\"the rule is times 3\") and guess each other's rules.", items: [
    { q: "Start at 2 and multiply by 3 each time. Which list follows the rule?", t: "mc", o: ["2, 6, 18, 54", "2, 5, 8, 11", "2, 6, 10, 14"] },
    { q: "Tickets cost $8 each. A family buys 4 tickets and pays with $50. How much change do they get, in dollars?", t: "num", ans: 18 },
    { q: "Which number is a factor of 36?", t: "mc", o: ["9", "8", "5"] }] },
  5: { skill: "order of operations and writing expressions", tip: "Write number puzzles with parentheses and solve them in the right order.", items: [
    { q: "3 + 4 × 2 = ?", t: "num", ans: 11 },
    { q: "(8 + 4) ÷ 3 = ?", t: "num", ans: 4 },
    { q: "Which means \"add 5 and 7, then multiply by 2\"?", t: "mc", o: ["(5 + 7) × 2", "5 + 7 × 2", "5 × 2 + 7"] }] },
  6: { skill: "expressions with letters and one-step equations", tip: "Use letters for unknowns in everyday problems: if n is the number of apples at $3 each, the cost is 3n.", items: [
    { q: "If n = 5, what is 4n + 3?", t: "num", ans: 23, say: "If n equals 5, what is 4 n plus 3?" },
    { q: "x + 12 = 30. What is x?", t: "num", ans: 18 },
    { q: "Which is the same as 3(x + 2)?", t: "mc", o: ["3x + 6", "3x + 2", "x + 6"], say: "Which is the same as 3 times the quantity x plus 2?" }] },
  7: { skill: "two-step equations and combining like terms", tip: "Solve equations by undoing the steps in reverse order, then check by putting the answer back in.", items: [
    { q: "2x + 5 = 17. What is x?", t: "num", ans: 6 },
    { q: "x ÷ 4 − 3 = 2. What is x?", t: "num", ans: 20, neg: true },
    { q: "Which is the same as 5x − 2x + 4?", t: "mc", o: ["3x + 4", "7x + 4", "3x + 2"] }] },
  8: { skill: "multi-step equations and slope", tip: "Graph real situations, like money saved each week, and talk about what the slope means.", items: [
    { q: "3(x − 2) = 2x + 4. What is x?", t: "num", ans: 10, neg: true, say: "3 times the quantity x minus 2 equals 2 x plus 4. What is x?" },
    { q: "What is the slope of the line through (0, 1) and (2, 7)?", t: "num", ans: 3, neg: true },
    { q: "Which line has a slope of 2 and crosses the y-axis at −3?", t: "mc", o: ["y = 2x − 3", "y = −3x + 2", "y = 2x + 3"] }] }
}},
{ id: "geo", name: "Measurement, data and geometry", min: 0, max: 8, levels: {
  0: { skill: "naming shapes and comparing lengths", tip: "Go on a shape hunt at home and name circles, squares, triangles and rectangles.", items: [
    { q: "What shape is this?", t: "mc", o: ["triangle", "square", "circle"], fig: { t: "shape", k: 3 } },
    { q: "How many sides does this shape have?", t: "num", ans: 4, fig: { t: "shape", k: 4 } },
    { q: "Which line is the longest?", t: "mc", o: ["B", "A", "C"], fig: { t: "lens", L: [["A", 3], ["B", 5], ["C", 2]] } }] },
  1: { skill: "telling time to the half hour and measuring length", tip: "Read the clock together at mealtimes, and measure things with paper clips or blocks.", items: [
    { q: "What time is it?", t: "mc", o: ["3:00", "12:03", "3:12"], fig: { t: "clock", h: 3, m: 0 } },
    { q: "What time is it?", t: "mc", o: ["7:30", "6:30", "7:06"], fig: { t: "clock", h: 7, m: 30 } },
    { q: "How many units long is the pencil?", t: "num", ans: 6, fig: { t: "ruler", len: 6 } }] },
  2: { skill: "money, time to 5 minutes and bar graphs", tip: "Count real coins together and read analog clocks to the nearest 5 minutes.", items: [
    { q: "You have 2 quarters, 1 dime, and 3 pennies. How many cents is that?", t: "num", ans: 63 },
    { q: "What time is it?", t: "mc", o: ["4:15", "3:15", "4:03"], fig: { t: "clock", h: 4, m: 15 } },
    { q: "How many more dogs than fish?", t: "num", ans: 5, fig: { t: "graph", data: [["Cats", 5], ["Dogs", 8], ["Fish", 3]], title: "Pets in our class" } }] },
  3: { skill: "area, perimeter and elapsed time", tip: "Measure tables or rooms. Count squares for area and walk the edge for perimeter.", items: [
    { q: "What is the area of this rectangle, in square units?", t: "num", ans: 24, fig: { t: "rectDim", w: 6, h: 4, grid: true } },
    { q: "What is the perimeter of this rectangle, in units?", t: "num", ans: 16, fig: { t: "rectDim", w: 5, h: 3 } },
    { q: "A movie starts at 2:45 and lasts 50 minutes. When does it end?", t: "mc", o: ["3:35", "3:05", "3:45"] }] },
  4: { skill: "angles and converting units", tip: "Bake or build together and convert units: feet to inches, hours to minutes.", items: [
    { q: "What kind of angle is this?", t: "mc", o: ["obtuse angle", "acute angle", "right angle"], fig: { t: "angle", deg: 125 } },
    { q: "How many inches are in 3 feet?", t: "num", ans: 36 },
    { q: "A rectangle has an area of 48 square feet. One side is 6 feet long. How long is the other side, in feet?", t: "num", ans: 8 }] },
  5: { skill: "volume, metric conversions and coordinate grids", tip: "Count cubes in boxes or drawings to see that volume is length × width × height.", items: [
    { q: "What is the volume of this box, in cubic units?", t: "num", ans: 24, fig: { t: "box", l: 4, w: 3, h: 2 } },
    { q: "How many centimeters are in 3.5 meters?", t: "num", ans: 350 },
    { q: "Which point is 3 to the right of (0, 0) and 2 up?", t: "mc", o: ["(3, 2)", "(2, 3)", "(3, 0)"] }] },
  6: { skill: "area of triangles, mean and median", tip: "Find the average of real data, like daily high temperatures or game scores.", items: [
    { q: "What is the area of this triangle, in square units?", t: "num", ans: 30, fig: { t: "tri", b: 10, h: 6 } },
    { q: "What is the mean (average) of 5, 9, 6, 10, 10?", t: "num", ans: 8 },
    { q: "What is the median of 3, 9, 4, 12, 7?", t: "num", ans: 7 }] },
  7: { skill: "area of circles, probability and scale drawings", tip: "Measure round objects to explore pi, and use spinners or dice to talk about chance.", items: [
    { q: "A circle has a radius of 5 cm. What is its area in square cm? Use 3.14 for π.", t: "num", ans: 78.5, say: "A circle has a radius of 5 centimeters. What is its area in square centimeters? Use 3.14 for pi." },
    { q: "A bag has 3 red, 5 blue, and 2 green marbles. What is the chance of picking a blue one without looking?", t: "mc", o: ["1/2", "1/3", "1/5"] },
    { q: "On a map, 1 inch stands for 20 miles. Two towns are 3.5 inches apart on the map. How many miles apart are they?", t: "num", ans: 70 }] },
  8: { skill: "the Pythagorean theorem, volume of cylinders and transformations", tip: "Check corners for right angles with the 3-4-5 rule, and talk about how shapes move when they slide, flip or turn.", items: [
    { q: "How long is the longest side of this right triangle?", t: "num", ans: 10, fig: { t: "rtri", a: 6, b: 8 } },
    { q: "A cylinder has a radius of 2 and a height of 5. What is its volume? Use 3.14 for π.", t: "num", ans: 62.8, say: "A cylinder has a radius of 2 and a height of 5. What is its volume? Use 3.14 for pi." },
    { q: "The point (2, 3) is flipped (reflected) across the x-axis. Where does it land?", t: "mc", o: ["(2, −3)", "(−2, 3)", "(3, 2)"] }] }
}}
];

const PRACTICE = [
  { q: "Practice: tap the number 4.", t: "mc", o: ["4", "7", "1"] },
  { q: "Practice: type the number 10, then tap Next.", t: "num", ans: 10 }
];
