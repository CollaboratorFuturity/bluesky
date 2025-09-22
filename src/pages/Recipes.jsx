import React, { useState, useEffect } from 'react';
// import { LightRecipe } from '@/entities/LightRecipe'; // ← no backend now
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Bot, Play, X, Save, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { sendArduinoCommand } from '@/lib/arduino.js';

// Reordered lights to match Control page
const lights = [
  { id: '265nm', name: '265 nm' }, { id: '367nm', name: '367 nm' }, { id: '450nm', name: '450 nm' },
  { id: '522nm', name: '522 nm' }, { id: '632nm', name: '632 nm' }, { id: '657nm', name: '657 nm' },
  { id: '727nm', name: '727 nm' }, { id: 'wash', name: 'Wash' }
];
const durationOptions = Array.from({ length: 20 }, (_, i) => (i + 1) * 500);

/* ----------------------- Local persistence helpers ----------------------- */
const slugify = (s) =>
  String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

function saveRecipeLocal(name, data) {
  try {
    localStorage.setItem(
      `recipe:${name}`,
      JSON.stringify({ savedAt: new Date().toISOString(), data }, null, 2)
    );
    return true;
  } catch (e) {
    console.warn('localStorage save failed:', e);
    return false;
  }
}

async function saveRecipeFile(name, data) {
  const json = JSON.stringify(data, null, 2);

  if ('showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: `${slugify(name)}.json`,
        types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(new Blob([json], { type: 'application/json' }));
      await writable.close();
      return 'fs-access';
    } catch (err) {
      console.warn('File picker failed, falling back to download:', err);
    }
  }

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slugify(name)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return 'download';
}

function loadAllRecipesLocal() {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith('recipe:'));
  const list = keys.map((k) => {
    try {
      const parsed = JSON.parse(localStorage.getItem(k) || '{}');
      if (parsed && parsed.data) {
        // ensure id exists; use name if missing
        const r = parsed.data;
        return { ...r, id: r.id ?? r.name };
      }
    } catch (_) {}
    return null;
  }).filter(Boolean);

  // Sort by name, fallback to id
  return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

function deleteRecipeLocal(nameOrId) {
  // We store by name; accept either exact name or an id equal to the name.
  localStorage.removeItem(`recipe:${nameOrId}`);
}
/* ------------------------------------------------------------------------ */

export default function RecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runnerLog, setRunnerLog] = useState([]);

  useEffect(() => { loadRecipes(); }, []);
  const loadRecipes = () => {
    setIsLoading(true);
    const data = loadAllRecipesLocal();
    setRecipes(data);
    setIsLoading(false);
  };

  const runRecipe = async () => {
    if (!selectedRecipeId) return;
    const recipeToRun = recipes.find(r => (r.id || r.name) === selectedRecipeId);
    if (!recipeToRun) return;

    setIsRunning(true);
    setRunnerLog([`> Starting recipe: "${recipeToRun.name}"...`]);
    for (let i = 0; i < recipeToRun.steps.length; i++) {
      const step = recipeToRun.steps[i];
      setRunnerLog(prev => [...prev, `> Executing Step ${i + 1} (${step.actions.length} action(s))`]);

      const commands = step.actions.map(action => `led ${action.light_id} ON ${action.duration}ms`);
      const maxDuration = Math.max(...step.actions.map(a => a.duration), 0);

      await Promise.all(commands.map(cmd => sendArduinoCommand(cmd)));
      setRunnerLog(prev => [...prev, `< Step ${i + 1} commands sent.`]);

      if (i < recipeToRun.steps.length - 1) {
        setRunnerLog(prev => [...prev, `> Waiting ${maxDuration}ms...`]);
        await new Promise(resolve => setTimeout(resolve, maxDuration));
      }
    }
    setRunnerLog(prev => [...prev, `> Recipe "${recipeToRun.name}" finished.`]);
    setIsRunning(false);
  };

  const handleNewRecipe = () => {
    setCurrentRecipe({
      id: '', // will be set to name on save
      name: '',
      description: '',
      steps: [{ actions: [{ light_id: '', duration: 500 }] }]
    });
    setIsEditorOpen(true);
  };

  const handleEditRecipe = (recipe) => {
    setCurrentRecipe(JSON.parse(JSON.stringify(recipe)));
    setIsEditorOpen(true);
  };

  const handleSaveRecipe = async () => {
    if (!currentRecipe?.name?.trim()) {
      alert("Recipe name is required.");
      return;
    }

    // Assign id = name (since localStorage key uses the name)
    const toSave = { ...currentRecipe, id: currentRecipe.name };

    // Save to localStorage
    saveRecipeLocal(toSave.name, toSave);

    // Offer a file save (picker or download)
    //await saveRecipeFile(toSave.name, toSave);

    setIsEditorOpen(false);
    setCurrentRecipe(null);
    loadRecipes();
  };

  const handleDeleteRecipe = async (idOrName) => {
    if (window.confirm("Are you sure?")) {
      deleteRecipeLocal(idOrName);
      // if the deleted one was selected, clear selection
      setSelectedRecipeId(prev => (prev === idOrName ? '' : prev));
      loadRecipes();
    }
  };

  const updateRecipeField = (field, value) => {
    setCurrentRecipe(prev => ({ ...prev, [field]: value }));
  };

  const updateAction = (stepIndex, actionIndex, field, value) => {
    const newSteps = [...currentRecipe.steps];
    newSteps[stepIndex].actions[actionIndex][field] = value;
    setCurrentRecipe(prev => ({ ...prev, steps: newSteps }));
  };

  const addAction = (stepIndex) => {
    const newSteps = [...currentRecipe.steps];
    newSteps[stepIndex].actions.push({ light_id: '', duration: 500 });
    setCurrentRecipe(prev => ({ ...prev, steps: newSteps }));
  };

  const removeAction = (stepIndex, actionIndex) => {
    const newSteps = [...currentRecipe.steps];
    newSteps[stepIndex].actions.splice(actionIndex, 1);
    if (newSteps[stepIndex].actions.length === 0 && newSteps.length > 1) {
      newSteps.splice(stepIndex, 1);
    }
    setCurrentRecipe(prev => ({ ...prev, steps: newSteps }));
  };

  const addStep = () => {
    const newSteps = [...currentRecipe.steps, { actions: [{ light_id: '', duration: 500 }] }];
    setCurrentRecipe(prev => ({ ...prev, steps: newSteps }));
  };

  return (
    <div className="space-y-8">
      <Card className="bg-white border-2 border-gray-300 rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 font-bold text-gray-900" style={{ fontSize: '2rem' }}>
            <Play className="text-gray-500"/> Recipe Runner
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <Select onValueChange={setSelectedRecipeId} value={selectedRecipeId} disabled={isRunning}>
              <SelectTrigger className="w-full bg-white border-2 border-gray-400 text-gray-900 h-12 rounded-lg text-base">
                <SelectValue placeholder="Select a recipe to run..." />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 border-gray-400 text-gray-900">
                {recipes.map(r => (
                  <SelectItem key={r.id} value={r.id} className="focus:bg-gray-200">
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={runRecipe}
              disabled={!selectedRecipeId || isRunning}
              className="bg-gray-900 hover:bg-gray-800 text-white font-bold h-12 px-6 rounded-lg transition-colors"
            >
              {isRunning ? 'Running...' : 'Run'}
            </Button>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 h-48 overflow-y-auto font-mono text-sm text-gray-200 border-2 border-gray-700">
            {runnerLog.length === 0 && <p className="text-gray-500">Awaiting recipe execution...</p>}
            {runnerLog.map((log, index) => <p key={index}>{log}</p>)}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h1 className="font-bold flex items-center gap-3 text-gray-900" style={{ fontSize: '1.125rem' }}>
          <Bot className="text-gray-600"/> Light Recipes
        </h1>
        <Button
          onClick={handleNewRecipe}
          className="bg-gray-300 text-gray-900 hover:bg-gray-400 font-bold py-2 px-4 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4 mr-2"/> Add Recipe
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p className="text-gray-600">Loading...</p>
        ) : (
          recipes.map(recipe => (
            <Card key={recipe.id} className="bg-white border-2 border-gray-300 rounded-lg flex flex-col">
              <CardHeader>
                <CardTitle className="text-gray-900 text-lg font-bold">{recipe.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-gray-700 text-sm">{recipe.description || 'No description.'}</p>
                <p className="text-gray-500 mt-2 text-xs">{recipe.steps.length} steps</p>
              </CardContent>
              <div className="p-4 border-t-2 border-gray-300 flex justify-end items-center gap-2">
                <Button
                  variant="ghost"
                  className="text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg"
                  onClick={() => handleDeleteRecipe(recipe.id)}
                >
                  <Trash2 className="w-4 h-4"/>
                </Button>
                <Button
                  onClick={() => handleEditRecipe(recipe)}
                  className="bg-gray-300 text-gray-900 hover:bg-gray-400 font-bold py-2 px-3 rounded-lg text-sm transition-colors"
                >
                  Edit
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <AnimatePresence>
        {isEditorOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col border-2 border-gray-300"
            >
              <Card className="flex flex-col w-full h-full">
                <CardHeader>
                  <div className="flex items-center">
                    <h2 className="text-lg font-bold text-gray-900">
                      {currentRecipe?.id ? 'Edit Recipe' : 'Create New Recipe'}
                    </h2>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4 overflow-y-auto">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
                  <Input
                    placeholder="Recipe Name"
                    value={currentRecipe?.name || ''}
                    onChange={e => updateRecipeField('name', e.target.value)}
                    className="bg-white border-2 border-gray-400 rounded-lg"
                    style={{
                      height: '3.5rem',
                      fontSize: '1.5rem',
                      padding: '0 1.5rem',
                      width: '100%',
                      maxWidth: '480px',
                      fontWeight: 600
                    }}
                  />
                  <Textarea
                    placeholder="Description"
                    value={currentRecipe?.description || ''}
                    onChange={e => updateRecipeField('description', e.target.value)}
                    className="bg-white border-2 border-gray-400 rounded-lg"
                  />
                </div>
                <h3 className="font-bold pt-4 text-gray-900">Steps</h3>
                  <div className="space-y-4">
                    {currentRecipe?.steps?.map((step, stepIndex) => (
                      <div key={stepIndex}>
                        <Card className="bg-gray-200 border-2 border-gray-400 p-4 space-y-3 rounded-lg">
                          <p className="text-sm font-bold text-gray-700">Step {stepIndex + 1}</p>

                          {step.actions.map((action, actionIndex) => (
                            <div key={actionIndex} className="flex items-center gap-2">
                              <Select
                                value={action.light_id}
                                onValueChange={val => updateAction(stepIndex, actionIndex, 'light_id', val)}
                              >
                                <SelectTrigger
                                  className="bg-white border-2 border-gray-400 rounded-lg"
                                  style={{
                                    height: '2.5rem',
                                    fontSize: '1.1rem',
                                    minWidth: '120px'
                                  }}
                                >
                                  <SelectValue placeholder="Light"/>
                                </SelectTrigger>
                                <SelectContent className="bg-white border-2 border-gray-300">
                                  {lights.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                                </SelectContent>
                              </Select>

                              <Select
                                value={String(action.duration)}
                                onValueChange={val => updateAction(stepIndex, actionIndex, 'duration', parseInt(val, 10))}
                              >
                                <SelectTrigger
                                  className="bg-white border-2 border-gray-400 rounded-lg"
                                  style={{
                                    height: '2.5rem',
                                    fontSize: '1.1rem',
                                    minWidth: '120px'
                                  }}
                                >
                                  <SelectValue placeholder="Duration"/>
                                </SelectTrigger>
                                <SelectContent className="bg-white border-2 border-gray-300">
                                  {durationOptions.map(d => <SelectItem key={d} value={String(d)}>{d} ms</SelectItem>)}
                                </SelectContent>
                              </Select>

                              <Button variant="ghost" size="icon" onClick={() => removeAction(stepIndex, actionIndex)}>
                                <Trash2 className="text-gray-500 hover:text-red-600 w-4 h-4"/>
                              </Button>
                            </div>
                          ))}

                        <Button
                          variant="outline" size="sm" onClick={() => addAction(stepIndex)}
                          className="border-2 border-gray-400 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          <Plus className="w-4 h-4 mr-2"/>Add Light
                        </Button>
                      </Card>

                      {stepIndex < currentRecipe.steps.length - 1 &&
                        <div className="flex justify-center my-2"><ArrowRight className="text-gray-500"/></div>}
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline" onClick={addStep}
                  className="border-2 border-gray-400 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  <Plus className="w-4 h-4 mr-2"/>Add Sequential Step
                </Button>
                </CardContent>

              <footer className="p-4 border-t-2 border-gray-300 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsEditorOpen(false)} className="text-gray-700 rounded-lg">
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveRecipe}
                  className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4 mr-2"/>Save Recipe
                </Button>
                </footer>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}