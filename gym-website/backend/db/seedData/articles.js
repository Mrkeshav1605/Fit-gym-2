/**
 * Nutrition education content. This is general, balanced information —
 * NOT medical advice and NOT a personalised diet plan. The API and UI both
 * repeat the disclaimer that individual plans belong with a qualified
 * nutrition professional.
 */
export const articles = [
  {
    title: 'How to Build a Balanced Plate',
    slug: 'balanced-plate', category: 'Basics', readTime: 4, tags: ['plate method', 'basics', 'meal planning'], published: true,
    summary: 'A simple visual guide to putting together balanced meals without counting anything — protein, vegetables, carbs, and healthy fats in the right proportions.',
    sections: [
      { h: 'The plate method', p: ['Imagine your plate divided into four simple parts: half vegetables and fruit, one quarter protein, one quarter whole grains or starchy foods, plus a small serving of healthy fat. This simple mental model keeps most meals balanced without measuring or calculating anything.'] },
      { h: 'Why protein matters for gym-goers', p: ['Protein supplies the building blocks your body uses to repair muscle after training. Spread it across your meals — for example eggs or dal at breakfast, chicken or paneer at lunch, fish or sprouts at dinner — rather than loading it all into one meal.'] },
      { h: 'Carbs are not the enemy', p: ['Carbohydrates are the main fuel for training. Whole grains, rice, roti, oats, potatoes and fruit give your muscles the energy they need to perform. Very low-carb approaches may leave you flat and tired during workouts, so they are rarely a good idea for active people.'] },
      { h: 'Fats and vegetables', p: ['Healthy fats from nuts, seeds, oils and avocado support hormones and recovery. Vegetables and fruit provide vitamins, minerals and fibre. Aim for colour variety across the week rather than perfection at every meal.'] },
      { h: 'A note to remember', p: ['This is general nutrition education, not a personalised plan. Individualised nutrition plans should be created with a qualified nutrition professional, especially if you have medical conditions, allergies, or special dietary requirements.'] },
    ],
  },
  {
    title: 'Protein Basics for Strength Training',
    slug: 'protein-basics', category: 'Protein', readTime: 5, tags: ['protein', 'muscle', 'recovery'], published: true,
    summary: 'What protein does, how much most active people aim for, and where to find it — in both vegetarian and non-vegetarian diets.',
    sections: [
      { h: 'What protein actually does', p: ['After resistance training your muscles are in a state of repair. Protein provides the amino acids needed for that repair, which is how muscles adapt and grow stronger over time. Without enough protein, recovery slows down and progress stalls.'] },
      { h: 'How much?', p: ['A commonly cited general target for active people is roughly 1.6–2.2 g of protein per kilogram of bodyweight per day, spread across meals. This is general guidance, not a prescription — individual needs vary, and people with kidney or other medical conditions should follow professional advice.'] },
      { h: 'Great protein sources', p: ['Non-vegetarian: eggs, chicken, fish, paneer, curd and milk. Vegetarian: dal and legumes, chickpeas, rajma, soya, sprouts, milk products, and nuts in smaller amounts. Mixing sources across the day (grains + legumes) improves the overall protein quality of vegetarian meals.'] },
      { h: 'Timing and consistency', p: ['Total daily intake matters far more than perfect timing. That said, having 20–40 g of protein within a few hours after training is a practical, widely recommended habit that supports recovery.'] },
      { h: 'Supplements are optional', p: ['Protein powder is simply a convenience food, not a requirement. Most people can meet their needs with normal food. Never buy unverified supplements, and remember the platform does not prescribe supplements — discuss any supplement with a qualified professional.'] },
    ],
  },
  {
    title: 'Pre & Post Workout Nutrition',
    slug: 'pre-post-workout', category: 'Performance', readTime: 4, tags: ['fuel', 'recovery', 'timing'], published: true,
    summary: 'What to eat before and after training so you perform well and recover better — with simple examples for morning and evening trainers.',
    sections: [
      { h: 'Before training', p: ['A meal 2–3 hours before training works best for most people: a mix of carbs for fuel and some protein. Examples: oats with milk and banana, or rice with dal and curd, or a chicken sandwich. If you train within an hour of eating, keep it small and easy to digest — a banana, a slice of toast with peanut butter, or a glass of milk.'] },
      { h: 'During training', p: ['For sessions under an hour, water is all most people need. For longer or very sweaty sessions, sipping water regularly and, if needed, an electrolyte drink can help you maintain performance.'] },
      { h: 'After training', p: ['Within a couple of hours, have a meal containing protein and carbs — this supports muscle repair and refills energy stores. Examples: eggs with roti and vegetables, paneer with rice, or chicken with rice and salad.'] },
      { h: 'What about fasted training?', p: ['Some people feel fine training on an empty stomach; others get dizzy and weak. There is no universal rule — but if you feel light-headed, training fasted is not for you. If you have diabetes or blood-sugar issues, get professional advice before training fasted.'] },
      { h: 'Important', p: ['This is general guidance, not a personalised nutrition plan. For medical conditions, allergies, or special dietary requirements, consult a qualified nutrition professional.'] },
    ],
  },
  {
    title: 'Hydration for Training Days',
    slug: 'hydration', category: 'Basics', readTime: 3, tags: ['water', 'performance', 'basics'], published: true,
    summary: 'Water is the most underrated performance tool in the gym. How much, when, and how to know if you are drinking enough.',
    sections: [
      { h: 'Why hydration matters', p: ['Even mild dehydration (2% of bodyweight) measurably reduces strength, endurance, and concentration. Most people train noticeably better simply by staying properly hydrated through the day.'] },
      { h: 'How much?', p: ['A simple general guide: drink regularly through the day so your urine stays pale yellow, and sip 200–300 ml of water every 15–20 minutes during training. Thirst is a late signal, so drink before you feel thirsty.'] },
      { h: 'Signs you are behind', p: ['Dark urine, headaches, dry mouth, feeling tired despite good sleep, and muscle cramps can all point to under-hydration. If you notice these often, add water — and if they persist, talk to a doctor.'] },
      { h: 'Do you need sports drinks?', p: ['For most sessions under an hour, plain water is enough. Electrolyte drinks help mainly in long sessions, heavy sweating, or hot conditions. Many commercial drinks are high in sugar — check the label.'] },
    ],
  },
  {
    title: 'Sleep: The Hidden Recovery Tool',
    slug: 'sleep-recovery', category: 'Recovery', readTime: 4, tags: ['sleep', 'recovery', 'performance'], published: true,
    summary: 'Muscle is not built in the gym — it is built while you sleep. Why sleep is the most powerful recovery tool you own, and how to protect it.',
    sections: [
      { h: 'The build happens at night', p: ['Training creates the stimulus; sleep is when your body releases growth hormone, repairs muscle tissue, and consolidates the adaptations you trained for. Chronic short sleep is one of the fastest ways to stall progress.'] },
      { h: 'How much do you need?', p: ['Most adults do best on 7–9 hours. If you train hard, aim for the upper end of that range. Consistency matters more than catching up on weekends.'] },
      { h: 'Simple habits that help', p: ['Keep a roughly fixed sleep and wake time, avoid heavy meals and caffeine within several hours of bed, keep the room cool and dark, and put screens away 30–60 minutes before sleeping. These small habits compound.'] },
      { h: 'Training and sleep feed each other', p: ['Regular exercise improves sleep quality, and better sleep improves training performance — a positive loop. If you are exhausted, an extra rest day and an early night usually beat another hard session.'] },
      { h: 'When to get help', p: ['If you regularly sleep poorly despite good habits, or if you snore heavily or feel exhausted after a full night, speak to a doctor. Sleep disorders are medical matters, and this platform cannot diagnose them.'] },
    ],
  },
  {
    title: 'Meal Timing Made Simple',
    slug: 'meal-timing', category: 'Basics', readTime: 3, tags: ['timing', 'routine', 'basics'], published: true,
    summary: 'Do you need six meals a day? Is eating late bad? What actually matters about when you eat — simplified.',
    sections: [
      { h: 'The big picture', p: ['For body composition and performance, total daily nutrition matters most: enough protein, enough total energy for your goals, and mostly whole foods. Meal timing is the fine-tuning, not the engine.'] },
      { h: 'Meals per day', p: ['Whether you eat 3 meals or 5, what matters is that it fits your routine and supplies your needs. Many people do well with 3 balanced meals plus one snack; some prefer smaller frequent meals. Pick what you can sustain.'] },
      { h: 'Eating late at night', p: ['Eating close to bedtime can disturb sleep for some people, but the food itself is not magically "stored as fat" at night. A light protein-rich snack before bed is fine for most — and helpful for some.'] },
      { h: 'Around training', p: ['A carb + protein meal within a few hours before training, and protein + carbs within a couple of hours after, are the two timing habits with the most practical benefit. See our pre & post workout article for examples.'] },
      { h: 'Remember', p: ['This is general nutrition education. Individualised plans should be created with a qualified nutrition professional, especially for medical conditions, allergies, or eating concerns.'] },
    ],
  },
];
