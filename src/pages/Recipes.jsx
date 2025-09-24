import React, { useState, useEffect } from 'react';
import { BUILTIN_RECIPES } from '@/entities/LightRecipe.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Bot, Play, X, Save, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { sendArduinoCommand, isArduinoConnected } from '@/lib/arduino.js';

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
  const [runButtonHover, setRunButtonHover] = useState(false);
  const [deleteHoverId, setDeleteHoverId] = useState(null);
  const [editHoverId, setEditHoverId] = useState(null);
  const [runCardHoverId, setRunCardHoverId] = useState(null);
  const [deleteLightHover, setDeleteLightHover] = useState('');
  const [addLightHoverStep, setAddLightHoverStep] = useState(null);
  const [addStepHover, setAddStepHover] = useState(false);
  const [cancelHover, setCancelHover] = useState(false);
  const [saveHover, setSaveHover] = useState(false);

  useEffect(() => { loadRecipes(); }, []);
  const loadRecipes = () => {
    setIsLoading(true);
    const localRecipes = loadAllRecipesLocal();
    // Merge built-in and local recipes, avoiding duplicates by id
    const allRecipes = [
      ...BUILTIN_RECIPES,
      ...localRecipes.filter(r => !BUILTIN_RECIPES.some(b => b.id === r.id))
    ];
    setRecipes(allRecipes);
    // If only one recipe, auto-select it
    if (allRecipes.length === 1) {
      setSelectedRecipeId(allRecipes[0].id);
    }
    setIsLoading(false);
  };

  const runRecipe = async (recipeId) => {
    const idToRun = recipeId || selectedRecipeId;
    if (!idToRun) return;
    if (!isArduinoConnected()) {
      setRunnerLog(prev => [
        ...prev,
        '< Error: Not connected'
      ]);
      return;
    }
    const recipeToRun = recipes.find(r => (r.id || r.name) === idToRun);
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
      <Card className="border-2 border-gray-300 rounded-lg" style={{ background: '#f3f4f6', color: '#222', fontWeight: 500 }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 font-bold" style={{ fontSize: '2rem', color: '#222' }}>
            <Play className="text-gray-500"/> Recipe Runner
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <Select
              onValueChange={setSelectedRecipeId}
              value={selectedRecipeId}
              disabled={isRunning}
              style={{
                height: '2rem',
                fontSize: '1.5rem',
                minWidth: '60px'
              }}
            >
              <SelectTrigger className="bg-white border-2 border-gray-400 rounded-lg">
                <SelectValue placeholder="Pick recipe" />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 border-gray-400 text-gray-900">
                {recipes.map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={runRecipe}
              disabled={!selectedRecipeId || isRunning}
              style={{
                backgroundColor: runButtonHover ? '#22c55e' : '#bbf7d0', // full green on hover, light green default
                color: '#222',
                fontWeight: 'bold',
                height: '3rem',
                padding: '0 1.5rem',
                borderRadius: '0.5rem',
                marginLeft: '1rem', // space from dropdown
                border: 'none',
                cursor: (!selectedRecipeId || isRunning) ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={() => setRunButtonHover(true)}
              onMouseLeave={() => setRunButtonHover(false)}
            >
              {isRunning ? 'Running...' : 'Run'}
            </Button>
          </div>

          {/* Recipe run log: only show last 2 messages */}
          <div
            className="bg-gray-900 rounded-lg p-4 h-24 overflow-y-auto font-mono text-sm border-2 border-gray-700"
            style={{ color: '#222' }}
          >
            {runnerLog.length === 0 && <p style={{ color: '#888' }}>Awaiting recipe execution...</p>}
            {runnerLog.slice(-2).map((log, index) => {
              const isFinished = /^> Recipe ".*" finished\.$/.test(log);
              const isError = /^< Error:/.test(log);
              return (
                <p
                  key={index}
                  style={
                    isFinished
                      ? { color: "green", fontWeight: "bold" }
                      : isError
                        ? { color: "red", fontWeight: "bold" }
                        : { color: "#222" }
                  }
                >
                  {log}
                </p>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h1 className="font-bold flex items-center gap-3 text-gray-900" style={{ fontSize: '1.125rem' }}>
          <Bot className="text-gray-600"/> Light Recipes
        </h1>
      </div>
      
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        style={{ gap: '10px' }}
      >
        {isLoading ? (
          <p className="text-gray-600">Loading...</p>
        ) : (
          recipes.map(recipe => (
            <Card
              key={recipe.id}
              className="border-2 border-gray-300 rounded-lg flex flex-col"
              style={{ background: '#f3f4f6', margin: '5px', color: '#222', fontWeight: 500 }}
            >
              <CardHeader>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ color: '#222', fontWeight: 'bold', fontSize: '1.1rem' }}>{recipe.name}</span>
                  <span style={{ color: '#aaa', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {recipe.description || 'No description.'}
                  </span>
                </div>
              </CardHeader>
              {/* No CardContent or steps count needed */}
              <div
                className="p-4 border-t-2 border-gray-300"
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: '1rem',
                  padding: '1rem'
                }}
              >
                {/* Delete and Edit buttons with equal height and red hover for delete */}
                <Button
                  onClick={() => handleDeleteRecipe(recipe.id)}
                  style={{
                    background: deleteHoverId === recipe.id ? '#ef4444' : '#fca5a5',
                    color: deleteHoverId === recipe.id ? '#fff' : '#b91c1c',
                    border: 'none',
                    borderRadius: '0.5rem',
                    height: '2.2rem',
                    width: '2.2rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={() => setDeleteHoverId(recipe.id)}
                  onMouseLeave={() => setDeleteHoverId(null)}
                >
                  <Trash2 className="w-4 h-4"/>
                </Button>
                <Button
                  onClick={() => handleEditRecipe(recipe)}
                  style={{
                    background: editHoverId === recipe.id ? '#3b82f6' : '#bae6fd',
                    color: editHoverId === recipe.id ? '#fff' : '#1e3a8a',
                    fontWeight: 'bold',
                    border: 'none',
                    borderRadius: '0.5rem',
                    height: '2.2rem',
                    padding: '0 1.5rem',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={() => setEditHoverId(recipe.id)}
                  onMouseLeave={() => setEditHoverId(null)}
                >
                  Edit
                </Button>
                <Button
                  onClick={() => runRecipe(recipe.id)}
                  style={{
                    background: runCardHoverId === recipe.id ? '#22c55e' : '#bbf7d0',
                    color: runCardHoverId === recipe.id ? '#fff' : '#166534',
                    fontWeight: 'bold',
                    border: 'none',
                    borderRadius: '0.5rem',
                    height: '2.2rem',
                    padding: '0 1.5rem',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={() => setRunCardHoverId(recipe.id)}
                  onMouseLeave={() => setRunCardHoverId(null)}
                >
                  Run
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
      {/* Add Recipe button moved below the cards */}
      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
        <Button
          onClick={handleNewRecipe}
          className="bg-gray-300 text-gray-900 hover:bg-gray-400 font-bold py-2 px-4 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4 mr-2"/> Add Recipe
        </Button>
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
              <Card className="flex flex-col w-full h-full" style={{ background: '#f3f4f6', color: '#222', fontWeight: 500 }}>
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
                        <Card
                          className="border-2 border-gray-400 p-6 space-y-5 rounded-lg"
                          style={{
                            background: '#e5e7eb',
                            color: '#222',
                            fontWeight: 500,
                            marginBottom: stepIndex < currentRecipe.steps.length - 1 ? '10px' : 0
                          }}
                        >
                          <div style={{ paddingLeft: '20px' }}>
                            <p className="text-sm font-bold text-gray-700 mb-4">Step {stepIndex + 1}</p>

                          {step.actions.map((action, actionIndex) => (
                            <div
                              key={actionIndex}
                              className="flex items-center"
                              style={{ gap: '2rem', marginBottom: '0.75rem' }}
                            >
                              <Select
                                value={action.light_id}
                                onValueChange={val => updateAction(stepIndex, actionIndex, 'light_id', val)}
                                style={{
                                  height: '1.5rem',
                                  fontSize: '1rem',
                                  minWidth: '60px'
                                }}
                              >
                                <SelectTrigger className="bg-white border-2 border-gray-400 rounded-lg">
                                  <SelectValue placeholder="Light"/>
                                </SelectTrigger>
                                <SelectContent className="bg-white border-2 border-gray-300">
                                  {lights.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                                </SelectContent>
                              </Select>

                              <Select
                                value={String(action.duration)}
                                onValueChange={val => updateAction(stepIndex, actionIndex, 'duration', parseInt(val, 10))}
                                style={{
                                  height: '1.5rem',
                                  fontSize: '1rem',
                                  minWidth: '60px'
                                }}
                              >
                                <SelectTrigger className="bg-white border-2 border-gray-400 rounded-lg">
                                  <SelectValue placeholder="Duration"/>
                                </SelectTrigger>
                                <SelectContent className="bg-white border-2 border-gray-300">
                                  {durationOptions.map(d => <SelectItem key={d} value={String(d)}>{d} ms</SelectItem>)}
                                </SelectContent>
                              </Select>

                              <Button
                                onClick={() => removeAction(stepIndex, actionIndex)}
                                style={{
                                  background: deleteLightHover === `${stepIndex}-${actionIndex}` ? '#ef4444' : '#fca5a5',
                                  color: deleteLightHover === `${stepIndex}-${actionIndex}` ? '#fff' : '#b91c1c',
                                  border: 'none',
                                  borderRadius: '0.5rem',
                                  height: '2rem',
                                  width: '2rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  transition: 'background 0.2s'
                                }}
                                onMouseEnter={() => setDeleteLightHover(`${stepIndex}-${actionIndex}`)}
                                onMouseLeave={() => setDeleteLightHover('')}
                              >
                                <Trash2 className="w-4 h-4"/>
                              </Button>
                            </div>
                          ))}

                        <Button
                          onClick={() => addAction(stepIndex)}
                          style={{
                            background: addLightHoverStep === stepIndex ? '#22c55e' : '#bbf7d0',
                            color: '#222',
                            fontWeight: 'bold',
                            border: 'none',
                            borderRadius: '0.5rem',
                            height: '2rem',
                            padding: '0 1.2rem',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            marginTop: '0.5rem',
                            marginBottom: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={() => setAddLightHoverStep(stepIndex)}
                          onMouseLeave={() => setAddLightHoverStep(null)}
                        >
                          <Plus className="w-4 h-4 mr-2"/>Add Light
                        </Button>
                          </div>
                      </Card>

                      {/* Add 10px spacing between step cards instead of arrow */}
                      {stepIndex < currentRecipe.steps.length - 1 && (
                        <div style={{ height: '10px' }} />
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  onClick={addStep}
                  style={{
                    background: addStepHover ? '#22c55e' : '#bbf7d0',
                    color: '#222',
                    fontWeight: 'bold',
                    border: 'none',
                    borderRadius: '0.5rem',
                    height: '2rem',
                    padding: '0 1.2rem',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    marginTop: '2rem',
                    marginBottom: '2.5rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={() => setAddStepHover(true)}
                  onMouseLeave={() => setAddStepHover(false)}
                >
                  <Plus className="w-4 h-4 mr-2"/>Add Sequential Step
                </Button>
                </CardContent>

              <footer
                className="py-4 border-t-2 border-gray-300 flex justify-end gap-8"
                style={{ paddingLeft: '2rem', paddingRight: '2rem', paddingBottom: '2rem', width: '100%', boxSizing: 'border-box' }}
              >
                <Button
                  onClick={() => setIsEditorOpen(false)}
                  style={{
                    background: cancelHover ? '#ef4444' : '#fca5a5',
                    color: cancelHover ? '#fff' : '#b91c1c',
                    fontWeight: 'bold',
                    border: 'none',
                    borderRadius: '0.5rem',
                    height: '2.2rem',
                    padding: '0 1.5rem',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    marginRight: '2rem',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={() => setCancelHover(true)}
                  onMouseLeave={() => setCancelHover(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveRecipe}
                  style={{
                    background: saveHover ? '#22c55e' : '#bbf7d0',
                    color: saveHover ? '#fff' : '#222',
                    fontWeight: 'bold',
                    border: 'none',
                    borderRadius: '0.5rem',
                    height: '2.2rem',
                    padding: '0 1.5rem',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={() => setSaveHover(true)}
                  onMouseLeave={() => setSaveHover(false)}
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

