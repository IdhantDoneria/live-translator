// Emergency / Travel Phrasebook (R3)
// Pre-translated common phrases organized by situation category.
// Each phrase has an English source and translations are handled dynamically
// via the /translate endpoint when the user clicks a phrase.

window.PHRASEBOOK = [
  {
    category: '🏥 Medical',
    icon: '🏥',
    phrases: [
      'I need a doctor',
      'I am allergic to peanuts',
      'I have a severe food allergy',
      'Where is the nearest hospital?',
      'I need an ambulance',
      'I am diabetic',
      'I have chest pain',
      'I need my medication',
      'Please call emergency services',
      'I cannot breathe properly'
    ]
  },
  {
    category: '✈️ Airport',
    icon: '✈️',
    phrases: [
      'Where is the check-in counter?',
      'I need to find my gate',
      'Where is baggage claim?',
      'I have a connecting flight',
      'My luggage is missing',
      'Where is the currency exchange?',
      'How do I get to the city center?',
      'I need a taxi to my hotel',
      'Where is the immigration desk?',
      'Is there free Wi-Fi here?'
    ]
  },
  {
    category: '🍽️ Restaurant',
    icon: '🍽️',
    phrases: [
      'A table for two, please',
      'Can I see the menu?',
      'I am vegetarian',
      'I am allergic to shellfish',
      'The bill, please',
      'Is this dish spicy?',
      'Can I have water, please?',
      'Do you have a kids menu?',
      'I would like to order takeout',
      'No sugar, please'
    ]
  },
  {
    category: '🏨 Hotel',
    icon: '🏨',
    phrases: [
      'I have a reservation',
      'What time is check-out?',
      'Can I get a wake-up call?',
      'The air conditioning is not working',
      'Where is the elevator?',
      'I need extra towels',
      'Is breakfast included?',
      'Can I store my luggage?',
      'What is the Wi-Fi password?',
      'I would like to extend my stay'
    ]
  },
  {
    category: '🚗 Transportation',
    icon: '🚗',
    phrases: [
      'How much does a taxi cost to here?',
      'Please take me to this address',
      'Where is the nearest bus stop?',
      'One ticket, please',
      'Does this train go to the city center?',
      'Please stop here',
      'How long is the ride?',
      'I need to rent a car',
      'Where can I buy a transit card?',
      'Is this seat available?'
    ]
  },
  {
    category: '🆘 Emergency',
    icon: '🆘',
    phrases: [
      'Help! Please help me!',
      'I am lost',
      'Someone stole my wallet',
      'I need to contact my embassy',
      'Please call the police',
      'There has been an accident',
      'I lost my passport',
      'Can you help me find my hotel?',
      'I do not speak this language',
      'Where is the nearest police station?'
    ]
  }
];
