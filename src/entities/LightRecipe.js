export const BUILTIN_RECIPES = [
  {
    id: 'builtin-uv-demo',
    name: 'Lights Demo',
    description: 'Demo: Each light turns on for 1 second, one after another.',
    steps: [
      { actions: [ { light_id: '265nm', duration: 1000 } ] },
      { actions: [ { light_id: '367nm', duration: 1000 } ] },
      { actions: [ { light_id: '450nm', duration: 1000 } ] },
      { actions: [ { light_id: '522nm', duration: 1000 } ] },
      { actions: [ { light_id: '632nm', duration: 1000 } ] },
      { actions: [ { light_id: '657nm', duration: 1000 } ] },
      { actions: [ { light_id: '727nm', duration: 1000 } ] },
      { actions: [ { light_id: 'wash', duration: 1000 } ] }
    ]
  },
  {
    id: 'builtin-all-uv',
    name: 'All UV',
    description: 'Turns all UV lights on for 5 seconds',
    steps: [
      {
        actions: [
          { light_id: '265nm', duration: 5000 },
          { light_id: '367nm', duration: 5000 }
        ]
      }
    ]
  }
];

// (Keep the stub for LightRecipe for now)
export function LightRecipe(...args){ /* TODO */ return undefined }
