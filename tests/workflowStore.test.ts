import assert from 'node:assert';
// Minimal localStorage stub for Node test runtime
const mem = new Map<string,string>();
(globalThis as any).localStorage = { getItem:(k:string)=>mem.has(k)?mem.get(k)!:null, setItem:(k:string,v:string)=>{mem.set(k,String(v));}, removeItem:(k:string)=>{mem.delete(k);} };
(globalThis as any).window = { dispatchEvent:()=>true };
const { createWorkflowRun, updateWorkflowStep, finishWorkflowRun, getLatestWorkflowRun, parsePrice, saveChartAnalysisState, loadChartAnalysisState } = await import('../src/services/workflowStore');
// Workflow créé depuis Analyse est retrouvé (persistance après navigation simulée par relecture du store)
const run = createWorkflowRun('user-1','BTC/USDT','1H');
updateWorkflowStep(run.id,'vision','success','Image analysée');
finishWorkflowRun(run.id,'success');
const latest = getLatestWorkflowRun('user-1');
assert.equal(latest?.id, run.id); assert.equal(latest?.status,'success'); assert.equal(latest?.steps.find((s:any)=>s.id==='vision')?.status,'success');
assert.equal(getLatestWorkflowRun('other-user'), null);
// État d'analyse restaurable
saveChartAnalysisState({ analysis:{recommendation:'BUY'}, symbol:'BTC/USDT' });
assert.equal(loadChartAnalysisState()?.analysis.recommendation,'BUY');
// parsePrice: seuls les nombres réels sont annotés, jamais inventés
assert.equal(parsePrice(65000),65000); assert.equal(parsePrice('Support 64200.5'),64200.5); assert.equal(parsePrice('zone haute'),null); assert.equal(parsePrice(undefined),null);
console.log('workflowStore tests: PASS (persistance workflow, restauration analyse, parsePrice sans invention)');
